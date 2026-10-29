"use client";

import { isLayout, KINDS, type GameState } from "@mesa/mahjong";

// A partida fica salva no aparelho: recarregar a página continua de onde parou.
const GAME_KEY = "mahjong.game";
const LAYOUT_KEY = "mahjong.layout";
const BEST_KEY = "mahjong.best";

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isSlots = (v: unknown, n: number) => Array.isArray(v) && v.every((x) => Number.isInteger(x) && x >= 0 && x < n);
const isPairs = (v: unknown, n: number) => Array.isArray(v) && v.every((p) => Array.isArray(p) && p.length === 2 && isSlots(p, n));

/** Partida salva só volta se tiver tudo o que a mesa usa; senão começa outra. */
export function isGame(g: unknown): g is GameState {
  if (!g || typeof g !== "object") return false;
  const s = g as GameState;
  const n = Array.isArray(s.kinds) ? s.kinds.length : 0;
  return (
    isLayout(s.layout) &&
    n === 144 &&
    isSlots(s.kinds, KINDS) &&
    [s.seed, s.hints, s.shuffles, s.undos, s.elapsed].every(isNum) &&
    isSlots(s.removed, n) &&
    s.removed.length % 2 === 0 &&
    isPairs(s.solution, n) &&
    (s.plan === null || isPairs(s.plan, n)) &&
    typeof s.won === "boolean" &&
    (s.last === null || typeof s.last === "object")
  );
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const g: unknown = JSON.parse(raw);
    return isGame(g) ? g : null;
  } catch {
    return null;
  }
}

export function saveGame(game: GameState) {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  } catch {}
}

/** Formato escolhido; null = surpresa. */
export function loadLayout(): string | null {
  try {
    const v = localStorage.getItem(LAYOUT_KEY);
    return isLayout(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveLayout(layout: string | null) {
  try {
    if (layout) localStorage.setItem(LAYOUT_KEY, layout);
    else localStorage.removeItem(LAYOUT_KEY);
  } catch {}
}

export type Bests = Partial<Record<string, number>>;

export function loadBests(): Bests {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}") as Bests;
  } catch {
    return {};
  }
}

/** Guarda o tempo se for o melhor do formato. Diz se foi recorde. */
export function saveBest(layout: string, ms: number): boolean {
  const b = loadBests();
  if (b[layout] !== undefined && b[layout]! <= ms) return false;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ ...b, [layout]: ms }));
  } catch {}
  return true;
}
