import { DECKS, type Card, type Rank, type Suit } from "./types";

export const SUITS: Suit[] = ["clubs", "diamonds", "hearts", "spades"];
export const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const SUIT_CHAR: Record<Suit, string> = { clubs: "c", diamonds: "d", hearts: "h", spades: "s" };

export type Rng = () => number;

export function makeCard(rank: Rank, suit: Suit, deck = 0): Card {
  return { id: `${rank}${SUIT_CHAR[suit]}${deck}`, rank, suit };
}

/** Sapato com `decks` baralhos de 52 cartas, sem embaralhar. */
export function makeShoe(decks = DECKS): Card[] {
  const out: Card[] = [];
  for (let d = 0; d < decks; d++) for (const suit of SUITS) for (const rank of RANKS) out.push(makeCard(rank, suit, d));
  return out;
}

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Valor da carta: ás = 1 (o 11 sai em `handValue`), figuras = 10. */
export function cardValue(rank: Rank): number {
  if (rank === "A") return 1;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return Number(rank);
}

/** Total da mão e se é mole (um ás valendo 11). */
export function handValue(cards: readonly (Card | null)[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (!c) continue;
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  const soft = aces > 0 && total + 10 <= 21;
  return { total: soft ? total + 10 : total, soft };
}

/** Ás + carta de 10 nas 2 primeiras cartas (mão que não veio de divisão). */
export const isBlackjack = (cards: readonly Card[], split = false) => !split && cards.length === 2 && handValue(cards).total === 21;

/** As duas cartas podem ser divididas (mesmo valor: 10, J, Q e K valem igual). */
export const isPair = (cards: readonly Card[]) => cards.length === 2 && cardValue(cards[0].rank) === cardValue(cards[1].rank);

const FILE_RANK: Record<Rank, string> = {
  A: "ace", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10", J: "jack", Q: "queen", K: "king",
};

export function cardImage(card: Pick<Card, "rank" | "suit">): string {
  return `/cards/${FILE_RANK[card.rank]}_of_${card.suit}.png`;
}
