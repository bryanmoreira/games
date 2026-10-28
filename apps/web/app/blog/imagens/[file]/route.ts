import { parseDbImageSrc } from "@/lib/blog-images";
import { prisma } from "@/lib/db";

// /blog/imagens/<id>-<l>x<a>.<ext>: imagem enviada pelo CMS (tabela blog_image). Nunca muda: cache longo.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const ref = parseDbImageSrc(`/blog/imagens/${(await params).file}`);
  const img = ref && (await prisma.blogImage.findUnique({ where: { id: ref.id }, select: { mime: true, data: true } }));
  if (!img) return new Response(null, { status: 404 });
  return new Response(img.data, { headers: { "content-type": img.mime, "cache-control": "public, max-age=31536000, immutable" } });
}
