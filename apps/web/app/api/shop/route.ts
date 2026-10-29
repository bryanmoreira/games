import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { buyItem, equipItem, shopState } from "@/lib/shop/shop";

async function userId() {
  return (await auth.api.getSession({ headers: await headers() }))?.user.id ?? null;
}

/** Saldo, itens do jogador e o que está em uso. */
export async function GET() {
  const id = await userId();
  if (!id) return new Response(null, { status: 401 });
  return Response.json(await shopState(id), { headers: { "cache-control": "no-store" } });
}

/** { action: "buy", itemId, price? } compra (price: o que a pessoa viu, para a promoção não virar no meio) e já usa; { action: "equip", type, key } troca o que está em uso (key null = padrão). */
export async function POST(req: Request) {
  const id = await userId();
  if (!id) return new Response(null, { status: 401 });
  const body = (await req.json().catch(() => null)) as { action?: string; itemId?: unknown; price?: unknown; type?: unknown; key?: unknown } | null;
  let result;
  if (body?.action === "buy" && typeof body.itemId === "string") result = await buyItem(id, body.itemId, typeof body.price === "number" ? body.price : undefined);
  else if (body?.action === "equip" && (body.type === "frame" || body.type === "deck" || body.type === "table") && (body.key === null || typeof body.key === "string"))
    result = await equipItem(id, body.type, body.key);
  else return new Response(null, { status: 400 });
  return Response.json({ ...result, state: await shopState(id) }, { status: result.ok ? 200 : 409 });
}
