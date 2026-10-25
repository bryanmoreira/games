import { LEVEL_CONF, lineCells, wordCells, type Level } from "./board";
import { generate, type Placed, type Puzzle } from "./generate";
import { THEMES } from "./themes";

// Regras do Caça-Palavras (um jogador só):
// - A grade tem as palavras do tema escondidas em linha reta. Fácil: 10×10, 8 palavras, → e ↓.
//   Médio: 12×12, 12 palavras, → ↓ ↘ ↗. Difícil: 15×15, 16 palavras, as 8 direções (inclusive de trás pra frente).
// - Tudo sem acento e Ç como C. Cada palavra aparece uma vez só na grade.
// - Marca-se uma palavra selecionando da primeira à última letra (ou da última à primeira).
// - Dica: acende a primeira letra de uma palavra que falta. Conta no fim da partida.
// - Acabou quando todas as palavras foram achadas. Não tem derrota.

export interface GameState extends Puzzle {
  /** índices de `words` achados, na ordem em que foram achados */
  found: number[];
  /** palavras com a primeira letra acesa pela dica */
  hinted: number[];
  hints: number;
  /** ms jogados (o relógio fica na tela; a mesa grava aqui) */
  elapsed: number;
  won: boolean;
  /** último lance, para a tela tocar som e animar */
  last: Last | null;
}

export type Last =
  | { id: number; type: "found"; word: number }
  | { id: number; type: "miss"; from: number; to: number }
  | { id: number; type: "hint"; word: number };

export type Action = { type: "select"; from: number; to: number } | { type: "hint" };

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

export function gameFrom(p: Puzzle): GameState {
  return { ...p, words: p.words.map((w) => ({ ...w })), found: [], hinted: [], hints: 0, elapsed: 0, won: false, last: null };
}

/** Partida nova. Sem tema, sorteia um. */
export function newGame(level: Level, theme: string | null = null, seed = randomSeed()): GameState {
  const t = theme ?? THEMES[Math.floor(Math.random() * THEMES.length)].id;
  return gameFrom(generate(level, t, seed));
}

export const cellsOf = (s: { size: number }, w: Placed) => wordCells(s.size, w.start, w.dir, w.word.length);

/** Palavra que ocupa exatamente as casas de `from` a `to` (em qualquer sentido), ou -1. */
export function wordAt(s: Puzzle, from: number, to: number): number {
  const line = lineCells(s.size, from, to);
  if (!line || line.length < 2) return -1;
  return s.words.findIndex((w) => {
    const cells = cellsOf(s, w);
    if (cells.length !== line.length) return false;
    return cells.every((c, k) => c === line[k]) || cells.every((c, k) => c === line[line.length - 1 - k]);
  });
}

/** Palavras que faltam e ainda não têm dica: a dica escolhe entre elas. */
export const hintable = (s: GameState) => s.words.flatMap((_, i) => (s.found.includes(i) || s.hinted.includes(i) ? [] : [i]));

const nextId = (s: GameState) => (s.last?.id ?? 0) + 1;

export function applyAction(s: GameState, a: Action): Result {
  if (s.won) return { ok: false, error: "acabou" };
  if (a.type === "hint") {
    const left = hintable(s);
    if (!left.length) return { ok: false, error: "sem dica" };
    // a mesma partida dá sempre a mesma sequência de dicas
    const word = left[(s.seed + s.hints) % left.length];
    return { ok: true, state: { ...s, hinted: [...s.hinted, word], hints: s.hints + 1, last: { id: nextId(s), type: "hint", word } } };
  }
  const n = s.size * s.size;
  if (![a.from, a.to].every((i) => Number.isInteger(i) && i >= 0 && i < n)) return { ok: false, error: "casa inválida" };
  const line = lineCells(s.size, a.from, a.to);
  // uma casa só, ou fora de linha: não é tentativa
  if (!line || line.length < 2) return { ok: false, error: "seleção" };
  const word = wordAt(s, a.from, a.to);
  if (word >= 0 && s.found.includes(word)) return { ok: false, error: "já achada" };
  if (word < 0) return { ok: true, state: { ...s, last: { id: nextId(s), type: "miss", from: a.from, to: a.to } } };
  const found = [...s.found, word];
  return { ok: true, state: { ...s, found, won: found.length === s.words.length, last: { id: nextId(s), type: "found", word } } };
}

/** Quantas palavras tem a partida de cada nível. */
export const wordsOf = (level: Level) => LEVEL_CONF[level].words;
