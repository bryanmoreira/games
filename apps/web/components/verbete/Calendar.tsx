"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MODES } from "@mesa/verbete";
import { BackButton } from "@/components/BackButton";
import { longDay } from "@/components/daily/common";
import { MonthCalendar, monthOf } from "@/components/daily/MonthCalendar";
import { formatTime } from "@/components/sudoku/common";
import { CalendarIcon } from "@/components/ui/icons";
import { msToNextDay } from "@/lib/daily/challenge";
import { loginHref } from "@/lib/login";
import { VERBETE_DAILY_PATH, VERBETE_PATH } from "@/lib/verbete/paths";
import { localDays, type DayState } from "@/lib/verbete/storage";
import { dayStates, mergeDays, ModeCards } from "./ModeCards";
import { MODE_NAME } from "./Tile";

const DOT: Record<DayState["status"], string> = { won: "bg-gold", lost: "bg-red-400", playing: "bg-emerald-400" };

/** Calendário da palavra do dia: hoje com os três modos e os dias anteriores para rejogar. */
export function Calendar({ today, done, loggedIn }: { today: string; done: Record<string, { won: boolean; attempts: number }>; loggedIn: boolean }) {
  const router = useRouter();
  const [local, setLocal] = useState<Record<string, DayState> | null>(null);
  const [month, setMonth] = useState(monthOf(today));
  useEffect(() => setLocal(localDays()), []);
  const days = useMemo(() => mergeDays(done, local ?? {}), [done, local]);

  // meia-noite em Brasília: recarrega para mostrar as palavras novas
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      const ms = msToNextDay();
      setLeft(ms);
      if (ms < 1000) setTimeout(() => router.refresh(), 1500);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center gap-7 px-4 py-10">
      <BackButton href={VERBETE_PATH} className="fixed left-4 top-4" />

      <div className="flex flex-col items-center gap-4">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gold/15 text-gold ring-2 ring-gold/40">
          <CalendarIcon className="h-11 w-11" />
        </span>
        <h1 className="flex flex-col items-center leading-none">
          <span className="font-display text-[34px] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-5xl">PALAVRA DO DIA</span>
          <span className="mt-2 font-display text-sm tracking-[0.4em] text-white/70">VERBETE</span>
        </h1>
      </div>

      <div className="flex w-full flex-col gap-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-sm capitalize text-white/90">{longDay(today)}</span>
          {left !== null && (
            <span className="flex flex-col items-end font-display leading-none" title="Próximas palavras">
              <span className="text-[10px] text-white/50">PRÓXIMA</span>
              <span className="mt-1 tabular-nums text-white/80">{formatTime(left)}</span>
            </span>
          )}
        </div>
        <div className={local ? "" : "invisible"}>
          <ModeCards href={(m) => `${VERBETE_DAILY_PATH}/${today}?m=${m}`} states={dayStates(days, today)} />
        </div>
      </div>

      <MonthCalendar
        today={today}
        month={month}
        onMonth={setMonth}
        cell={(d, n) => {
          const s = dayStates(days, d);
          const all = MODES.every((m) => s[m]?.status === "won");
          return (
            <button
              onClick={() => router.push(`${VERBETE_DAILY_PATH}/${d}`)}
              title={[longDay(d), ...MODES.flatMap((m) => (s[m] ? [`${MODE_NAME[m]}: ${s[m]!.status === "won" ? `${s[m]!.attempts}ª` : s[m]!.status === "lost" ? "não acertou" : "jogando"}`] : []))].join(" · ")}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg font-display text-xs transition ${
                all ? "bg-gold text-stone-900 hover:brightness-110" : "bg-white/5 text-white/80 hover:bg-white/15 hover:text-white"
              } ${d === today ? "ring-2 ring-gold ring-offset-2 ring-offset-[#0f1813]" : ""}`}
            >
              {n}
              {!all && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {MODES.map((m) => (
                    <span key={m} className={`h-1 w-1 rounded-full ${s[m] ? DOT[s[m]!.status] : "bg-white/15"}`} />
                  ))}
                </span>
              )}
            </button>
          );
        }}
      />

      {!loggedIn && (
        <Link href={loginHref(VERBETE_DAILY_PATH)} className="font-display text-xs text-white/50 transition hover:text-white">
          Entre para contar no perfil
        </Link>
      )}
    </main>
  );
}
