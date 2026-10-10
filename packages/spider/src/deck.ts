import type { Card, Suit, SuitCount } from "./types";

export const DECK_SIZE = 104;
export const COLS = 10;
export const DEALS = 5;

export const SUIT_SETS: Record<SuitCount, Suit[]> = {
  1: ["spades"],
  2: ["spades", "hearts"],
  4: ["spades", "hearts", "clubs", "diamonds"],
};

export const RANK_LABEL = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/** Os ids 0-103 formam 8 naipes completos; com 1 ou 2 naipes eles se repetem. */
export function cardOf(id: number, suits: SuitCount): Card {
  const set = SUIT_SETS[suits];
  return { id, rank: (id % 13) + 1, suit: set[Math.floor(id / 13) % set.length] };
}

export function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

export type Rng = () => number;

/** Gerador determinístico: a mesma semente dá o mesmo embaralhamento. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
