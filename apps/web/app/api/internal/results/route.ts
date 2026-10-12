import type { MatchReport } from "@truco/game";
import { isGameServer } from "@/lib/game-ticket";
import { isOnlineGame } from "@/lib/stats/games";
import { recordResults } from "@/lib/stats/record";

const OUTCOMES = new Set(["win", "loss", "draw"]);

/** Resultado de partida online/contra IA, mandado pelo servidor de jogos. */
export async function POST(req: Request) {
  if (!isGameServer(req)) return new Response(null, { status: 401 });
  const r = (await req.json().catch(() => null)) as MatchReport | null;
  if (!r || !isOnlineGame(r.game) || (r.mode !== "ai" && r.mode !== "online") || typeof r.matchId !== "string" || !Array.isArray(r.players))
    return Response.json({ error: "inválido" }, { status: 400 });
  const players = r.players.filter((p) => typeof p?.userId === "string" && OUTCOMES.has(p.outcome));
  await recordResults(
    r.game,
    r.mode,
    r.matchId,
    players.map((p) => ({ userId: p.userId, outcome: p.outcome, placement: p.placement ?? null, data: p.data ?? {} })),
  );
  return Response.json({ ok: true });
}
