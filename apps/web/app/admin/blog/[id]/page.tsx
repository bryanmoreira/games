import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/PostEditor";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { findPost } from "@/lib/blog-admin";
import { imageSize } from "@/lib/blog-images";
import { bodyImages, todayBR } from "@/lib/blog-rules";
import { GAMES } from "@/lib/seo";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await findPost({ id: (await params).id }))?.title ?? "Post" };
}

export default async function EditPost({ params }: Props) {
  const { id } = await params;
  await requireAdmin(`/admin/blog/${id}`);
  const post = await findPost({ id });
  if (!post) notFound();
  const { title, slug, description, game, keyword, date, draft, cover, coverAlt, body } = post;
  // tamanho das imagens de `public` para a prévia (o navegador não lê o disco)
  const sizes = Object.fromEntries([cover, ...bodyImages(body).map((i) => i.src)].flatMap((src) => (src && imageSize(src) ? [[src, imageSize(src)!]] : [])));
  return (
    <div className="flex flex-col gap-5">
      <PageTitle>Editar post</PageTitle>
      <PostEditor
        id={id}
        today={todayBR()}
        sizes={sizes}
        games={GAMES.map((g) => ({ slug: g.slug, name: g.name }))}
        initial={{ title, slug, description, game, keyword, date, draft, cover, coverAlt, body }}
      />
    </div>
  );
}
