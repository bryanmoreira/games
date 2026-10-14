import { freeCells, LINES, threats } from "./rules";
import { CELLS, FADE_LIMIT, MAX_PIECES, type Action, type Level, type PlayerView, type Seat } from "./types";

// Busca negamax com poda alfa-beta. Casas: -1 vazia, 0/1 o dono.
// No modo "some" a partida pode durar até o limite de lances, então a busca tem profundidade fixa.

const WIN = 100;
const ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7]; // centro e cantos primeiro: melhora a poda
const FADING_DEPTH = 9;

interface Sim {
  board: number[];
  pieces: [number[], number[]];
  moves: number;
  fading: boolean;
}

function play(s: Sim, seat: Seat, cell: number): Sim {
  const board = s.board.slice();
  const mine = s.pieces[seat].slice();
  if (s.fading && mine.length >= MAX_PIECES) board[mine.shift()!] = -1;
  board[cell] = seat;
  mine.push(cell);
  const pieces: [number[], number[]] = seat === 0 ? [mine, s.pieces[1]] : [s.pieces[0], mine];
  return { board, pieces, moves: s.moves + 1, fading: s.fading };
}

const wins = (board: number[], cell: number, seat: Seat) => LINES.some((l) => l.includes(cell) && l.every((c) => board[c] === seat));

function negamax(s: Sim, seat: Seat, depth: number, alpha: number, beta: number, ply: number): number {
  if (s.moves >= (s.fading ? FADE_LIMIT : CELLS)) return 0;
  const free = ORDER.filter((c) => s.board[c] === -1);
  for (const c of free) if (wins(play(s, seat, c).board, c, seat)) return WIN - ply;
  if (depth === 0) return 0;

  let best = -Infinity;
  for (const c of free) {
    const v = -negamax(play(s, seat, c), (1 - seat) as Seat, depth - 1, -beta, -alpha, ply + 1);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

const simOf = (v: PlayerView): Sim => ({
  board: v.board.map((x) => (x === null ? -1 : x)),
  pieces: [v.pieces[0].slice(), v.pieces[1].slice()],
  moves: v.moves.length,
  fading: v.settings.mode === "fading",
});

/** Nota de cada casa livre para quem está na vez (maior = melhor), com a busca completa. */
export function scoreMoves(view: PlayerView): { cell: number; score: number }[] {
  const s = simOf(view);
  const depth = s.fading ? FADING_DEPTH : CELLS;
  const me = view.seat;
  return ORDER.filter((c) => s.board[c] === -1).map((cell) => {
    const next = play(s, me, cell);
    const score = wins(next.board, cell, me) ? WIN : -negamax(next, (1 - me) as Seat, depth - 1, -Infinity, Infinity, 1);
    return { cell, score };
  });
}

const pick = <T>(xs: T[], rng: () => number) => xs[Math.floor(rng() * xs.length)];

/** Fecha se puder, bloqueia se precisar; fora isso, centro ou uma casa qualquer. Não enxerga garfo. */
function medium(view: PlayerView, rng: () => number): number {
  const free = freeCells(view.board);
  const win = threats(view, view.seat);
  if (win.length) return pick(win, rng);
  const block = threats(view, (1 - view.seat) as Seat);
  if (block.length) return pick(block, rng);
  if (view.board[4] === null && rng() < 0.6) return 4;
  return pick(free, rng);
}

function hard(view: PlayerView, rng: () => number): number {
  const scored = scoreMoves(view);
  const best = Math.max(...scored.map((m) => m.score));
  return pick(
    scored.filter((m) => m.score === best),
    rng,
  ).cell;
}

export interface AiOptions {
  /** Padrão: o nível das opções da sala. */
  level?: Level;
  rng?: () => number;
}

/** Lance da IA, usando só a visão do bot. */
export function decide(view: PlayerView, { level = view.settings.level, rng = Math.random }: AiOptions = {}): Action | null {
  if (!view.canPlay || view.playable.length === 0) return null;
  let cell: number;
  if (level === "hard") cell = hard(view, rng);
  else if (level === "easy" && rng() < 0.4) cell = pick(view.playable, rng);
  else cell = medium(view, rng);
  return { type: "place", seat: view.seat, cell };
}
