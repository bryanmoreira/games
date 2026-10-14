import { CELLS, COLORS, PER_SIZE, SIZES, SLOTS, type Action, type Color, type GameState, type Seat, type Size, type Triple } from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export const slotOf = (cell: number, size: Size) => cell * SIZES + size;
export const cellOf = (slot: number) => Math.floor(slot / SIZES);
export const sizeOf = (slot: number) => (slot % SIZES) as Size;

/** As 8 linhas de 3 casas do 3×3. */
export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

const triple = (slots: number[], kind: Triple["kind"]): Triple => ({ slots: slots as Triple["slots"], kind });

/** Todas as trincas que vencem: 24 linhas, 16 escadas e 9 alvos. */
export const TRIPLES: Triple[] = [
  ...LINES.flatMap((l) => ([0, 1, 2] as Size[]).map((s) => triple(l.map((c) => slotOf(c, s)), "line"))),
  ...LINES.flatMap((l) => [
    triple(l.map((c, i) => slotOf(c, i as Size)), "stair"),
    triple(l.map((c, i) => slotOf(c, (2 - i) as Size)), "stair"),
  ]),
  ...Array.from({ length: CELLS }, (_, c) => triple([0, 1, 2].map((s) => slotOf(c, s as Size)), "stack")),
];

/** Trincas que passam por cada encaixe. */
export const SLOT_TRIPLES: Triple[][] = Array.from({ length: SLOTS }, () => []);
for (const t of TRIPLES) for (const s of t.slots) SLOT_TRIPLES[s].push(t);

/**
 * Cores de cada lugar e a ordem da rodada, começando por `starter`.
 * Com 2 jogadores, cada um leva também uma das cores que sobraram: ordem A1, B1, A2, B2.
 */
export function seatColors(players: Seat[], starter: Seat): { owner: (Seat | null)[]; order: Color[] } {
  const owner: (Seat | null)[] = Array(COLORS).fill(null);
  for (const p of players) owner[p] = p;
  const i = players.indexOf(starter);
  const turnOrder = [...players.slice(i), ...players.slice(0, i)];
  if (players.length !== 2) return { owner, order: turnOrder };
  const extra = [...Array(COLORS).keys()].filter((c) => !players.includes(c));
  extra.forEach((c, k) => (owner[c] = players[k]));
  const second = (p: Seat) => extra[players.indexOf(p)];
  return { owner, order: [turnOrder[0], turnOrder[1], second(turnOrder[0]), second(turnOrder[1])] };
}

/**
 * Partida nova com os lugares ocupados. Com `prev` (o "De novo"), mantém o placar e quem começa
 * passa ao próximo lugar.
 */
export function newGame(rng: () => number = Math.random, players: Seat[], prev?: GameState | null): GameState {
  const ps = [...new Set(players)].filter((p) => Number.isInteger(p) && p >= 0 && p < COLORS).sort((a, b) => a - b);
  if (ps.length < MIN_PLAYERS) throw new Error("Otrio precisa de 2 a 4 jogadores");
  const starter = prev ? (ps.find((p) => p > prev.starter) ?? ps[0]) : ps[Math.floor(rng() * ps.length)];
  const { owner, order } = seatColors(ps, starter);
  return {
    board: Array(SLOTS).fill(null),
    players: ps,
    owner,
    order,
    turn: 0,
    starter,
    stock: owner.map((o) => (o === null ? [0, 0, 0] : [PER_SIZE, PER_SIZE, PER_SIZE])),
    phase: "playing",
    moves: [],
    winner: null,
    winColor: null,
    win: null,
    scores: prev ? [...prev.scores] : Array(COLORS).fill(0),
    draws: prev?.draws ?? 0,
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
}

/** Cor da vez (null com a partida encerrada). */
export const currentColor = (s: GameState): Color | null => (s.phase === "playing" ? s.order[s.turn] : null);

/** Encaixes livres em que `color` pode pôr peça (tem peça daquele tamanho). */
export const placeableSlots = (s: Pick<GameState, "board" | "stock">, color: Color) =>
  s.board.flatMap((v, i) => (v === null && s.stock[color][sizeOf(i)] > 0 ? [i] : []));

/** Trinca de `color` que passa pelo encaixe (já ocupado por ela), ou null. */
export function tripleAt(board: (Color | null)[], slot: number, color: Color): Triple | null {
  return SLOT_TRIPLES[slot].find((t) => t.slots.every((x) => board[x] === color)) ?? null;
}

/** Encaixes livres em que `color` fecharia uma trinca agora (só os tamanhos que ela ainda tem). */
export function winningSlots(s: Pick<GameState, "board" | "stock">, color: Color): number[] {
  return placeableSlots(s, color).filter((i) => SLOT_TRIPLES[i].some((t) => t.slots.every((x) => x === i || s.board[x] === color)));
}

export function applyAction(state: GameState, action: Action): Result {
  if (state.phase !== "playing") return { ok: false, error: "Partida encerrada" };
  if (action?.type !== "place") return { ok: false, error: "Ação inválida" };
  const color = state.order[state.turn];
  if (action.seat !== state.owner[color]) return { ok: false, error: "Não é sua vez" };
  const { cell, size } = action;
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS || !Number.isInteger(size) || size < 0 || size >= SIZES) {
    return { ok: false, error: "Lance inválido" };
  }
  if (state.stock[color][size] <= 0) return { ok: false, error: "Acabaram as peças desse tamanho" };
  const slot = slotOf(cell, size);
  if (state.board[slot] !== null) return { ok: false, error: "Encaixe ocupado" };

  const s = structuredClone(state);
  s.board[slot] = color;
  s.stock[color][size]--;
  s.moves.push({ cell, size, color, seat: action.seat });

  const win = tripleAt(s.board, slot, color);
  if (win) {
    s.phase = "gameOver";
    s.winner = action.seat;
    s.winColor = color;
    s.win = win;
    s.scores[action.seat]++;
    return { ok: true, state: s };
  }
  // próxima cor com lance possível; quem não tem passa
  for (let k = 1; k <= s.order.length; k++) {
    const i = (s.turn + k) % s.order.length;
    if (placeableSlots(s, s.order[i]).length > 0) {
      s.turn = i;
      return { ok: true, state: s };
    }
  }
  s.phase = "gameOver";
  s.draws++;
  return { ok: true, state: s };
}
