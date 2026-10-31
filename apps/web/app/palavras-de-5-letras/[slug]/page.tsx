import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterGrid, PalavrasShell, Section, WordList } from "@/components/palavras/Parts";
import { OTHER_LIMIT, PAGES, pagePath, pageTitle, pageWords, PALAVRAS_PATH, resolveSlug } from "@/lib/palavras";
import { pageLd, pageMetadata } from "@/lib/palavras-seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PAGES.map((p) => ({ slug: pagePath(p).split("/").pop()! }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = resolveSlug((await params).slug);
  return p ? pageMetadata(p) : {};
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default async function PalavrasPage({ params }: Props) {
  const p = resolveSlug((await params).slug);
  if (!p) notFound();
  const { common, other } = pageWords(p);
  const L = p.letter.toUpperCase();
  const verb = p.kind === "start" ? "começam" : "terminam";
  // a busca já chega preenchida com a letra desta página
  const finder = `${PALAVRAS_PATH}?p=${p.kind === "start" ? `${p.letter}____` : `____${p.letter}`}`;

  return (
    <PalavrasShell back={PALAVRAS_PATH} title={pageTitle(p)} ld={pageLd(p)}>
      <p className="-mt-4 text-center text-sm leading-relaxed text-white/70 sm:text-base">
        <b className="font-semibold text-white/90">
          {fmt(common.length + other.length)} palavras de 5 letras que {verb} com {L}
        </b>
        {common.length >= 3 && <>, como {common.slice(0, 3).join(", ")}</>}. As mais comuns vêm primeiro.
      </p>
      <Link
        href={finder}
        className="mx-auto flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-display text-sm text-white/90 transition hover:bg-white/20"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        Filtrar por mais letras
      </Link>
      {common.length > 0 && (
        <Section title="Mais comuns">
          <WordList words={common} />
        </Section>
      )}
      {other.length > 0 && (
        <Section title={common.length ? "Menos comuns" : "Palavras"}>
          <WordList words={other.slice(0, OTHER_LIMIT)} />
          {other.length > OTHER_LIMIT && (
            <Link href={finder} className="mx-auto text-sm text-white/60 underline-offset-4 transition hover:text-gold hover:underline">
              Ver as outras {fmt(other.length - OTHER_LIMIT)} na busca
            </Link>
          )}
        </Section>
      )}
      <Section title="Começam com">
        <LetterGrid kind="start" current={p.kind === "start" ? p.letter : undefined} />
      </Section>
      <Section title="Terminam com">
        <LetterGrid kind="end" current={p.kind === "end" ? p.letter : undefined} />
      </Section>
    </PalavrasShell>
  );
}
