import { endsOf, fits, handPips, isDouble, makeSet, pips, sameTile, shuffle, sidesFor } from "./tiles";
import {
  HAND,
  MAX_PIP,
  SEATS,
  TARGET,
  WIN_POINTS,
  type Action,
  type GameState,
  type HandResult,
  type Mode,
  type Seat,
  type SeatStats,
  type Side,
  type Team,
  type Tile,
  type Win,
} from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

export const teamOf = (seat: Seat): Team => (seat % 2) as Team;

/** Lugares que formam uma mesa: 4 (duplas) ou 2 em duplas diferentes (1×1). */
export function validPlayers(seats: Seat[]): boolean {
  const ps = [...new Set(seats)];
  if (ps.length === SEATS) return true;
  return ps.length === 2 && teamOf(ps[0]) !== teamOf(ps[1]);
}

const emptyStats = (): SeatStats => ({ wins: { simples: 0, carroca: 0, laelo: 0, cruzada: 0 }, closed: 0 });

/** Próximo lugar da rodada. */
export function nextSeat(s: Pick<GameState, "players">, seat: Seat): Seat {
  const i = s.players.indexOf(seat);
  return s.players[(i + 1) % s.players.length];
}

/** Quem sai na 1ª mão e com que peça: a sena; no 1×1 sem ela, a maior carroça; sem carroça, a mais pesada. */
export function openingOf(s: Pick<GameState, "players" | "hands">): { seat: Seat; tile: Tile } {
  let best: { seat: Seat; tile: Tile; key: number } | null = null;
  for (const seat of s.players) {
    for (const t of s.hands[seat]) {
      // carroça vale mais que qualquer outra; entre as outras, soma e depois o maior número
      const key = isDouble(t) ? 1000 + t[0] : pips(t) * 10 + t[1];
      if (!best || key > best.key) best = { seat, tile: t, key };
    }
  }
  return { seat: best!.seat, tile: best!.tile };
}

/** Distribui uma mão nova. `starter` null = 1ª mão (sai quem tem a maior carroça). */
function deal(s: GameState, rng: () => number, starter: Seat | null) {
  const set = shuffle(makeSet(), rng);
  s.hands = Array.from({ length: SEATS }, () => []);
  for (const p of s.players) s.hands[p] = set.splice(0, HAND);
  s.stock = s.mode === "1x1" ? set : [];
  s.board = { first: null, left: [], right: [] };
  s.events = [];
  s.result = null;
  s.phase = "playing";
  if (starter === null) {
    const o = openingOf(s);
    s.opening = o.tile;
    s.turn = o.seat;
  } else {
    s.opening = null;
    s.turn = starter;
  }
  s.starter = s.turn;
}

/** Partida nova com os lugares ocupados (2 ou 4). */
export function newGame(rng: () => number = Math.random, players: Seat[], prev?: GameState | null): GameState {
  const ps = [...new Set(players)].filter((p) => Number.isInteger(p) && p >= 0 && p < SEATS).sort((a, b) => a - b);
  if (!validPlayers(ps)) throw new Error("Dominó precisa de 4 jogadores ou 2 em lados opostos");
  const mode: Mode = ps.length === SEATS ? "duplas" : "1x1";
  const s: GameState = {
    mode,
    players: ps,
    hands: [],
    stock: [],
    board: { first: null, left: [], right: [] },
    turn: ps[0],
    phase: "playing",
    handNo: 1,
    opening: null,
    starter: ps[0],
    doubled: false,
    events: [],
    scores: [0, 0],
    maxDeficit: [0, 0],
    result: null,
    winner: null,
    stats: Array.from({ length: SEATS }, emptyStats),
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
  deal(s, rng, null);
  return s;
}

export const cloneState = (s: GameState): GameState => structuredClone(s);

/** O lugar tem alguma peça que encaixa. */
export const canPlaySeat = (s: Pick<GameState, "hands" | "board">, seat: Seat) => s.hands[seat].some((t) => fits(s.board, t));

/** Peças que este lugar pode jogar agora (respeitando a saída obrigatória da 1ª mão). */
export function playable(s: Pick<GameState, "hands" | "board" | "opening">, seat: Seat): Tile[] {
  if (!s.board.first && s.opening) return s.hands[seat].filter((t) => sameTile(t, s.opening!));
  return s.hands[seat].filter((t) => fits(s.board, t));
}

/** Tipo de batida com a última peça `t` e as pontas `ends` de antes. */
export function winType(t: Tile, ends: [number, number]): Win {
  const [l, r] = ends;
  if (isDouble(t)) return l === t[0] && r === t[0] ? "cruzada" : "carroca";
  return (l === t[0] && r === t[1]) || (l === t[1] && r === t[0]) ? "laelo" : "simples";
}

const teamPips = (s: GameState): [number, number] => {
  const out: [number, number] = [0, 0];
  for (const p of s.players) out[teamOf(p)] += handPips(s.hands[p]);
  return out;
};

/** Fecha a mão: marca os pontos, atualiza a partida e para na fase "handEnd". */
function endHand(s: GameState, r: Omit<HandResult, "pips" | "doubled" | "points"> & { base: number }) {
  const pipsNow = teamPips(s);
  const points = r.team === null ? 0 : r.base * (s.doubled ? 2 : 1);
  s.result = { kind: r.kind, seat: r.seat, team: r.team, win: r.win, points, pips: pipsNow, doubled: s.doubled };
  if (r.team !== null) s.scores[r.team] += points;
  for (const t of [0, 1] as const) s.maxDeficit[t] = Math.max(s.maxDeficit[t], s.scores[1 - t] - s.scores[t]);
  if (r.kind === "batida" && r.win) s.stats[r.seat].wins[r.win]++;
  if (r.kind === "fechado") s.stats[r.seat].closed++;
  // empate no fechado: a próxima vale o dobro
  s.doubled = r.kind === "fechado" && r.team === null;
  if (s.scores[0] >= TARGET || s.scores[1] >= TARGET) s.winner = s.scores[0] >= TARGET ? 0 : 1;
  s.phase = "handEnd";
}

/**
 * Depois de cada lance: quem não tem peça e não pode comprar passa sozinho, até chegar em alguém que
 * joga (ou compra). Se ninguém consegue jogar e o monte acabou, o jogo fechou.
 */
function settle(s: GameState) {
  for (let i = 0; i <= s.players.length; i++) {
    if (s.stock.length === 0 && !s.players.some((p) => canPlaySeat(s, p))) {
      const last = [...s.events].reverse().find((e) => e.kind === "play");
      const pipsNow = teamPips(s);
      const team = pipsNow[0] === pipsNow[1] ? null : pipsNow[0] < pipsNow[1] ? 0 : 1;
      endHand(s, { kind: "fechado", seat: last?.seat ?? s.turn, team, win: null, base: 1 });
      return;
    }
    if (canPlaySeat(s, s.turn) || s.stock.length > 0) return;
    s.events.push({ kind: "pass", seat: s.turn, ends: endsOf(s.board)! });
    s.turn = nextSeat(s, s.turn);
  }
}

export function applyAction(state: GameState, action: Action, rng: () => number = Math.random): Result {
  if (action?.type === "advance") {
    if (state.phase !== "handEnd") return { ok: false, error: "Nada a avançar" };
    const s = cloneState(state);
    if (s.winner !== null) {
      s.phase = "gameOver";
      return { ok: true, state: s };
    }
    s.handNo++;
    deal(s, rng, s.result!.seat);
    return { ok: true, state: s };
  }

  if (state.phase !== "playing") return { ok: false, error: "Mão encerrada" };
  if (action?.seat !== state.turn) return { ok: false, error: "Não é sua vez" };
  const seat = state.turn;

  if (action.type === "draw") {
    if (canPlaySeat(state, seat)) return { ok: false, error: "Você tem peça para jogar" };
    if (state.stock.length === 0) return { ok: false, error: "O monte acabou" };
    const s = cloneState(state);
    s.hands[seat].push(s.stock.pop()!);
    s.events.push({ kind: "draw", seat });
    settle(s);
    return { ok: true, state: s };
  }

  if (action.type === "play") {
    const t = action.tile;
    if (!Array.isArray(t) || t.length !== 2 || !t.every((x) => Number.isInteger(x) && x >= 0 && x <= MAX_PIP)) {
      return { ok: false, error: "Peça inválida" };
    }
    const idx = state.hands[seat].findIndex((h) => sameTile(h, [Math.min(t[0], t[1]), Math.max(t[0], t[1])]));
    if (idx < 0) return { ok: false, error: "Peça não está na mão" };
    const piece = state.hands[seat][idx];
    if (!state.board.first && state.opening && !sameTile(piece, state.opening)) {
      return { ok: false, error: `Saia com ${state.opening[0]}-${state.opening[1]}` };
    }
    const sides = sidesFor(state.board, piece);
    if (sides.length === 0) return { ok: false, error: "Essa peça não encaixa" };
    const before = endsOf(state.board);
    let side: Side;
    if (!before) side = "right";
    else if (action.side === "left" || action.side === "right") {
      // pontas iguais: entra dos dois lados
      if (!sides.includes(action.side) && before[0] !== before[1]) return { ok: false, error: "Essa peça não encaixa aí" };
      side = action.side;
    } else if (sides.length === 1) side = sides[0];
    else return { ok: false, error: "Escolha a ponta" };

    const s = cloneState(state);
    const ends = before;
    const n = s.events.filter((e) => e.kind === "play").length;
    s.hands[seat].splice(idx, 1);
    if (!s.board.first) {
      s.board.first = { tile: piece, inner: piece[0], outer: piece[1], seat, n };
      s.events.push({ kind: "play", seat, tile: piece, side: null, n });
    } else {
      const end = side === "left" ? ends![0] : ends![1];
      const outer = piece[0] === end ? piece[1] : piece[0];
      s.board[side].push({ tile: piece, inner: end, outer, seat, n });
      s.events.push({ kind: "play", seat, tile: piece, side, n });
    }

    if (s.hands[seat].length === 0) {
      const win = ends ? winType(piece, ends) : "simples";
      endHand(s, { kind: "batida", seat, team: teamOf(seat), win, base: WIN_POINTS[win] });
      return { ok: true, state: s };
    }
    s.turn = nextSeat(s, seat);
    settle(s);
    return { ok: true, state: s };
  }

  return { ok: false, error: "Ação inválida" };
}
