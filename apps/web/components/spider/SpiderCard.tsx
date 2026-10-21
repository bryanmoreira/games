import { isRed, RANK_LABEL, type Card, type Suit } from "@mesa/spider";
import { CardBack, CardImg, useDeck } from "@/components/cards/Card";
import { deckPalette } from "@/lib/shop/art";
import { DEFAULT_DECK } from "@/lib/shop/catalog";

/** Abaixo desta largura (px) o índice da PNG fica ilegível: usa a face compacta. */
export const COMPACT_BELOW = 64;

export function SuitIcon({ suit, className = "", size }: { suit: Suit; className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="currentColor" aria-hidden="true">
      {suit === "hearts" && (
        <path d="M12 21.4 10.6 20C5.4 15.4 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.9-8.6 11.5L12 21.4Z" />
      )}
      {suit === "diamonds" && <path d="M12 1.5 20.5 12 12 22.5 3.5 12Z" />}
      {suit === "spades" && (
        <path d="M12 1.5C9.3 5.2 3 8.6 3 13.4 3 16 5 18 7.6 18c1.5 0 2.8-.6 3.6-1.7L10 22.5h4l-1.2-6.2c.8 1.1 2.1 1.7 3.6 1.7 2.6 0 4.6-2 4.6-4.6 0-4.8-6.3-8.2-9-11.9Z" />
      )}
      {suit === "clubs" && (
        <>
          <circle cx="12" cy="6.8" r="4.6" />
          <circle cx="6.6" cy="13.6" r="4.6" />
          <circle cx="17.4" cy="13.6" r="4.6" />
          <path d="M11 13h2l1.6 9.5H9.4Z" />
        </>
      )}
    </svg>
  );
}

/** Face desenhada para cartas pequenas: valor e naipe grandes no topo (a parte que aparece na pilha). */
function CompactFace({ card, width }: { card: Card; width: number }) {
  const deck = useDeck();
  const color = isRed(card.suit) ? "text-[#d40000]" : "text-stone-900";
  // baralho da loja: fundo, borda e tinta do próprio baralho
  const p = deck === DEFAULT_DECK ? null : deckPalette(deck);
  const style = p ? { background: p.bg, color: isRed(card.suit) ? p.red : p.black, boxShadow: `inset 0 0 0 1.5px ${p.edge}, 0 2px 6px rgba(0,0,0,.45)` } : undefined;
  return (
    <div className={`card-face relative flex w-full flex-col overflow-hidden ${p ? "" : color}`} style={style}>
      <div className="flex items-center leading-none" style={{ padding: `${width * 0.06}px ${width * 0.08}px` }}>
        <span className="font-display tracking-tighter" style={{ fontSize: width * (card.rank === 10 ? 0.36 : 0.42) }}>
          {RANK_LABEL[card.rank]}
        </span>
        <SuitIcon suit={card.suit} size={width * 0.34} className="ml-auto shrink-0" />
      </div>
      <SuitIcon suit={card.suit} className="absolute bottom-[12%] left-1/2 w-[55%] -translate-x-1/2 opacity-90" />
    </div>
  );
}

export function SpiderCard({ card, up, width }: { card: Card; up: boolean; width: number }) {
  if (!up) return <CardBack className={width < COMPACT_BELOW ? "!border-2" : ""} />;
  if (width < COMPACT_BELOW) return <CompactFace card={card} width={width} />;
  return <CardImg card={card} />;
}
