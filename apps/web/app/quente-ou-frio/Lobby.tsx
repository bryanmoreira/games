"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { attempts, status, type GameState } from "@mesa/quente-ou-frio";
import { BackButton } from "@/components/BackButton";
import { AdSlot } from "@/components/AdSlot";
import { MiniBars } from "@/components/quente-ou-frio/WordBar";
import { GameIntro } from "@/components/seo";
import { XIcon } from "@/components/ui/buttons";
import { CalendarIcon, CheckIcon, ChevronIcon, InfinityIcon } from "@/components/ui/icons";
import { QUENTE_DAILY_PATH, QUENTE_FREE_PATH, QUENTE_PATH } from "@/lib/quente-ou-frio/paths";
import { loadDailyGame, loadFreeGame } from "@/lib/quente-ou-frio/storage";
import { dayKey } from "@/lib/stats/achievements";

type State = { status: "new" | "playing" | "won" | "lost"; attempts: number };

const stateOf = (g: GameState | null): State =>
  !g || !g.moves.length ? { status: "new", attempts: 0 } : { status: status(g), attempts: attempts(g) };

function Mode({ href, icon, label, state }: { href: string; icon: React.ReactNode; label: string; state: State | null }) {
  const done = state?.status === "won" || state?.status === "lost";
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-4 transition active:translate-y-1 active:shadow-none ${
        state?.status === "playing" ? "bg-emerald-600 shadow-[0_4px_0_#065f46] hover:brightness-110" : done ? "bg-white/10 hover:bg-white/15" : "bg-gold text-stone-900 shadow-[0_4px_0_#9a6b12] hover:brightness-110"
      } ${state ? "" : "invisible"}`}
    >
      {icon}
      <span className="flex-1 font-display text-xl">{label}</span>
      {state?.status === "playing" && <span className="font-display text-sm text-white/80">{state.attempts}</span>}
      {state?.status === "won" && (
        <span className="flex items-center gap-1.5 font-display text-sm text-gold">
          <CheckIcon className="h-5 w-5" />
          {state.attempts}
        </span>
      )}
      {state?.status === "lost" && (
        <span className="text-red-300">
          <XIcon />
        </span>
      )}
    </Link>
  );
}

export default function QuenteHome() {
  const [today, setToday] = useState("");
  const [states, setStates] = useState<{ day: State; free: State } | null>(null);

  useEffect(() => {
    const day = dayKey(new Date());
    setToday(day);
    const free = stateOf(loadFreeGame());
    setStates({ day: stateOf(loadDailyGame(day)), free: free.status === "playing" ? free : { status: "new", attempts: 0 } });
  }, []);

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-7 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <MiniBars className="-rotate-2 text-sm" />
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-[42px] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-6xl">QUENTE</span>
        <span className="mt-1 font-display text-2xl tracking-[0.3em] text-white/70 sm:text-3xl">OU FRIO</span>
      </h1>
      <GameIntro slug="quente-ou-frio" />

      <div className="flex w-full flex-col gap-3">
        <Mode href={`${QUENTE_DAILY_PATH}/${today}`} icon={<CalendarIcon className="h-7 w-7" />} label="DO DIA" state={states?.day ?? null} />
        <Mode href={QUENTE_FREE_PATH} icon={<InfinityIcon className="h-7 w-7" />} label="LIVRE" state={states?.free ?? null} />

        <Link
          href={QUENTE_DAILY_PATH}
          className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-gold/40 transition hover:bg-white/10"
        >
          <CalendarIcon className="h-6 w-6 shrink-0 text-gold" />
          <span className="flex-1 font-display text-base">Dias anteriores</span>
          <ChevronIcon className="h-5 w-5 text-white/50" />
        </Link>
      </div>

      <Link
        href={`${QUENTE_PATH}/como-jogar`}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
        Como jogar
      </Link>
      <AdSlot className="mt-6" />
    </main>
  );
}
