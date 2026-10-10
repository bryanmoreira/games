"use client";

import { useState } from "react";
import { makeCard, manilhaOf, RANKS, SUITS, type Rank } from "@truco/game";
import { CardImg } from "./Card";

const MANILHA_NAME = ["Pica-fumo", "Espadilha", "Copas", "Zap"];

export function ViraPicker() {
  const [vira, setVira] = useState<Rank>("7");
  const manilha = manilhaOf(vira);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {RANKS.map((r) => (
          <button
            key={r}
            onClick={() => setVira(r)}
            className={`rounded-md transition ${r === vira ? "-translate-y-1.5 outline-3 outline-offset-1 outline-gold" : "opacity-60 hover:opacity-100"}`}
            aria-label={`Vira ${r}`}
          >
            <CardImg card={makeCard(r, "diamonds")} />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-16 rotate-[-6deg] sm:w-20">
            <CardImg card={makeCard(vira, "diamonds")} />
          </div>
          <span className="font-display text-xs text-white/60">VIRA</span>
        </div>
        <span className="font-display text-3xl text-gold">→</span>
        <div className="flex gap-1.5 sm:gap-2">
          {SUITS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1.5">
              <div className="w-14 sm:w-20">
                <CardImg card={makeCard(manilha, s)} />
              </div>
              <span className={`font-display text-[10px] sm:text-xs ${i === 3 ? "text-gold" : "text-white/70"}`}>
                {MANILHA_NAME[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-white/50">mais fraca → mais forte</p>
    </div>
  );
}
