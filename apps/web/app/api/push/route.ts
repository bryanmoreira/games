import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { DAILY_GAMES_PUSH, isSubscription, saveSubscription } from "@/lib/push";
import { prisma } from "@/lib/db";

/** Liga ou desliga o lembrete dos desafios do dia deste aparelho: { subscription, on } (todos os jogos diários de uma vez). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!isSubscription(body?.subscription) || typeof body?.on !== "boolean") return Response.json({ error: "inválido" }, { status: 400 });
  const session = await auth.api.getSession({ headers: await headers() });
  await saveSubscription(body.subscription, body.on ? DAILY_GAMES_PUSH : [], session?.user.id ?? null);
  return Response.json({ ok: true });
}

/** Desliga o lembrete do aparelho: { endpoint } */
export async function DELETE(req: Request) {
  const endpoint = (await req.json().catch(() => null))?.endpoint;
  if (typeof endpoint !== "string") return Response.json({ error: "inválido" }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return new Response(null, { status: 204 });
}
