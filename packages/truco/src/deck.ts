import type { Card, Rank, Suit } from "./types";

export const RANKS: Rank[] = ["4", "5", "6", "7", "Q", "J", "K", "A", "2", "3"];
// Ordem de força das manilhas: ouros < espadas < copas < paus (zap)
export const SUITS: Suit[] = ["diamonds", "spades", "hearts", "clubs"];

const SUIT_CHAR: Record<Suit, string> = { diamonds: "d", spades: "s", hearts: "h", clubs: "c" };

export function makeCard(rank: Rank, suit: Suit): Card {
  return { id: rank + SUIT_CHAR[suit], rank, suit };
}

export function makeDeck(): Card[] {
  return RANKS.flatMap((r) => SUITS.map((s) => makeCard(r, s)));
}

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function manilhaOf(vira: Rank): Rank {
  return RANKS[(RANKS.indexOf(vira) + 1) % RANKS.length];
}

/** Força da carta: 0-9 cartas comuns, 10-13 manilhas. Coberta = -1. */
export function strength(card: Card | null, manilha: Rank, hidden = false): number {
  if (!card || hidden) return -1;
  if (card.rank === manilha) return 10 + SUITS.indexOf(card.suit);
  return RANKS.indexOf(card.rank);
}

const FILE_RANK: Record<Rank, string> = {
  "4": "4", "5": "5", "6": "6", "7": "7", Q: "queen", J: "jack", K: "king", A: "ace", "2": "2", "3": "3",
};

export function cardImage(card: Card): string {
  return `/cards/${FILE_RANK[card.rank]}_of_${card.suit}.png`;
}
