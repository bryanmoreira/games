import { prisma } from "@/lib/db";
import { ONLINE_MS, isOnline } from "@/lib/friends-rules";
import { DAILY_START } from "@/lib/daily/challenge";
import { ACHIEVEMENTS, dayKey } from "@/lib/stats/achievements";
import { getProfileStats } from "@/lib/stats/summary";
import { type DailyRow, type MatchRow, type OutcomeRow, type PlayerRow, fillDays, lastDays, summarizeDailies, summarizeGames } from "@/lib/admin-rules";

// Números do admin (lidos na hora; o site é pequeno). As contas ficam em lib/admin-rules.ts.

const DAY_MS = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

export const CHART_DAYS = 30;

/** Painel: totais e as séries por dia (horário de Brasília). Partida = uma por mesa (`matchId`), não por jogador. */
export async function getOverview() {
  const now = new Date();
  const since = daysAgo(CHART_DAYS + 1);
  const days = lastDays(dayKey(now), CHART_DAYS);
  const [users, online, newWeek, signups, played] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastSeenAt: { gte: new Date(now.getTime() - ONLINE_MS) } } }),
    prisma.user.count({ where: { createdAt: { gte: daysAgo(7) } } }),
    prisma.$queryRaw<{ day: string; n: number }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day, COUNT(*)::int AS n
      FROM "user" WHERE "createdAt" >= ${since} GROUP BY 1`,
    prisma.$queryRaw<{ day: string; matches: number; players: number }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day,
             COUNT(DISTINCT COALESCE("matchId", id))::int AS matches, COUNT(DISTINCT "userId")::int AS players
      FROM game_result WHERE "createdAt" >= ${since} GROUP BY 1`,
  ]);
  const [activeWeek] = await prisma.$queryRaw<{ n: number }[]>`
    SELECT COUNT(DISTINCT "userId")::int AS n FROM game_result WHERE "createdAt" >= ${daysAgo(7)}`;
  const matches = fillDays(played.map((r) => ({ day: r.day, n: r.matches })), days);
  return {
    users,
    online,
    newWeek,
    activeWeek: activeWeek?.n ?? 0,
    matchesToday: matches.at(-1) ?? 0,
    matchesWeek: matches.slice(-7).reduce((a, b) => a + b, 0),
    days,
    signups: fillDays(signups, days),
    matches,
    players: fillDays(played.map((r) => ({ day: r.day, n: r.players })), days),
  };
}

export const PERIODS = { "7": 7, "30": 30, all: null } as const;
export type Period = keyof typeof PERIODS;
export const isPeriod = (p: unknown): p is Period => typeof p === "string" && p in PERIODS;

/** Jogos no período: partidas por modo, jogadores e resultado contra a IA (ou sozinho). */
export async function getGameSummaries(period: Period) {
  const n = PERIODS[period];
  const since = n ? daysAgo(n) : new Date(0);
  const [matches, house, players] = await Promise.all([
    prisma.$queryRaw<MatchRow[]>`
      SELECT game, mode, COUNT(DISTINCT COALESCE("matchId", id))::int AS n
      FROM game_result WHERE "createdAt" >= ${since} GROUP BY game, mode`,
    prisma.$queryRaw<OutcomeRow[]>`
      SELECT game, outcome, COUNT(*)::int AS n
      FROM game_result WHERE "createdAt" >= ${since} AND mode IN ('ai', 'solo') GROUP BY game, outcome`,
    prisma.$queryRaw<PlayerRow[]>`
      SELECT game, COUNT(DISTINCT "userId")::int AS n FROM game_result WHERE "createdAt" >= ${since} GROUP BY game`,
  ]);
  return summarizeGames(matches, house, players);
}

export const DAILY_DAYS = 30;

/** Desafios diários dos últimos dias: quem jogou, quem venceu e o tempo médio. */
export async function getDailySummaries() {
  const days = lastDays(dayKey(new Date()), DAILY_DAYS).filter((d) => d >= DAILY_START);
  if (!days.length) return [];
  const rows = await prisma.gameResult.findMany({
    where: { daily: { gte: days[0] } },
    select: { game: true, daily: true, userId: true, outcome: true, data: true },
  });
  const flat: DailyRow[] = rows.map((r) => ({
    game: r.game,
    daily: r.daily!,
    userId: r.userId,
    outcome: r.outcome,
    timeMs: Number((r.data as Record<string, unknown>)?.timeMs) || null,
  }));
  return summarizeDailies(flat, days);
}

/** Quantos desbloquearam cada conquista e quantos jogaram cada jogo (a base do %). */
export async function getAchievementCounts() {
  const [counts, players, [all]] = await Promise.all([
    prisma.achievement.groupBy({ by: ["code"], _count: { _all: true } }),
    prisma.$queryRaw<PlayerRow[]>`SELECT game, COUNT(DISTINCT "userId")::int AS n FROM game_result GROUP BY game`,
    prisma.$queryRaw<{ n: number }[]>`SELECT COUNT(DISTINCT "userId")::int AS n FROM game_result`,
  ]);
  const got = new Map(counts.map((c) => [c.code, c._count._all]));
  const base = new Map(players.map((p) => [p.game, p.n]));
  return ACHIEVEMENTS.map((def) => ({ def, count: got.get(def.code) ?? 0, base: def.game ? (base.get(def.game) ?? 0) : (all?.n ?? 0) }));
}

export const RECENT_RESULTS = 15;

/** Tudo de um usuário para o admin: conta, sessões abertas, amigos, últimas partidas e os números do perfil. */
export async function getAdminUser(id: string) {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      username: true,
      role: true,
      profilePublic: true,
      equippedFrame: true,
      equippedDeck: true,
      chips: true,
      createdAt: true,
      lastSeenAt: true,
      accounts: { select: { providerId: true, createdAt: true } },
      sessions: {
        where: { expiresAt: { gt: now } },
        orderBy: { updatedAt: "desc" },
        select: { id: true, ipAddress: true, userAgent: true, createdAt: true, updatedAt: true, expiresAt: true },
      },
    },
  });
  if (!user) return null;
  const USER = { select: { id: true, name: true, image: true, username: true, lastSeenAt: true, equippedFrame: true } } as const;
  const [stats, recent, friendships, invites] = await Promise.all([
    getProfileStats(id),
    prisma.gameResult.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: RECENT_RESULTS,
      select: { id: true, game: true, mode: true, outcome: true, placement: true, daily: true, createdAt: true },
    }),
    prisma.friendship.findMany({
      where: { status: "accepted", OR: [{ requesterId: id }, { addresseeId: id }] },
      include: { requester: USER, addressee: USER },
      orderBy: { acceptedAt: "desc" },
    }),
    prisma.friendship.count({ where: { status: "pending", addresseeId: id } }),
  ]);
  const friends = friendships.map((f) => {
    const u = f.requesterId === id ? f.addressee : f.requester;
    return { ...u, online: isOnline(u.lastSeenAt, now) };
  });
  return { user: { ...user, online: isOnline(user.lastSeenAt, now) }, stats, recent, friends, pendingFriends: invites };
}
