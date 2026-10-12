import { prisma } from "@/lib/db";
import { ACHIEVEMENTS, dayStreaks, type AchievementDef } from "@/lib/stats/achievements";
import { computeRivalry, statsByGame, type GameStats, type Rivalry, type RivalryRow } from "@/lib/stats/compute";
import { playedDays } from "@/lib/stats/record";

export { formatMs } from "@/lib/stats/compute";
export type { Chip, GameStats, ModeStats, RecordTable, Rivalry } from "@/lib/stats/compute";

export interface UnlockedAchievement {
  def: AchievementDef;
  unlockedAt: Date;
}

export interface ProfileStats {
  games: GameStats[];
  days: { best: number; current: number };
  achievements: UnlockedAchievement[];
}

/** Tudo o que o perfil mostra de um jogador. */
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [results, unlocked, days] = await Promise.all([
    prisma.gameResult.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { game: true, mode: true, outcome: true, placement: true, data: true, createdAt: true },
    }),
    prisma.achievement.findMany({ where: { userId }, orderBy: { unlockedAt: "desc" } }),
    playedDays(userId),
  ]);
  const have = new Map(unlocked.map((a) => [a.code, a.unlockedAt]));
  return {
    games: statsByGame(results.map((r) => ({ ...r, data: (r.data ?? {}) as Record<string, unknown> }))),
    days: dayStreaks(days),
    achievements: ACHIEVEMENTS.filter((a) => have.has(a.code)).map((def) => ({ def, unlockedAt: have.get(def.code)! })),
  };
}

/** Placar entre dois jogadores nas partidas em que se enfrentaram (parceiros de time não contam). */
export async function getRivalry(me: string, them: string): Promise<Rivalry> {
  const rows = await prisma.$queryRaw<RivalryRow[]>`
    SELECT a.game, a.outcome AS mine, b.outcome AS theirs, a.placement AS "myPlace", b.placement AS "theirPlace"
    FROM game_result a
    JOIN game_result b ON a."matchId" = b."matchId"
    WHERE a."userId" = ${me} AND b."userId" = ${them} AND a."matchId" IS NOT NULL`;
  return computeRivalry(rows);
}
