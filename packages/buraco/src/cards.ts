import type { Card, Rank, Suit } from "./types";

export const SUITS: Suit[] = ["clubs", "diamonds", "hearts", "spades"];
export const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const SUIT_CHAR: Record<Suit, string> = { clubs: "c", diamonds: "d", hearts: "h", spades: "s" };

export type Rng = () => number;

/** 108 cartas: dois baralhos de 52 e 4 coringas. */
export function makeDeck(): Card[] {
  const out: Card[] = [];
  for (let deck = 0; deck < 2; deck++) {
    for (const suit of SUITS) for (const rank of RANKS) out.push({ id: `${rank}${SUIT_CHAR[suit]}${deck}`, rank, suit });
  }
  for (let i = 0; i < 4; i++) out.push({ id: `JK${i}`, rank: "JK", suit: null });
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

/** Posição natural na sequência: A = 1, 2..10, J = 11, Q = 12, K = 13 (coringa: 0). */
export function rankValue(rank: Rank): number {
  switch (rank) {
    case "A": return 1;
    case "J": return 11;
    case "Q": return 12;
    case "K": return 13;
    case "JK": return 0;
    default: return Number(rank);
  }
}

export const isJoker = (c: Card) => c.rank === "JK";
/** Carta que pode servir de curinga (o coringa e qualquer 2). */
export const isWildCard = (c: Card) => c.rank === "JK" || c.rank === "2";

/** Valor da carta na contagem de pontos. */
export function points(c: Card): number {
  switch (c.rank) {
    case "JK": return 50;
    case "2": return 20;
    case "A": return 15;
    case "8": case "9": case "10": case "J": case "Q": case "K": return 10;
    default: return 5;
  }
}

export const sumPoints = (cards: Card[]) => cards.reduce((n, c) => n + points(c), 0);

/** Ordem da mão: por naipe e valor; coringas no fim. */
export function sortHand(cards: Card[]): Card[] {
  const key = (c: Card) => (c.suit ? SUITS.indexOf(c.suit) * 20 + rankValue(c.rank) : 100 + Number(c.id.slice(2)));
  return cards.slice().sort((a, b) => key(a) - key(b));
}

const FILE_RANK: Record<string, string> = { A: "ace", J: "jack", Q: "queen", K: "king" };

/** Imagem da carta em /cards (o coringa dos baralhos 0 e 1 é preto, 2 e 3 vermelho). */
export function cardImage(c: Card): string {
  if (c.rank === "JK") return Number(c.id.slice(2)) < 2 ? "/cards/black_joker.png" : "/cards/red_joker.png";
  return `/cards/${FILE_RANK[c.rank] ?? c.rank}_of_${c.suit}.png`;
}
