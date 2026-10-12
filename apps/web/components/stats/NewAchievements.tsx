"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AchievementIcon } from "@/components/stats/AchievementIcon";
import { gameFromPath } from "@/lib/stats/games";
import { ACHIEVEMENTS_EVENT, type UnlockedAchievement } from "@/lib/stats/report";

const SHOWN_KEY = "mesa.achievements.shown";

function shown(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SHOWN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function markShown(codes: string[]) {
  try {
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify([...shown(), ...codes]));
  } catch {}
}

/**
 * Conquistas que acabaram de sair, dentro da tela de fim de partida.
 * Jogos solo avisam pelo evento; online, o servidor grava e aqui busca as recentes.
 */
export function NewAchievements() {
  const game = gameFromPath(usePathname());
  const [list, setList] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    if (!game) return;
    const add = (items: UnlockedAchievement[]) => {
      const seen = shown();
      const fresh = items.filter((a) => !seen.has(a.code));
      if (!fresh.length) return;
      markShown(fresh.map((a) => a.code));
      setList((l) => [...l, ...fresh.filter((a) => !l.some((x) => x.code === a.code))]);
    };
    const load = () =>
      fetch(`/api/achievements/recent?game=${game}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((j: { achievements?: UnlockedAchievement[] } | null) => j?.achievements && add(j.achievements))
        .catch(() => {});
    const onEvent = (e: Event) => add((e as CustomEvent<UnlockedAchievement[]>).detail);
    window.addEventListener(ACHIEVEMENTS_EVENT, onEvent);
    // o resultado pode levar um instante para chegar ao banco
    const t1 = setTimeout(load, 900);
    const t2 = setTimeout(load, 3000);
    return () => {
      window.removeEventListener(ACHIEVEMENTS_EVENT, onEvent);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [game]);

  if (!list.length) return null;
  return (
    <div className="flex flex-col items-stretch gap-2">
      {list.map((a) => (
        <div key={a.code} className="achievement-pop flex items-center gap-3 rounded-2xl bg-gold/10 px-4 py-2.5 ring-1 ring-gold/50" title={a.desc}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-stone-900">
            <AchievementIcon icon={a.icon} className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[10px] tracking-wider text-gold/80">CONQUISTA</span>
            <span className="text-sm font-semibold text-white">{a.title}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
