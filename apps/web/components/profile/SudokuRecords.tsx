"use client";

import { useEffect, useState } from "react";
import { DIFFICULTIES } from "@truco/sudoku";
import { formatTime, LevelBars, LEVEL_LABEL } from "@/components/sudoku/common";
import { loadBests, type Bests } from "@/lib/sudoku/storage";

/** Melhor tempo por nível (guardado no navegador). */
export function SudokuRecords() {
  const [bests, setBests] = useState<Bests>({});
  useEffect(() => setBests(loadBests()), []);

  return (
    <div className="grid grid-cols-4 gap-2">
      {DIFFICULTIES.map((d) => (
        <div key={d} className="flex flex-col items-center gap-2 rounded-xl bg-black/20 py-3" title="Melhor tempo">
          <LevelBars level={d} className={`h-5 w-6 ${bests[d] !== undefined ? "text-gold" : "text-white/40"}`} />
          <span className="font-display text-[10px] text-white/60 sm:text-xs">{LEVEL_LABEL[d]}</span>
          <span className={`font-display text-xs tabular-nums ${bests[d] !== undefined ? "text-gold" : "text-white/25"}`}>
            {bests[d] !== undefined ? formatTime(bests[d]!) : "--:--"}
          </span>
        </div>
      ))}
    </div>
  );
}
