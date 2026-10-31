import Link from "next/link";
import { cellsOf, type Puzzle as CacaPuzzle } from "@mesa/caca-palavras";
import type { Puzzle as SudokuPuzzle } from "@mesa/sudoku";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo";
import { PrintButton } from "@/components/imprimir/PrintButton";
import { SITE_URL } from "@/lib/seo";

// Folhas para imprimir. Na tela: o site em volta e a folha branca no meio. Na impressão (globals.css, .print-root),
// só as folhas, uma por página.

/** Moldura: título, texto, opções e botão na tela; folhas no meio; links e rodapé que a impressão esconde */
export function PrintShell({
  back,
  kicker,
  title,
  intro,
  options,
  what,
  ld,
  sheets,
  children,
}: {
  back: string;
  kicker: string;
  title: string;
  intro: React.ReactNode;
  options?: React.ReactNode;
  what: string;
  ld: object;
  sheets: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="print-root min-h-dvh bg-[#0f1813] print:bg-white">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12 print:block print:max-w-none print:p-0">
        <JsonLd data={ld} />
        <div className="flex flex-col gap-6 print:hidden">
          <header className="relative flex flex-col items-center gap-1 px-12">
            <BackButton href={back} className="absolute left-0 top-1/2 -translate-y-1/2" />
            <span className="font-display text-xs tracking-[0.4em] text-white/60">{kicker}</span>
            <h1 className="text-balance text-center font-display text-3xl text-gold sm:text-4xl">{title}</h1>
          </header>
          <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">{intro}</p>
          {options}
          <div className="flex justify-center">
            <PrintButton what={what} />
          </div>
        </div>
        {sheets}
        {children && <div className="flex flex-col gap-8 print:hidden">{children}</div>}
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

/** Folha A4: branca na tela, a página inteira na impressão */
export function Paper({ title, subtitle, children, last }: { title: string; subtitle?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section
      className={`mx-auto w-full max-w-[720px] rounded-xl bg-white p-5 text-stone-900 shadow-xl sm:p-8 print:max-w-none print:rounded-none print:p-0 print:shadow-none ${
        last ? "" : "print:break-after-page"
      }`}
    >
      <header className="mb-4 flex items-end justify-between gap-4 border-b-2 border-stone-900 pb-2">
        <div>
          <h2 className="font-display text-xl leading-tight sm:text-2xl">{title}</h2>
          {subtitle && <p className="text-xs text-stone-600 sm:text-sm">{subtitle}</p>}
        </div>
        <span className="shrink-0 text-right text-[10px] leading-tight text-stone-500 sm:text-xs">{SITE_URL.replace("https://", "")}</span>
      </header>
      {children}
    </section>
  );
}

/** Grade de sudoku em tinta preta; com `solution`, os números que faltavam saem em cinza */
export function SudokuGrid({ p, solved, small }: { p: SudokuPuzzle; solved?: boolean; small?: boolean }) {
  return (
    <div className={`grid aspect-square w-full grid-cols-9 border-2 border-stone-900 ${small ? "text-[9px] sm:text-xs" : "text-sm sm:text-xl"}`}>
      {p.puzzle.map((v, i) => {
        const r = Math.floor(i / 9);
        const c = i % 9;
        const shown = v || (solved ? p.solution[i] : 0);
        return (
          <span
            key={i}
            className={`flex items-center justify-center border-stone-400 font-semibold tabular-nums ${c % 3 === 2 && c < 8 ? "border-r-2 border-r-stone-900" : c < 8 ? "border-r" : ""} ${
              r % 3 === 2 && r < 8 ? "border-b-2 border-b-stone-900" : r < 8 ? "border-b" : ""
            } ${v ? "text-stone-900" : "text-stone-400"}`}
          >
            {shown || ""}
          </span>
        );
      })}
    </div>
  );
}

/** Grade do caça-palavras; com `solved`, as casas das palavras ficam marcadas */
export function CacaGrid({ p, solved }: { p: CacaPuzzle; solved?: boolean }) {
  const marked = new Set(solved ? p.words.flatMap((w) => cellsOf(p, w)) : []);
  const text = p.size >= 15 ? "text-xs sm:text-lg" : p.size >= 12 ? "text-sm sm:text-xl" : "text-base sm:text-2xl";
  return (
    <div className={`mx-auto grid w-full max-w-[600px] font-mono font-semibold ${text}`} style={{ gridTemplateColumns: `repeat(${p.size}, minmax(0, 1fr))` }}>
      {[...p.grid].map((l, i) => (
        <span key={i} className={`flex aspect-square items-center justify-center ${marked.has(i) ? "rounded bg-stone-300 text-stone-900" : solved ? "text-stone-400" : "text-stone-900"}`}>
          {l}
        </span>
      ))}
    </div>
  );
}

/** Lista de palavras para achar, em colunas, com quadradinho para riscar */
export function WordChecklist({ words }: { words: string[] }) {
  return (
    <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm font-semibold sm:grid-cols-4 sm:text-base">
      {words.map((w) => (
        <li key={w} className="flex items-center gap-2">
          <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rounded-sm border-2 border-stone-900" />
          {w}
        </li>
      ))}
    </ul>
  );
}

/** Botões de opção (nível, outra folha) — só na tela */
export function OptionLinks({ label, items }: { label: string; items: { href: string; text: string; active?: boolean }[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-xs tracking-[0.2em] text-white/40">{label.toUpperCase()}</span>
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={`rounded-full px-4 py-2 font-display text-xs ring-1 transition ${
            it.active ? "bg-gold text-stone-900 ring-gold" : "bg-black/30 text-white/80 ring-white/10 hover:text-gold"
          }`}
        >
          {it.text}
        </Link>
      ))}
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
