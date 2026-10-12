import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { signTicket } from "@/lib/game-ticket";

/** Ticket para o servidor de jogos saber quem está logado (sem login: 204). */
export async function GET() {
  // sem cache do cookie: nome e foto recém-trocados no perfil já valem na próxima conexão
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  const ticket = session ? signTicket(session.user) : null;
  if (!ticket) return new Response(null, { status: 204 });
  return Response.json({ ticket }, { headers: { "cache-control": "no-store" } });
}
