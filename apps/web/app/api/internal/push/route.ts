import { isGameServer } from "@/lib/game-ticket";
import { sendDailyPush } from "@/lib/push";

/** Chamado pelo agendador do servidor de jogos de manhã: manda o lembrete do desafio do dia. */
export async function POST(req: Request) {
  if (!isGameServer(req)) return new Response(null, { status: 401 });
  const r = await sendDailyPush();
  return r ? Response.json(r) : Response.json({ error: "VAPID não configurado" }, { status: 503 });
}
