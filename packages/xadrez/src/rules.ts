import {
  FLAG_CASTLE,
  FLAG_EP,
  POINTS,
  colOf,
  initialBoard,
  inCheck,
  insufficient,
  legalCodes,
  loneKing,
  make,
  makePos,
  materialOf,
  mFlag,
  mFrom,
  mPromo,
  mTo,
  san,
  toMove,
  typeOf,
  type Pos,
} from "./board";
import {
  CLOCKS,
  CLOCK_TIME,
  DEFAULT_SETTINGS,
  FIFTY_LIMIT,
  LEVELS,
  PAWN,
  QUEEN,
  REPEAT_LIMIT,
  type Action,
  type Clock,
  type Color,
  type GameState,
  type Move,
  type Seat,
  type SeatStats,
  type Settings,
} from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

/** Opções vindas do lobby; o que não for válido fica como estava. */
export function parseSettings(raw: unknown, prev: Settings = DEFAULT_SETTINGS): Settings {
  const r = (raw ?? {}) as Partial<Record<keyof Settings, unknown>>;
  return {
    level: LEVELS.includes(r.level as never) ? (r.level as Settings["level"]) : prev.level,
    clock: CLOCKS.includes(r.clock as never) ? (r.clock as Settings["clock"]) : prev.clock,
  };
}

/** 1 para quem joga de brancas, -1 para quem joga de pretas. */
export const sideOfSeat = (s: Pick<GameState, "white">, seat: Seat) => (seat === s.white ? 1 : -1);
export const colorOf = (s: Pick<GameState, "white">, seat: Seat): Color => (seat === s.white ? "white" : "black");
export const seatOfSide = (s: Pick<GameState, "white">, side: number): Seat => (side > 0 ? s.white : ((1 - s.white) as Seat));

/** Posição da partida para a geração de lances e a IA (cópia do tabuleiro). */
export const posOf = (s: Pick<GameState, "board" | "white" | "turn" | "castle" | "ep" | "half">): Pos =>
  makePos(s.board, sideOfSeat(s, s.turn), s.castle, s.ep, s.half);

/** Chave da posição para a repetição: peças, quem joga, roques e en passant (só se der para capturar). */
export function positionKey(pos: Pos): string {
  let ep = "-";
  if (pos.ep >= 0) {
    const from = pos.ep + (pos.side > 0 ? 8 : -8);
    const c = colOf(pos.ep);
    if ((c > 0 && pos.board[from - 1] === pos.side * PAWN) || (c < 7 && pos.board[from + 1] === pos.side * PAWN)) ep = String(pos.ep);
  }
  return `${pos.board.join(",")}|${pos.side}|${pos.castle}|${ep}`;
}

const emptyStats = (): SeatStats => ({ captured: 0, behind: 0, promotions: 0, lostQueen: false });

const newClock = (settings: Settings, now: number): Clock | null => {
  if (settings.clock === "none") return null;
  const { base, inc } = CLOCK_TIME[settings.clock];
  return { base, inc, left: [base, base], since: now };
};

/** Partida nova. Com `prev` (o "De novo"), mantém o placar e troca as cores. `now` liga o relógio. */
export function newGame(rng: () => number = Math.random, settings: Settings = DEFAULT_SETTINGS, prev?: GameState | null, now = 0): GameState {
  const white: Seat = prev ? ((1 - prev.white) as Seat) : rng() < 0.5 ? 0 : 1;
  const board = initialBoard();
  const s: GameState = {
    settings: { ...settings },
    board,
    castle: 15,
    ep: -1,
    half: 0,
    white,
    turn: white,
    phase: "playing",
    moves: [],
    winner: null,
    end: null,
    positions: {},
    clock: newClock(settings, now),
    drawOffer: null,
    offeredAt: [-1, -1],
    stats: [emptyStats(), emptyStats()],
    scores: prev ? [...prev.scores] : [0, 0],
    draws: prev?.draws ?? 0,
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
  s.positions[positionKey(posOf(s))] = 1;
  return s;
}

/** Lances válidos de quem está na vez. */
export const movesFor = (s: GameState): Move[] => (s.phase === "playing" ? legalCodes(posOf(s)).map(toMove) : []);

/** Tempo de cada lugar agora, descontando a vez em andamento. */
export function timeLeft(s: GameState, now: number): [number, number] | null {
  const c = s.clock;
  if (!c) return null;
  const left: [number, number] = [...c.left];
  if (s.phase === "playing") left[s.turn] = Math.max(0, left[s.turn] - Math.max(0, now - c.since));
  return left;
}

function finish(s: GameState, winner: Seat | null, end: GameState["end"]) {
  s.phase = "gameOver";
  s.winner = winner;
  s.end = end;
  s.drawOffer = null;
  if (winner === null) s.draws++;
  else s.scores[winner]++;
}

/** Acabou o tempo de `seat`: perde, a não ser que o adversário tenha só o rei. */
function flagged(s: GameState, seat: Seat) {
  const opp = (1 - seat) as Seat;
  s.clock!.left[seat] = 0;
  if (loneKing(s.board, sideOfSeat(s, opp))) finish(s, null, "time");
  else finish(s, opp, "time");
}

/** Desconta o tempo da vez de quem está jogando; devolve false se acabou. */
function tick(s: GameState, at: number | undefined): boolean {
  const c = s.clock;
  if (!c || at === undefined) return true;
  c.left[s.turn] -= Math.max(0, at - c.since);
  c.since = at;
  if (c.left[s.turn] > 0) return true;
  flagged(s, s.turn);
  return false;
}

export const canOfferDraw = (s: GameState, seat: Seat) =>
  s.phase === "playing" && s.drawOffer === null && s.moves.length >= 2 && s.offeredAt[seat] < s.moves.length - 1;

export function applyAction(state: GameState, action: Action): Result {
  if (state.phase !== "playing") return { ok: false, error: "Partida encerrada" };
  if (!action || typeof action !== "object") return { ok: false, error: "Ação inválida" };

  if (action.type === "flag") {
    const left = timeLeft(state, action.at);
    if (!left || left[state.turn] > 0) return { ok: false, error: "Ainda tem tempo" };
    const s = structuredClone(state);
    tick(s, action.at);
    return { ok: true, state: s };
  }

  const seat = action.seat;
  if (seat !== 0 && seat !== 1) return { ok: false, error: "Ação inválida" };
  const opp = (1 - seat) as Seat;

  if (action.type === "resign") {
    const s = structuredClone(state);
    // quem desiste com o relógio zerado perdeu pelo tempo antes
    if (!tick(s, action.at)) return { ok: true, state: s };
    finish(s, opp, "resign");
    return { ok: true, state: s };
  }

  if (action.type === "offerDraw") {
    if (!canOfferDraw(state, seat)) return { ok: false, error: "Não dá para oferecer empate agora" };
    const s = structuredClone(state);
    s.drawOffer = seat;
    s.offeredAt[seat] = s.moves.length;
    return { ok: true, state: s };
  }

  if (action.type === "answerDraw") {
    if (state.drawOffer !== opp) return { ok: false, error: "Sem oferta de empate" };
    const s = structuredClone(state);
    s.drawOffer = null;
    if (action.accept) finish(s, null, "agreed");
    return { ok: true, state: s };
  }

  if (action.type !== "move") return { ok: false, error: "Ação inválida" };
  if (seat !== state.turn) return { ok: false, error: "Não é sua vez" };
  const pos = posOf(state);
  const legal = legalCodes(pos);
  const code = legal.find((m) => mFrom(m) === action.from && mTo(m) === action.to && (mPromo(m) || undefined) === (action.promo || undefined));
  if (code === undefined) return { ok: false, error: "Lance inválido" };

  const s = structuredClone(state);
  if (!tick(s, action.at)) return { ok: true, state: s };

  const side = pos.side;
  const notation = san(pos, code, legal);
  const flag = mFlag(code);
  const from = mFrom(code);
  const to = mTo(code);
  const capturedAt = flag === FLAG_EP ? to + (side > 0 ? 8 : -8) : to;
  const captured = typeOf(pos.board[capturedAt]);
  make(pos, code);
  const check = inCheck(pos);
  s.board = pos.board.slice();
  s.castle = pos.castle;
  s.ep = pos.ep;
  s.half = pos.half;
  s.moves.push({
    seat,
    from,
    to,
    promo: mPromo(code),
    captured,
    capturedAt: captured ? capturedAt : -1,
    rook: flag === FLAG_CASTLE ? (to > from ? [from + 3, from + 1] : [from - 4, from - 1]) : null,
    san: notation,
    check,
  });
  // jogar recusa o empate que o adversário ofereceu
  if (s.drawOffer === opp) s.drawOffer = null;

  const st = s.stats[seat];
  st.captured += POINTS[captured];
  if (mPromo(code)) st.promotions++;
  if (captured === QUEEN) s.stats[opp].lostQueen = true;
  for (const x of [0, 1] as Seat[]) {
    const mine = materialOf(s.board, sideOfSeat(s, x));
    const theirs = materialOf(s.board, -sideOfSeat(s, x));
    s.stats[x].behind = Math.max(s.stats[x].behind, theirs - mine);
  }

  // captura ou peão: a posição anterior nunca mais volta
  if (captured || typeOf(state.board[from]) === PAWN) s.positions = {};
  const key = positionKey(pos);
  s.positions[key] = (s.positions[key] ?? 0) + 1;

  if (s.clock) s.clock.left[seat] += s.clock.inc;
  s.turn = opp;

  if (!legalCodes(pos).length) finish(s, check ? seat : null, check ? "mate" : "stalemate");
  else if (insufficient(s.board)) finish(s, null, "material");
  else if (s.positions[key] >= REPEAT_LIMIT) finish(s, null, "repeat");
  else if (s.half >= FIFTY_LIMIT) finish(s, null, "fifty");
  return { ok: true, state: s };
}

/** Material de cada lugar no tabuleiro (pontos). */
export const materialOfSeat = (s: Pick<GameState, "board" | "white">, seat: Seat) => materialOf(s.board, sideOfSeat(s, seat));

/** Peças que o lugar capturou, da mais valiosa para a menos (para mostrar ao lado do tabuleiro). */
export function capturedBy(s: Pick<GameState, "moves">, seat: Seat): number[] {
  return s.moves
    .filter((m) => m.seat === seat && m.captured)
    .map((m) => m.captured)
    .sort((a, b) => b - a);
}
