import { cardImage, type Card } from "@truco/game";

export function CardBack({ className = "" }: { className?: string }) {
  return <div className={`card-back w-full ${className}`} />;
}

export function CardImg({ card, className = "" }: { card: Card | null; className?: string }) {
  if (!card) return <CardBack className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cardImage(card)}
      alt={`${card.rank} ${card.suit}`}
      draggable={false}
      className={`card-face block w-full select-none ${className}`}
    />
  );
}
