import { DIFFICULTIES } from "@truco/sudoku";

const int = (v: unknown, min: number, max: number) => (Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : null);

export type SoloGame = "sudoku" | "paciencia-spider";

/** Dados de uma vitória solo (Sudoku/Spider) mandados pelo navegador, validados. null = inválido. */
export function parseSoloResult(game: unknown, raw: unknown): { game: SoloGame; data: Record<string, unknown> } | null {
  const d = (raw ?? {}) as Record<string, unknown>;
  const timeMs = int(d.timeMs, 1000, 24 * 60 * 60 * 1000);
  if (timeMs === null) return null;
  if (game === "sudoku") {
    const mistakes = int(d.mistakes, 0, 99);
    const hints = int(d.hints, 0, 81);
    if (!DIFFICULTIES.includes(d.difficulty as never) || mistakes === null || hints === null) return null;
    return { game, data: { difficulty: d.difficulty, timeMs, mistakes, hints } };
  }
  if (game === "paciencia-spider") {
    const suits = int(d.suits, 1, 4);
    const moves = int(d.moves, 1, 100_000);
    const score = int(d.score, -100_000, 2000);
    if (suits === null || ![1, 2, 4].includes(suits) || moves === null || score === null) return null;
    return { game, data: { suits, moves, score, timeMs } };
  }
  return null;
}
