import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { achievementChips } from "@/lib/chips-rules";
import { ACHIEVEMENT_BY_CODE } from "@/lib/stats/achievements";

/** Conquistas desbloqueadas agora há pouco (para mostrar na tela de fim da partida). */
export async function GET(req: Request) {
  // só as deste jogo e as gerais: conquista de outro jogo não aparece na tela errada
  const game = new URL(req.url).searchParams.get("game");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ achievements: [] });
  const rows = await prisma.achievement.findMany({
    // relógio do servidor: a partida que acabou de terminar, não uma de minutos atrás
    where: { userId: session.user.id, unlockedAt: { gte: new Date(Date.now() - 20_000) } },
    orderBy: { unlockedAt: "asc" },
  });
  const achievements = rows.flatMap((r) => {
    const a = ACHIEVEMENT_BY_CODE.get(r.code);
    return a && (a.game === null || a.game === game) ? [{ code: a.code, title: a.title, desc: a.desc, icon: a.icon, chips: achievementChips(a) }] : [];
  });
  return Response.json({ achievements }, { headers: { "cache-control": "no-store" } });
}
