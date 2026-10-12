import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";

// o segredo é lido quando o módulo carrega: define antes de importar
const SECRET = "segredo-de-teste";
process.env.GAME_SECRET = SECRET;
const { verifyTicket } = await import("../src/results");
const { signTicket } = await import("../../web/lib/game-ticket");

/** Ticket assinado à mão: `dados.assinatura` com os dados em base64url. */
function ticket(data: unknown, secret = SECRET): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${createHmac("sha256", secret).update(payload).digest("hex")}`;
}

const later = () => Date.now() + 60_000;

describe("ticket", () => {
  test("válido devolve a conta", () => {
    expect(verifyTicket(ticket({ u: "u1", n: "Ana", i: "https://img/a.png", h: "ana", e: later() }))).toEqual({
      userId: "u1",
      name: "Ana",
      image: "https://img/a.png",
      username: "ana",
    });
  });

  test("assinado pelo site é aceito pelo servidor", () => {
    const t = signTicket({ id: "u2", name: "Bia", image: null, username: "bia" });
    expect(t).not.toBeNull();
    expect(verifyTicket(t)).toEqual({ userId: "u2", name: "Bia", image: null, username: "bia" });
    expect(verifyTicket(signTicket({ id: "u3", name: "Caio" }))).toEqual({ userId: "u3", name: "Caio", image: null, username: null });
  });

  test("nome vazio vira Jogador; nome longo corta em 24", () => {
    expect(verifyTicket(ticket({ u: "u1", n: "", i: null, h: null, e: later() }))?.name).toBe("Jogador");
    expect(verifyTicket(ticket({ u: "u1", n: "A".repeat(40), i: null, h: null, e: later() }))?.name).toBe("A".repeat(24));
  });

  test("dados ou assinatura alterados são recusados", () => {
    const t = ticket({ u: "u1", n: "Ana", i: null, h: null, e: later() });
    const [payload, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "admin", n: "Ana", i: null, h: null, e: later() })).toString("base64url");
    expect(verifyTicket(`${forged}.${sig}`)).toBeNull();
    const flip = sig[0] === "a" ? "b" : "a";
    expect(verifyTicket(`${payload}.${flip}${sig.slice(1)}`)).toBeNull();
    expect(verifyTicket(`${payload}.${sig.toUpperCase()}`)).toBeNull();
    expect(verifyTicket(`${payload}.${sig.slice(1)}`)).toBeNull();
  });

  test("assinado com outro segredo é recusado", () => {
    expect(verifyTicket(ticket({ u: "u1", n: "Ana", i: null, h: null, e: later() }, "outro"))).toBeNull();
  });

  test("vencido é recusado", () => {
    expect(verifyTicket(ticket({ u: "u1", n: "Ana", i: null, h: null, e: Date.now() - 1 }))).toBeNull();
    expect(verifyTicket(ticket({ u: "u1", n: "Ana", i: null, h: null }))).toBeNull();
  });

  test("sem usuário ou com dados que não são da conta é recusado", () => {
    expect(verifyTicket(ticket({ n: "Ana", e: later() }))).toBeNull();
    expect(verifyTicket(ticket({ u: 42, n: "Ana", e: later() }))).toBeNull();
    expect(verifyTicket(ticket(null))).toBeNull();
    expect(verifyTicket(ticket("texto"))).toBeNull();
  });

  test("dados assinados que não são JSON são recusados", () => {
    const payload = Buffer.from("não é json").toString("base64url");
    expect(verifyTicket(`${payload}.${createHmac("sha256", SECRET).update(payload).digest("hex")}`)).toBeNull();
  });

  test("lixo e formatos errados são recusados", () => {
    for (const t of [undefined, null, 42, {}, ["a", "b"], "", "abc", ".", "abc.", ".abc", "a.b"]) expect(verifyTicket(t)).toBeNull();
  });

  // comportamento atual: só as duas primeiras partes contam (a assinatura continua valendo sobre os dados)
  test("partes extras depois da assinatura são ignoradas", () => {
    const t = ticket({ u: "u1", n: "Ana", i: null, h: null, e: later() });
    expect(verifyTicket(`${t}.qualquer.coisa`)?.userId).toBe("u1");
  });
});
