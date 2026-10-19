import { createHmac, timingSafeEqual } from "node:crypto";
import type { MatchReport } from "@truco/game";

// Resultados das partidas vão para o site, que guarda no banco.
// GAME_SECRET é o mesmo nos dois serviços: assina o ticket de quem está logado e autentica o envio.
const SECRET = process.env.GAME_SECRET ?? "";
const WEB_URL = (process.env.WEB_URL ?? "http://localhost:3000").replace(/\/$/, "");

if (!SECRET) console.warn("GAME_SECRET vazio: resultados das partidas não serão salvos");

/** Conta logada no site, como vem no ticket: nome e foto valem nas mesas (só mudam no perfil). */
export interface Account {
  userId: string;
  name: string;
  image: string | null;
  username: string | null;
  /** moldura e baralho da loja (o site confere as chaves ao desenhar) */
  frame: string | null;
  deck: string | null;
}

/** Ticket do site: `dados.assinatura` (dados em base64url). Devolve a conta se for válido e não venceu. */
export function verifyTicket(ticket: unknown): Account | null {
  if (!SECRET || typeof ticket !== "string") return null;
  const [payload, sig] = ticket.split(".");
  if (!payload || !sig) return null;
  const want = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString()) as { u: string; n: string; i: string | null; h: string | null; f?: unknown; k?: unknown; e: number };
    if (!(d.e > Date.now()) || typeof d.u !== "string") return null;
    const key = (v: unknown) => (typeof v === "string" && /^[a-z]{1,20}$/.test(v) ? v : null);
    return { userId: d.u, name: String(d.n || "Jogador").slice(0, 24), image: d.i ?? null, username: d.h ?? null, frame: key(d.f), deck: key(d.k) };
  } catch {
    return null;
  }
}

/** POST numa rota interna do site, autenticado com o GAME_SECRET. null = sem segredo ou site fora do ar. */
export async function callSite(path: string, body: unknown = {}): Promise<Response | null> {
  if (!SECRET) return null;
  try {
    return await fetch(`${WEB_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

export async function sendReport(report: MatchReport) {
  if (!SECRET || report.players.length === 0) return;
  const r = await callSite("/api/internal/results", report);
  if (!r) console.error("resultados: site fora do ar");
  else if (!r.ok) console.error(`resultados: ${r.status} ${await r.text()}`);
}
