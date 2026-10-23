"use client";

import type { Card } from "@mesa/buraco";
import { CardImg, useDeck, type CardLike } from "@/components/cards/Card";
import { SuitIcon } from "@/components/spider/SpiderCard";
import { deckPalette } from "@/lib/shop/art";
import { DEFAULT_DECK } from "@/lib/shop/catalog";

/** Rótulo de uma posição da sequência (1 e 14 = ás). */
export const posLabel = (n: number) => (n === 1 || n === 14 ? "A" : n === 11 ? "J" : n === 12 ? "Q" : n === 13 ? "K" : String(n));

const isRed = (c: Card) => (c.suit ? c.suit === "hearts" || c.suit === "diamonds" : Number(c.id.slice(2)) >= 2);

/** A carta no formato que `CardImg` entende (o coringa tem arquivo próprio). */
export function cardLike(c: Card): CardLike {
  if (c.rank === "JK") return { rank: "JK", suit: "", file: Number(c.id.slice(2)) < 2 ? "black_joker" : "red_joker" };
  return { rank: c.rank, suit: c.suit! };
}

/** Carta inteira (PNG ou baralho da loja). */
export function BCard({ card, className = "" }: { card: Card; className?: string }) {
  return <CardImg card={cardLike(card)} className={className} />;
}

export function StarIcon({ size, className = "" }: { size: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor" aria-hidden="true">
      <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.1 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8Z" />
    </svg>
  );
}

/**
 * Face compacta para cartas pequenas dos jogos na mesa: valor e naipe no canto, que é a parte que aparece
 * quando as cartas se sobrepõem. `wild`: faz papel de curinga (borda dourada e a posição que ocupa).
 */
export function MiniCard({ card, as, wild, width }: { card: Card; as?: number; wild?: boolean; width: number }) {
  const deck = useDeck();
  const joker = card.rank === "JK";
  const red = isRed(card);
  const p = deck === DEFAULT_DECK ? null : deckPalette(deck);
  const style = p
    ? { background: p.bg, color: red ? p.red : p.black, boxShadow: `inset 0 0 0 1.5px ${p.edge}, 0 2px 6px rgba(0,0,0,.45)` }
    : undefined;
  return (
    <div
      className={`card-face relative flex flex-col overflow-hidden ${p ? "" : red ? "text-[#d40000]" : "text-stone-900"} ${
        wild ? "outline outline-2 -outline-offset-1 outline-gold" : ""
      }`}
      style={{ ...style, width, height: width * 1.4 }}
    >
      <div className="flex flex-col items-start leading-none" style={{ padding: `${width * 0.07}px ${width * 0.09}px` }}>
        {joker ? (
          <StarIcon size={width * 0.5} />
        ) : (
          <>
            <span className="font-display tracking-tighter" style={{ fontSize: width * (card.rank === "10" ? 0.38 : 0.46) }}>
              {card.rank}
            </span>
            <SuitIcon suit={card.suit!} size={width * 0.38} />
          </>
        )}
      </div>
      {wild && as !== undefined && (
        <span className="absolute bottom-0 left-0 rounded-tr-md bg-gold px-[3px] font-display leading-none text-stone-900" style={{ fontSize: width * 0.34 }}>
          {posLabel(as)}
        </span>
      )}
    </div>
  );
}
