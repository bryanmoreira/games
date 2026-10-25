"use client";

import { isLevel, isTheme, type GameState, type Level } from "@mesa/caca-palavras";

// A partida fica salva no aparelho: recarregar a página continua de onde parou.
const GAME_KEY = "cacapalavras.game";
const LEVEL_KEY = "cacapalavras.level";
const THEME_KEY = "cacapalavras.theme";
const BEST_KEY = "cacapalavras.best";

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isIdx = (v: unknown) => Array.isArray(v) && v.every((x) => Number.isInteger(x) && x >= 0);

/** Partida salva só volta se tiver tudo o que a mesa usa; senão começa outra. */
export function isGame(g: unknown): g is GameState {
  if (!g || typeof g !== "object") return false;
  const s = g as GameState;
  return (
    isLevel(s.level) &&
    isTheme(s.theme) &&
    [s.seed, s.size, s.hints, s.elapsed].every(isNum) &&
    typeof s.grid === "string" &&
    s.grid.length === s.size * s.size &&
    Array.isArray(s.words) &&
    s.words.every((w) => typeof w?.word === "string" && isNum(w.start) && isNum(w.dir)) &&
    isIdx(s.found) &&
    isIdx(s.hinted) &&
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

export function loadLevel(): Level {
  try {
    const v = localStorage.getItem(LEVEL_KEY);
    return isLevel(v) ? v : "easy";
  } catch {
    return "easy";
  }
}

export function saveLevel(level: Level) {
  try {
    localStorage.setItem(LEVEL_KEY, level);
  } catch {}
}

/** Tema escolhido; null = surpresa. */
export function loadTheme(): string | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: string | null) {
  try {
    if (theme) localStorage.setItem(THEME_KEY, theme);
    else localStorage.removeItem(THEME_KEY);
  } catch {}
}

export type Bests = Partial<Record<Level, number>>;

export function loadBests(): Bests {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}") as Bests;
  } catch {
    return {};
  }
}

/** Guarda o tempo se for o melhor do nível. Diz se foi recorde. */
export function saveBest(level: Level, ms: number): boolean {
  const b = loadBests();
  if (b[level] !== undefined && b[level]! <= ms) return false;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ ...b, [level]: ms }));
  } catch {}
  return true;
}
