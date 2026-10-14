"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { AchievementIcon } from "@/components/stats/AchievementIcon";
import { formatTime } from "@/components/sudoku/common";
import { CalendarIcon, CheckIcon } from "@/components/ui/icons";
import { msToNextDay, type DailyDone, type DailyGame } from "@/lib/daily/challenge";
import { localDailies, type LocalDaily } from "@/lib/daily/storage";
import { loginHref } from "@/lib/login";
import { dayStreaks } from "@/lib/stats/achievements";
import { longDay } from "./common";
import { MonthCalendar, monthOf } from "./MonthCalendar";

interface Day {
  won: boolean;
  timeMs: number | null;
  started: boolean;
}

/** Junta o que o perfil tem (logado) com o que está salvo no aparelho. */
function merge(server: Record<string, DailyDone>, local: Record<string, LocalDaily>): Record<string, Day> {
  const out: Record<string, Day> = {};
  for (const [d, l] of Object.entries(local)) out[d] = { won: l.won, timeMs: l.won ? l.elapsed : null, started: l.started };
  for (const [d, s] of Object.entries(server)) out[d] = { won: true, timeMs: s.timeMs, started: true };
  return out;
}

/** Calendário do desafio diário: hoje em destaque e os dias anteriores para rejogar. */
export function DailyHub({
  game,
  name,
  level,
  today,
  done,
  loggedIn,
  path,
  back,
}: {
  game: DailyGame;
  name: string;
  /** selo da dificuldade (sempre a maior) */
  level: React.ReactNode;
  today: string;
  /** desafios vencidos, do perfil */
  done: Record<string, DailyDone>;
  loggedIn: boolean;
  /** rota do calendário; a partida fica em `${path}/AAAA-MM-DD` */
  path: string;
  back: string;
}) {
  const router = useRouter();
  // null até ler o aparelho: o botão de hoje só aparece já com o estado certo
  const [local, setLocal] = useState<Record<string, LocalDaily> | null>(null);
  const [month, setMonth] = useState(monthOf(today));
  useEffect(() => setLocal(localDailies(game)), [game]);
  const days = useMemo(() => merge(done, local ?? {}), [done, local]);
  const streak = useMemo(() => dayStreaks(Object.entries(done).flatMap(([d, s]) => (s.onTime ? [d] : []))).current, [done]);

  // meia-noite em Brasília: recarrega para mostrar o desafio novo
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

  const t = days[today];
  const play = (day: string) => router.push(`${path}/${day}`);

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center gap-7 px-4 py-10">
      <BackButton href={back} className="fixed left-4 top-4" />

      <div className="flex flex-col items-center gap-4">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gold/15 text-gold ring-2 ring-gold/40">
          <CalendarIcon className="h-11 w-11" />
        </span>
        <h1 className="flex flex-col items-center leading-none">
          <span className="font-display text-[34px] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-5xl">DESAFIO DO DIA</span>
          <span className="mt-2 font-display text-sm tracking-[0.4em] text-white/70">{name}</span>
        </h1>
        <span className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 font-display text-xs text-white/70">{level}</span>
      </div>

      {/* hoje */}
      <div className="flex w-full flex-col gap-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-sm capitalize text-white/90">{longDay(today)}</span>
          {loggedIn && streak > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-orange-400/10 px-2.5 py-1 font-display text-xs text-orange-200 ring-1 ring-orange-400/30" title="Desafios seguidos">
              <AchievementIcon icon="flame" className="h-3.5 w-3.5" />
              {streak}
            </span>
          )}
        </div>
        {t?.won ? (
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-display text-lg text-gold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-stone-900">
                <CheckIcon className="h-5 w-5" />
              </span>
              {t.timeMs !== null && <span className="tabular-nums">{formatTime(t.timeMs)}</span>}
            </span>
            {left !== null && (
              <span className="flex flex-col items-end font-display leading-none" title="Próximo desafio">
                <span className="text-[10px] text-white/50">PRÓXIMO</span>
                <span className="mt-1 tabular-nums text-white/80">{formatTime(left)}</span>
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={() => play(today)}
            className={`flex items-center justify-center gap-3 rounded-xl py-3 font-display text-lg active:translate-y-1 active:shadow-none ${
              t?.started ? "bg-emerald-600 shadow-[0_4px_0_#065f46]" : "banner bg-gold text-stone-900 shadow-[0_4px_0_#9a6b12]"
            } ${local ? "" : "invisible"}`}
          >
            {t?.started ? "Continuar" : "Jogar"}
          </button>
        )}
      </div>

      {/* dias anteriores */}
      <MonthCalendar
        today={today}
        month={month}
        onMonth={setMonth}
        cell={(d, n) => {
          const s = days[d];
          return (
            <button
              onClick={() => play(d)}
              title={`${longDay(d)}${s?.won && s.timeMs !== null ? ` · ${formatTime(s.timeMs)}` : ""}`}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-lg font-display text-xs transition ${
                s?.won ? "bg-gold text-stone-900 hover:brightness-110" : "bg-white/5 text-white/80 hover:bg-white/15 hover:text-white"
              } ${d === today ? "ring-2 ring-gold ring-offset-2 ring-offset-[#0f1813]" : ""}`}
            >
              {n}
              {s?.won ? (
                <CheckIcon className="absolute bottom-0.5 h-2.5 w-2.5" />
              ) : (
                s?.started && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        }}
      />

      {!loggedIn && (
        <Link href={loginHref(path)} className="font-display text-xs text-white/50 transition hover:text-white">
          Entre para contar no perfil
        </Link>
      )}
    </main>
  );
}
