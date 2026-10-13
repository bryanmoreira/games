import { generate, type Difficulty } from "@truco/sudoku";
import { shuffledDeck, type SuitCount } from "@truco/spider";
import { dayKey, nextDay } from "@/lib/stats/achievements";

// Desafio diário: a mesma partida para todo mundo das 00h às 23h59 (horário de Brasília).
// Sem banco aqui, para testar; o banco fica em lib/daily/db.ts.

export const DAILY_GAMES = ["sudoku", "paciencia-spider"] as const;
export type DailyGame = (typeof DAILY_GAMES)[number];
export const isDailyGame = (g: unknown): g is DailyGame => (DAILY_GAMES as readonly unknown[]).includes(g);

/** Dia do primeiro desafio: antes dele não tem. */
export const DAILY_START = "2026-10-12";

/** Sempre na maior dificuldade. */
export const DAILY_DIFFICULTY: Difficulty = "expert";
export const DAILY_SUITS: SuitCount = 4;

export interface SudokuDaily {
  difficulty: Difficulty;
  seed: number;
  puzzle: number[];
  solution: number[];
}

export interface SpiderDaily {
  suits: SuitCount;
  seed: number;
  /** baralho embaralhado: a partida sai dele (`dealGame`) */
  deck: number[];
}

export type DailyChallenge = { game: "sudoku"; day: string; data: SudokuDaily } | { game: "paciencia-spider"; day: string; data: SpiderDaily };

/** O que o perfil sabe de um desafio vencido. */
export interface DailyDone {
  timeMs: number;
  /** venceu no próprio dia (conta para a sequência) */
  onTime: boolean;
}

/** AAAA-MM-DD de uma data que existe. */
export function isDayKey(s: unknown): s is string {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Dia que já tem desafio: do primeiro até hoje. */
export function isOpenDay(day: unknown, today = dayKey(new Date())): day is string {
  return isDayKey(day) && day >= DAILY_START && day <= today;
}

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

/** Gera a partida do desafio. O Sudoku expert pode levar ~1 s. */
export function makeChallenge(game: DailyGame, seed = randomSeed()): DailyChallenge["data"] {
  if (game === "sudoku") return { difficulty: DAILY_DIFFICULTY, seed, ...generate(DAILY_DIFFICULTY, seed) };
  return { suits: DAILY_SUITS, seed, deck: shuffledDeck(seed) };
}

/** A vitória mandada pelo navegador é deste desafio? (mesmo seed e mesmo nível) */
export function matchesChallenge(ch: DailyChallenge, data: Record<string, unknown>, seed: unknown): boolean {
  if (seed !== ch.data.seed) return false;
  return ch.game === "sudoku" ? data.difficulty === ch.data.difficulty : data.suits === ch.data.suits;
}

/** ms até o próximo desafio (meia-noite em Brasília, UTC-3 o ano todo). */
export function msToNextDay(now = Date.now()): number {
  const BRT = 3 * 60 * 60 * 1000;
  const DAY = 24 * 60 * 60 * 1000;
  return DAY - ((now - BRT) % DAY + DAY) % DAY;
}

/** Dias de `DAILY_START` até hoje que ainda não têm desafio, do mais novo ao mais antigo (no máximo `limit`). */
export function missingDays(have: Iterable<string>, today: string, limit = 60): string[] {
  const set = new Set(have);
  const out: string[] = [];
  for (let d = DAILY_START; d <= today; d = nextDay(d)) if (!set.has(d)) out.push(d);
  return out.reverse().slice(0, limit);
}
