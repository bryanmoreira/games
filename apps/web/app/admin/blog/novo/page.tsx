import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/PostEditor";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import { todayBR } from "@/lib/blog-rules";
import { GAMES } from "@/lib/seo";

export const metadata: Metadata = { title: "Novo post" };

export default async function NewPost() {
  await requireAdmin("/admin/blog/novo");
  const today = todayBR();
  return (
    <div className="flex flex-col gap-5">
      <PageTitle>Novo post</PageTitle>
      <PostEditor
        id={null}
        today={today}
        games={GAMES.map((g) => ({ slug: g.slug, name: g.name }))}
        initial={{ title: "", slug: "", description: "", game: "home", keyword: "", date: today, draft: true, cover: null, coverAlt: null, body: "" }}
      />
    </div>
  );
}
