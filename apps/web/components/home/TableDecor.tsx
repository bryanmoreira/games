import { useId } from "react";
import { makeCard } from "@truco/game";
import { CardImg } from "@/components/cards/Card";

// Enfeite do topo da home: luz de luminária sobre a mesa e cartas, fichas e dado soltos dos lados do título.
// Só decoração (aria-hidden, sem clique). Os objetos aparecem a partir do md; no celular fica só a luz.

const CARDS = [makeCard("A", "spades"), makeCard("K", "hearts")];

function Chip({ color, edge, className = "" }: { color: string; edge: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className}>
      <circle cx="32" cy="32" r="30" fill={color} />
      {/* listras da borda */}
      <circle cx="32" cy="32" r="26" fill="none" stroke={edge} strokeWidth="8" strokeDasharray="10 10.4" />
      <circle cx="32" cy="32" r="19" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="2" />
      <circle cx="32" cy="32" r="13" fill="none" stroke={edge} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
    </svg>
  );
}

/** Pilha de fichas vista de cima e de lado: cada ficha é um cilindro com listras na lateral; só a de cima mostra a face. */
function ChipStack({ color, edge, n, className = "" }: { color: string; edge: string; n: number; className?: string }) {
  const id = useId();
  const RX = 28;
  const RY = 10;
  const T = 7; // espessura de cada ficha
  const y0 = RY + 2;
  const dxs = Array.from({ length: n }, (_, i) => [0, 1.5, -1, 0.5, -1.5][i % 5]);
  // lateral: metade de baixo da face de cima, desce T e volta pela metade de baixo da face de baixo
  const side = (i: number) => {
    const cx = 32 + dxs[i];
    const ya = y0 + i * T;
    const yb = ya + T;
    return `M${cx - RX},${ya} L${cx - RX},${yb} A${RX},${RY} 0 0 0 ${cx + RX},${yb} L${cx + RX},${ya} A${RX},${RY} 0 0 1 ${cx - RX},${ya} Z`;
  };
  return (
    <svg viewBox={`0 0 64 ${2 * RY + n * T + 4}`} className={className}>
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* de baixo para cima: a de cima cobre a borda da de baixo */}
      {dxs
        .map((dx, i) => ({ dx, i }))
        .reverse()
        .map(({ dx, i }) => {
          const ya = y0 + i * T;
          return (
            <g key={i}>
              <clipPath id={`${id}-c${i}`}>
                <path d={side(i)} />
              </clipPath>
              <path d={side(i)} fill={color} />
              <g clipPath={`url(#${id}-c${i})`}>
                {[10, 24, 38, 52].map((x) => (
                  <rect key={x} x={x + dx} y={ya - RY} width="5" height={T + 2 * RY} fill={edge} />
                ))}
                <rect x="0" y={ya - RY} width="64" height={T + 2 * RY} fill={`url(#${id}-shade)`} />
              </g>
              <path d={side(i)} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="0.8" />
            </g>
          );
        })}
      {/* face de cima */}
      <ellipse cx={32 + dxs[0]} cy={y0} rx={RX} ry={RY} fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="0.8" />
      <ellipse cx={32 + dxs[0]} cy={y0} rx={RX - 3} ry={RY - 1.2} fill="none" stroke={edge} strokeWidth="3" strokeDasharray="6 6.8" />
      <ellipse cx={32 + dxs[0]} cy={y0} rx={RX - 9} ry={RY - 3.4} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
    </svg>
  );
}

function Die({ className = "" }: { className?: string }) {
  const pips: [number, number][] = [
    [20, 20],
    [44, 20],
    [32, 32],
    [20, 44],
    [44, 44],
  ];
  return (
    <svg viewBox="0 0 64 64" className={className}>
      <rect x="4" y="6" width="56" height="56" rx="12" fill="#cfc6b4" />
      <rect x="4" y="2" width="56" height="56" rx="12" fill="#f5efe2" />
      {pips.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y - 2} r="5" fill="#2a1a04" />
      ))}
    </svg>
  );
}

export function TableDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] select-none overflow-hidden">
      {/* luz da luminária: some antes do fim, para não marcar faixa na cor do fundo */}
      <div className="absolute left-1/2 top-[-180px] h-[560px] w-[min(1100px,140vw)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(242,193,78,0.14),rgba(15,81,50,0.18)_45%,transparent)]" />

      <div className="relative mx-auto hidden h-full max-w-6xl md:block">
        {/* esquerda: duas cartas e uma ficha */}
        <div className="absolute left-[4%] top-[44px] w-[80px] -rotate-[24deg] drop-shadow-[0_10px_14px_rgba(0,0,0,0.55)] lg:left-[6%]">
          <CardImg card={CARDS[1]} />
        </div>
        <div className="absolute left-[9%] top-[64px] w-[80px] -rotate-[6deg] drop-shadow-[0_10px_14px_rgba(0,0,0,0.55)] lg:left-[13%]">
          <CardImg card={CARDS[0]} />
        </div>
        <Chip color="#b8322a" edge="#f5efe2" className="absolute left-[19%] top-[170px] w-12 rotate-12 drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)] lg:left-[22%]" />

        {/* direita: pilha de fichas, ficha solta e dado */}
        <ChipStack color="#1f5fa8" edge="#f5efe2" n={5} className="absolute right-[12%] top-[48px] w-16 drop-shadow-[0_8px_10px_rgba(0,0,0,0.5)] lg:right-[16%]" />
        <Chip color="#1d7a4c" edge="#f5efe2" className="absolute right-[4%] top-[120px] w-14 -rotate-12 drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)] lg:right-[8%]" />
        <Die className="absolute right-[20%] top-[150px] w-10 rotate-[18deg] drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)] lg:right-[24%]" />
      </div>
    </div>
  );
}
