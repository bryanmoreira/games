import { prisma } from "@/lib/db";
import { friendStatus, groupFriends, planFriendAction, type FriendAction, type FriendStatus } from "@/lib/friends-rules";

const USER = { select: { id: true, name: true, image: true, username: true, lastSeenAt: true, equippedFrame: true } } as const;

// a linha do par, em qualquer direção
const pair = (a: string, b: string) => ({
  OR: [
    { requesterId: a, addresseeId: b },
    { requesterId: b, addresseeId: a },
  ],
});

const findPair = (a: string, b: string) => prisma.friendship.findFirst({ where: pair(a, b) });

export async function getFriendStatus(me: string, them: string): Promise<FriendStatus> {
  return friendStatus(me, await findPair(me, them));
}

/** Aplica no banco o que planFriendAction decidir. Responde o status novo. */
export async function applyFriendAction(me: string, them: string, action: FriendAction): Promise<FriendStatus> {
  const row = await findPair(me, them);
  const { op, status } = planFriendAction(me, them, row, action);
  if (op === "delete") await prisma.friendship.deleteMany({ where: pair(me, them) });
  if (op === "accept") await prisma.friendship.update({ where: { id: row!.id }, data: { status: "accepted", acceptedAt: new Date() } });
  if (op === "create") {
    // dois convites ao mesmo tempo: a unique segura e vale o que ficou no banco
    const ok = await prisma.friendship.create({ data: { requesterId: me, addresseeId: them, status: "pending" } }).catch(() => null);
    if (!ok) return getFriendStatus(me, them);
  }
  return status;
}

export async function countFriendRequests(me: string): Promise<number> {
  return prisma.friendship.count({ where: { addresseeId: me, status: "pending" } });
}

/** Amigos, convites recebidos e enviados. */
export async function listFriends(me: string) {
  const rows = await prisma.friendship.findMany({
    where: { OR: [{ requesterId: me }, { addresseeId: me }] },
    include: { requester: USER, addressee: USER },
    orderBy: { createdAt: "desc" },
  });
  return groupFriends(me, rows);
}
