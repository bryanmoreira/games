import { createHash, randomBytes } from "node:crypto";
import { IMAGE_RE, type ImageMime } from "@/lib/blog-images";
import { slugify } from "@/lib/blog-text";

export { slugify };

// Regras do CMS do blog sem banco (para testar). O banco fica em lib/blog-admin.ts.

export type PostInput = {
  title: string;
  slug: string;
  description: string;
  game: string;
  keyword: string;
  date: string;
  draft: boolean;
  cover: string | null;
  coverAlt: string | null;
  body: string;
};

export type PostError = { field: keyof PostInput | "image"; message: string };

const FIELDS = ["title", "slug", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body"] as const;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Dia de hoje em Brasília (AAAA-MM-DD). */
export function todayBR(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
}

/**
 * Junta o que veio (JSON do admin ou da API) com o post atual e valida.
 * Criar: `current` null; slug vazio sai do título, data vazia vira hoje, sem `draft` vira rascunho.
 * Editar: só os campos enviados mudam.
 */
export function mergePost(
  raw: unknown,
  current: PostInput | null,
  games: string[],
  today = todayBR(),
): { ok: true; post: PostInput } | { ok: false; errors: PostError[] } {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: PostError[] = [];
  const str = (k: (typeof FIELDS)[number]) => {
    const v = src[k];
    if (v === undefined) return undefined;
    if (v === null) return "";
    if (typeof v !== "string") {
      errors.push({ field: k, message: "precisa ser texto" });
      return undefined;
    }
    return k === "body" ? v.replace(/\r\n/g, "\n").trim() : v.trim();
  };

  const title = str("title") ?? current?.title ?? "";
  const slug = str("slug") || (current?.slug ?? slugify(title));
  const cover = str("cover");
  const coverAlt = str("coverAlt");
  const draftRaw = src.draft;
  if (draftRaw !== undefined && typeof draftRaw !== "boolean") errors.push({ field: "draft", message: "precisa ser true ou false" });

  const post: PostInput = {
    title,
    slug,
    description: str("description") ?? current?.description ?? "",
    game: str("game") || (current?.game ?? "home"),
    keyword: str("keyword") ?? current?.keyword ?? "",
    date: str("date") || (current?.date ?? today),
    draft: typeof draftRaw === "boolean" ? draftRaw : (current?.draft ?? true),
    cover: cover === undefined ? (current?.cover ?? null) : cover || null,
    coverAlt: coverAlt === undefined ? (current?.coverAlt ?? null) : coverAlt || null,
    body: str("body") ?? current?.body ?? "",
  };

  if (!post.title) errors.push({ field: "title", message: "obrigatório" });
  else if (post.title.length > 140) errors.push({ field: "title", message: "até 140 letras" });
  if (!SLUG_RE.test(post.slug)) errors.push({ field: "slug", message: "só letras minúsculas, números e hífens" });
  if (!post.description) errors.push({ field: "description", message: "obrigatório" });
  else if (post.description.length > 300) errors.push({ field: "description", message: "até 300 letras" });
  if (post.game !== "home" && !games.includes(post.game)) errors.push({ field: "game", message: `jogo desconhecido (use "home" ou ${games.join(", ")})` });
  if (!DATE_RE.test(post.date) || Number.isNaN(Date.parse(`${post.date}T12:00:00Z`))) errors.push({ field: "date", message: "use AAAA-MM-DD" });
  if (!post.body) errors.push({ field: "body", message: "obrigatório" });
  if (post.cover && !post.cover.startsWith("/blog/")) errors.push({ field: "cover", message: "use uma imagem enviada (/blog/...)" });
  if (post.cover && !post.coverAlt) errors.push({ field: "coverAlt", message: "descreva a capa" });
  for (const img of bodyImages(post.body)) if (!img.alt.trim()) errors.push({ field: "body", message: `imagem sem descrição: ${img.src}` });

  return errors.length ? { ok: false, errors } : { ok: true, post };
}

/** Imagens sozinhas num bloco do Markdown (as que o post mostra). */
export function bodyImages(body: string): { alt: string; src: string }[] {
  return body
    .split(/\n{2,}/)
    .map((b) => b.trim().match(IMAGE_RE))
    .filter((m) => !!m)
    .map((m) => ({ alt: m[1], src: m[2] }));
}

// ---- imagens enviadas ----

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Tipo e tamanho lidos do cabeçalho do arquivo (PNG, JPEG ou WebP). null = não é imagem aceita. */
export function imageInfo(buf: Uint8Array): { mime: ImageMime; width: number; height: number } | null {
  const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
  if (b.length > 24 && b.toString("ascii", 1, 4) === "PNG") return { mime: "image/png", width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    // percorre os segmentos até um SOF (início do quadro), que tem a altura e a largura
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc)
        return { mime: "image/jpeg", height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      i += 2 + len;
    }
    return null;
  }
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { mime: "image/webp", width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { mime: "image/webp", width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const bits = b.readUInt32LE(21);
      return { mime: "image/webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

// ---- chaves da API ----

export const API_KEY_PREFIX = "mj_";

/** Chave nova: mostrada uma vez; o banco guarda só o hash e o começo. */
export function newApiKey(): { key: string; prefix: string; hash: string } {
  const key = API_KEY_PREFIX + randomBytes(24).toString("base64url");
  return { key, prefix: key.slice(0, 10), hash: hashApiKey(key) };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** `Authorization: Bearer mj_…` ou `X-API-Key: mj_…` */
export function apiKeyFrom(headers: Headers): string | null {
  const bearer = headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const key = bearer ?? headers.get("x-api-key")?.trim();
  return key?.startsWith(API_KEY_PREFIX) ? key : null;
}
