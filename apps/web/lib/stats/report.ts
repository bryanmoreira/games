"use client";

import type { AchievementIcon } from "@/lib/stats/achievements";
import type { SoloGame } from "@/lib/stats/games";

export interface UnlockedAchievement {
  code: string;
  title: string;
  desc: string;
  icon: AchievementIcon;
}

export const ACHIEVEMENTS_EVENT = "mesa:achievements";

/** Vitória num jogo solo: vai para o perfil (só se estiver logado; senão o site ignora). */
export function reportSoloWin(game: SoloGame, data: Record<string, unknown>) {
  fetch("/api/results", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ game, data }) })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { achievements?: UnlockedAchievement[] } | null) => {
      if (j?.achievements?.length) window.dispatchEvent(new CustomEvent(ACHIEVEMENTS_EVENT, { detail: j.achievements }));
    })
    .catch(() => {});
}
