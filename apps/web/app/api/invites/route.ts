import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFriendStatus } from "@/lib/friends";
import { inviteCutoff, parseInvite, type GameInviteEntry } from "@/lib/invites-rules";
import { isOnlineGame } from "@/lib/stats/games";
import { normalizeUsername } from "@/lib/username";

const me = async () => (await auth.api.getSession({ headers: await headers() }))?.user.id ?? null;

/** Convites para jogar que eu recebi e ainda valem (o navegador confere a cada poucos segundos). */
export async function GET() {
  const id = await me();
  if (!id) return new Response(null, { status: 401 });
  const rows = await prisma.gameInvite.findMany({
    where: { toId: id, createdAt: { gte: inviteCutoff() } },
    include: { from: { select: { name: true, image: true, username: true, equippedFrame: true } } },
    orderBy: { createdAt: "desc" },
  });
  const invites: GameInviteEntry[] = rows.flatMap((r) => (isOnlineGame(r.game) ? [{ id: r.id, game: r.game, code: r.code, from: r.from }] : []));
  return Response.json({ invites }, { headers: { "cache-control": "no-store" } });
}

/** Chama um amigo para a minha sala: { username, game, code }. Só amigos aceitos. */
export async function POST(req: Request) {
  const id = await me();
  if (!id) return new Response(null, { status: 401 });
  const body = parseInvite(await req.json().catch(() => null));
  if (!body) return Response.json({ error: "inválido" }, { status: 400 });
  const them = await prisma.user.findUnique({ where: { username: normalizeUsername(body.username) }, select: { id: true } });
  if (!them || them.id === id || (await getFriendStatus(id, them.id)) !== "friends") return Response.json({ error: "not_friends" }, { status: 403 });

  const { game, code } = body;
  // convidar de novo renova o horário (volta a aparecer se o amigo já tinha dispensado)
  await prisma.gameInvite.upsert({
    where: { fromId_toId_code: { fromId: id, toId: them.id, code } },
    create: { fromId: id, toId: them.id, game, code },
    update: { game, createdAt: new Date() },
  });
  await prisma.gameInvite.deleteMany({ where: { createdAt: { lt: inviteCutoff() } } });
  return new Response(null, { status: 204 });
}

/** Entrei ou dispensei: ?id=<convite>. */
export async function DELETE(req: Request) {
  const id = await me();
  if (!id) return new Response(null, { status: 401 });
  const invite = new URL(req.url).searchParams.get("id");
  if (invite) await prisma.gameInvite.deleteMany({ where: { id: invite, toId: id } });
  return new Response(null, { status: 204 });
}
