"use client";

import type { PlayerView } from "@mesa/jogo-da-memoria";
import type { CSSProperties } from "react";
import { Fruit, FRUIT_NAMES } from "./Fruit";

export function Board({ view, onFlip, tips, dealing }: { view: PlayerView; onFlip: (index: number) => void; tips: boolean; dealing: boolean }) {
  return <div className="mm-board" role="group" aria-label="Tabuleiro de 30 cartas">
    {view.cards.map((fruit, index) => {
      const matched = view.owners[index] !== null;
      const face = fruit !== null;
      return <div key={`${view.gameNo}-${index}`} className={dealing ? "mm-deal" : ""} style={{ "--mm-delay": `${index * 30}ms` } as CSSProperties}>
        <button type="button" className={`mm-card ${face ? "mm-face-up" : ""} ${matched ? "mm-matched" : ""}`}
          disabled={dealing || !view.legal.includes(index)} onClick={() => onFlip(index)}
          aria-label={`Carta ${index + 1}${face ? `: ${FRUIT_NAMES[fruit]}${matched ? ", par encontrado" : ""}` : ": virada para baixo"}`}
          aria-pressed={face} title={tips ? face ? FRUIT_NAMES[fruit] : "Revele uma carta" : undefined}>
          <span className="mm-card-inner">
            <span className="mm-card-back" aria-hidden="true"><svg viewBox="0 0 40 48"><path d="M20 10v28M6 24h28M10 14l20 20M30 14 10 34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="20" cy="24" r="6" fill="#235847" stroke="currentColor" strokeWidth="2" /></svg></span>
            <span className="mm-card-front" aria-hidden="true">{fruit !== null && <Fruit fruit={fruit} className="h-[85%] w-[90%]" />}{matched && <svg className="mm-check" viewBox="0 0 20 20"><path d="m5 10 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
          </span>
        </button>
      </div>;
    })}
  </div>;
}
