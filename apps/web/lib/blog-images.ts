import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDbImageSrc, type BlogImage } from "@/lib/blog-image-src";

/**
 * Imagens dos posts: as antigas ficam em `public/blog` (tamanho lido do cabeçalho do PNG);
 * as enviadas pelo admin/API ficam no banco e o tamanho vai no nome (`dbImageSrc`). Assim o next/image reserva o espaço.
 */

export { dbImageSrc, IMAGE_RE, parseDbImageSrc, type BlogImage, type ImageMime } from "@/lib/blog-image-src";

const sizes = new Map<string, { width: number; height: number } | null>();

/** Tamanho de uma imagem do post; null = arquivo não existe (ou não é PNG) em `public`. */
export function imageSize(src: string): { width: number; height: number } | null {
  const db = parseDbImageSrc(src);
  if (db) return db;
  let s = sizes.get(src);
  if (s === undefined) {
    try {
      const buf = readFileSync(join(/* turbopackIgnore: true */ process.cwd(), "public", src));
      s = buf.toString("ascii", 1, 4) === "PNG" ? { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) } : null;
    } catch {
      s = null;
    }
    sizes.set(src, s);
  }
  return s;
}

/** Monta a imagem. Caminho inválido não derruba a página (o CMS já recusa ao salvar). */
export function blogImage(src: string, alt: string, caption?: string): BlogImage {
  return { src, alt, caption, ...(imageSize(src) ?? { width: 1200, height: 630 }) };
}
