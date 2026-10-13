import { prisma } from "@/lib/db";
import { dayStreaks, newAchievements, type AchievementDef } from "@/lib/stats/achievements";
import type { Mode, Outcome, StatGame } from "@/lib/stats/games";
import type { Prisma } from "@/lib/generated/prisma/client";

export interface NewResult {
  userId: string;
  outcome: Outcome;
  placement?: number | null;
  data: Record<string, unknown>;
  /** dia do desafio diário (só jogos solo) */
  daily?: string | null;
}

/** Dias (horário de Brasília) em que o jogador terminou alguma partida. */
export async function playedDays(userId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ d: string }[]>`
    SELECT DISTINCT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS d
    FROM game_result WHERE "userId" = ${userId}`;
  return rows.map((r) => r.d);
}

/** Guarda os resultados de uma partida e devolve as conquistas novas de cada jogador. */
export async function recordResults(game: StatGame, mode: Mode, matchId: string | null, results: NewResult[]): Promise<Map<string, AchievementDef[]>> {
  // só contas que existem (o servidor de jogos pode mandar alguém que apagou a conta)
  const exists = new Set(
    (await prisma.user.findMany({ where: { id: { in: results.map((r) => r.userId) } }, select: { id: true } })).map((u) => u.id),
  );
  const rows = results.filter((r) => exists.has(r.userId));
  if (!rows.length) return new Map();

  // desafio diário já vencido não conta de novo (único por jogador, jogo e dia)
  await prisma.gameResult.createMany({
    skipDuplicates: true,
    data: rows.map((r) => ({
      userId: r.userId,
      game,
      mode,
      outcome: r.outcome,
      placement: r.placement ?? null,
      matchId,
      daily: r.daily ?? null,
      data: r.data as Prisma.InputJsonValue,
    })),
  });

  const unlocked = new Map<string, AchievementDef[]>();
  for (const { userId } of rows) unlocked.set(userId, await checkAchievements(userId, game));
  return unlocked;
}

async function checkAchievements(userId: string, game: StatGame): Promise<AchievementDef[]> {
  const [results, have, days] = await Promise.all([
    prisma.gameResult.findMany({
      where: { userId, game },
      orderBy: { createdAt: "asc" },
      select: { mode: true, outcome: true, placement: true, data: true, daily: true, createdAt: true },
    }),
    prisma.achievement.findMany({ where: { userId }, select: { code: true } }),
    playedDays(userId),
  ]);
  const fresh = newAchievements(
    game,
    { results: results.map((r) => ({ ...r, data: (r.data ?? {}) as Record<string, unknown> })), bestDays: dayStreaks(days).best },
    new Set(have.map((a) => a.code)),
  );
  if (fresh.length) await prisma.achievement.createMany({ data: fresh.map((a) => ({ userId, code: a.code })), skipDuplicates: true });
  return fresh;
}
