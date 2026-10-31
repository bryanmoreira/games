export const PAIRS = 15;
export const CARDS = PAIRS * 2;
export const REVEAL_MS = 1100;
export const DEAL_MS = 1500;
export type Level = "easy";
export interface Settings { level: Level }
export const DEFAULT_SETTINGS: Settings = { level: "easy" };
export function parseSettings(_raw?: unknown): Settings {
  return { level: "easy" };
}
export type Phase = "playing" | "reveal" | "gameOver";
export interface PlayerStats { pairs: number; attempts: number; mistakes: number; streak: number; bestStreak: number }
export interface GameState {
  deck: number[];
  players: number[];
  turn: number;
  starter: number;
  phase: Phase;
  open: number[];
  /** Dono de cada carta encontrada; null enquanto estiver em jogo. */
  owners: (number | null)[];
  stats: PlayerStats[];
  /** Posições já reveladas, da menos para a mais recente. */
  memory: number[];
  history: number[];
  settings: Settings;
  winners: number[];
  gameNo: number;
  startedAt: number;
  finishedAt: number | null;
}
export type Action = { type: "flip"; index: number; seat: number } | { type: "advance" };
export type ClientAction = { type: "flip"; index: number };
export interface PlayerView extends Omit<GameState, "deck" | "memory" | "history"> {
  seat: number;
  cards: (number | null)[];
  memory: { index: number; value: number }[];
  canPlay: boolean;
  legal: number[];
  flips: number;
}
