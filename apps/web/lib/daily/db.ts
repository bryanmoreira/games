import { prisma } from "@/lib/db";
import { dayKey } from "@/lib/stats/achievements";
import { DAILY_GAMES, isOpenDay, makeChallenge, missingDays, type DailyChallenge, type DailyDone, type DailyGame } from "@/lib/daily/challenge";
import type { Prisma } from "@/lib/generated/prisma/client";

const toChallenge = (game: DailyGame, day: string, data: unknown) => ({ game, day, data }) as DailyChallenge;

/** Desafio já guardado do dia (sem criar). */
export async function findChallenge(game: DailyGame, day: string): Promise<DailyChallenge | null> {
  const row = await prisma.dailyChallenge.findUnique({ where: { game_day: { game, day } } });
  return row ? toChallenge(game, day, row.data) : null;
}

/** Desafio do dia: o primeiro pedido do dia gera e guarda; os outros leem o mesmo. null = dia sem desafio (futuro ou antes do primeiro). */
export async function getChallenge(game: DailyGame, day: string): Promise<DailyChallenge | null> {
  if (!isOpenDay(day)) return null;
  const found = await findChallenge(game, day);
  if (found) return found;
  const data = makeChallenge(game, undefined, day) as unknown as Prisma.InputJsonValue;
  // dois pedidos ao mesmo tempo: vale o que entrou primeiro
  await prisma.dailyChallenge.createMany({ data: [{ game, day, data }], skipDuplicates: true });
  return findChallenge(game, day);
}

/** Gera o desafio de hoje e os dias que ficaram sem (ninguém abriu, ou o agendador estava fora). Devolve o que criou. */
export async function ensureDailies(today = dayKey(new Date())): Promise<{ game: DailyGame; day: string }[]> {
  const created: { game: DailyGame; day: string }[] = [];
  for (const game of DAILY_GAMES) {
    const have = await prisma.dailyChallenge.findMany({ where: { game }, select: { day: true } });
    for (const day of missingDays(have.map((r) => r.day), today)) {
      await getChallenge(game, day);
      created.push({ game, day });
    }
  }
  return created;
}

/** Palavras do dia que o jogador terminou (vencidas ou não), por `AAAA-MM-DD:modo`. */
export async function verbeteDone(userId: string): Promise<Record<string, { won: boolean; attempts: number }>> {
  const rows = await prisma.gameResult.findMany({
    where: { userId, game: "verbete", daily: { not: null } },
    select: { daily: true, outcome: true, data: true },
  });
  return Object.fromEntries(rows.map((r) => [r.daily!, { won: r.outcome === "win", attempts: Number((r.data as Record<string, unknown>)?.attempts ?? 0) }]));
}

/** Desafios que o jogador venceu, por dia. `field`: o número que o calendário mostra (o tempo; no Quente ou Frio, as tentativas). */
export async function dailyDone(userId: string, game: DailyGame, field = "timeMs"): Promise<Record<string, DailyDone>> {
  const rows = await prisma.gameResult.findMany({
    where: { userId, game, outcome: "win", daily: { not: null } },
    select: { daily: true, data: true, createdAt: true },
  });
  return Object.fromEntries(
    rows.map((r) => [r.daily!, { timeMs: Number((r.data as Record<string, unknown>)?.[field] ?? 0), onTime: dayKey(r.createdAt) === r.daily }]),
  );
}
