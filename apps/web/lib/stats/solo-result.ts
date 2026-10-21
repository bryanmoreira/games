import { DIFFICULTIES } from "@mesa/sudoku";
import { isMode, MAX_GUESSES, replay, status } from "@mesa/verbete";
import { COLS, LINES_PER_LEVEL, MAX_LEVEL } from "@mesa/tijolada";
import type { Outcome } from "@/lib/stats/games";

const int = (v: unknown, min: number, max: number) => (Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : null);

export type SoloGame = "sudoku" | "paciencia-spider" | "verbete" | "tijolada";

/**
 * Dados de uma partida solo mandados pelo navegador, validados. null = inválido.
 * Sudoku e Spider só mandam vitória; o Verbete manda vitória e derrota, e o resultado sai dos chutes refeitos aqui.
 */
export function parseSoloResult(game: unknown, raw: unknown): { game: SoloGame; data: Record<string, unknown>; outcome?: Outcome } | null {
  const d = (raw ?? {}) as Record<string, unknown>;
  if (game === "verbete") return parseVerbete(d);
  if (game === "tijolada") return parseTijolada(d);
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

/**
 * Tijolada solo: não tem vitória (joga até encher o campo), então vai como derrota e só os números contam.
 * Os números precisam ser coerentes entre si: o nível sai das linhas, cada peça põe 4 blocos e os pontos
 * não passam do máximo possível para aquelas linhas e peças.
 */
function parseTijolada(d: Record<string, unknown>) {
  const timeMs = int(d.timeMs, 1000, 24 * 60 * 60 * 1000);
  const pieces = int(d.pieces, 1, 1_000_000);
  const lines = int(d.lines, 0, 1_000_000);
  const level = int(d.level, 1, MAX_LEVEL);
  const tetras = int(d.tetras, 0, 250_000);
  const score = int(d.score, 0, 1_000_000_000);
  if (timeMs === null || pieces === null || lines === null || level === null || tetras === null || score === null) return null;
  if (lines * COLS > pieces * 4 || tetras * 4 > lines || level !== Math.min(MAX_LEVEL, 1 + Math.floor(lines / LINES_PER_LEVEL))) return null;
  if (score > 48 * pieces + 6000 * lines + 500 * lines * lines) return null;
  return { game: "tijolada" as const, outcome: "loss" as const, data: { score, lines, level, tetras, pieces, timeMs } };
}

const words = (v: unknown, max: number): string[] | null =>
  Array.isArray(v) && v.length <= max && v.every((w) => typeof w === "string" && w.length <= 10) ? (v as string[]) : null;

/** Verbete: refaz a partida com as respostas e os chutes; só vale partida terminada. */
function parseVerbete(d: Record<string, unknown>) {
  const mode = d.mode;
  if (!isMode(mode)) return null;
  const answers = words(d.answers, mode);
  const guesses = words(d.guesses, MAX_GUESSES[mode]);
  if (!answers || !guesses) return null;
  const s = replay(mode, answers, guesses);
  const st = s && status(s);
  if (!s || st === "playing") return null;
  return {
    game: "verbete" as const,
    outcome: st === "won" ? ("win" as const) : ("loss" as const),
    data: { mode, attempts: s.guesses.length, answers: s.answers, guesses: s.guesses },
  };
}
