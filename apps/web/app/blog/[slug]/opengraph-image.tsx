import { notFound } from "next/navigation";
import { getPost } from "@/lib/blog";
import { blogOgImage, OG_SIZE } from "@/lib/og";

export const alt = "Blog do Mesa de Jogos";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPost((await params).slug);
  if (!p) notFound();
  return blogOgImage(p.title, p.game);
}
