import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isSubscription, saveSubscription } from "@/lib/push";
import { prisma } from "@/lib/db";

/** Liga ou atualiza o lembrete do desafio do dia deste aparelho: { subscription, games } (games vazio desliga). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!isSubscription(body?.subscription) || !Array.isArray(body?.games)) return Response.json({ error: "inválido" }, { status: 400 });
  const session = await auth.api.getSession({ headers: await headers() });
  await saveSubscription(body.subscription, body.games.filter((g: unknown) => typeof g === "string"), session?.user.id ?? null);
  return Response.json({ ok: true });
}

/** Desliga o lembrete do aparelho: { endpoint } */
export async function DELETE(req: Request) {
  const endpoint = (await req.json().catch(() => null))?.endpoint;
  if (typeof endpoint !== "string") return Response.json({ error: "inválido" }, { status: 400 });
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return new Response(null, { status: 204 });
}
