/** Regras de amizade sem banco (testadas em test/friends.test.ts). O banco fica em lib/friends.ts. */

/** Como eu estou com o outro jogador. */
export type FriendStatus = "none" | "sent" | "received" | "friends";

export type FriendAction = "add" | "accept" | "remove";

export type FriendUser = { id: string; name: string; image: string | null; username: string | null; equippedFrame?: string | null };

/** Amigo na lista: `online` só vale para amizades aceitas. */
export type FriendEntry = FriendUser & { online: boolean };

/** O navegador avisa a cada minuto; um pouco de folga para aba em segundo plano e rede lenta. */
export const PRESENCE_EVERY_MS = 60_000;
export const ONLINE_MS = 150_000;

export function isOnline(lastSeenAt: Date | null, now: Date): boolean {
  return !!lastSeenAt && now.getTime() - lastSeenAt.getTime() <= ONLINE_MS;
}

/** A linha do par na tabela friendship (uma só por par, em qualquer direção). */
export type FriendRow = { requesterId: string; status: string };

/** O que fazer no banco: criar convite, aceitar o convite que existe, apagar a linha ou nada. */
export type FriendOp = "create" | "accept" | "delete" | null;

export function friendStatus(me: string, row: FriendRow | null): FriendStatus {
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  return row.requesterId === me ? "sent" : "received";
}

/** Convidar, aceitar ou desfazer (recusar, cancelar e remover amigo são o mesmo: apagar a linha). */
export function planFriendAction(me: string, them: string, row: FriendRow | null, action: FriendAction): { op: FriendOp; status: FriendStatus } {
  if (me === them) return { op: null, status: "none" };
  if (action === "remove") return { op: row ? "delete" : null, status: "none" };
  const current = friendStatus(me, row);
  // convidar quem já me convidou = aceitar
  if (current === "received") return { op: "accept", status: "friends" };
  if (current !== "none") return { op: null, status: current };
  // não há convite para aceitar
  if (action === "accept") return { op: null, status: "none" };
  return { op: "create", status: "sent" };
}

/** Perfil privado: só o dono e os amigos veem os números; os outros veem foto, nome e @. */
export function canSeeProfile(profilePublic: boolean, isMe: boolean, status: FriendStatus): boolean {
  return profilePublic || isMe || status === "friends";
}

type RowUser = FriendUser & { lastSeenAt?: Date | null };
type RowWithUsers = FriendRow & { addresseeId: string; requester: RowUser; addressee: RowUser };

/** Separa as linhas em amigos (online primeiro, depois por nome), convites recebidos e enviados. */
export function groupFriends(me: string, rows: RowWithUsers[], now = new Date()) {
  const friends: FriendEntry[] = [];
  const received: FriendEntry[] = [];
  const sent: FriendEntry[] = [];
  for (const r of rows) {
    const { lastSeenAt, ...other } = r.requesterId === me ? r.addressee : r.requester;
    // sem @ não tem perfil para abrir nem como responder
    if (!other.username) continue;
    const status = friendStatus(me, r);
    // quem não é amigo não vê se a pessoa está online
    if (status === "friends") friends.push({ ...other, online: isOnline(lastSeenAt ?? null, now) });
    else if (status === "received") received.push({ ...other, online: false });
    else sent.push({ ...other, online: false });
  }
  friends.sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name, "pt-BR"));
  return { friends, received, sent };
}
