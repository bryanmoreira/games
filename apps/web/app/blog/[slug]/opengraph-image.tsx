import { getPost, getPosts } from "@/lib/blog";
import { blogOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Blog do Mesa de Jogos";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPost((await params).slug)!;
  return blogOgImage(p.title, p.game);
}
