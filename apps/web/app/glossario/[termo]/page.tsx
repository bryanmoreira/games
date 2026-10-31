import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo";
import { HOWTO_UPDATED } from "@/lib/como-jogar";
import { findTerm, GLOSSARIO_PATH, GLOSSARY, termPath, termsOf } from "@/lib/glossario";
import { breadcrumbLd, getGame, SITE_NAME, SITE_URL } from "@/lib/seo";

type Props = { params: Promise<{ termo: string }> };

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ termo: t.slug }));
}

/** "Manilha: o que é no Truco Paulista" */
const titleOf = (term: string, game: string) => `${term}: o que é no ${game}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = findTerm((await params).termo);
  if (!t) return {};
  const g = getGame(t.game);
  const description = t.definition.length > 158 ? `${t.definition.slice(0, 155).replace(/\s+\S*$/, "")}…` : t.definition;
  return {
    title: titleOf(t.term, g.name),
    description,
    keywords: [`o que é ${t.term.toLowerCase()}`, `${t.term.toLowerCase()} ${g.name.toLowerCase()}`, `${t.term.toLowerCase()} significado`],
    alternates: { canonical: termPath(t.slug) },
    openGraph: { title: `${titleOf(t.term, g.name)} · ${SITE_NAME}`, description, url: termPath(t.slug), siteName: SITE_NAME, locale: "pt_BR", type: "article", images: [`${g.path}/opengraph-image`] },
  };
}

export default async function Termo({ params }: Props) {
  const t = findTerm((await params).termo);
  if (!t) notFound();
  const g = getGame(t.game);
  const others = termsOf(t.game).filter((x) => x.slug !== t.slug);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "DefinedTerm",
        name: t.term,
        description: t.definition,
        url: `${SITE_URL}${termPath(t.slug)}`,
        inLanguage: "pt-BR",
        inDefinedTermSet: `${SITE_URL}${GLOSSARIO_PATH}#glossario`,
      },
      {
        "@type": "FAQPage",
        dateModified: HOWTO_UPDATED,
        mainEntity: [{ "@type": "Question", name: `O que é ${t.term.toLowerCase()} no ${g.name}?`, acceptedAnswer: { "@type": "Answer", text: t.definition } }],
      },
      breadcrumbLd([
        { name: SITE_NAME, path: "/" },
        { name: "Glossário", path: GLOSSARIO_PATH },
        { name: t.term, path: termPath(t.slug) },
      ]),
    ],
  };
  const chip = "rounded-full bg-black/30 px-3 py-1.5 text-sm text-white/80 ring-1 ring-white/10 transition hover:text-gold";

  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
        <JsonLd data={ld} />
        <header className="relative flex flex-col items-center gap-1 px-12">
          <BackButton href={GLOSSARIO_PATH} className="absolute left-0 top-1/2 -translate-y-1/2" />
          <span className="font-display text-xs tracking-[0.4em] text-white/60">{g.name.toUpperCase()}</span>
          <h1 className="text-balance text-center font-display text-3xl text-gold sm:text-4xl">{t.term}</h1>
        </header>
        <section className="flex flex-col gap-2 rounded-2xl bg-black/30 p-4 ring-1 ring-gold/30 sm:p-5">
          <h2 className="font-display text-sm tracking-[0.2em] text-gold">O QUE É</h2>
          <p className="leading-relaxed text-white/85">{t.definition}</p>
        </section>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`${g.path}/como-jogar`} className={chip}>
            Regras do {g.name}
          </Link>
          <Link href={GLOSSARIO_PATH} className={chip}>
            Todos os termos
          </Link>
        </div>
        {others.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-center font-display text-xl text-gold">Outros termos do {g.name}</h2>
            <ul className="flex flex-wrap justify-center gap-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={termPath(o.slug)} className={chip}>
                    {o.term}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Link
          href={g.path}
          className="mx-auto rounded-xl bg-gold px-8 py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none"
        >
          Jogar {g.name}
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
