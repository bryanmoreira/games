import { describe, expect, test } from "bun:test";
import type { GameAdapter } from "../src/games";
import { GAMES } from "../src/games";
import { canStartSeats, matchPlayers, matchReport, newMatch, occupiedSeats, type SeatSlot } from "../src/match";

const human = (token: string): SeatSlot => ({ kind: "human", token });
const bot: SeatSlot = { kind: "bot" };
const empty: SeatSlot = { kind: "empty" };

/** Contas do site por token: só "ana" e "bia" estão logadas. */
const userIdOf = (token: string) => ({ ana: "u-ana", bia: "u-bia" })[token] ?? null;

/** Jogo de mentira: o resultado diz o lugar, para saber quem chamou `outcome`. */
const fake = { outcome: (state: unknown, seat: number) => ({ outcome: "win", data: { state, seat } }) } as unknown as GameAdapter;

describe("começo da partida", () => {
  test("anota humanos com lugar e conta; IA e lugar vazio ficam de fora", () => {
    expect(matchPlayers([human("ana"), bot, human("caio"), empty], userIdOf)).toEqual([
      { seat: 0, token: "ana", userId: "u-ana" },
      { seat: 2, token: "caio", userId: null },
    ]);
  });

  test("humano sem token não entra", () => {
    expect(matchPlayers([{ kind: "human" }, human("bia")], userIdOf)).toEqual([{ seat: 1, token: "bia", userId: "u-bia" }]);
  });

  test("dois ou mais humanos é online, mesmo sem conta", () => {
    expect(newMatch([human("caio"), human("dani")], userIdOf).mode).toBe("online");
    expect(newMatch([human("ana"), bot, human("bia"), bot], userIdOf).mode).toBe("online");
  });

  test("um humano só contra IA é ai", () => {
    expect(newMatch([human("ana"), bot, bot, bot], userIdOf).mode).toBe("ai");
    expect(newMatch([bot, empty, human("caio")], userIdOf).mode).toBe("ai");
  });

  test("id novo a cada partida, ou o que foi passado", () => {
    const a = newMatch([human("ana")], userIdOf);
    const b = newMatch([human("ana")], userIdOf);
    expect(a.id).not.toBe(b.id);
    expect(newMatch([human("ana")], userIdOf, "m1").id).toBe("m1");
  });
});

describe("fim da partida", () => {
  const start = [human("ana"), human("bia"), human("caio"), bot];
  const match = newMatch(start, userIdOf, "m1");

  test("só logados recebem resultado, com o outcome do jogo", () => {
    expect(matchReport("truco-paulista", fake, "S", match, start)).toEqual({
      game: "truco-paulista",
      mode: "online",
      matchId: "m1",
      players: [
        { userId: "u-ana", outcome: "win", data: { state: "S", seat: 0 } },
        { userId: "u-bia", outcome: "win", data: { state: "S", seat: 1 } },
      ],
    });
  });

  test("quem saiu no meio leva derrota por abandono", () => {
    // bia saiu: uma IA assumiu o lugar
    const end = [human("ana"), bot, human("caio"), bot];
    expect(matchReport("truco-paulista", fake, "S", match, end).players).toEqual([
      { userId: "u-ana", outcome: "win", data: { state: "S", seat: 0 } },
      { userId: "u-bia", outcome: "loss", data: { abandoned: true } },
    ]);
  });

  test("lugar vazio (jogo sem IA) ou com outra pessoa também é abandono", () => {
    const end = [{ kind: "empty", name: "Ana" } as SeatSlot, human("dani"), human("caio"), bot];
    expect(matchReport("stop", fake, "S", match, end).players).toEqual([
      { userId: "u-ana", outcome: "loss", data: { abandoned: true } },
      { userId: "u-bia", outcome: "loss", data: { abandoned: true } },
    ]);
  });

  test("contra IA, o modo vai no relatório", () => {
    const solo = [human("ana"), bot];
    const r = matchReport("connect4", fake, "S", newMatch(solo, userIdOf, "m2"), solo);
    expect(r).toMatchObject({ game: "connect4", mode: "ai", matchId: "m2" });
    expect(r.players).toHaveLength(1);
  });

  test("ninguém logado: relatório sem jogadores", () => {
    const anon = [human("caio"), human("dani")];
    expect(matchReport("connect4", fake, "S", newMatch(anon, userIdOf), anon).players).toEqual([]);
  });

  test("com o adapter de verdade", () => {
    const seats = [human("ana"), human("bia")];
    const s = { ...GAMES.connect4.newGame(null, { seats: [0, 1], settings: null }), phase: "gameOver", winner: 1 };
    expect(matchReport("connect4", GAMES.connect4, s, newMatch(seats, userIdOf), seats).players).toEqual([
      { userId: "u-ana", outcome: "loss", data: { pieces: 0, moves: 0 } },
      { userId: "u-bia", outcome: "win", data: { pieces: 0, moves: 0 } },
    ]);
  });
});

describe("começar a mesa", () => {
  const seats = (n: number, filled: number[]) => Array.from({ length: n }, (_, i) => (filled.includes(i) ? (i % 2 ? bot : human(`p${i}`)) : empty));

  test("lugares ocupados contam humanos e IA", () => {
    expect(occupiedSeats([human("ana"), empty, bot, empty])).toEqual([0, 2]);
  });

  test("sem mínimo, precisa da mesa cheia", () => {
    expect(canStartSeats(GAMES["truco-paulista"], seats(4, [0, 1, 2, 3]))).toBe(true);
    expect(canStartSeats(GAMES["truco-paulista"], seats(4, [0, 1, 2]))).toBe(false);
    expect(canStartSeats(GAMES.connect4, seats(2, [0]))).toBe(false);
  });

  test("com mínimo, basta o mínimo", () => {
    expect(canStartSeats(GAMES.stop, seats(8, [0, 5]))).toBe(true);
    expect(canStartSeats(GAMES.stop, seats(8, [3]))).toBe(false);
  });

  test("além do mínimo, a formação precisa valer", () => {
    expect(canStartSeats(GAMES.codenames, seats(12, [0, 1, 6, 7]))).toBe(true);
    expect(canStartSeats(GAMES.codenames, seats(12, [1, 2, 7, 8]))).toBe(false); // sem mestres
    expect(canStartSeats(GAMES.codenames, seats(12, [0, 6, 7]))).toBe(false); // abaixo do mínimo
  });
});
