import { describe, expect, test } from "bun:test";
import { parseRequest } from "@/lib/quente-ou-frio/protocol";

describe("Quente ou Frio: pedido da API", () => {
  test("aceita chute, dica, desistir e fim, do dia ou livre", () => {
    expect(parseRequest({ game: { day: "2026-10-28" }, moves: [{ word: "casa" }, { word: "lar", hint: true }], action: "guess", word: "Casas" })).toEqual({
      game: { day: "2026-10-28" },
      moves: [
        { word: "casa", hint: false },
        { word: "lar", hint: true },
      ],
      gaveUp: false,
      action: "guess",
      word: "Casas",
    });
    expect(parseRequest({ game: { id: 7 }, moves: [], action: "hint" })?.game).toEqual({ id: 7 });
    expect(parseRequest({ game: { id: 7 }, moves: [], gaveUp: true, action: "end" })?.gaveUp).toBe(true);
  });

  test("recusa pedido malformado", () => {
    expect(parseRequest(null)).toBeNull();
    expect(parseRequest({ game: {}, moves: [], action: "hint" })).toBeNull();
    expect(parseRequest({ game: { id: -1 }, moves: [], action: "hint" })).toBeNull();
    expect(parseRequest({ game: { id: 1.5 }, moves: [], action: "hint" })).toBeNull();
    expect(parseRequest({ game: { id: 1 }, moves: "casa", action: "hint" })).toBeNull();
    expect(parseRequest({ game: { id: 1 }, moves: [{ word: 3 }], action: "hint" })).toBeNull();
    expect(parseRequest({ game: { id: 1 }, moves: Array(2001).fill({ word: "a" }), action: "hint" })).toBeNull();
    expect(parseRequest({ game: { id: 1 }, moves: [], action: "win" })).toBeNull();
    expect(parseRequest({ game: { id: 1 }, moves: [], action: "guess" })).toBeNull();
    expect(parseRequest({ game: { id: 1 }, moves: [], action: "guess", word: "x".repeat(41) })).toBeNull();
  });
});
