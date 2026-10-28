import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { PostArticle } from "@/components/blog/PostArticle";
import { JsonLd } from "@/components/seo";
import { blogImage } from "@/lib/blog-images";
import { canSeeDrafts, getPost, postCta } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPost((await params).slug, await canSeeDrafts());
  if (!p) return {};
  const path = `/blog/${p.slug}`;
  return {
    title: p.title,
    description: p.description,
    keywords: p.keyword ? [p.keyword] : undefined,
    alternates: { canonical: path },
    openGraph: { title: `${p.title} · ${SITE_NAME}`, description: p.description, url: path, siteName: SITE_NAME, locale: "pt_BR", type: "article", publishedTime: p.date },
    twitter: { card: "summary_large_image", title: `${p.title} · ${SITE_NAME}`, description: p.description },
    ...(p.draft && { robots: { index: false, follow: false } }),
  };
}

export default async function Post({ params }: Props) {
  const p = await getPost((await params).slug, await canSeeDrafts());
  if (!p) notFound();
  const cta = postCta(p);
  const url = `${SITE_URL}/blog/${p.slug}`;

  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BlogPosting",
                headline: p.title,
                description: p.description,
                datePublished: p.date,
                dateModified: p.updatedAt.toISOString(),
                inLanguage: "pt-BR",
                url,
                mainEntityOfPage: url,
                image: p.cover ? `${SITE_URL}${p.cover.src}` : `${url}/opengraph-image`,
                publisher: { "@id": `${SITE_URL}/#organization` },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
                  { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
                  { "@type": "ListItem", position: 3, name: p.title, item: url },
                ],
              },
            ],
          }}
        />
        <header className="relative flex min-h-10 items-center justify-center">
          <BackButton href="/blog" className="absolute left-0 top-1/2 -translate-y-1/2" />
          <span className="font-display text-xs tracking-[0.4em] text-white/60">BLOG</span>
        </header>

        <PostArticle p={p} image={blogImage} />

        <div className="flex flex-col items-center gap-3">
          <Link
            href={cta.href}
            className="rounded-xl bg-gold px-8 py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none"
          >
            {cta.label}
          </Link>
          {cta.howTo && (
            <Link href={cta.howTo} className="text-sm text-white/60 underline-offset-2 hover:text-white hover:underline">
              Como jogar
            </Link>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
