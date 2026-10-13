import { ensureDailies } from "@/lib/daily/db";
import { isGameServer } from "@/lib/game-ticket";

/** Chamado pelo agendador do servidor de jogos à meia-noite (e ao subir): deixa o desafio do dia pronto no banco. */
export async function POST(req: Request) {
  if (!isGameServer(req)) return new Response(null, { status: 401 });
  return Response.json({ created: await ensureDailies() });
}
