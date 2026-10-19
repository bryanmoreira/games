import { headers } from "next/headers";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { adjustChips, grantItem, revokeItem } from "@/lib/shop/shop";

/**
 * Admin mexe nas fichas e itens de um jogador:
 * { action: "chips", delta, note? } · { action: "grant", itemId } · { action: "revoke", itemId }.
 * Quem não é admin recebe 404 (a área não "existe" para ele).
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session || !isAdmin(session.user)) return new Response(null, { status: 404 });
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { action?: string; delta?: unknown; note?: unknown; itemId?: unknown } | null;
  const admin = session.user.id;
  let result;
  if (body?.action === "chips" && typeof body.delta === "number")
    result = await adjustChips(admin, id, body.delta, typeof body.note === "string" ? body.note : null);
  else if (body?.action === "grant" && typeof body.itemId === "string") result = await grantItem(admin, id, body.itemId);
  else if (body?.action === "revoke" && typeof body.itemId === "string") result = await revokeItem(admin, id, body.itemId);
  else return new Response(null, { status: 400 });
  return Response.json(result, { status: result.ok ? 200 : 409 });
}
