/** Partes das imagens do blog sem acesso ao disco: servem também ao editor do admin, no navegador. */

export type BlogImage = { src: string; alt: string; width: number; height: number; caption?: string };

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
export type ImageMime = keyof typeof EXT;

/** Caminho público de uma imagem do banco (servida por app/blog/imagens/[file]). */
export function dbImageSrc(img: { id: string; mime: string; width: number; height: number }): string {
  return `/blog/imagens/${img.id}-${img.width}x${img.height}.${EXT[img.mime as ImageMime] ?? "png"}`;
}

const DB_IMAGE_RE = /^\/blog\/imagens\/([a-z0-9]+)-(\d+)x(\d+)\.(png|jpg|webp)$/;

export function parseDbImageSrc(src: string): { id: string; width: number; height: number } | null {
  const m = src.match(DB_IMAGE_RE);
  return m ? { id: m[1], width: Number(m[2]), height: Number(m[3]) } : null;
}

/** `![alt](src "legenda opcional")` sozinho num bloco */
export const IMAGE_RE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;
