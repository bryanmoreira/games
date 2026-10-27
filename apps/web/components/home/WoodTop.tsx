import type { ReactNode } from "react";
import { makeCard } from "@mesa/truco";
import { CardImg } from "@/components/cards/Card";

// Topo da home: trilho de madeira com a barra (loja, fichas, perfil) e, pendurada nele, a placa com o título.

const SIDE_CARDS = [makeCard("Q", "hearts"), makeCard("J", "spades")];

/** Naipes em SVG: os caracteres da fonte têm tamanho e linha de base diferentes e ficam desalinhados. */
const SUITS: ReactNode[] = [
  <path key="s" d="M12 2C9 6 4 9 4 13.5a4 4 0 0 0 7 2.6L10 22h4l-1-5.9a4 4 0 0 0 7-2.6C20 9 15 6 12 2z" />,
  <path key="h" d="M12 21.5S3.5 16 3.5 9.8A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8.5 2.8c0 6.2-8.5 11.7-8.5 11.7z" />,
  <g key="c">
    <circle cx="12" cy="7" r="4.3" />
    <circle cx="6.8" cy="13.6" r="4.3" />
    <circle cx="17.2" cy="13.6" r="4.3" />
    <path d="M11 12h2l1.2 10h-4.4z" />
  </g>,
  <path key="d" d="M12 2l7.5 10L12 22 4.5 12z" />,
];

/** Trilho de madeira de ponta a ponta. Os naipes ficam no centro e `children` (a barra) à direita. */
export function WoodRail({ children }: { children: ReactNode }) {
  return (
    <header className="wood wood-rail relative z-10">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-4">
        <span />
        <span aria-hidden="true" className="flex items-center gap-4 text-[#2a1608] drop-shadow-[0_1px_0_rgba(255,255,255,0.18)] max-sm:invisible">
          {SUITS.map((suit, i) => (
            <svg key={i} viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor">
              {suit}
            </svg>
          ))}
        </span>
        <div className="wood-hud flex items-center gap-2.5 justify-self-end">{children}</div>
      </div>
    </header>
  );
}

/**
 * Placa pendurada no trilho por duas correntes, com uma carta meio escondida atrás de cada ponta
 * (-z-10: a placa não abre contexto de empilhamento, então as cartas passam para trás dela). Cartas só a partir do md.
 */
export function WoodSign({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col items-center">
      <div aria-hidden="true" className="flex h-8 gap-40 sm:gap-72">
        <i className="wood-chain" />
        <i className="wood-chain" />
      </div>
      <div className="wood wood-plank relative rounded-[20px] px-8 py-5 sm:px-13">
        <div aria-hidden="true" className="pointer-events-none absolute -left-11 -top-1 -z-10 hidden w-[70px] -rotate-[16deg] drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)] md:block">
          <CardImg card={SIDE_CARDS[0]} />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-11 top-0 -z-10 hidden w-[70px] rotate-[14deg] drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)] md:block">
          <CardImg card={SIDE_CARDS[1]} />
        </div>
        {["left-3.5 top-3.5", "right-3.5 top-3.5", "left-3.5 bottom-3.5", "right-3.5 bottom-3.5"].map((pos) => (
          <i key={pos} aria-hidden="true" className={`wood-rivet absolute ${pos}`} />
        ))}
        {children}
      </div>
    </div>
  );
}
