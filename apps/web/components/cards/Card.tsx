"use client";

import { createContext, useContext } from "react";
import { backSrc, faceSrc } from "@/components/shop/Art";
import { DEFAULT_DECK, deckKey, type DeckKey } from "@/lib/shop/catalog";

/** Carta de qualquer jogo: valor como "A", "Q", "7" (truco) ou 1-13 (spider). */
export interface CardLike {
  rank: string | number;
  suit: string;
}

const FILE_RANK: Record<string, string> = { A: "ace", "1": "ace", J: "jack", "11": "jack", Q: "queen", "12": "queen", K: "king", "13": "king" };

/** Nome do arquivo da carta ("king_of_hearts"), o mesmo em todos os baralhos. */
export const cardFile = (card: CardLike) => {
  const r = String(card.rank);
  return `${FILE_RANK[r] ?? r}_of_${card.suit}`;
};

export function cardSrc(card: CardLike, deck: DeckKey = DEFAULT_DECK): string {
  return faceSrc(deck, cardFile(card));
}

/**
 * Baralho das cartas aqui dentro (frente e verso). Sem provider: o clássico.
 * No truco cada jogador tem o seu: a mão virada e a carta jogada usam o baralho do dono.
 */
const DeckContext = createContext<DeckKey>(DEFAULT_DECK);

export function DeckProvider({ deck, children }: { deck?: string | null; children: React.ReactNode }) {
  return <DeckContext.Provider value={deckKey(deck)}>{children}</DeckContext.Provider>;
}

export const useDeck = () => useContext(DeckContext);

export function CardBack({ className = "" }: { className?: string }) {
  const deck = useDeck();
  if (deck === DEFAULT_DECK) return <div className={`card-back w-full ${className}`} />;
  // a borda branca do verso clássico (ex.: !border-2 nas cartas pequenas) já vem desenhada no SVG
  const cls = className.split(" ").filter((c) => !c.includes("border")).join(" ");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={backSrc(deck)} alt="" draggable={false} className={`card-deck block aspect-[500/726] w-full select-none rounded-[7%/5%] ${cls}`} />
  );
}

export function CardImg({ card, className = "" }: { card: CardLike | null; className?: string }) {
  const deck = useDeck();
  if (!card) return <CardBack className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cardSrc(card, deck)}
      alt={`${card.rank} ${card.suit}`}
      draggable={false}
      className={`${deck === DEFAULT_DECK ? "card-face" : "card-deck aspect-[500/726] rounded-[7%/5%]"} block w-full select-none ${className}`}
    />
  );
}
