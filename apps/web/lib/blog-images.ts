import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Imagens dos posts ficam em `public/blog`. Tamanho lido do cabeçalho do PNG, para o next/image reservar o espaço. */

export type BlogImage = { src: string; alt: string; width: number; height: number; caption?: string };

const sizes = new Map<string, { width: number; height: number }>();

function pngSize(src: string) {
  let s = sizes.get(src);
  if (!s) {
    const buf = readFileSync(join(/* turbopackIgnore: true */ process.cwd(), "public", src));
    if (buf.toString("ascii", 1, 4) !== "PNG") throw new Error(`Imagem do blog precisa ser PNG: ${src}`);
    s = { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    sizes.set(src, s);
  }
  return s;
}

/** Monta a imagem. A falta de alt é avisada uma vez, ao ler o post (`lib/blog.ts`). */
export function blogImage(src: string, alt: string, caption?: string): BlogImage {
  return { src, alt, caption, ...pngSize(src) };
}

/** `![alt](src "legenda opcional")` sozinho num bloco */
export const IMAGE_RE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;
