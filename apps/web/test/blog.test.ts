import { describe, expect, test } from "bun:test";
import { dbImageSrc, parseDbImageSrc } from "@/lib/blog-images";
import { apiKeyFrom, bodyImages, hashApiKey, imageInfo, mergePost, newApiKey, slugify, todayBR, type PostInput } from "@/lib/blog-rules";

const GAMES = ["truco-paulista", "buraco"];
const TODAY = "2026-10-27";

const base = { title: "Dicas de Truco", description: "Como ganhar mais.", body: "## Oi\n\nTexto." };

describe("slugify", () => {
  test("tira acentos, pontuação e espaços", () => {
    expect(slugify("Buraco ou Canastra: qual é a diferença?")).toBe("buraco-ou-canastra-qual-e-a-diferenca");
    expect(slugify("  --Ação!!  ")).toBe("acao");
  });
});

describe("mergePost", () => {
  test("criar: slug do título, data de hoje, rascunho e jogo home", () => {
    const r = mergePost(base, null, GAMES, TODAY);
    expect(r.ok && r.post).toEqual({ ...base, slug: "dicas-de-truco", game: "home", keyword: "", date: TODAY, draft: true, cover: null, coverAlt: null });
  });

  test("editar: só muda o que veio; null limpa campo opcional", () => {
    const current: PostInput = { ...base, slug: "x", game: "buraco", keyword: "k", date: "2026-01-01", draft: false, cover: "/blog/a.png", coverAlt: "a", body: "Oi" };
    const r = mergePost({ title: "Novo", cover: null }, current, GAMES, TODAY);
    expect(r.ok && r.post).toEqual({ ...current, title: "Novo", cover: null });
  });

  test("erros por campo", () => {
    const r = mergePost({ title: "", slug: "Com Espaço", game: "uno", date: "27/10/2026", draft: "sim", cover: "/blog/c.png" }, null, GAMES, TODAY);
    expect(r.ok).toBe(false);
    const fields = !r.ok && r.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(["title", "slug", "description", "game", "date", "draft", "body", "coverAlt"]));
  });

  test("imagem do corpo sem descrição", () => {
    const r = mergePost({ ...base, body: "Texto\n\n![](/blog/x.png)" }, null, GAMES, TODAY);
    expect(!r.ok && r.errors[0]).toEqual({ field: "body", message: "imagem sem descrição: /blog/x.png" });
  });

  test("CRLF vira LF", () => {
    const r = mergePost({ ...base, body: "a\r\n\r\nb" }, null, GAMES, TODAY);
    expect(r.ok && r.post.body).toBe("a\n\nb");
  });
});

test("bodyImages pega só imagens sozinhas no bloco", () => {
  expect(bodyImages('Oi ![a](/x.png)\n\n![b](/blog/y.png "legenda")')).toEqual([{ alt: "b", src: "/blog/y.png" }]);
});

test("todayBR usa o fuso de Brasília", () => {
  expect(todayBR(new Date("2026-10-28T02:00:00Z"))).toBe("2026-10-27");
});

describe("imageInfo", () => {
  test("PNG", () => {
    const b = Buffer.alloc(32);
    b.write("\x89PNG", 0, "latin1");
    b.writeUInt32BE(1200, 16);
    b.writeUInt32BE(630, 20);
    expect(imageInfo(b)).toEqual({ mime: "image/png", width: 1200, height: 630 });
  });

  test("JPEG (pula APP0 até o SOF0)", () => {
    const b = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0, 0, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x76, 0x04, 0xb0, 0, 0, 0]);
    expect(imageInfo(b)).toEqual({ mime: "image/jpeg", width: 1200, height: 630 });
  });

  test("WebP VP8X", () => {
    const b = Buffer.alloc(32);
    b.write("RIFF", 0, "ascii");
    b.write("WEBPVP8X", 8, "ascii");
    b.writeUIntLE(1199, 24, 3);
    b.writeUIntLE(629, 27, 3);
    expect(imageInfo(b)).toEqual({ mime: "image/webp", width: 1200, height: 630 });
  });

  test("outra coisa", () => {
    expect(imageInfo(Buffer.from("GIF89a................................"))).toBeNull();
  });
});

test("caminho da imagem do banco leva o tamanho", () => {
  const src = dbImageSrc({ id: "abc123", mime: "image/jpeg", width: 800, height: 600 });
  expect(src).toBe("/blog/imagens/abc123-800x600.jpg");
  expect(parseDbImageSrc(src)).toEqual({ id: "abc123", width: 800, height: 600 });
  expect(parseDbImageSrc("/blog/capa.png")).toBeNull();
});

describe("chaves", () => {
  test("nova chave: prefixo mj_, hash confere", () => {
    const k = newApiKey();
    expect(k.key.startsWith("mj_")).toBe(true);
    expect(k.key.startsWith(k.prefix)).toBe(true);
    expect(k.hash).toBe(hashApiKey(k.key));
    expect(newApiKey().key).not.toBe(k.key);
  });

  test("lê Bearer ou X-API-Key", () => {
    expect(apiKeyFrom(new Headers({ authorization: "Bearer mj_abc" }))).toBe("mj_abc");
    expect(apiKeyFrom(new Headers({ "x-api-key": "mj_abc" }))).toBe("mj_abc");
    expect(apiKeyFrom(new Headers({ authorization: "Bearer outra" }))).toBeNull();
    expect(apiKeyFrom(new Headers())).toBeNull();
  });
});
