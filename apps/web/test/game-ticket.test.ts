import { afterAll, beforeAll, describe, expect, setSystemTime, test } from "bun:test";
import { createHmac } from "node:crypto";

// o segredo é lido quando o módulo carrega: define antes de importar
const SECRET = "segredo-de-teste";
process.env.GAME_SECRET = SECRET;
const { isGameServer, signTicket } = await import("@/lib/game-ticket");

const NOW = new Date("2026-01-02T03:04:05Z");
const TTL = 12 * 60 * 60 * 1000;
const ANA = { id: "u1", name: "Ana Maria", image: "https://img/ana.png", username: "ana" };

const split = (t: string) => {
  const [payload, sig] = t.split(".");
  return { payload, sig, data: JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) };
};

beforeAll(() => setSystemTime(NOW));
afterAll(() => setSystemTime());

describe("ticket", () => {
  test("formato dados.assinatura, com a assinatura HMAC-SHA256 dos dados", () => {
    const t = signTicket(ANA)!;
    expect(t).toMatch(/^[A-Za-z0-9_-]+\.[0-9a-f]{64}$/);
    const { payload, sig } = split(t);
    expect(sig).toBe(createHmac("sha256", SECRET).update(payload).digest("hex"));
  });

  test("leva conta, nome, foto, username e vence em 12h", () => {
    expect(split(signTicket(ANA)!).data).toEqual({ u: "u1", n: "Ana Maria", i: "https://img/ana.png", h: "ana", e: NOW.getTime() + TTL });
  });

  test("sem foto ou username: null", () => {
    expect(split(signTicket({ id: "u2", name: "Beto" })!).data).toMatchObject({ i: null, h: null });
    expect(split(signTicket({ id: "u2", name: "Beto", image: null, username: null })!).data).toMatchObject({ i: null, h: null });
  });

  test("acentos e emoji no nome sobrevivem", () => {
    expect(split(signTicket({ ...ANA, name: "João 🃏" })!).data.n).toBe("João 🃏");
  });

  test("estável: mesma conta e mesmo instante, mesmo ticket", () => {
    expect(signTicket(ANA)).toBe(signTicket(ANA));
  });

  test("muda com a conta e com o tempo", () => {
    const t = signTicket(ANA);
    expect(signTicket({ ...ANA, name: "Ana" })).not.toBe(t);
    setSystemTime(new Date(NOW.getTime() + 1));
    expect(signTicket(ANA)).not.toBe(t);
    setSystemTime(NOW);
  });

  test("dados alterados não batem com a assinatura", () => {
    const { sig, data } = split(signTicket(ANA)!);
    const forged = Buffer.from(JSON.stringify({ ...data, u: "admin" })).toString("base64url");
    expect(createHmac("sha256", SECRET).update(forged).digest("hex")).not.toBe(sig);
  });

  test("assinado com outro segredo não bate", () => {
    const { payload, sig } = split(signTicket(ANA)!);
    expect(createHmac("sha256", "outro").update(payload).digest("hex")).not.toBe(sig);
  });

  // conferir alteração/validade é do servidor de jogos (apps/server/src/results.ts), não deste arquivo
});

describe("servidor de jogos", () => {
  test("Bearer com o segredo: aceito", () => {
    expect(isGameServer(req(`Bearer ${SECRET}`))).toBe(true);
  });

  test("sem cabeçalho, outro segredo ou outro formato: recusado", () => {
    expect(isGameServer(req())).toBe(false);
    expect(isGameServer(req("Bearer segredo-de-testE"))).toBe(false);
    expect(isGameServer(req("Bearer curto"))).toBe(false);
    expect(isGameServer(req(SECRET))).toBe(false);
    expect(isGameServer(req(`Basic ${SECRET}`))).toBe(false);
  });
});

describe("sem GAME_SECRET", () => {
  test("não assina e não reconhece ninguém", async () => {
    process.env.GAME_SECRET = "";
    // outro caminho de import = módulo novo, que lê o segredo vazio
    const path = "../lib/game-ticket.ts?sem-segredo";
    const fresh = (await import(path)) as typeof import("@/lib/game-ticket");
    process.env.GAME_SECRET = SECRET;
    expect(fresh.signTicket(ANA)).toBeNull();
    expect(fresh.isGameServer(req("Bearer "))).toBe(false);
    expect(fresh.isGameServer(new Request("http://x"))).toBe(false);
  });
});

function req(authorization?: string) {
  return new Request("http://x", { headers: authorization ? { authorization } : {} });
}
