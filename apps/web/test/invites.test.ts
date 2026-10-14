import { describe, expect, test } from "bun:test";
import { INVITE_TTL_MS, inviteCutoff, parseInvite } from "../lib/invites-rules";

describe("convite para jogar", () => {
  test("aceita jogo online e código de sala (minúsculo vira maiúsculo)", () => {
    expect(parseInvite({ username: "ana", game: "truco-paulista", code: "abcd" })).toEqual({ username: "ana", game: "truco-paulista", code: "ABCD" });
    expect(parseInvite({ username: "ana", game: "otrio", code: "WXYZ" })?.game).toBe("otrio");
  });

  test("recusa jogo solo, jogo que não existe e código fora do padrão das salas", () => {
    expect(parseInvite({ username: "ana", game: "sudoku", code: "ABCD" })).toBeNull();
    expect(parseInvite({ username: "ana", game: "xadrez", code: "ABCD" })).toBeNull();
    expect(parseInvite({ username: "ana", game: "stop", code: "ABC" })).toBeNull();
    expect(parseInvite({ username: "ana", game: "stop", code: "AB1D" })).toBeNull();
    // I e O não saem no gerador de código
    expect(parseInvite({ username: "ana", game: "stop", code: "ABIO" })).toBeNull();
  });

  test("recusa corpo sem usuário ou com tipos errados", () => {
    expect(parseInvite(null)).toBeNull();
    expect(parseInvite("ana")).toBeNull();
    expect(parseInvite({ username: "", game: "stop", code: "ABCD" })).toBeNull();
    expect(parseInvite({ username: 1, game: "stop", code: "ABCD" })).toBeNull();
  });

  test("vale por alguns minutos", () => {
    const now = new Date("2026-10-13T12:00:00Z");
    expect(now.getTime() - inviteCutoff(now).getTime()).toBe(INVITE_TTL_MS);
  });
});
