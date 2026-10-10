"use client";

import type { GameState, SuitCount } from "@truco/spider";

// A partida fica salva no aparelho: recarregar a página continua de onde parou.
const GAME_KEY = "spider.game";
const SUITS_KEY = "spider.suits";

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as GameState;
    return Array.isArray(g.cols) && g.cols.length === 10 ? g : null;
  } catch {
    return null;
  }
}

export function saveGame(game: GameState) {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  } catch {
    // histórico grande demais para o armazenamento: salva sem o desfazer antigo
    try {
      localStorage.setItem(GAME_KEY, JSON.stringify({ ...game, history: game.history.slice(-100) }));
    } catch {}
  }
}

export function loadSuits(): SuitCount {
  try {
    const n = Number(localStorage.getItem(SUITS_KEY));
    return n === 2 || n === 4 ? n : 1;
  } catch {
    return 1;
  }
}

export function saveSuits(suits: SuitCount) {
  try {
    localStorage.setItem(SUITS_KEY, String(suits));
  } catch {}
}
