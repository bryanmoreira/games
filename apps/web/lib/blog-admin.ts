import { dbImageSrc, imageSize, parseDbImageSrc } from "@/lib/blog-images";
import { IMAGE_MAX_BYTES, apiKeyFrom, bodyImages, hashApiKey, imageInfo, mergePost, newApiKey, type PostError, type PostInput } from "@/lib/blog-rules";
import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { pingIndexNow } from "@/lib/indexnow";
import { GAMES } from "@/lib/seo";

// Escrita do blog: usada pelo admin (/api/admin/blog) e pela API com chave (/api/v1/blog). Regras em lib/blog-rules.ts.

const GAME_SLUGS = GAMES.map((g) => g.slug);

const SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  game: true,
  keyword: true,
  date: true,
  draft: true,
  cover: true,
  coverAlt: true,
  body: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type SavedPost = PostInput & { id: string; url: string; createdAt: Date; updatedAt: Date };
type Row = PostInput & { id: string; createdAt: Date; updatedAt: Date };

const withUrl = (p: Row): SavedPost => ({ ...p, url: `/blog/${p.slug}` });

export type SaveResult = { ok: true; post: SavedPost } | { ok: false; status: 400 | 404 | 409; errors: PostError[] };

/** Imagens do post (capa e corpo) que não existem: em `public` ou no banco. */
async function missingImages(post: PostInput): Promise<string[]> {
  const srcs = [...new Set([...(post.cover ? [post.cover] : []), ...bodyImages(post.body).map((i) => i.src)])];
  const db = srcs.map((s) => [s, parseDbImageSrc(s)] as const).filter(([, d]) => d);
  const found = new Set(
    (await prisma.blogImage.findMany({ where: { id: { in: db.map(([, d]) => d!.id) } }, select: { id: true, mime: true, width: true, height: true } })).map(dbImageSrc),
  );
  return srcs.filter((s) => (parseDbImageSrc(s) ? !found.has(s) : !imageSize(s)));
}

/** Cria (`id` null) ou edita um post. Na edição só mudam os campos enviados. */
export async function savePost(id: string | null, raw: unknown): Promise<SaveResult> {
  const current = id ? await prisma.blogPost.findUnique({ where: { id }, select: SELECT }) : null;
  if (id && !current) return { ok: false, status: 404, errors: [{ field: "slug", message: "post não existe" }] };
  const merged = mergePost(raw, current, GAME_SLUGS);
  if (!merged.ok) return { ok: false, status: 400, errors: merged.errors };
  const missing = await missingImages(merged.post);
  if (missing.length) return { ok: false, status: 400, errors: missing.map((src) => ({ field: "image", message: `imagem não encontrada: ${src}` })) };
  try {
    const post = id
      ? await prisma.blogPost.update({ where: { id }, data: merged.post, select: SELECT })
      : await prisma.blogPost.create({ data: merged.post, select: SELECT });
    const saved = withUrl(post);
    // post publicado (ou editado depois de publicado): avisa os buscadores na hora
    if (!saved.draft) void pingIndexNow([saved.url, "/blog"]);
    return { ok: true, post: saved };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false, status: 409, errors: [{ field: "slug", message: "já existe um post com esse slug" }] };
    throw e;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  return (await prisma.blogPost.deleteMany({ where: { id } })).count > 0;
}

export async function listAllPosts(): Promise<SavedPost[]> {
  return (await prisma.blogPost.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }], select: SELECT })).map(withUrl);
}

export async function findPost(by: { id: string } | { slug: string }): Promise<SavedPost | null> {
  const p = await prisma.blogPost.findUnique({ where: by, select: SELECT });
  return p && withUrl(p);
}

export type UploadResult =
  | { ok: true; image: { src: string; width: number; height: number; markdown: string } }
  | { ok: false; status: 400 | 413; error: string };

/** Guarda a imagem no banco e devolve o caminho para usar na capa ou no Markdown. */
export async function uploadImage(bytes: Uint8Array<ArrayBuffer>, alt = ""): Promise<UploadResult> {
  if (bytes.byteLength > IMAGE_MAX_BYTES) return { ok: false, status: 413, error: "imagem maior que 5 MB" };
  const info = imageInfo(bytes);
  if (!info || !info.width || !info.height) return { ok: false, status: 400, error: "envie PNG, JPEG ou WebP" };
  const img = await prisma.blogImage.create({ data: { ...info, data: bytes }, select: { id: true, mime: true, width: true, height: true } });
  const src = dbImageSrc(img);
  return { ok: true, image: { src, width: img.width, height: img.height, markdown: `![${alt.replace(/[[\]]/g, "")}](${src})` } };
}

/** Lê a imagem de um pedido: corpo cru (Content-Type image/…) ou formulário com o campo `file`. */
export async function imageFromRequest(req: Request): Promise<{ bytes: Uint8Array<ArrayBuffer>; alt: string } | null> {
  const alt = new URL(req.url).searchParams.get("alt") ?? "";
  if (req.headers.get("content-type")?.startsWith("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof Blob)) return null;
    const formAlt = form?.get("alt");
    return { bytes: new Uint8Array(await file.arrayBuffer()), alt: typeof formAlt === "string" ? formAlt : alt };
  }
  const bytes = new Uint8Array(await req.arrayBuffer());
  return bytes.byteLength ? { bytes, alt } : null;
}

// ---- chaves ----

export async function listApiKeys() {
  return prisma.apiKey.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, prefix: true, createdAt: true, lastUsedAt: true } });
}

/** A chave só volta aqui; depois só o começo (`prefix`). */
export async function createApiKey(name: string, createdById: string) {
  const { key, prefix, hash } = newApiKey();
  const row = await prisma.apiKey.create({ data: { name: name.trim().slice(0, 60) || "Chave", prefix, hash, createdById }, select: { id: true } });
  return { id: row.id, key };
}

export async function deleteApiKey(id: string): Promise<boolean> {
  return (await prisma.apiKey.deleteMany({ where: { id } })).count > 0;
}

/** Confere a chave do pedido e marca o último uso. */
export async function checkApiKey(headers: Headers): Promise<boolean> {
  const key = apiKeyFrom(headers);
  if (!key) return false;
  const row = await prisma.apiKey.findUnique({ where: { hash: hashApiKey(key) }, select: { id: true } });
  if (!row) return false;
  await prisma.apiKey.update({ where: { id: row.id }, data: { lastUsedAt: new Date() } });
  return true;
}
