import { createHmac, timingSafeEqual } from "node:crypto";

// O servidor de jogos (apps/server) confere com o mesmo GAME_SECRET: ver apps/server/src/results.ts.
const SECRET = process.env.GAME_SECRET ?? "";
const TTL = 12 * 60 * 60 * 1000;

/** Quem está logado, como aparece nas mesas: o nome e a foto só mudam no perfil. */
export interface TicketUser {
  id: string;
  name: string;
  image?: string | null;
  username?: string | null;
  /** moldura e baralho da loja em uso (chaves de lib/shop/catalog.ts) */
  equippedFrame?: string | null;
  equippedDeck?: string | null;
}

/** Ticket `dados.assinatura` (dados em base64url) que diz ao servidor de jogos quem está logado. */
export function signTicket(user: TicketUser): string | null {
  if (!SECRET) return null;
  const payload = Buffer.from(
    JSON.stringify({ u: user.id, n: user.name, i: user.image ?? null, h: user.username ?? null, f: user.equippedFrame ?? null, k: user.equippedDeck ?? null, e: Date.now() + TTL }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", SECRET).update(payload).digest("hex")}`;
}

/** O servidor de jogos se identifica com `Authorization: Bearer <GAME_SECRET>`. */
export function isGameServer(req: Request): boolean {
  const got = req.headers.get("authorization") ?? "";
  const want = `Bearer ${SECRET}`;
  return !!SECRET && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
