import type { CSSProperties, ReactNode } from "react";
import { makeCard, type Rank, type Suit } from "@mesa/truco";
import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK } from "@mesa/xadrez";
import { CardImg } from "@/components/cards/Card";
import { PieceShape } from "@/components/xadrez/Piece";
import { Domino } from "@/components/domino/Tile";
import { ChipIcon } from "@/components/chips/ChipIcon";

// Fundo da home na página inteira: peças de xadrez, cartas, fichas, dado e dominó desfocados, como objetos fora de
// foco sobre a mesa. Quanto maior o objeto, mais desfocado (parece mais perto da câmera). Ficam quase todos nas
// laterais, fora da grade de jogos; no fim da página só à direita, para não passar atrás da logo do rodapé. No celular
// só aparecem os marcados com `phone`. Só decoração (aria-hidden).

/** Ficha de pôquer vista de cima. */
function Chip({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" className="block w-full">
      <circle cx="32" cy="32" r="30" fill={color} />
      <circle cx="32" cy="32" r="26" fill="none" stroke="#f5efe2" strokeWidth="8" strokeDasharray="10 10.4" />
      <circle cx="32" cy="32" r="19" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
      <circle cx="32" cy="32" r="13" fill="none" stroke="#f5efe2" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
    </svg>
  );
}

function Die() {
  const pips: [number, number][] = [
    [20, 20],
    [44, 20],
    [32, 32],
    [20, 44],
    [44, 44],
  ];
  return (
    <svg viewBox="0 0 64 64" className="block w-full">
      <rect x="4" y="6" width="56" height="56" rx="12" fill="#cfc6b4" />
      <rect x="4" y="2" width="56" height="56" rx="12" fill="#f5efe2" />
      {pips.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y - 2} r="5" fill="#2a1a04" />
      ))}
    </svg>
  );
}

type Item = {
  art: ReactNode;
  /** posição: top em % da página; left ou right (um dos dois) em % da largura */
  top: string;
  left?: string;
  right?: string;
  w: number;
  blur: number;
  rot: number;
  opacity: number;
  /** atraso da flutuação, para os objetos não subirem juntos */
  delay: number;
  phone?: boolean;
};

const piece = (p: number) => <PieceShape p={p} className="block w-full" />;
const card = (rank: Rank, suit: Suit) => <CardImg card={makeCard(rank, suit)} />;

const ITEMS: Item[] = [
  { art: piece(KNIGHT), top: "3%", left: "-3%", w: 255, blur: 10, rot: -14, opacity: 0.4, delay: 0, phone: true },
  { art: <Chip color="#b8322a" />, top: "9%", right: "3%", w: 119, blur: 4, rot: 20, opacity: 0.45, delay: 3 },
  { art: card("A", "spades"), top: "15%", right: "-2%", w: 187, blur: 8.5, rot: 18, opacity: 0.35, delay: 6, phone: true },
  { art: piece(-PAWN), top: "22%", left: "4%", w: 119, blur: 3.5, rot: 8, opacity: 0.45, delay: 2 },
  { art: <Die />, top: "30%", left: "-1%", w: 136, blur: 7, rot: -22, opacity: 0.4, delay: 5 },
  { art: piece(-QUEEN), top: "35%", right: "1%", w: 221, blur: 10, rot: 10, opacity: 0.35, delay: 1, phone: true },
  { art: <ChipIcon className="block w-full" />, top: "43%", left: "3%", w: 95, blur: 3, rot: 0, opacity: 0.5, delay: 4 },
  { art: <Domino a={6} b={3} />, top: "48%", right: "4%", w: 92, blur: 4, rot: -25, opacity: 0.45, delay: 7 },
  { art: card("K", "hearts"), top: "54%", left: "-2%", w: 204, blur: 8.5, rot: -20, opacity: 0.35, delay: 2, phone: true },
  { art: <Chip color="#1f5fa8" />, top: "61%", right: "-1%", w: 153, blur: 7, rot: -10, opacity: 0.4, delay: 6 },
  { art: piece(ROOK), top: "67%", left: "4%", w: 129, blur: 3.5, rot: -6, opacity: 0.45, delay: 0 },
  { art: piece(-BISHOP), top: "73%", right: "2%", w: 187, blur: 8.5, rot: 14, opacity: 0.35, delay: 3, phone: true },
  { art: <Chip color="#1d7a4c" />, top: "77%", right: "9%", w: 109, blur: 4, rot: 30, opacity: 0.45, delay: 5 },
  { art: card("7", "diamonds"), top: "85%", right: "3%", w: 143, blur: 5, rot: -16, opacity: 0.4, delay: 1 },
  { art: piece(KING), top: "92%", right: "-2%", w: 255, blur: 11, rot: 12, opacity: 0.3, delay: 4 },
];

export function BackdropDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 select-none overflow-hidden">
      {ITEMS.map((it, i) => (
        <div
          key={i}
          className={`absolute ${it.phone ? "" : "hidden md:block"} max-md:scale-75`}
          style={{ top: it.top, left: it.left, right: it.right, width: it.w, opacity: it.opacity, rotate: `${it.rot}deg`, filter: `blur(${it.blur}px)` }}
        >
          <div className="backdrop-float" style={{ "--d": `${-it.delay}s` } as CSSProperties}>
            {it.art}
          </div>
        </div>
      ))}
    </div>
  );
}
