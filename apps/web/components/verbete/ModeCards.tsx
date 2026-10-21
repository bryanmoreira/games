"use client";

import Link from "next/link";
import { MAX_GUESSES, MODES, type Mode } from "@mesa/verbete";
import { CheckIcon } from "@/components/ui/icons";
import { XIcon } from "@/components/ui/buttons";
import type { DayState } from "@/lib/verbete/storage";
import { ModeIcon, MODE_NAME } from "./Tile";

/** Situação de cada modo num dia: do perfil (logado) e do aparelho; o terminado vale mais que o "jogando". */
export function mergeDays(server: Record<string, { won: boolean; attempts: number }>, local: Record<string, DayState>): Record<string, DayState> {
  const out: Record<string, DayState> = { ...local };
  for (const [k, s] of Object.entries(server)) out[k] = { status: s.won ? "won" : "lost", attempts: s.attempts };
  return out;
}

/** Os três modos lado a lado, com a situação de cada um (✓ 3/6, ✕ ou jogando). */
export function ModeCards({ href, states }: { href: (m: Mode) => string; states?: Partial<Record<Mode, DayState>> }) {
  return (
    <div className="grid w-full grid-cols-3 gap-2">
      {MODES.map((m) => {
        const s = states?.[m];
        return (
          <Link
            key={m}
            href={href(m)}
            className={`flex flex-col items-center gap-2 rounded-2xl px-1 py-3 font-display transition ${
              s?.status === "won" ? "bg-gold/15 ring-2 ring-gold/70 hover:bg-gold/25" : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
            }`}
          >
            <ModeIcon mode={m} className="h-7 w-7 text-gold" />
            <span className="text-xs sm:text-sm">{MODE_NAME[m].toUpperCase()}</span>
            {s?.status === "won" ? (
              <span className="flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] tabular-nums text-stone-900">
                <CheckIcon className="h-3 w-3" />
                {s.attempts}/{MAX_GUESSES[m]}
              </span>
            ) : s?.status === "lost" ? (
              <span className="flex items-center gap-1 rounded-full bg-red-500/80 px-2 py-0.5 text-[10px] text-white [&_svg]:h-3 [&_svg]:w-3">
                <XIcon />
                {MAX_GUESSES[m]}/{MAX_GUESSES[m]}
              </span>
            ) : s?.status === "playing" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {s.attempts}/{MAX_GUESSES[m]}
              </span>
            ) : (
              <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] text-white/60">{MAX_GUESSES[m]} CHUTES</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

/** Estados de um dia por modo. */
export const dayStates = (all: Record<string, DayState>, day: string): Partial<Record<Mode, DayState>> =>
  Object.fromEntries(MODES.flatMap((m) => (all[`${day}:${m}`] ? [[m, all[`${day}:${m}`]]] : [])));
