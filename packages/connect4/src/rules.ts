import { COLS, ROWS, type Action, type Cell, type GameState, type Seat } from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

const DIRS: [number, number][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

/** Partida nova. Com `prev` (o "De novo"), mantém o placar e inverte quem começa. */
export function newGame(rng: () => number = Math.random, prev?: GameState | null): GameState {
  const starter: Seat = prev ? ((1 - prev.starter) as Seat) : rng() < 0.5 ? 0 : 1;
  return {
    cols: Array.from({ length: COLS }, () => []),
    turn: starter,
    starter,
    phase: "playing",
    moves: [],
    winner: null,
    winLine: null,
    scores: prev ? [...prev.scores] : [0, 0],
    draws: prev?.draws ?? 0,
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
}

export const at = (cols: Seat[][], col: number, row: number): Seat | null =>
  col < 0 || col >= COLS || row < 0 || row >= ROWS ? null : (cols[col][row] ?? null);

export const isPlayable = (cols: Seat[][], col: number) => Number.isInteger(col) && col >= 0 && col < COLS && cols[col].length < ROWS;

export const playableCols = (cols: Seat[][]) => [...Array(COLS).keys()].filter((c) => isPlayable(cols, c));

/** As 4+ casas em linha que passam por (col,row), ou null. */
export function lineThrough(cols: Seat[][], col: number, row: number): Cell[] | null {
  const seat = at(cols, col, row);
  if (seat === null) return null;
  for (const [dc, dr] of DIRS) {
    const line: Cell[] = [{ col, row }];
    for (const s of [1, -1]) {
      let c = col + dc * s;
      let r = row + dr * s;
      while (at(cols, c, r) === seat) {
        line.push({ col: c, row: r });
        c += dc * s;
        r += dr * s;
      }
    }
    if (line.length >= 4) return line.sort((a, b) => a.col - b.col || a.row - b.row);
  }
  return null;
}

/** Casas vazias onde `seat` completaria 4 em linha (jogáveis agora ou não). */
export function threats(cols: Seat[][], seat: Seat): Cell[] {
  const out: Cell[] = [];
  for (let col = 0; col < COLS; col++) {
    for (let row = cols[col].length; row < ROWS; row++) {
      const test = cols.map((c) => c.slice());
      // preenche por baixo só para testar a linha; a casa em si vira do `seat`
      while (test[col].length < row) test[col].push((1 - seat) as Seat);
      test[col].push(seat);
      if (lineThrough(test, col, row)) out.push({ col, row });
    }
  }
  return out;
}

export function applyAction(state: GameState, action: Action): Result {
  if (state.phase !== "playing") return { ok: false, error: "Partida encerrada" };
  if (action.type !== "drop") return { ok: false, error: "Ação inválida" };
  if (action.seat !== state.turn) return { ok: false, error: "Não é sua vez" };
  if (!isPlayable(state.cols, action.col)) return { ok: false, error: "Coluna cheia" };

  const s = structuredClone(state);
  const row = s.cols[action.col].length;
  s.cols[action.col].push(action.seat);
  s.moves.push({ col: action.col, row, seat: action.seat });

  const line = lineThrough(s.cols, action.col, row);
  if (line) {
    s.phase = "gameOver";
    s.winner = action.seat;
    s.winLine = line;
    s.scores[action.seat]++;
  } else if (s.moves.length === COLS * ROWS) {
    s.phase = "gameOver";
    s.draws++;
  } else {
    s.turn = (1 - action.seat) as Seat;
  }
  return { ok: true, state: s };
}
