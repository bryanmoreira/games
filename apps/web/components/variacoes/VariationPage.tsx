import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { GameFaq, JsonLd } from "@/components/seo";
import { StartButton } from "@/components/variacoes/StartButton";
import { breadcrumbLd, getGame, SITE_NAME, SITE_URL } from "@/lib/seo";
import { variation, variationsOf } from "@/lib/variacoes";

export function variationMetadata(path: string): Metadata {
  const v = variation(path);
  const g = getGame(v.game);
  // o layout do jogo tem título próprio, então o template do layout raiz não chega aqui
  const title = `${v.title} · ${SITE_NAME}`;
  return {
    title,
    description: v.description,
    keywords: v.keywords,
    alternates: { canonical: v.path },
    openGraph: { title, description: v.description, url: v.path, siteName: SITE_NAME, locale: "pt_BR", type: "website", images: [`${g.path}/opengraph-image`] },
    twitter: { card: "summary_large_image", title, description: v.description, images: [`${g.path}/opengraph-image`] },
  };
}

/** Página de uma variação do jogo: título, botão que já começa a partida, texto, perguntas e as outras variações. */
export function VariationPage({ path }: { path: string }) {
  const v = variation(path);
  const g = getGame(v.game);
  const others = variationsOf(v.game).filter((x) => x.path !== v.path);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        name: v.h1,
        url: `${SITE_URL}${v.path}`,
        description: v.description,
        inLanguage: "pt-BR",
        genre: g.genre,
        gamePlatform: "Navegador web",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "BRL" },
        isPartOf: { "@id": `${SITE_URL}${g.path}#game` },
      },
      { "@type": "FAQPage", mainEntity: v.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      breadcrumbLd([
        { name: SITE_NAME, path: "/" },
        { name: g.name, path: g.path },
        { name: v.h1, path: v.path },
      ]),
    ],
  };
  const link = "rounded-full bg-black/30 px-4 py-2 font-display text-xs text-white/80 ring-1 ring-white/10 transition hover:text-gold";

  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-8 sm:py-12">
        <JsonLd data={ld} />
        <header className="relative flex w-full flex-col items-center gap-2 px-12">
          <BackButton href={g.path} className="absolute left-0 top-1/2 -translate-y-1/2" />
          <h1 className="text-balance text-center font-display text-3xl text-gold sm:text-4xl">{v.h1}</h1>
          <p className="max-w-md text-balance text-center text-sm text-white/70 sm:text-base">{v.lead}</p>
        </header>

        <StartButton start={v.start} cta={v.cta} gamePath={g.path} />

        <section className="flex w-full flex-col gap-4 border-t border-white/10 pt-8 text-sm leading-relaxed text-white/70 sm:text-base">
          {v.about.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
          <nav aria-label={`Mais de ${g.name}`} className="flex flex-wrap justify-center gap-2 pt-2">
            {others.map((o) => (
              <Link key={o.path} href={o.path} className={link}>
                {o.h1}
              </Link>
            ))}
            <Link href={`${g.path}/como-jogar`} className={link}>
              Regras completas
            </Link>
          </nav>
        </section>

        <div className="w-full">
          <GameFaq items={v.faq} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
