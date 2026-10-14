import {
  CELLS,
  DEFAULT_SETTINGS,
  FADE_LIMIT,
  LEVELS,
  MAX_PIECES,
  MODES,
  type Action,
  type GameState,
  type Mark,
  type Seat,
  type Settings,
} from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

/** As 8 linhas de 3 casas: linhas, colunas e as duas diagonais. */
export const LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** Opções vindas do lobby; o que não for válido fica como estava. */
export function parseSettings(raw: unknown, prev: Settings = DEFAULT_SETTINGS): Settings {
  const r = (raw ?? {}) as Partial<Record<keyof Settings, unknown>>;
  return {
    mode: MODES.includes(r.mode as never) ? (r.mode as Settings["mode"]) : prev.mode,
    level: LEVELS.includes(r.level as never) ? (r.level as Settings["level"]) : prev.level,
  };
}

/** Partida nova. Com `prev` (o "De novo"), mantém o placar e inverte quem começa. */
export function newGame(rng: () => number = Math.random, settings: Settings = DEFAULT_SETTINGS, prev?: GameState | null): GameState {
  const starter: Seat = prev ? ((1 - prev.starter) as Seat) : rng() < 0.5 ? 0 : 1;
  return {
    settings: { ...settings },
    board: Array(CELLS).fill(null),
    pieces: [[], []],
    turn: starter,
    starter,
    phase: "playing",
    moves: [],
    winner: null,
    winLine: null,
    double: [false, false],
    fork: false,
    scores: prev ? [...prev.scores] : [0, 0],
    draws: prev?.draws ?? 0,
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
}

export const markOf = (s: Pick<GameState, "starter">, seat: Seat): Mark => (seat === s.starter ? "X" : "O");

export const isFree = (board: (Seat | null)[], cell: number) => Number.isInteger(cell) && cell >= 0 && cell < CELLS && board[cell] === null;

export const freeCells = (board: (Seat | null)[]) => [...Array(CELLS).keys()].filter((c) => board[c] === null);

/** A linha completa que passa pela casa, ou null. */
export function lineThrough(board: (Seat | null)[], cell: number): number[] | null {
  const seat = board[cell];
  if (seat === null) return null;
  return (LINES.find((l) => l.includes(cell) && l.every((c) => board[c] === seat)) as number[] | undefined)?.slice() ?? null;
}

/** Casa que some quando `seat` jogar de novo (modo "some", com 3 peças no tabuleiro), ou null. */
export function nextToFade(s: GameState, seat: Seat): number | null {
  return s.settings.mode === "fading" && s.pieces[seat].length >= MAX_PIECES ? s.pieces[seat][0] : null;
}

/** Tabuleiro depois de `seat` jogar em `cell` (já sem a peça que some). */
export function boardAfter(s: GameState, seat: Seat, cell: number): (Seat | null)[] {
  const board = s.board.slice();
  const gone = nextToFade(s, seat);
  if (gone !== null) board[gone] = null;
  board[cell] = seat;
  return board;
}

/** Casas livres onde `seat` fecharia 3 em linha agora. */
export function threats(s: GameState, seat: Seat): number[] {
  return freeCells(s.board).filter((c) => lineThrough(boardAfter(s, seat, c), c) !== null);
}

export function applyAction(state: GameState, action: Action): Result {
  if (state.phase !== "playing") return { ok: false, error: "Partida encerrada" };
  if (action.type !== "place") return { ok: false, error: "Ação inválida" };
  if (action.seat !== state.turn) return { ok: false, error: "Não é sua vez" };
  if (!isFree(state.board, action.cell)) return { ok: false, error: "Casa ocupada" };

  const seat = action.seat;
  const s = structuredClone(state);
  const removed = nextToFade(state, seat);
  if (removed !== null) {
    s.board[removed] = null;
    s.pieces[seat].shift();
  }
  s.board[action.cell] = seat;
  s.pieces[seat].push(action.cell);
  s.moves.push(removed === null ? { cell: action.cell, seat } : { cell: action.cell, seat, removed });

  const line = lineThrough(s.board, action.cell);
  if (line) {
    s.phase = "gameOver";
    s.winner = seat;
    s.winLine = line;
    s.fork = state.double[seat];
    s.scores[seat]++;
  } else if (s.settings.mode === "classic" ? s.moves.length === CELLS : s.moves.length >= FADE_LIMIT) {
    s.phase = "gameOver";
    s.draws++;
  } else {
    s.turn = (1 - seat) as Seat;
    s.double[seat] = threats(s, seat).length >= 2;
  }
  return { ok: true, state: s };
}
