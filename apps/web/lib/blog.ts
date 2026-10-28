import { headers } from "next/headers";
import { cache } from "react";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { blogImage, type BlogImage } from "@/lib/blog-images";
import { prisma } from "@/lib/db";
import { getGame } from "@/lib/seo";

export { formatDate } from "@/lib/blog-text";

/** Posts do blog: tabela `blog_post`, editada em /admin/blog ou pela API (/api/v1/blog). */

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  /** Slug do jogo em `GAMES`, ou "home" para posts sobre o site todo */
  game: string;
  keyword: string;
  date: string;
  draft: boolean;
  /** Capa: topo do post e lista */
  cover?: BlogImage;
  body: string;
  updatedAt: Date;
};

/** Rascunhos aparecem no `next dev` ou com `BLOG_DRAFTS=1`; em produção só para admin (sem sitemap). */
export const SHOW_DRAFTS = process.env.NODE_ENV !== "production" || process.env.BLOG_DRAFTS === "1";

/** Admin vê os rascunhos no site, para conferir antes de publicar. */
export const canSeeDrafts = cache(async (): Promise<boolean> => {
  if (SHOW_DRAFTS) return true;
  const session = await auth.api.getSession({ headers: await headers() });
  return isAdmin(session?.user);
});

type Row = Awaited<ReturnType<typeof prisma.blogPost.findMany>>[number];

function toPost({ cover, coverAlt, createdAt: _, ...p }: Row): BlogPost {
  return { ...p, cover: cover ? blogImage(cover, coverAlt ?? "") : undefined };
}

// mesma data: o criado por último primeiro
const ORDER = [{ date: "desc" as const }, { createdAt: "desc" as const }];

/** Posts visíveis, do mais novo para o mais antigo. `drafts`: incluir rascunhos (admin). */
export const getPosts = cache(async (drafts = SHOW_DRAFTS): Promise<BlogPost[]> => {
  const rows = await prisma.blogPost.findMany({ where: drafts ? {} : { draft: false }, orderBy: ORDER });
  return rows.map(toPost);
});

export const getPost = cache(async (slug: string, drafts = SHOW_DRAFTS): Promise<BlogPost | undefined> => {
  const row = await prisma.blogPost.findUnique({ where: { slug } });
  return row && (drafts || !row.draft) ? toPost(row) : undefined;
});

/** Destino do botão "Jogar agora": a página do jogo, ou a home. */
export function postCta(p: BlogPost): { href: string; label: string; howTo?: string } {
  if (p.game === "home") return { href: "/", label: "Escolher um jogo" };
  const g = getGame(p.game);
  return { href: g.path, label: "Jogar agora", howTo: `${g.path}/como-jogar` };
}
