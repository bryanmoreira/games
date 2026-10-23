import { isWildCard, makeDeck, shuffle, sumPoints } from "./cards";
import { arrangements, canastraKind, meldPoints, pickArrangement, type Arrangement } from "./melds";
import {
  BATIDA_BONUS,
  CANASTRA_BONUS,
  HAND,
  MORTO,
  MORTO_PENALTY,
  SEATS,
  TARGET,
  type Action,
  type Card,
  type Event,
  type GameState,
  type HandResult,
  type Meld,
  type Mode,
  type Seat,
  type SeatStats,
  type TakeOption,
  type Team,
  type TeamScore,
  type TeamStats,
} from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

export const teamOf = (seat: Seat): Team => (seat % 2) as Team;

/** Lugares que formam uma mesa: 4 (duplas) ou 2 em duplas diferentes (1×1). */
export function validPlayers(seats: Seat[]): boolean {
  const ps = [...new Set(seats)];
  if (ps.length === SEATS) return true;
  return ps.length === 2 && teamOf(ps[0]) !== teamOf(ps[1]);
}

/** Próximo lugar da rodada. */
export function nextSeat(s: Pick<GameState, "players">, seat: Seat): Seat {
  const i = s.players.indexOf(seat);
  return s.players[(i + 1) % s.players.length];
}

const emptySeatStats = (): SeatStats => ({ batidas: 0, mortos: 0, maxPile: 0 });
const emptyTeamStats = (): TeamStats => ({ limpa: 0, suja: 0, real: 0, bestHand: 0 });

export const teamHasCanastra = (melds: Meld[], team: Team) => melds.some((m) => m.team === team && canastraKind(m) !== null);

// ---------- o que as regras precisam saber de um lugar (o estado todo ou só a visão) ----------

export interface Ctx {
  hand: Card[];
  team: Team;
  melds: Meld[];
  /** A dupla já pegou o morto. */
  mortoTaken: boolean;
  pile: Card[];
}

export const ctxOf = (s: GameState, seat: Seat): Ctx => ({
  hand: s.hands[seat],
  team: teamOf(seat),
  melds: s.melds,
  mortoTaken: s.mortoTaken[teamOf(seat)],
  pile: s.pile,
});

export interface Plan {
  /** Cartas da mão que entram no jogo. */
  used: Card[];
  /** Carta de cima do lixo (só ao pegar o lixo). */
  top: Card | null;
  /** Jogo da mesa que recebe as cartas (null = jogo novo). */
  target: Meld | null;
  arrangement: Arrangement;
  /** Cartas na mão depois do lance (já com o lixo, se pegou). */
  leaving: number;
}

export type PlanResult = { ok: true; plan: Plan } | { ok: false; error: string };

/**
 * Confere um lance de baixar (`meld`), acrescentar (`add`) ou pegar o lixo (`take`) sem mexer em nada.
 * `ids` são as cartas da mão; `meldId` o jogo que recebe (add e take).
 */
export function plan(ctx: Ctx, kind: "meld" | "add" | "take", ids: string[], meldId: string | null, wildAt?: number): PlanResult {
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== "string")) return { ok: false, error: "Cartas inválidas" };
  const used: Card[] = [];
  for (const id of ids) {
    if (used.some((c) => c.id === id)) return { ok: false, error: "Carta repetida" };
    const c = ctx.hand.find((h) => h.id === id);
    if (!c) return { ok: false, error: "Carta não está na mão" };
    used.push(c);
  }
  let target: Meld | null = null;
  if (kind === "add" || (kind === "take" && meldId)) {
    target = ctx.melds.find((m) => m.id === meldId && m.team === ctx.team) ?? null;
    if (!target) return { ok: false, error: "Esse jogo não é da sua dupla" };
  }
  let top: Card | null = null;
  if (kind === "take") {
    top = ctx.pile[ctx.pile.length - 1] ?? null;
    if (!top) return { ok: false, error: "Lixo vazio" };
    if (isWildCard(top)) return { ok: false, error: "Curinga no topo trava o lixo" };
    if (!target && used.length < 2) return { ok: false, error: "Junte a carta do lixo com 2 da mão, ou ponha num jogo seu" };
  }
  if (kind === "meld" && used.length < 3) return { ok: false, error: "Um jogo tem 3 cartas ou mais" };
  if (kind === "add" && used.length === 0) return { ok: false, error: "Escolha cartas para acrescentar" };

  const incoming = top ? [top, ...used] : used;
  const opts = arrangements(target?.cards ?? [], target?.suit ?? null, incoming);
  if (opts.length === 0) return { ok: false, error: target ? "Essas cartas não entram nesse jogo" : "Essas cartas não formam um jogo" };
  const arrangement = pickArrangement(opts, wildAt);
  if (!arrangement) return { ok: false, error: "O curinga não pode ficar aí" };

  const leaving = ctx.hand.length - used.length + (kind === "take" ? ctx.pile.length - 1 : 0);
  if (ctx.mortoTaken && leaving <= 1) {
    const others = ctx.melds.some((m) => m !== target && m.team === ctx.team && canastraKind(m) !== null);
    if (!others && canastraKind(arrangement) === null) {
      return { ok: false, error: leaving === 0 ? "Só bate com canastra" : "Sem canastra, fique com 2 cartas" };
    }
  }
  return { ok: true, plan: { used, top, target, arrangement, leaving } };
}

const optionKey = (cards: Card[]) => cards.map((c) => `${c.rank}${c.suit ?? ""}`).sort().join("|");

/** Jeitos de pegar o lixo agora: a carta de cima num jogo seu, ou com 2 cartas da mão num jogo novo. */
export function takeOptions(ctx: Ctx, limit = 16, first = false): TakeOption[] {
  const out: TakeOption[] = [];
  const top = ctx.pile[ctx.pile.length - 1];
  if (!top || isWildCard(top)) return out;
  for (const m of ctx.melds) {
    if (m.team !== ctx.team) continue;
    if (plan(ctx, "take", [], m.id).ok) {
      out.push({ meld: m.id, cards: [] });
      if (first) return out;
    }
  }
  const seen = new Set<string>();
  const h = ctx.hand;
  for (let i = 0; i < h.length && out.length < limit; i++) {
    for (let j = i + 1; j < h.length && out.length < limit; j++) {
      const k = optionKey([h[i], h[j]]);
      if (seen.has(k)) continue;
      seen.add(k);
      if (plan(ctx, "take", [h[i].id, h[j].id], null).ok) {
        out.push({ meld: null, cards: [h[i].id, h[j].id] });
        if (first) return out;
      }
    }
  }
  return out;
}

export const canTakePile = (ctx: Ctx) => takeOptions(ctx, 1, true).length > 0;

/** Descartar `cardId` é permitido (a última carta só sai com canastra, se a dupla já pegou o morto). */
export function canDiscard(ctx: Ctx, cardId: string): boolean {
  if (!ctx.hand.some((c) => c.id === cardId)) return false;
  if (ctx.hand.length === 1 && ctx.mortoTaken && !ctx.melds.some((m) => m.team === ctx.team && canastraKind(m) !== null)) return false;
  return true;
}

// ---------- partida ----------

function pushEvent(s: GameState, e: DistributiveOmit<Event, "n">) {
  s.eventNo++;
  s.events.push({ ...e, n: s.eventNo } as Event);
  if (s.events.length > 16) s.events.shift();
}
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Distribui uma mão nova: 11 cartas para cada, dois mortos, uma carta no lixo e o resto no monte. */
function deal(s: GameState, rng: () => number) {
  const deck = shuffle(makeDeck(), rng);
  s.hands = Array.from({ length: SEATS }, () => []);
  for (const p of s.players) s.hands[p] = deck.splice(0, HAND);
  s.mortos = [deck.splice(0, MORTO), deck.splice(0, MORTO)];
  s.pile = [deck.pop()!];
  s.stock = deck;
  s.mortoTaken = [false, false];
  s.melds = [];
  s.events = [];
  s.result = null;
  s.phase = "playing";
  s.step = "draw";
  s.turn = nextSeat(s, s.dealer);
}

/** Partida nova com os lugares ocupados (2 ou 4). */
export function newGame(rng: () => number = Math.random, players: Seat[], prev?: GameState | null, target = TARGET): GameState {
  const ps = [...new Set(players)].filter((p) => Number.isInteger(p) && p >= 0 && p < SEATS).sort((a, b) => a - b);
  if (!validPlayers(ps)) throw new Error("Buraco precisa de 4 jogadores ou 2 em lados opostos");
  const mode: Mode = ps.length === SEATS ? "duplas" : "1x1";
  const s: GameState = {
    mode,
    players: ps,
    hands: [],
    stock: [],
    pile: [],
    mortos: [],
    mortoTaken: [false, false],
    melds: [],
    nextMeld: 1,
    turn: ps[0],
    step: "draw",
    phase: "playing",
    handNo: 1,
    dealer: ps[Math.floor(rng() * ps.length)],
    events: [],
    eventNo: 0,
    scores: [0, 0],
    target,
    maxDeficit: [0, 0],
    result: null,
    winner: null,
    stats: Array.from({ length: SEATS }, emptySeatStats),
    teamStats: [emptyTeamStats(), emptyTeamStats()],
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
  deal(s, rng);
  return s;
}

export const cloneState = (s: GameState): GameState => structuredClone(s);

function scoreTeam(s: GameState, team: Team, batidaTeam: Team | null): TeamScore {
  const mine = s.melds.filter((m) => m.team === team);
  const canastras = { limpa: 0, suja: 0, real: 0 };
  for (const m of mine) {
    const k = canastraKind(m);
    if (k) canastras[k]++;
  }
  const table = mine.reduce((n, m) => n + meldPoints(m), 0);
  const bonus = canastras.limpa * CANASTRA_BONUS.limpa + canastras.suja * CANASTRA_BONUS.suja + canastras.real * CANASTRA_BONUS.real;
  const hand = -s.players.filter((p) => teamOf(p) === team).reduce((n, p) => n + sumPoints(s.hands[p]), 0);
  const morto = s.mortoTaken[team] ? 0 : -MORTO_PENALTY;
  const batida = batidaTeam === team ? BATIDA_BONUS : 0;
  return { table, canastras, bonus, batida, hand, morto, total: table + bonus + batida + hand + morto };
}

/** Fecha a mão: marca os pontos, atualiza a partida e para na fase "handEnd". */
function endHand(s: GameState, kind: HandResult["kind"], seat: Seat | null) {
  const team = seat === null ? null : teamOf(seat);
  const scores: [TeamScore, TeamScore] = [scoreTeam(s, 0, team), scoreTeam(s, 1, team)];
  s.result = { kind, seat, team, scores };
  for (const t of [0, 1] as const) {
    s.scores[t] += scores[t].total;
    s.teamStats[t].limpa += scores[t].canastras.limpa;
    s.teamStats[t].suja += scores[t].canastras.suja;
    s.teamStats[t].real += scores[t].canastras.real;
    s.teamStats[t].bestHand = Math.max(s.teamStats[t].bestHand, scores[t].total);
  }
  for (const t of [0, 1] as const) s.maxDeficit[t] = Math.max(s.maxDeficit[t], s.scores[1 - t] - s.scores[t]);
  if (seat !== null) {
    s.stats[seat].batidas++;
    pushEvent(s, { kind: "batida", seat });
  }
  if ((s.scores[0] >= s.target || s.scores[1] >= s.target) && s.scores[0] !== s.scores[1]) s.winner = s.scores[0] > s.scores[1] ? 0 : 1;
  s.phase = "handEnd";
}

/** A dupla de `seat` pega o morto (11 cartas vão para a mão). */
function takeMorto(s: GameState, seat: Seat) {
  const team = teamOf(seat);
  s.mortoTaken[team] = true;
  const m = s.mortos.shift();
  if (m) {
    s.hands[seat].push(...m);
    s.stats[seat].mortos++;
    pushEvent(s, { kind: "morto", seat });
  }
}

/** Depois de baixar cartas: mão vazia = pega o morto, ou bate se a dupla já pegou. */
function afterMeld(s: GameState, seat: Seat) {
  if (s.hands[seat].length > 0) return;
  if (!s.mortoTaken[teamOf(seat)]) takeMorto(s, seat);
  else endHand(s, "batida", seat);
}

function store(s: GameState, seat: Seat, p: Plan) {
  const cards = p.arrangement.cards;
  const team = teamOf(seat);
  s.hands[seat] = s.hands[seat].filter((c) => !p.used.some((u) => u.id === c.id));
  const entering = p.top ? [p.top, ...p.used] : p.used;
  if (p.target) {
    const m = s.melds.find((x) => x.id === p.target!.id)!;
    m.cards = cards;
    pushEvent(s, { kind: "add", seat, meld: m.id, cards: entering });
  } else {
    const m: Meld = { id: `m${s.nextMeld++}`, team, suit: p.arrangement.suit, cards };
    s.melds.push(m);
    pushEvent(s, { kind: "meld", seat, meld: m.id, cards: entering });
  }
}

/** Vez de quem vem: se o monte acabou e a pessoa não pode pegar o lixo, a mão acaba. */
function passTurn(s: GameState, from: Seat) {
  s.turn = nextSeat(s, from);
  s.step = "draw";
  if (s.stock.length === 0 && !canTakePile(ctxOf(s, s.turn))) endHand(s, "monte", null);
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
    s.dealer = nextSeat(s, s.dealer);
    deal(s, rng);
    return { ok: true, state: s };
  }

  if (state.phase !== "playing") return { ok: false, error: "Mão encerrada" };
  if (action?.seat !== state.turn) return { ok: false, error: "Não é sua vez" };
  const seat = state.turn;

  if (action.type === "draw") {
    if (state.step !== "draw") return { ok: false, error: "Você já comprou" };
    if (state.stock.length === 0) return { ok: false, error: "O monte acabou" };
    const s = cloneState(state);
    s.hands[seat].push(s.stock.pop()!);
    s.step = "play";
    pushEvent(s, { kind: "draw", seat });
    return { ok: true, state: s };
  }

  if (action.type === "take") {
    if (state.step !== "draw") return { ok: false, error: "Você já comprou" };
    const r = plan(ctxOf(state, seat), "take", action.cards, action.meld ?? null, action.wildAt);
    if (!r.ok) return r;
    const s = cloneState(state);
    const count = s.pile.length;
    s.hands[seat].push(...s.pile.slice(0, -1));
    s.pile = [];
    s.stats[seat].maxPile = Math.max(s.stats[seat].maxPile, count);
    s.step = "play";
    pushEvent(s, { kind: "take", seat, count });
    store(s, seat, r.plan);
    afterMeld(s, seat);
    return { ok: true, state: s };
  }

  if (action.type === "meld" || action.type === "add") {
    if (state.step !== "play") return { ok: false, error: "Compre primeiro" };
    const r = plan(ctxOf(state, seat), action.type, action.cards, action.type === "add" ? action.meld : null, action.wildAt);
    if (!r.ok) return r;
    const s = cloneState(state);
    store(s, seat, r.plan);
    afterMeld(s, seat);
    return { ok: true, state: s };
  }

  if (action.type === "discard") {
    if (state.step !== "play") return { ok: false, error: "Compre primeiro" };
    const ctx = ctxOf(state, seat);
    if (!ctx.hand.some((c) => c.id === action.card)) return { ok: false, error: "Carta não está na mão" };
    if (!canDiscard(ctx, action.card)) return { ok: false, error: "Só bate com canastra" };
    const s = cloneState(state);
    const idx = s.hands[seat].findIndex((c) => c.id === action.card);
    const [card] = s.hands[seat].splice(idx, 1);
    s.pile.push(card);
    pushEvent(s, { kind: "discard", seat, card });
    if (s.hands[seat].length === 0) {
      if (s.mortoTaken[teamOf(seat)]) {
        endHand(s, "batida", seat);
        return { ok: true, state: s };
      }
      takeMorto(s, seat);
    }
    passTurn(s, seat);
    return { ok: true, state: s };
  }

  return { ok: false, error: "Ação inválida" };
}

