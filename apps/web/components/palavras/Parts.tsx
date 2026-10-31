import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo";
import { ALPHABET, PAGES, pagePath, type PalavrasPage } from "@/lib/palavras";
import { VERBETE_DAILY_PATH } from "@/lib/verbete/paths";

/** Moldura das páginas de palavras: voltar, título, conteúdo, convite para o Verbete e rodapé. */
export function PalavrasShell({ back, title, ld, children }: { back: string; title: string; ld: object; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
        <JsonLd data={ld} />
        <header className="relative flex flex-col items-center gap-1 px-12">
          <BackButton href={back} className="absolute left-0 top-1/2 -translate-y-1/2" />
          <span className="font-display text-xs tracking-[0.4em] text-white/60">5 LETRAS</span>
          <h1 className="text-balance text-center font-display text-3xl text-gold sm:text-4xl">{title}</h1>
        </header>
        {children}
        <PlayVerbete />
      </main>
      <SiteFooter />
    </div>
  );
}

export function PlayVerbete() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/30 px-4 py-6 text-center ring-1 ring-white/10">
      <p className="text-sm text-white/70">Uma palavra nova de 5 letras todo dia, em 6 tentativas.</p>
      <Link
        href={VERBETE_DAILY_PATH}
        className="rounded-xl bg-gold px-8 py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none"
      >
        Jogar o Verbete do dia
      </Link>
    </div>
  );
}

/** A–Z das páginas "começam com" ou "terminam com": letra sem página fica apagada */
export function LetterGrid({ kind, current }: { kind: PalavrasPage["kind"]; current?: string }) {
  const has = new Set(PAGES.filter((p) => p.kind === kind).map((p) => p.letter));
  return (
    <nav aria-label={kind === "start" ? "Começam com" : "Terminam com"} className="grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(13,minmax(0,1fr))]">
      {ALPHABET.map((l) =>
        has.has(l) ? (
          <Link
            key={l}
            href={pagePath({ kind, letter: l })}
            aria-current={l === current ? "page" : undefined}
            className={`flex aspect-square items-center justify-center rounded-lg font-display text-lg uppercase ring-1 transition ${
              l === current ? "bg-gold text-stone-900 ring-gold" : "bg-black/30 text-white/80 ring-white/10 hover:text-gold"
            }`}
          >
            {l}
          </Link>
        ) : (
          <span key={l} aria-hidden="true" className="flex aspect-square items-center justify-center rounded-lg font-display text-lg uppercase text-white/15 ring-1 ring-white/5">
            {l}
          </span>
        ),
      )}
    </nav>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-center font-display text-xl text-gold">{title}</h2>
      {children}
    </section>
  );
}

/** Lista fixa de palavras (lida pelo Google, diferente da busca, que só aparece depois de digitar) */
export function WordList({ words }: { words: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {words.map((w) => (
        <li key={w} className="rounded-lg bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wide text-white/90 ring-1 ring-white/10">
          {w}
        </li>
      ))}
    </ul>
  );
}
