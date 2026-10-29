import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPosts } from "@/lib/blog";
import { ABOUT_PATH, CONTACT_PATH, INSTALL_PATH, PRIVACY_PATH, TERMS_PATH } from "@/lib/legal";
import { DAILY_SEO, GAMES, SITE_URL } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Posts vêm do banco: gera no pedido, não no build (no Docker não há banco)
  await connection();
  // Rascunhos nunca entram, nem com BLOG_DRAFTS=1
  const posts = await getPosts(false);
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...GAMES.flatMap((g) => [
      { url: `${SITE_URL}${g.path}`, changeFrequency: "monthly" as const, priority: 0.9 },
      { url: `${SITE_URL}${g.path}/como-jogar`, changeFrequency: "monthly" as const, priority: 0.7 },
      ...(g.slug in DAILY_SEO ? [{ url: `${SITE_URL}${g.path}/diario`, changeFrequency: "daily" as const, priority: 0.8 }] : []),
    ]),
    ...(posts.length
      ? [
          { url: `${SITE_URL}/blog`, changeFrequency: "weekly" as const, priority: 0.6 },
          ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
        ]
      : []),
    { url: `${SITE_URL}${ABOUT_PATH}`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}${INSTALL_PATH}`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}${CONTACT_PATH}`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}${PRIVACY_PATH}`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}${TERMS_PATH}`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
