import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo";
import { GLOSSARIO_PATH, GLOSSARY, termPath, termsOf } from "@/lib/glossario";
import { breadcrumbLd, GAMES, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Glossário de jogos de cartas e de tabuleiro",
  description: "O que significa cada termo dos jogos de cartas, tabuleiro e palavras: manilha, canastra, roque, xeque-mate, carroça e muito mais, explicados em poucas linhas.",
  alternates: { canonical: GLOSSARIO_PATH },
};

export default function Glossario() {
  if (!GLOSSARY.length) notFound();
  const games = GAMES.filter((g) => termsOf(g.slug).length);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTermSet",
        "@id": `${SITE_URL}${GLOSSARIO_PATH}#glossario`,
        name: "Glossário do Mesa de Jogos",
        inLanguage: "pt-BR",
        hasDefinedTerm: GLOSSARY.map((t) => ({ "@type": "DefinedTerm", name: t.term, url: `${SITE_URL}${termPath(t.slug)}` })),
      },
      breadcrumbLd([
        { name: SITE_NAME, path: "/" },
        { name: "Glossário", path: GLOSSARIO_PATH },
      ]),
    ],
  };
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
        <JsonLd data={ld} />
        <header className="relative flex flex-col items-center gap-1 px-12">
          <BackButton href="/" className="absolute left-0 top-1/2 -translate-y-1/2" />
          <h1 className="font-display text-3xl text-gold sm:text-4xl">GLOSSÁRIO</h1>
          <span className="font-display text-xs tracking-[0.4em] text-white/60">{GLOSSARY.length} TERMOS</span>
        </header>
        <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">
          Os termos dos jogos do {SITE_NAME}, cada um explicado em poucas linhas, com as regras que valem aqui no site.
        </p>
        {games.map((g) => (
          <section key={g.slug} className="flex flex-col gap-3">
            <h2 className="text-center font-display text-lg text-gold">{g.name}</h2>
            <ul className="flex flex-wrap justify-center gap-2">
              {termsOf(g.slug).map((t) => (
                <li key={t.slug}>
                  <Link href={termPath(t.slug)} className="rounded-full bg-black/30 px-3 py-1.5 text-sm text-white/80 ring-1 ring-white/10 transition hover:text-gold">
                    {t.term}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
