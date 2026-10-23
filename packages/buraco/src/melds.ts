import { isJoker, points, rankValue } from "./cards";
import { CANASTRA_MIN, MAX_POS, MAX_RUN, type CanastraKind, type Card, type Meld, type MeldCard, type Suit } from "./types";

/** A carta, nesta posição do jogo, faz papel de curinga (coringa, ou 2 fora do lugar de 2 do naipe). */
export function isWildIn(mc: MeldCard, suit: Suit): boolean {
  if (isJoker(mc.card)) return true;
  if (mc.card.rank === "2") return !(mc.card.suit === suit && mc.as === 2);
  return false;
}

export const wildCount = (cards: MeldCard[], suit: Suit) => cards.reduce((n, mc) => n + (isWildIn(mc, suit) ? 1 : 0), 0);

/** Canastra (7+ cartas): limpa sem curinga, real se limpa e inteira (13 cartas), suja com curinga. */
export function canastraKind(m: Pick<Meld, "suit" | "cards">): CanastraKind | null {
  if (m.cards.length < CANASTRA_MIN) return null;
  if (wildCount(m.cards, m.suit) > 0) return "suja";
  return m.cards.length === MAX_RUN ? "real" : "limpa";
}

/** Pontos das cartas do jogo. */
export const meldPoints = (m: Pick<Meld, "cards">) => m.cards.reduce((n, mc) => n + points(mc.card), 0);

/** Posição do curinga no jogo (null se não tem). */
export function wildAtOf(m: Pick<Meld, "suit" | "cards">): number | null {
  const w = m.cards.find((mc) => isWildIn(mc, m.suit));
  return w ? w.as : null;
}

export interface Arrangement {
  suit: Suit;
  cards: MeldCard[];
}

interface Opt {
  pos: number;
  wild: boolean;
}

/** Onde cada carta que chega pode ficar (naturais numa posição só, o ás em duas; curingas em qualquer uma). */
function optionsFor(c: Card, suit: Suit): Opt[] {
  const wilds = (skip?: number): Opt[] => {
    const out: Opt[] = [];
    for (let p = 1; p <= MAX_POS; p++) if (p !== skip) out.push({ pos: p, wild: true });
    return out;
  };
  if (isJoker(c)) return wilds();
  if (c.rank === "2") return c.suit === suit ? [{ pos: 2, wild: false }, ...wilds(2)] : wilds();
  if (c.suit !== suit) return [];
  return c.rank === "A" ? [{ pos: 1, wild: false }, { pos: MAX_POS, wild: false }] : [{ pos: rankValue(c.rank), wild: false }];
}

/** Naipe do jogo formado por essas cartas (as naturais que não são 2 mandam); null se faltar ou conflitar. */
export function suitOf(cards: Card[]): Suit | null {
  let suit: Suit | null = null;
  for (const c of cards) {
    if (!c.suit || c.rank === "2") continue;
    if (suit && suit !== c.suit) return null;
    suit = c.suit;
  }
  return suit;
}

const key = (cards: MeldCard[], suit: Suit) => cards.map((mc) => `${mc.as}${isWildIn(mc, suit) ? "w" : ""}`).join(",");

/** Nota de preferência (menor é melhor): sem curinga, ás baixo, curinga fora das pontas. */
function score(cards: MeldCard[], suit: Suit): number {
  const wild = cards.find((mc) => isWildIn(mc, suit));
  let s = 0;
  if (wild) s += 1000 + (wild.as === 1 || wild.as === MAX_POS ? 10 : 0) + (MAX_POS - wild.as) / 20;
  if (cards.some((mc) => mc.card.rank === "A" && mc.as === MAX_POS)) s += 100;
  return s;
}

/**
 * Todos os jeitos válidos de pôr `incoming` num jogo cujas cartas `fixed` ficam onde estão (naipe `fixedSuit`;
 * jogo novo: null). Do melhor para o pior; vazio se não forma um jogo.
 */
export function arrangements(fixed: MeldCard[], fixedSuit: Suit | null, incoming: Card[]): Arrangement[] {
  if (fixed.length + incoming.length < 3) return [];
  const suit = fixedSuit ?? suitOf(incoming);
  if (!suit) return [];
  const opts: Opt[][] = [];
  for (const c of incoming) {
    const o = optionsFor(c, suit);
    if (o.length === 0) return [];
    opts.push(o);
  }
  const occupied = new Set(fixed.map((mc) => mc.as));
  if (occupied.size !== fixed.length) return [];
  const out: Arrangement[] = [];
  const seen = new Set<string>();
  const placed: MeldCard[] = [];

  const rec = (i: number, wilds: number) => {
    if (i === incoming.length) {
      const all = [...fixed, ...placed].sort((a, b) => a.as - b.as);
      const span = all[all.length - 1].as - all[0].as + 1;
      if (span !== all.length || span > MAX_RUN) return;
      const k = key(all, suit);
      if (seen.has(k)) return;
      seen.add(k);
      out.push({ suit, cards: all });
      return;
    }
    for (const o of opts[i]) {
      if (occupied.has(o.pos)) continue;
      const w = wilds + (o.wild ? 1 : 0);
      if (w > 1) continue;
      occupied.add(o.pos);
      placed.push({ card: incoming[i], as: o.pos });
      rec(i + 1, w);
      placed.pop();
      occupied.delete(o.pos);
    }
  };
  rec(0, wildCount(fixed, suit));
  return out.sort((a, b) => score(a.cards, suit) - score(b.cards, suit));
}

/** Escolhe o jeito: o que põe o curinga em `wildAt`, ou o preferido. null se `wildAt` não existe. */
export function pickArrangement(opts: Arrangement[], wildAt?: number): Arrangement | null {
  if (opts.length === 0) return null;
  if (wildAt === undefined) return opts[0];
  return opts.find((a) => wildAtOf(a) === wildAt) ?? (opts.every((a) => wildAtOf(a) === null) ? opts[0] : null);
}

/** Posições possíveis do curinga entre os jeitos (mais de uma = a pessoa escolhe). */
export function wildChoices(opts: Arrangement[]): number[] {
  const seen: number[] = [];
  for (const a of opts) {
    const w = wildAtOf(a);
    if (w !== null && !seen.includes(w)) seen.push(w);
  }
  return seen;
}
