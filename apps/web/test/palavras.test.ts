import { describe, expect, test } from "bun:test";
import { ANSWERS, EXTRA } from "@mesa/verbete";
import { EMPTY_FILTER, matcher, PAGES, pageWords, palavrasPaths, plain, resolveSlug, search } from "@/lib/palavras";

const f = (pos: string, has = "", not = "") => ({ pos: [...pos].map((c) => (c === "_" ? "" : c)), has, not });

describe("filtro de palavras de 5 letras", () => {
  test("letra na posição ignora acento e cedilha", () => {
    expect(matcher(f("a____"))("ácaro")).toBe(true);
    expect(matcher(f("_c___"))("açude")).toBe(true);
    expect(matcher(f("____o"))("abril")).toBe(false);
  });

  test("tem e não tem", () => {
    expect(matcher(f("_____", "ra"))("ácaro")).toBe(true);
    expect(matcher(f("_____", "", "r"))("ácaro")).toBe(false);
    expect(matcher(f("_____", "", "xz"))("ácaro")).toBe(true);
  });

  test("letra no lugar certo ou em 'tem' não é excluída por 'não tem' (letra repetida)", () => {
    expect(matcher(f("a____", "", "a"))("adaga")).toBe(true);
    expect(matcher(f("_____", "a", "a"))("adaga")).toBe(true);
  });

  test("busca devolve comuns e menos comuns sem misturar", () => {
    const r = search(f("ab___"));
    expect(r.common.every((w) => ANSWERS.includes(w))).toBe(true);
    expect(r.other.every((w) => EXTRA.includes(w))).toBe(true);
    expect(r.common.every((w) => plain(w).startsWith("ab"))).toBe(true);
  });

  test("filtro vazio casa com tudo", () => {
    expect(search(EMPTY_FILTER).common.length).toBe(ANSWERS.length);
  });
});

describe("páginas fixas", () => {
  test("cada página tem pelo menos 3 palavras e a letra certa", () => {
    for (const p of PAGES) {
      const { common, other } = pageWords(p);
      expect(common.length + other.length).toBeGreaterThanOrEqual(3);
      const i = p.kind === "start" ? 0 : 4;
      expect([...common, ...other].every((w) => plain(w)[i] === p.letter)).toBe(true);
    }
  });

  test("slugs", () => {
    expect(resolveSlug("comecam-com-a")).toEqual({ kind: "start", letter: "a" });
    expect(resolveSlug("terminam-com-o")).toEqual({ kind: "end", letter: "o" });
    expect(resolveSlug("terminam-com-w")).toBeNull();
    expect(resolveSlug("comecam-com-A")).toBeNull();
    expect(resolveSlug("comecam-com-ab")).toBeNull();
  });

  test("todo caminho listado resolve e não repete", () => {
    const paths = palavrasPaths();
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of paths.slice(1)) expect(resolveSlug(p.split("/").pop()!)).not.toBeNull();
  });
});
