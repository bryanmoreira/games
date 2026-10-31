import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo";
import { SudokuGrid } from "@/components/imprimir/Sheets";
import { SUDOKU_LEVELS, SUDOKU_PRINT_PATH, sudokuPrintPath, sudokuSheet, SUDOKUS_PER_SHEET } from "@/lib/imprimir";
import { printLd, printMetadata } from "@/lib/imprimir-seo";
import { SUDOKU_PATH } from "@/lib/sudoku/paths";

export const metadata: Metadata = printMetadata(
  SUDOKU_PRINT_PATH,
  "Sudoku para imprimir: fácil, médio, difícil e expert",
  `Sudoku para imprimir grátis em A4 ou PDF, com gabarito: ${SUDOKUS_PER_SHEET} jogos por folha nos níveis fácil, médio, difícil e expert. Uma folha nova a cada clique.`,
  ["sudoku para imprimir", "sudoku pdf", "sudoku para imprimir com gabarito", "sudoku fácil para imprimir", "sudoku difícil para imprimir"],
  SUDOKU_PATH,
);

export default function SudokuPrintHub() {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
        <JsonLd data={printLd("sudoku")} />
        <header className="relative flex flex-col items-center gap-1 px-12">
          <BackButton href={SUDOKU_PATH} className="absolute left-0 top-1/2 -translate-y-1/2" />
          <span className="font-display text-xs tracking-[0.4em] text-white/60">PARA IMPRIMIR</span>
          <h1 className="text-balance text-center font-display text-3xl text-gold sm:text-4xl">Sudoku para imprimir</h1>
        </header>
        <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">
          Escolha o nível: cada folha A4 tem {SUDOKUS_PER_SHEET} sudokus e o gabarito vem na página seguinte. Dá para imprimir ou salvar em PDF.
        </p>
        <ul className="grid grid-cols-2 gap-3">
          {SUDOKU_LEVELS.map((l) => (
            <li key={l.slug}>
              <Link href={sudokuPrintPath(l.slug)} className="flex flex-col gap-3 rounded-2xl bg-black/30 p-3 ring-1 ring-white/10 transition hover:ring-gold/60 sm:p-4">
                <span className="rounded-lg bg-white p-2">
                  <SudokuGrid p={sudokuSheet(l.difficulty, 1)[0]} small />
                </span>
                <span className="text-center font-display text-lg text-gold">{l.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
