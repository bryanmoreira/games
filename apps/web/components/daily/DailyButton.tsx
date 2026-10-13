"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTime } from "@/components/sudoku/common";
import { CalendarIcon, CheckIcon } from "@/components/ui/icons";
import type { DailyGame } from "@/lib/daily/challenge";
import { localDailies, type LocalDaily } from "@/lib/daily/storage";
import { dayKey } from "@/lib/stats/achievements";
import { shortDay } from "./common";

/** Entrada do desafio do dia na página do jogo: o dia, ou o tempo se já venceu hoje neste aparelho. */
export function DailyButton({ game, href }: { game: DailyGame; href: string }) {
  const [today, setToday] = useState<{ day: string; s?: LocalDaily } | null>(null);
  useEffect(() => {
    const day = dayKey(new Date());
    setToday({ day, s: localDailies(game)[day] });
  }, [game]);

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-gold/40 transition hover:bg-white/10"
    >
      <CalendarIcon className="h-6 w-6 shrink-0 text-gold" />
      <span className="flex-1 font-display text-base">Desafio do dia</span>
      {today?.s?.won ? (
        <span className="flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 font-display text-xs tabular-nums text-stone-900">
          <CheckIcon className="h-3.5 w-3.5" />
          {formatTime(today.s.elapsed)}
        </span>
      ) : (
        today && <span className="rounded-full bg-black/25 px-2.5 py-1 font-display text-xs text-white/70">{shortDay(today.day)}</span>
      )}
    </Link>
  );
}
