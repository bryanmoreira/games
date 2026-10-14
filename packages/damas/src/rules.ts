import { boardAfter, initialBoard, isKing, legalMoves, material, sameMove, sideOf } from "./board";
import {
  DEFAULT_SETTINGS,
  ENDGAME_LIMIT,
  LEVELS,
  QUIET_LIMIT,
  REPEAT_LIMIT,
  type Action,
  type Cell,
  type Color,
  type GameState,
  type Seat,
  type SeatStats,
  type Settings,
} from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

/** Opções vindas do lobby; o que não for válido fica como estava. */
export function parseSettings(raw: unknown, prev: Settings = DEFAULT_SETTINGS): Settings {
  const r = (raw ?? {}) as Partial<Record<keyof Settings, unknown>>;
  return { level: LEVELS.includes(r.level as never) ? (r.level as Settings["level"]) : prev.level };
}

/** 1 para quem joga de brancas, -1 para quem joga de pretas. */
export const sideOfSeat = (s: Pick<GameState, "white">, seat: Seat) => (seat === s.white ? 1 : -1);
export const colorOf = (s: Pick<GameState, "white">, seat: Seat): Color => (seat === s.white ? "white" : "black");
export const seatOfSide = (s: Pick<GameState, "white">, side: number): Seat => (side > 0 ? s.white : ((1 - s.white) as Seat));

const CHARS: Record<number, string> = { 0: ".", 1: "w", 2: "W", [-1]: "b", [-2]: "B" };
/** Chave da posição: quem joga + tabuleiro. */
export const positionKey = (board: readonly number[], side: number) => (side > 0 ? "w:" : "b:") + board.map((p) => CHARS[p]).join("");

const emptyStats = (): SeatStats => ({ captured: 0, bestChain: 0, kings: 0, behind: 0 });

/** Partida nova. Com `prev` (o "De novo"), mantém o placar e troca as cores. */
export function newGame(rng: () => number = Math.random, settings: Settings = DEFAULT_SETTINGS, prev?: GameState | null): GameState {
  const white: Seat = prev ? ((1 - prev.white) as Seat) : rng() < 0.5 ? 0 : 1;
  const board = initialBoard();
  return {
    settings: { ...settings },
    board,
    white,
    turn: white,
    phase: "playing",
    moves: [],
    winner: null,
    end: null,
    quiet: 0,
    endgame: 0,
    positions: { [positionKey(board, 1)]: 1 },
    stats: [emptyStats(), emptyStats()],
    scores: prev ? [...prev.scores] : [0, 0],
    draws: prev?.draws ?? 0,
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
}

/**
 * Final pequeno em que valem só 5 lances de cada lado: um lado com uma dama sozinha e o outro com
 * 1 ou 2 damas e no máximo 3 peças.
 */
export function isSmallEndgame(board: readonly number[]): boolean {
  const w = material(board, 1);
  const b = material(board, -1);
  const lone = (m: typeof w) => m.kings === 1 && m.men === 0;
  const small = (m: typeof w) => m.kings >= 1 && m.kings <= 2 && m.kings + m.men <= 3;
  return (lone(w) && small(b)) || (lone(b) && small(w));
}

const count = (board: readonly number[], side: number) => board.reduce<number>((n, p) => n + (sideOf(p) === side ? 1 : 0), 0);

/** Lances válidos de quem está na vez. */
export const movesFor = (s: GameState) => (s.phase === "playing" ? legalMoves(s.board, sideOfSeat(s, s.turn)) : []);

export function applyAction(state: GameState, action: Action): Result {
  if (state.phase !== "playing") return { ok: false, error: "Partida encerrada" };
  if (action?.type !== "move") return { ok: false, error: "Ação inválida" };
  if (action.seat !== state.turn) return { ok: false, error: "Não é sua vez" };
  if (!Array.isArray(action.path) || !action.path.length) return { ok: false, error: "Lance inválido" };
  const move = movesFor(state).find((m) => sameMove(m, action));
  if (!move) return { ok: false, error: "Lance inválido" };

  const seat = action.seat;
  const side = sideOfSeat(state, seat);
  const piece = state.board[move.from];
  const s = structuredClone(state);
  s.board = boardAfter<Cell>(state.board, move);
  const to = move.path[move.path.length - 1];
  const promoted = !isKing(piece) && isKing(s.board[to]);
  const kingsTaken = move.captured.filter((c) => isKing(state.board[c])).length;
  s.moves.push({ ...move, path: move.path.slice(), captured: move.captured.slice(), seat, promoted, kingsTaken });

  const st = s.stats[seat];
  st.captured += move.captured.length;
  st.bestChain = Math.max(st.bestChain, move.captured.length);
  if (promoted) st.kings++;
  for (const x of [0, 1] as Seat[]) {
    const mine = count(s.board, sideOfSeat(s, x));
    const theirs = count(s.board, -sideOfSeat(s, x));
    s.stats[x].behind = Math.max(s.stats[x].behind, theirs - mine);
  }

  // contadores de empate
  const capture = move.captured.length > 0;
  s.quiet = isKing(piece) && !capture ? state.quiet + 1 : 0;
  const changed = capture || promoted;
  s.endgame = isSmallEndgame(s.board) ? (isSmallEndgame(state.board) && !changed ? state.endgame + 1 : 0) : 0;
  const key = positionKey(s.board, -side);
  // pedra andando ou captura: a posição anterior nunca mais volta
  if (!isKing(piece) || capture) s.positions = {};
  s.positions[key] = (s.positions[key] ?? 0) + 1;

  const next = (1 - seat) as Seat;
  if (!legalMoves(s.board, -side).length) {
    s.phase = "gameOver";
    s.winner = seat;
    s.end = "noMoves";
    s.scores[seat]++;
  } else if (s.quiet >= QUIET_LIMIT || s.endgame >= ENDGAME_LIMIT || s.positions[key] >= REPEAT_LIMIT) {
    s.phase = "gameOver";
    s.end = s.positions[key] >= REPEAT_LIMIT ? "repeat" : s.endgame >= ENDGAME_LIMIT ? "endgame" : "quiet";
    s.draws++;
  } else {
    s.turn = next;
  }
  return { ok: true, state: s };
}

/** Peças de cada lugar no tabuleiro. */
export function piecesOf(s: Pick<GameState, "board" | "white">, seat: Seat): number {
  return count(s.board, sideOfSeat(s, seat));
}
