import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyFriendAction } from "@/lib/friends";
import type { FriendAction } from "@/lib/friends-rules";
import { normalizeUsername } from "@/lib/username";

const ACTIONS: FriendAction[] = ["add", "accept", "remove"];

/** Convite de amizade: { username, action: add | accept | remove }. Responde o status novo. */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });
  const body = await req.json().catch(() => null);
  const action = body?.action as FriendAction;
  if (typeof body?.username !== "string" || !ACTIONS.includes(action)) return Response.json({ error: "inválido" }, { status: 400 });
  const them = await prisma.user.findUnique({ where: { username: normalizeUsername(body.username) }, select: { id: true } });
  if (!them) return Response.json({ error: "not_found" }, { status: 404 });
  if (them.id === session.user.id) return Response.json({ error: "self" }, { status: 400 });
  return Response.json({ status: await applyFriendAction(session.user.id, them.id, action) });
}
