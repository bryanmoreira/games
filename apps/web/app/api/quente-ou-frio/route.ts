import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { achievementChips } from "@/lib/chips-rules";
import { prisma } from "@/lib/db";
import { play } from "@/lib/quente-ou-frio/play";
import { parseRequest } from "@/lib/quente-ou-frio/protocol";
import { recordResults } from "@/lib/stats/record";

/** Chute, dica, desistir ou ver as mais próximas no fim. A partida que termina aqui vai para o perfil (logado). */
export async function POST(req: Request) {
  const parsed = parseRequest(await req.json().catch(() => null));
  if (!parsed) return Response.json({ error: "invalid" }, { status: 400 });
  const r = await play(parsed);
  if (!r.finished) return Response.json(r.body, { status: r.status });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json(r.body);
  const { outcome, data, daily } = r.finished;
  // partida livre conta uma vez (o desafio do dia já é único pelo dia)
  if (data.gid !== undefined) {
    const dup = await prisma.gameResult.findFirst({ where: { userId: session.user.id, game: "quente-ou-frio", data: { path: ["gid"], equals: data.gid as number } }, select: { id: true } });
    if (dup) return Response.json(r.body);
  }
  const unlocked = await recordResults("quente-ou-frio", "solo", null, [{ userId: session.user.id, outcome, data, daily }]);
  const fresh = unlocked.get(session.user.id) ?? [];
  return Response.json({ ...r.body, achievements: fresh.map((a) => ({ code: a.code, title: a.title, desc: a.desc, icon: a.icon, chips: achievementChips(a) })) });
}
