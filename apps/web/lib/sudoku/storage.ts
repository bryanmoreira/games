"use client";

import { DIFFICULTIES, type Difficulty, type GameState } from "@truco/sudoku";

// A partida fica salva no aparelho: recarregar a página continua de onde parou.
const GAME_KEY = "sudoku.game";
const LEVEL_KEY = "sudoku.level";
const BEST_KEY = "sudoku.best";

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as GameState;
    return Array.isArray(g.values) && g.values.length === 81 && Array.isArray(g.solution) ? g : null;
  } catch {
    return null;
  }
}

export function saveGame(game: GameState) {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  } catch {
    try {
      localStorage.setItem(GAME_KEY, JSON.stringify({ ...game, history: game.history.slice(-50) }));
    } catch {}
  }
}

export function loadLevel(): Difficulty {
  try {
    const v = localStorage.getItem(LEVEL_KEY) as Difficulty;
    return DIFFICULTIES.includes(v) ? v : "easy";
  } catch {
    return "easy";
  }
}

export function saveLevel(level: Difficulty) {
  try {
    localStorage.setItem(LEVEL_KEY, level);
  } catch {}
}

export type Bests = Partial<Record<Difficulty, number>>;

export function loadBests(): Bests {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}") as Bests;
  } catch {
    return {};
  }
}

/** Guarda o tempo se for o melhor do nível. Diz se foi recorde. */
export function saveBest(level: Difficulty, ms: number): boolean {
  const b = loadBests();
  if (b[level] !== undefined && b[level]! <= ms) return false;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify({ ...b, [level]: ms }));
  } catch {}
  return true;
}
