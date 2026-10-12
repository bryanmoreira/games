/** Regras de amizade sem banco (testadas em test/friends.test.ts). O banco fica em lib/friends.ts. */

/** Como eu estou com o outro jogador. */
export type FriendStatus = "none" | "sent" | "received" | "friends";

export type FriendAction = "add" | "accept" | "remove";

export type FriendUser = { id: string; name: string; image: string | null; username: string | null };

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

type RowWithUsers = FriendRow & { addresseeId: string; requester: FriendUser; addressee: FriendUser };

/** Separa as linhas em amigos (por nome), convites recebidos e enviados. */
export function groupFriends(me: string, rows: RowWithUsers[]) {
  const friends: FriendUser[] = [];
  const received: FriendUser[] = [];
  const sent: FriendUser[] = [];
  for (const r of rows) {
    const other = r.requesterId === me ? r.addressee : r.requester;
    // sem @ não tem perfil para abrir nem como responder
    if (!other.username) continue;
    const status = friendStatus(me, r);
    if (status === "friends") friends.push(other);
    else if (status === "received") received.push(other);
    else sent.push(other);
  }
  friends.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return { friends, received, sent };
}
