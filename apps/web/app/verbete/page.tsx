"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MODES, status, type Mode } from "@truco/verbete";
import { BackButton } from "@/components/BackButton";
import { GameIntro } from "@/components/seo";
import { CalendarIcon, ChevronIcon, InfinityIcon } from "@/components/ui/icons";
import { dayStates, ModeCards } from "@/components/verbete/ModeCards";
import { MiniTiles } from "@/components/verbete/Tile";
import { dayKey } from "@/lib/stats/achievements";
import { VERBETE_DAILY_PATH, VERBETE_FREE_PATH, VERBETE_PATH } from "@/lib/verbete/paths";
import { loadFreeGame, loadTab, localDays, saveTab, type DayState } from "@/lib/verbete/storage";

type Tab = "day" | "free";

export default function VerbeteHome() {
  const [tab, setTab] = useState<Tab | null>(null);
  const [today, setToday] = useState("");
  const [states, setStates] = useState<Record<Tab, Partial<Record<Mode, DayState>>>>({ day: {}, free: {} });

  useEffect(() => {
    const day = dayKey(new Date());
    setToday(day);
    setTab(loadTab());
    const free = Object.fromEntries(
      MODES.flatMap((m) => {
        const g = loadFreeGame(m);
        return g && g.guesses.length && status(g) === "playing" ? [[m, { status: "playing", attempts: g.guesses.length }]] : [];
      }),
    );
    setStates({ day: dayStates(localDays(), day), free });
  }, []);

  const choose = (t: Tab) => {
    setTab(t);
    saveTab(t);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-7 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <MiniTiles className="-rotate-3 text-[15px]" />
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-[44px] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-6xl">VERBETE</span>
        <span className="mt-2 font-display text-sm tracking-[0.5em] text-white/70">5 LETRAS</span>
      </h1>
      <GameIntro slug="verbete" />

      <div className="flex w-full flex-col gap-3">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-black/30 p-1" role="tablist" aria-label="Partida">
          {(
            [
              ["day", "DO DIA", CalendarIcon],
              ["free", "LIVRE", InfinityIcon],
            ] as const
          ).map(([t, label, Ic]) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => choose(t)}
              className={`flex items-center justify-center gap-2 rounded-full py-2 font-display text-sm transition ${
                tab === t ? "bg-gold text-stone-900" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Ic className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className={tab ? "" : "invisible"}>
          <ModeCards
            href={(m) => (tab === "free" ? `${VERBETE_FREE_PATH}?m=${m}` : `${VERBETE_DAILY_PATH}/${today}?m=${m}`)}
            states={tab ? states[tab] : undefined}
          />
        </div>

        <Link
          href={VERBETE_DAILY_PATH}
          className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-gold/40 transition hover:bg-white/10"
        >
          <CalendarIcon className="h-6 w-6 shrink-0 text-gold" />
          <span className="flex-1 font-display text-base">Dias anteriores</span>
          <ChevronIcon className="h-5 w-5 text-white/50" />
        </Link>
      </div>

      <Link
        href={`${VERBETE_PATH}/como-jogar`}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
        Como jogar
      </Link>
    </main>
  );
}
