"use client";

import { trackEnd, type GameResult } from "@/lib/analytics";
import type { AchievementIcon } from "@/lib/stats/achievements";
import type { SoloGame } from "@/lib/stats/games";

export interface UnlockedAchievement {
  code: string;
  title: string;
  desc: string;
  icon: AchievementIcon;
  /** fichas que a conquista pagou */
  chips?: number;
}

export const ACHIEVEMENTS_EVENT = "mesa:achievements";

/**
 * Partida terminada num jogo solo: vai para o perfil (só se estiver logado; senão o site ignora) e conta no Umami.
 * `daily`: era o desafio deste dia. `nivel` e `resultado` só servem para o Umami.
 */
export function reportSoloResult(
  game: SoloGame | "tijolada",
  data: Record<string, unknown>,
  daily?: { day: string; seed: number },
  umami: { resultado?: GameResult; nivel?: string | number } = {},
) {
  trackEnd(game, umami.resultado ?? "vitoria", { modo: "solo", diario: !!daily, nivel: umami.nivel });
  const body = daily ? { game, data, daily: daily.day, seed: daily.seed } : { game, data };
  fetch("/api/results", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { achievements?: UnlockedAchievement[] } | null) => {
      if (j?.achievements?.length) window.dispatchEvent(new CustomEvent(ACHIEVEMENTS_EVENT, { detail: j.achievements }));
    })
    .catch(() => {});
}

/** Vitória num jogo solo (Sudoku e Spider só mandam vitórias). */
export const reportSoloWin = reportSoloResult;
