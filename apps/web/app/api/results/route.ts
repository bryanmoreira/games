import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { recordResults } from "@/lib/stats/record";
import { parseSoloResult } from "@/lib/stats/solo-result";

/** Vitória num jogo solo, mandada pelo navegador. */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = parseSoloResult(body?.game, body?.data);
  if (!parsed) return Response.json({ error: "inválido" }, { status: 400 });
  const unlocked = await recordResults(parsed.game, "solo", null, [{ userId: session.user.id, outcome: "win", data: parsed.data }]);
  const fresh = unlocked.get(session.user.id) ?? [];
  return Response.json({ achievements: fresh.map(({ code, title, desc, icon }) => ({ code, title, desc, icon })) });
}
