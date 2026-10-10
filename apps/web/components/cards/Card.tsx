/** Carta de qualquer jogo: valor como "A", "Q", "7" (truco) ou 1-13 (spider). */
export interface CardLike {
  rank: string | number;
  suit: string;
}

const FILE_RANK: Record<string, string> = { A: "ace", "1": "ace", J: "jack", "11": "jack", Q: "queen", "12": "queen", K: "king", "13": "king" };

export function cardSrc(card: CardLike): string {
  const r = String(card.rank);
  return `/cards/${FILE_RANK[r] ?? r}_of_${card.suit}.png`;
}

export function CardBack({ className = "" }: { className?: string }) {
  return <div className={`card-back w-full ${className}`} />;
}

export function CardImg({ card, className = "" }: { card: CardLike | null; className?: string }) {
  if (!card) return <CardBack className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cardSrc(card)}
      alt={`${card.rank} ${card.suit}`}
      draggable={false}
      className={`card-face block w-full select-none ${className}`}
    />
  );
}
