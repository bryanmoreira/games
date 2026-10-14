"use client";

import { isMode, plain, status, type GameState, type Mode } from "@truco/verbete";

// Cada partida fica salva no aparelho: a do dia por dia e modo, a livre por modo. Recarregar continua.

const DAILY = "verbete.daily.";
const FREE = "verbete.free.";
const STATS = "verbete.stats";
const TAB = "verbete.tab";

const dailyKey = (day: string, mode: Mode) => `${DAILY}${day}.${mode}`;

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const isStrings = (v: unknown, n?: number): v is string[] =>
  Array.isArray(v) && (n === undefined || v.length === n) && v.every((w) => typeof w === "string" && /^[a-z]{5}$/.test(w));

export function isGame(g: unknown): g is GameState {
  const s = g as GameState | null;
  return !!s && isMode(s.mode) && isStrings(s.answers, s.mode) && isStrings(s.guesses);
}

export function loadDailyGame(day: string, mode: Mode, answers: string[]): GameState | null {
  const g = read(dailyKey(day, mode));
  // só vale se for das mesmas palavras (o dia pode ter sido gerado de novo)
  return isGame(g) && g.mode === mode && g.answers.join() === answers.map(plain).join() ? g : null;
}
export const saveDailyGame = (day: string, g: GameState) => write(dailyKey(day, g.mode), g);

export function loadFreeGame(mode: Mode): GameState | null {
  const g = read(FREE + mode);
  return isGame(g) && g.mode === mode ? g : null;
}
export const saveFreeGame = (g: GameState) => write(FREE + g.mode, g);

/** Situação de uma palavra do dia: jogando (com algum chute), vencida ou perdida. */
export interface DayState {
  status: "playing" | "won" | "lost";
  attempts: number;
}

/** Palavras do dia jogadas neste aparelho, por `AAAA-MM-DD:modo`. */
export function localDays(): Record<string, DayState> {
  const out: Record<string, DayState> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const m = k && /^verbete\.daily\.(\d{4}-\d{2}-\d{2})\.([124])$/.exec(k);
      if (!m) continue;
      const g = read(k!);
      if (!isGame(g) || !g.guesses.length) continue;
      out[`${m[1]}:${m[2]}`] = { status: status(g), attempts: g.guesses.length };
    }
  } catch {}
  return out;
}

// ---------- estatísticas do aparelho (tela de fim) ----------

export interface Played {
  mode: Mode;
  won: boolean;
  attempts: number;
  /** dia da palavra do dia; sem ele, partida livre */
  day?: string;
  /** terminou no próprio dia */
  onTime?: boolean;
}

export function loadPlayed(): Played[] {
  const v = read(STATS);
  return Array.isArray(v) ? (v as Played[]).filter((p) => p && isMode(p.mode) && typeof p.won === "boolean" && Number.isInteger(p.attempts)) : [];
}

/** Guarda a partida terminada (a do dia, uma vez só). */
export function addPlayed(p: Played) {
  const all = loadPlayed();
  if (p.day && all.some((x) => x.day === p.day && x.mode === p.mode)) return;
  write(STATS, [...all, p].slice(-2000));
}

/** Aba escolhida na página do jogo: palavra do dia ou livre. */
export const loadTab = (): "day" | "free" => (read(TAB) === "free" ? "free" : "day");
export const saveTab = (tab: "day" | "free") => write(TAB, tab);
