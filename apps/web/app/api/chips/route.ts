import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { chipsState, claimChips } from "@/lib/chips";

async function userId() {
  return (await auth.api.getSession({ headers: await headers() }))?.user.id ?? null;
}

/** Saldo, sequência de login e últimas fichas. */
export async function GET() {
  const id = await userId();
  if (!id) return new Response(null, { status: 401 });
  return Response.json(await chipsState(id), { headers: { "cache-control": "no-store" } });
}

/** Ao abrir o site: paga o login do dia, as boas-vindas e conquistas sem fichas; devolve o que entrou agora. */
export async function POST() {
  const id = await userId();
  if (!id) return new Response(null, { status: 401 });
  const gained = await claimChips(id);
  return Response.json({ gained, state: await chipsState(id) });
}
