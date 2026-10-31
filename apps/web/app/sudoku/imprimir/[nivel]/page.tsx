import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OptionLinks, Paper, PrintShell, Section, SudokuGrid } from "@/components/imprimir/Sheets";
import { MAX_SHEET, sheetOf, SUDOKU_LEVELS, SUDOKU_PRINT_PATH, sudokuLevel, sudokuPrintPath, sudokuSheet, SUDOKUS_PER_SHEET } from "@/lib/imprimir";
import { printLd, printMetadata } from "@/lib/imprimir-seo";
import { SUDOKU_PATH, SUDOKU_PLAY_PATH } from "@/lib/sudoku/paths";

type Props = { params: Promise<{ nivel: string }>; searchParams: Promise<{ folha?: string }> };

export function generateStaticParams() {
  return SUDOKU_LEVELS.map((l) => ({ nivel: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = sudokuLevel((await params).nivel);
  if (!l) return {};
  return printMetadata(
    sudokuPrintPath(l.slug),
    `Sudoku ${l.name.toLowerCase()} para imprimir (com gabarito)`,
    `Folhas de Sudoku ${l.name.toLowerCase()} para imprimir em A4 ou salvar em PDF: ${SUDOKUS_PER_SHEET} jogos por folha e o gabarito na página seguinte. Grátis, com uma folha nova a cada clique.`,
    [`sudoku ${l.name.toLowerCase()} para imprimir`, "sudoku para imprimir", "sudoku pdf", `sudoku ${l.name.toLowerCase()} pdf`, "sudoku com gabarito"],
    SUDOKU_PATH,
  );
}

export default async function SudokuPrint({ params, searchParams }: Props) {
  const l = sudokuLevel((await params).nivel);
  if (!l) notFound();
  const sheet = sheetOf((await searchParams).folha);
  const puzzles = sudokuSheet(l.difficulty, sheet);
  const next = sheet >= MAX_SHEET ? 1 : sheet + 1;
  const title = `Sudoku ${l.name.toLowerCase()}`;

  return (
    <PrintShell
      back={SUDOKU_PRINT_PATH}
      kicker="PARA IMPRIMIR"
      title={`${title} para imprimir`}
      intro={
        <>
          {SUDOKUS_PER_SHEET} sudokus de nível {l.name.toLowerCase()} numa folha A4, com o gabarito na página seguinte. Cada jogo tem uma solução só.
        </>
      }
      options={
        <div className="flex flex-col items-center gap-3">
          <OptionLinks label="Nível" items={SUDOKU_LEVELS.map((x) => ({ href: sudokuPrintPath(x.slug), text: x.name, active: x.slug === l.slug }))} />
          <OptionLinks label={`Folha ${sheet}`} items={[{ href: `${sudokuPrintPath(l.slug)}?folha=${next}`, text: "Outra folha" }]} />
        </div>
      }
      what={`sudoku-${l.slug}`}
      ld={printLd("sudoku", { name: title, path: sudokuPrintPath(l.slug) })}
      sheets={
        <div className="flex flex-col gap-6 print:block">
          <Paper title={title} subtitle={`Folha ${sheet} · preencha cada linha, coluna e quadrado 3 × 3 com os números de 1 a 9`}>
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              {puzzles.map((p, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-stone-500">{i + 1}</span>
                  <SudokuGrid p={p} />
                </div>
              ))}
            </div>
          </Paper>
          <Paper title={`${title}: gabarito`} subtitle={`Folha ${sheet}`} last>
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              {puzzles.map((p, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-stone-500">{i + 1}</span>
                  <SudokuGrid p={p} solved small />
                </div>
              ))}
            </div>
          </Paper>
        </div>
      }
    >
      <Section title="Prefere jogar na tela?">
        <Link href={SUDOKU_PLAY_PATH} className="mx-auto rounded-xl bg-white/10 px-6 py-3 font-display text-white/90 transition hover:bg-white/20">
          Jogar Sudoku online
        </Link>
      </Section>
    </PrintShell>
  );
}
