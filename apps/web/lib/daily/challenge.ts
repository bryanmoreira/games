import { generate, type Difficulty } from "@mesa/sudoku";
import { generate as generateWords, THEMES, type Level, type Puzzle } from "@mesa/caca-palavras";
import { shuffledDeck, type SuitCount } from "@mesa/spider";
import { dailyWords, isMode, plain, type Mode } from "@mesa/verbete";
import { dayKey, nextDay } from "@/lib/stats/achievements";

// Desafio diário: a mesma partida para todo mundo das 00h às 23h59 (horário de Brasília).
// Sem banco aqui, para testar; o banco fica em lib/daily/db.ts.

export const DAILY_GAMES = ["sudoku", "paciencia-spider", "verbete", "caca-palavras"] as const;
export type DailyGame = (typeof DAILY_GAMES)[number];
export const isDailyGame = (g: unknown): g is DailyGame => (DAILY_GAMES as readonly unknown[]).includes(g);

/** Dia do primeiro desafio: antes dele não tem. */
export const DAILY_START = "2026-10-12";

/** Sempre na maior dificuldade. */
export const DAILY_DIFFICULTY: Difficulty = "expert";
export const DAILY_SUITS: SuitCount = 4;
export const DAILY_WORDS_LEVEL: Level = "hard";

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

export interface VerbeteDaily {
  seed: number;
  /** palavras com acento de cada modo: 1 do Verbete, 2 do Dueto e 4 do Quarteto */
  words: Record<`${Mode}`, string[]>;
}

/** A grade inteira fica guardada: mudar o gerador depois não muda os dias que já saíram. */
export type CacaDaily = Puzzle;

export type DailyChallenge =
  | { game: "sudoku"; day: string; data: SudokuDaily }
  | { game: "paciencia-spider"; day: string; data: SpiderDaily }
  | { game: "verbete"; day: string; data: VerbeteDaily }
  | { game: "caca-palavras"; day: string; data: CacaDaily };

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

/** Número do desafio de um dia: o primeiro dia é o #1. */
export const dayNumber = (day: string) => Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${DAILY_START}T12:00:00Z`)) / 86_400_000) + 1;

/** Tema do Caça-Palavras do dia: um por dia, na ordem da lista, e recomeça no fim. */
export function dailyTheme(day: string): string {
  const n = dayNumber(day) - 1;
  return THEMES[((n % THEMES.length) + THEMES.length) % THEMES.length].id;
}

/**
 * Gera a partida do desafio do dia `day`. O Sudoku expert pode levar ~1 s.
 * O Verbete não sorteia: as palavras saem da sequência fixa pelo número do dia (sem repetir por ~206 dias).
 * O Caça-Palavras troca de tema a cada dia, na ordem da lista, e sorteia a grade.
 */
export function makeChallenge(game: DailyGame, seed = randomSeed(), day = dayKey(new Date())): DailyChallenge["data"] {
  if (game === "sudoku") return { difficulty: DAILY_DIFFICULTY, seed, ...generate(DAILY_DIFFICULTY, seed) };
  if (game === "verbete") return { seed, words: dailyWords(dayNumber(day) - 1) };
  if (game === "caca-palavras") return generateWords(DAILY_WORDS_LEVEL, dailyTheme(day), seed);
  return { suits: DAILY_SUITS, seed, deck: shuffledDeck(seed) };
}

/** O resultado mandado pelo navegador é deste desafio? (mesmo seed e mesmo nível; no Verbete, as mesmas palavras; no Caça-Palavras, o mesmo tema) */
export function matchesChallenge(ch: DailyChallenge, data: Record<string, unknown>, seed: unknown): boolean {
  if (seed !== ch.data.seed) return false;
  if (ch.game === "sudoku") return data.difficulty === ch.data.difficulty;
  if (ch.game === "caca-palavras") return data.level === ch.data.level && data.theme === ch.data.theme;
  if (ch.game === "verbete") {
    const answers = data.answers;
    if (!isMode(data.mode) || !Array.isArray(answers)) return false;
    const words = ch.data.words[`${data.mode}`];
    return words.length === answers.length && words.every((w, i) => plain(w) === plain(String(answers[i])));
  }
  return data.suits === ch.data.suits;
}

/** Chave do resultado no banco (um por jogador, jogo e chave): o dia; no Verbete, o dia e o modo (`AAAA-MM-DD:2`). */
export const dailyKey = (game: DailyGame, day: string, data: Record<string, unknown>) => (game === "verbete" ? `${day}:${data.mode}` : day);

/** Dia de uma chave de resultado (tira o modo do Verbete). */
export const dailyDay = (key: string) => key.slice(0, 10);

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
