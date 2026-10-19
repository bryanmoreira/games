import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { dailyKey, isDailyGame, isOpenDay, matchesChallenge } from "@/lib/daily/challenge";
import { findChallenge } from "@/lib/daily/db";
import { achievementChips } from "@/lib/chips-rules";
import { recordResults } from "@/lib/stats/record";
import { parseSoloResult } from "@/lib/stats/solo-result";

/** Partida de um jogo solo, mandada pelo navegador. Com `daily`, é o desafio daquele dia (confere com o guardado). */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = parseSoloResult(body?.game, body?.data);
  if (!parsed) return Response.json({ error: "inválido" }, { status: 400 });

  let daily: string | null = null;
  if (body?.daily !== undefined) {
    if (!isDailyGame(parsed.game) || !isOpenDay(body.daily)) return Response.json({ error: "inválido" }, { status: 400 });
    const ch = await findChallenge(parsed.game, body.daily);
    if (!ch || !matchesChallenge(ch, parsed.data, body.seed)) return Response.json({ error: "inválido" }, { status: 400 });
    daily = dailyKey(parsed.game, body.daily, parsed.data);
  }

  const outcome = parsed.outcome ?? "win";
  const unlocked = await recordResults(parsed.game, "solo", null, [{ userId: session.user.id, outcome, data: parsed.data, daily }]);
  const fresh = unlocked.get(session.user.id) ?? [];
  return Response.json({ achievements: fresh.map((a) => ({ code: a.code, title: a.title, desc: a.desc, icon: a.icon, chips: achievementChips(a) })) });
}
