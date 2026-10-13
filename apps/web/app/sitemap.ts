import type { MetadataRoute } from "next";
import { DAILY_SEO, GAMES, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...GAMES.flatMap((g) => [
      { url: `${SITE_URL}${g.path}`, changeFrequency: "monthly" as const, priority: 0.9 },
      { url: `${SITE_URL}${g.path}/como-jogar`, changeFrequency: "monthly" as const, priority: 0.7 },
      ...(g.slug in DAILY_SEO ? [{ url: `${SITE_URL}${g.path}/diario`, changeFrequency: "daily" as const, priority: 0.8 }] : []),
    ]),
  ];
}
