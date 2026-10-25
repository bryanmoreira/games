import { handValue, isBlackjack, isPair, makeShoe, shuffle, cardValue, type Rng } from "./cards";
import {
  BET_MS,
  BET_STEP,
  CUT,
  DEAL_ANIM_MS,
  DEFAULT_SETTINGS,
  INSURANCE_MS,
  MAX_BET,
  MIN_BET,
  ROUND_OPTIONS,
  SEATS,
  START_CHIPS,
  TURN_MS,
  type Action,
  type Card,
  type Event,
  type EventInput,
  type GameState,
  type Hand,
  type Player,
  type PlayerStats,
  type Rounds,
  type Seat,
  type Settings,
} from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

const KEEP_EVENTS = 24;

export function parseSettings(raw: unknown, prev: Settings = DEFAULT_SETTINGS): Settings {
  const m = (raw ?? {}) as Record<string, unknown>;
  const rounds = ROUND_OPTIONS.includes(m.rounds as Rounds) ? (m.rounds as Rounds) : prev.rounds;
  const clock = typeof m.clock === "boolean" ? m.clock : prev.clock;
  return { rounds, clock };
}

const emptyStats = (): PlayerStats => ({
  rounds: 0,
  handsWon: 0,
  handsPlayed: 0,
  blackjacks: 0,
  doublesWon: 0,
  splits: 0,
  splitSweeps: 0,
  busts: 0,
  peak: START_CHIPS,
  low: START_CHIPS,
  bestRound: 0,
});

const newHand = (bet: number, cards: Card[] = [], split = false): Hand => ({ cards, bet, doubled: false, split, done: false, result: null, paid: 0 });

function push(s: GameState, e: EventInput) {
  s.eventNo++;
  s.events.push({ ...e, n: s.eventNo } as Event);
  if (s.events.length > KEEP_EVENTS) s.events.splice(0, s.events.length - KEEP_EVENTS);
}

function draw(s: GameState, rng: Rng): Card {
  // não acontece com o cartão de corte, mas o sapato nunca pode faltar
  if (s.shoe.length === 0) s.shoe = shuffle(makeShoe(), rng);
  return s.shoe.pop()!;
}

/** Jogadores sentados nesta partida, em ordem de jogo. */
export const playersOf = (s: GameState): Player[] => s.players.map((p) => s.table[p]!).filter(Boolean);

/** Quem tem cartas nesta rodada. */
const inRound = (s: GameState) => playersOf(s).filter((p) => p.hands.length > 0);

/** Banca compra: abaixo de 17, e no 17 mole (H17). */
export function dealerDraws(cards: readonly Card[]): boolean {
  const { total, soft } = handValue(cards);
  return total < 17 || (total === 17 && soft);
}

/** Maior aposta possível agora para quem tem `chips`. */
export const maxBetFor = (chips: number) => Math.floor(Math.min(MAX_BET, chips) / BET_STEP) * BET_STEP;

export const insuranceCost = (bet: number) => Math.floor(bet / 2);

export function newGame(rng: Rng, setup: { players: Seat[]; settings?: Settings }, prev: GameState | null = null, at = 0): GameState {
  const settings = setup.settings ?? DEFAULT_SETTINGS;
  const players = [...new Set(setup.players)].sort((a, b) => a - b);
  const table: (Player | null)[] = Array.from({ length: Math.max(SEATS, ...players.map((p) => p + 1)) }, () => null);
  for (const seat of players) {
    table[seat] = {
      seat,
      chips: START_CHIPS,
      bet: null,
      lastBet: prev?.table[seat]?.lastBet ?? 0,
      hands: [],
      insurance: null,
      net: null,
      stats: emptyStats(),
    };
  }
  const s: GameState = {
    settings,
    players,
    table,
    shoe: [],
    shuffleNo: prev?.shuffleNo ?? 0,
    dealer: [],
    hidden: false,
    phase: "bet",
    round: 1,
    turn: null,
    deadline: null,
    events: [],
    eventNo: prev?.eventNo ?? 0,
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
  startRound(s, at, rng, true);
  return s;
}

/** Começo de rodada: embaralha se passou do corte e abre as apostas. */
function startRound(s: GameState, at: number, rng: Rng, fresh = false) {
  s.dealer = [];
  s.hidden = false;
  s.turn = null;
  if (fresh || s.shoe.length < CUT) {
    s.shoe = shuffle(makeShoe(), rng);
    s.shuffleNo++;
    push(s, { kind: "shuffle" });
  }
  for (const p of playersOf(s)) {
    p.hands = [];
    p.insurance = null;
    p.net = null;
    // sem fichas para a aposta mínima: assiste
    p.bet = p.chips >= MIN_BET ? null : 0;
  }
  if (playersOf(s).every((p) => p.bet === 0)) {
    s.phase = "gameOver";
    s.deadline = null;
    return;
  }
  s.phase = "bet";
  s.deadline = s.settings.clock ? at + BET_MS : null;
}

/** Fim da rodada (depois do acerto, ou sem apostas): a próxima, ou o fim da partida. */
function nextRound(s: GameState, at: number, rng: Rng) {
  if (s.round >= s.settings.rounds) {
    s.phase = "gameOver";
    s.deadline = null;
    s.turn = null;
    return;
  }
  s.round++;
  startRound(s, at, rng);
}

function deal(s: GameState, at: number, rng: Rng) {
  const ps = playersOf(s).filter((p) => (p.bet ?? 0) > 0);
  if (ps.length === 0) return nextRound(s, at, rng);
  for (const p of ps) {
    p.hands = [newHand(p.bet!)];
    p.stats.rounds++;
  }
  for (let i = 0; i < 2; i++) {
    for (const p of ps) p.hands[0].cards.push(draw(s, rng));
    s.dealer.push(draw(s, rng));
  }
  s.hidden = true;
  push(s, { kind: "deal", cards: ps.length * 2 + 2 });
  const up = s.dealer[0];
  if (up.rank === "A") {
    for (const p of ps) p.insurance = p.chips >= insuranceCost(p.bet!) ? null : 0;
    if (ps.some((p) => p.insurance === null)) {
      s.phase = "insurance";
      s.deadline = s.settings.clock ? at + DEAL_ANIM_MS + INSURANCE_MS : null;
      return;
    }
  }
  peek(s, at, rng, DEAL_ANIM_MS);
}

/** Banca com ás ou 10 à mostra confere o blackjack antes de os jogadores jogarem. */
function peek(s: GameState, at: number, rng: Rng, delay: number) {
  const up = cardValue(s.dealer[0].rank);
  if ((up === 1 || up === 10) && isBlackjack(s.dealer)) {
    s.hidden = false;
    push(s, { kind: "reveal", blackjack: true });
    for (const p of inRound(s)) for (const h of p.hands) h.done = true;
    return settle(s);
  }
  for (const p of inRound(s)) {
    if (p.insurance === null) p.insurance = 0;
    const h = p.hands[0];
    if (isBlackjack(h.cards)) h.done = true;
  }
  s.phase = "play";
  nextTurn(s, at, rng, delay);
}

/** Passa a vez para a próxima mão que ainda joga; sem nenhuma, a banca joga. */
function nextTurn(s: GameState, at: number, rng: Rng, delay = 0) {
  for (const p of inRound(s)) {
    for (let i = 0; i < p.hands.length; i++) {
      const h = p.hands[i];
      if (h.done) continue;
      // segunda mão da divisão: recebe a carta quando chega a vez dela
      if (h.cards.length === 1) {
        h.cards.push(draw(s, rng));
        push(s, { kind: "hit", seat: p.seat, hand: i });
        if (handValue(h.cards).total === 21) {
          h.done = true;
          continue;
        }
      }
      s.turn = { seat: p.seat, hand: i };
      s.deadline = s.settings.clock ? at + delay + TURN_MS : null;
      return;
    }
  }
  s.turn = null;
  s.deadline = null;
  s.phase = "dealer";
}

/** Uma mão que ainda disputa contra a banca (não estourou nem é blackjack). */
const liveHands = (s: GameState) =>
  inRound(s).some((p) => p.hands.some((h) => h.result !== "bust" && !isBlackjack(h.cards, h.split)));

/** Um passo da banca: virar a carta, comprar uma, ou acertar. */
function dealerStep(s: GameState, rng: Rng) {
  if (s.hidden) {
    s.hidden = false;
    push(s, { kind: "reveal", blackjack: false });
    return;
  }
  if (liveHands(s) && dealerDraws(s.dealer)) {
    s.dealer.push(draw(s, rng));
    push(s, { kind: "dealerHit" });
    return;
  }
  settle(s);
}

function settle(s: GameState) {
  const dealerBj = isBlackjack(s.dealer);
  const dealer = handValue(s.dealer).total;
  for (const p of inRound(s)) {
    let staked = 0;
    let paid = 0;
    for (const h of p.hands) {
      staked += h.bet;
      const mine = handValue(h.cards).total;
      if (h.result === "bust") h.paid = 0;
      else if (isBlackjack(h.cards, h.split)) {
        h.result = dealerBj ? "push" : "blackjack";
        h.paid = dealerBj ? h.bet : h.bet + Math.floor(h.bet * 1.5);
      } else if (dealerBj) {
        h.result = "loss";
        h.paid = 0;
      } else if (dealer > 21 || mine > dealer) {
        h.result = "win";
        h.paid = h.bet * 2;
      } else if (mine === dealer) {
        h.result = "push";
        h.paid = h.bet;
      } else {
        h.result = "loss";
        h.paid = 0;
      }
      paid += h.paid;
    }
    const ins = p.insurance ?? 0;
    staked += ins;
    if (ins > 0 && dealerBj) paid += ins * 3;
    p.chips += paid;
    p.net = paid - staked;

    const st = p.stats;
    const won = (h: Hand) => h.result === "win" || h.result === "blackjack";
    st.handsPlayed += p.hands.length;
    st.handsWon += p.hands.filter(won).length;
    st.blackjacks += p.hands.filter((h) => h.result === "blackjack").length;
    st.doublesWon += p.hands.filter((h) => h.doubled && won(h)).length;
    if (p.hands.length === 2 && p.hands.every(won)) st.splitSweeps++;
    st.peak = Math.max(st.peak, p.chips);
    st.low = Math.min(st.low, p.chips);
    st.bestRound = Math.max(st.bestRound, p.net);
  }
  s.hidden = false;
  s.turn = null;
  s.deadline = null;
  s.phase = "settle";
  push(s, { kind: "settle" });
}

/** Mão na vez de `seat`, se for dele. */
function turnHand(s: GameState, seat: Seat): { p: Player; h: Hand; i: number } | null {
  if (s.phase !== "play" || !s.turn || s.turn.seat !== seat) return null;
  const p = s.table[seat]!;
  const h = p.hands[s.turn.hand];
  return h && !h.done ? { p, h, i: s.turn.hand } : null;
}

export const canDoubleHand = (p: Player, h: Hand) =>
  h.cards.length === 2 && !h.done && !(h.split && h.cards[0].rank === "A") && p.chips >= h.bet;

export const canSplitHand = (p: Player, h: Hand) => p.hands.length === 1 && isPair(h.cards) && !h.done && p.chips >= h.bet;

/** Depois de receber carta: estourou ou fez 21 para sozinho. */
function afterCard(s: GameState, p: Player, h: Hand, i: number) {
  const { total } = handValue(h.cards);
  if (total > 21) {
    h.done = true;
    h.result = "bust";
    p.stats.busts++;
    push(s, { kind: "bust", seat: p.seat, hand: i });
  } else if (total === 21) h.done = true;
}

export function applyAction(state: GameState, a: Action, rng: Rng = Math.random): Result {
  const s = structuredClone(state);
  const at = a.at ?? 0;
  const fail = (error: string): Result => ({ ok: false, error });
  if (s.phase === "gameOver") return fail("Partida encerrada");

  if (a.type === "advance") {
    if (s.phase === "dealer") dealerStep(s, rng);
    else if (s.phase === "settle") nextRound(s, at, rng);
    else {
      // relógio da decisão acabou: quem não decidiu fica de fora / recusa / para
      if (s.deadline === null || at < s.deadline) return fail("Ainda não");
      if (s.phase === "bet") {
        for (const p of playersOf(s)) if (p.bet === null) p.bet = 0;
        deal(s, at, rng);
      } else if (s.phase === "insurance") {
        for (const p of inRound(s)) if (p.insurance === null) p.insurance = 0;
        peek(s, at, rng, 0);
      } else if (s.phase === "play" && s.turn) {
        const t = turnHand(s, s.turn.seat);
        if (t) {
          t.h.done = true;
          push(s, { kind: "stand", seat: t.p.seat, hand: t.i });
        }
        nextTurn(s, at, rng);
      }
    }
    return { ok: true, state: s };
  }

  const p = s.table[a.seat];
  if (!p || !s.players.includes(a.seat)) return fail("Você não está na mesa");

  switch (a.type) {
    case "bet": {
      if (s.phase !== "bet" || p.bet !== null) return fail("Não é hora de apostar");
      const amount = Number(a.amount);
      if (!Number.isInteger(amount) || amount % BET_STEP !== 0) return fail("Aposta inválida");
      if (amount < MIN_BET) return fail(`Aposta mínima: ${MIN_BET}`);
      if (amount > maxBetFor(p.chips)) return fail("Fichas insuficientes");
      p.chips -= amount;
      p.bet = amount;
      p.lastBet = amount;
      push(s, { kind: "bet", seat: p.seat, amount });
      if (playersOf(s).every((x) => x.bet !== null)) deal(s, at, rng);
      return { ok: true, state: s };
    }
    case "insurance": {
      if (s.phase !== "insurance" || p.insurance !== null || p.hands.length === 0) return fail("Sem seguro agora");
      if (a.take) {
        const cost = insuranceCost(p.hands[0].bet);
        if (p.chips < cost) return fail("Fichas insuficientes");
        p.chips -= cost;
        p.insurance = cost;
      } else p.insurance = 0;
      push(s, { kind: "insurance", seat: p.seat, take: !!a.take });
      if (inRound(s).every((x) => x.insurance !== null)) peek(s, at, rng, 0);
      return { ok: true, state: s };
    }
    case "hit": {
      const t = turnHand(s, a.seat);
      if (!t) return fail("Não é sua vez");
      t.h.cards.push(draw(s, rng));
      push(s, { kind: "hit", seat: p.seat, hand: t.i });
      afterCard(s, p, t.h, t.i);
      if (t.h.done) nextTurn(s, at, rng);
      else s.deadline = s.settings.clock ? at + TURN_MS : null;
      return { ok: true, state: s };
    }
    case "stand": {
      const t = turnHand(s, a.seat);
      if (!t) return fail("Não é sua vez");
      t.h.done = true;
      push(s, { kind: "stand", seat: p.seat, hand: t.i });
      nextTurn(s, at, rng);
      return { ok: true, state: s };
    }
    case "double": {
      const t = turnHand(s, a.seat);
      if (!t) return fail("Não é sua vez");
      if (!canDoubleHand(p, t.h)) return fail("Não dá para dobrar");
      p.chips -= t.h.bet;
      t.h.bet *= 2;
      t.h.doubled = true;
      t.h.cards.push(draw(s, rng));
      push(s, { kind: "double", seat: p.seat, hand: t.i });
      afterCard(s, p, t.h, t.i);
      t.h.done = true;
      nextTurn(s, at, rng);
      return { ok: true, state: s };
    }
    case "split": {
      const t = turnHand(s, a.seat);
      if (!t) return fail("Não é sua vez");
      if (!canSplitHand(p, t.h)) return fail("Não dá para dividir");
      p.chips -= t.h.bet;
      p.stats.splits++;
      const [c1, c2] = t.h.cards;
      const second = newHand(t.h.bet, [c2], true);
      t.h.cards = [c1];
      t.h.split = true;
      p.hands.push(second);
      push(s, { kind: "split", seat: p.seat });
      t.h.cards.push(draw(s, rng));
      push(s, { kind: "hit", seat: p.seat, hand: 0 });
      if (c1.rank === "A") {
        // ases divididos: uma carta para cada e param
        second.cards.push(draw(s, rng));
        push(s, { kind: "hit", seat: p.seat, hand: 1 });
        t.h.done = true;
        second.done = true;
      } else afterCard(s, p, t.h, 0);
      nextTurn(s, at, rng);
      return { ok: true, state: s };
    }
  }
  return fail("Ação desconhecida");
}

/** Quem pode agir agora. */
export function actors(s: GameState): Seat[] {
  switch (s.phase) {
    case "bet":
      return playersOf(s).filter((p) => p.bet === null).map((p) => p.seat);
    case "insurance":
      return inRound(s).filter((p) => p.insurance === null).map((p) => p.seat);
    case "play":
      return s.turn ? [s.turn.seat] : [];
    default:
      return [];
  }
}

/** Colocação pelo saldo (1 = mais fichas; empatados dividem o lugar). */
export function placementOf(s: GameState, seat: Seat): number {
  const mine = s.table[seat]?.chips ?? 0;
  return 1 + playersOf(s).filter((p) => p.chips > mine).length;
}
