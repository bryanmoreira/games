import { describe, expect, test } from "bun:test";
import { friendStatus, groupFriends, planFriendAction, type FriendRow, type FriendUser } from "../lib/friends-rules";

const ANA = "ana";
const BETO = "beto";

const pending = (from: string): FriendRow => ({ requesterId: from, status: "pending" });
const accepted = (from: string): FriendRow => ({ requesterId: from, status: "accepted" });

const user = (id: string, name: string, username: string | null = id): FriendUser => ({ id, name, image: null, username });

describe("status", () => {
  test("sem linha: nada", () => {
    expect(friendStatus(ANA, null)).toBe("none");
  });

  test("convite pendente: enviado para quem pediu, recebido para o outro", () => {
    expect(friendStatus(ANA, pending(ANA))).toBe("sent");
    expect(friendStatus(BETO, pending(ANA))).toBe("received");
  });

  test("aceito: amigos dos dois lados", () => {
    expect(friendStatus(ANA, accepted(ANA))).toBe("friends");
    expect(friendStatus(BETO, accepted(ANA))).toBe("friends");
  });
});

describe("convidar", () => {
  test("sem convite: cria", () => {
    expect(planFriendAction(ANA, BETO, null, "add")).toEqual({ op: "create", status: "sent" });
  });

  test("convidar de novo não duplica", () => {
    expect(planFriendAction(ANA, BETO, pending(ANA), "add")).toEqual({ op: null, status: "sent" });
  });

  test("convidar quem já me convidou vira amizade", () => {
    expect(planFriendAction(ANA, BETO, pending(BETO), "add")).toEqual({ op: "accept", status: "friends" });
  });

  test("convidar quem já é amigo não muda nada", () => {
    expect(planFriendAction(ANA, BETO, accepted(BETO), "add")).toEqual({ op: null, status: "friends" });
  });

  test("não dá para convidar a si mesmo", () => {
    expect(planFriendAction(ANA, ANA, null, "add")).toEqual({ op: null, status: "none" });
  });
});

describe("aceitar", () => {
  test("aceita o convite recebido", () => {
    expect(planFriendAction(BETO, ANA, pending(ANA), "accept")).toEqual({ op: "accept", status: "friends" });
  });

  test("não aceita o próprio convite", () => {
    expect(planFriendAction(ANA, BETO, pending(ANA), "accept")).toEqual({ op: null, status: "sent" });
  });

  test("sem convite não cria amizade", () => {
    expect(planFriendAction(ANA, BETO, null, "accept")).toEqual({ op: null, status: "none" });
  });
});

describe("desfazer", () => {
  test("recusar, cancelar e remover amigo apagam a linha", () => {
    expect(planFriendAction(BETO, ANA, pending(ANA), "remove")).toEqual({ op: "delete", status: "none" });
    expect(planFriendAction(ANA, BETO, pending(ANA), "remove")).toEqual({ op: "delete", status: "none" });
    expect(planFriendAction(ANA, BETO, accepted(BETO), "remove")).toEqual({ op: "delete", status: "none" });
  });

  test("sem linha: nada para apagar", () => {
    expect(planFriendAction(ANA, BETO, null, "remove")).toEqual({ op: null, status: "none" });
  });
});

describe("lista", () => {
  const me = user(ANA, "Ana");
  const row = (requester: FriendUser, addressee: FriendUser, status: string) => ({
    requesterId: requester.id,
    addresseeId: addressee.id,
    status,
    requester,
    addressee,
  });

  test("separa amigos, recebidos e enviados, com o outro jogador em cada", () => {
    const caio = user("caio", "Caio");
    const duda = user("duda", "Duda");
    const edu = user("edu", "Edu");
    const g = groupFriends(ANA, [row(me, caio, "accepted"), row(duda, me, "pending"), row(me, edu, "pending")]);
    expect(g.friends.map((u) => u.id)).toEqual(["caio"]);
    expect(g.received.map((u) => u.id)).toEqual(["duda"]);
    expect(g.sent.map((u) => u.id)).toEqual(["edu"]);
  });

  test("amigos em ordem de nome, com acento no lugar certo", () => {
    const g = groupFriends(ANA, [
      row(me, user("z", "Zeca"), "accepted"),
      row(user("e", "Érica"), me, "accepted"),
      row(me, user("b", "Bruno"), "accepted"),
    ]);
    expect(g.friends.map((u) => u.name)).toEqual(["Bruno", "Érica", "Zeca"]);
  });

  test("jogador sem @ fica de fora", () => {
    const g = groupFriends(ANA, [row(user("x", "Sem Nome", null), me, "pending")]);
    expect(g.received).toEqual([]);
  });
});
