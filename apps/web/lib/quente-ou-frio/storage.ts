"use client";

import { attempts, status, type GameState, type Move } from "@mesa/quente-ou-frio";
import { loadDaily, saveDaily } from "@/lib/daily/storage";

// A partida fica salva no aparelho: a do dia por dia (no formato do calendário compartilhado), a livre numa chave só.

const FREE = "quenteoufrio.free";
const PLAYED = "quenteoufrio.played";

/** Partida do dia salva. `won`, `lost` e `elapsed` (as tentativas) são o que o calendário lê. */
interface SavedDaily extends GameState {
  won: boolean;
  lost: boolean;
  elapsed: number;
}

/** Partida livre: o número que o servidor usa para sortear a palavra. */
export interface FreeGame extends GameState {
  id: number;
}

const isMove = (m: unknown): m is Move => {
  const x = m as Move | null;
  return !!x && typeof x.word === "string" && Number.isInteger(x.rank) && x.rank >= 1;
};
export const isGame = (g: unknown): g is GameState => !!g && Array.isArray((g as GameState).moves) && (g as GameState).moves.every(isMove);

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

export const loadDailyGame = (day: string): GameState | null => {
  const g = loadDaily("quente-ou-frio", day, isGame);
  return g && { moves: g.moves, gaveUp: g.gaveUp === true };
};
export const saveDailyGame = (day: string, g: GameState) =>
  saveDaily<SavedDaily>("quente-ou-frio", day, { ...g, won: status(g) === "won", lost: status(g) === "lost", elapsed: attempts(g) });

export const newFreeId = () => Math.floor(Math.random() * 2 ** 31);

export function loadFreeGame(): FreeGame | null {
  const g = read(FREE) as FreeGame | null;
  return isGame(g) && Number.isSafeInteger(g.id) ? { id: g.id, moves: g.moves, gaveUp: g.gaveUp === true } : null;
}
export const saveFreeGame = (g: FreeGame) => write(FREE, g);

// ---------- números do aparelho (tela de fim) ----------

export interface Played {
  won: boolean;
  attempts: number;
  /** dia da palavra do dia; sem ele, livre */
  day?: string;
}

export function loadPlayed(): Played[] {
  const v = read(PLAYED);
  return Array.isArray(v) ? (v as Played[]).filter((p) => p && typeof p.won === "boolean" && Number.isInteger(p.attempts)) : [];
}

/** Guarda a partida terminada (a do dia, uma vez só). */
export function addPlayed(p: Played) {
  const all = loadPlayed();
  if (p.day && all.some((x) => x.day === p.day)) return;
  write(PLAYED, [...all, p].slice(-2000));
}
