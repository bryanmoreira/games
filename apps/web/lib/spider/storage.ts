"use client";

import type { Board, GameState, SuitCount } from "@truco/spider";

// A partida fica salva no aparelho: recarregar a página continua de onde parou.
const GAME_KEY = "spider.game";
const SUITS_KEY = "spider.suits";

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isPile = (v: unknown) => Array.isArray(v) && v.every(isNum);

function isBoard(b: unknown): b is Board {
  if (!b || typeof b !== "object") return false;
  const s = b as Board;
  return (
    Array.isArray(s.cols) &&
    s.cols.length === 10 &&
    s.cols.every(isPile) &&
    Array.isArray(s.hidden) &&
    s.hidden.length === 10 &&
    s.hidden.every(isNum) &&
    isPile(s.stock) &&
    Array.isArray(s.done) &&
    s.done.every(isPile)
  );
}

/** Partida salva só volta se tiver tudo o que a mesa usa; senão começa outra. */
function isGame(g: unknown): g is GameState {
  if (!isBoard(g)) return false;
  const s = g as GameState;
  return (
    [1, 2, 4].includes(s.suits) &&
    isNum(s.seed) &&
    isNum(s.moves) &&
    (s.elapsed === undefined || isNum(s.elapsed)) &&
    Array.isArray(s.history) &&
    s.history.every(isBoard) &&
    typeof s.won === "boolean" &&
    (s.last === null || typeof s.last === "object")
  );
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const g: unknown = JSON.parse(raw);
    // partidas salvas antes do cronômetro não têm elapsed
    return isGame(g) ? { ...g, elapsed: g.elapsed ?? 0 } : null;
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
