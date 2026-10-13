import { describe, expect, test } from "bun:test";
import { dealGame, newGame as newSpider } from "@truco/spider";
import { gameFrom, newGame as newSudoku } from "@truco/sudoku";
import {
  DAILY_START,
  isDailyGame,
  isDayKey,
  isOpenDay,
  makeChallenge,
  matchesChallenge,
  missingDays,
  msToNextDay,
  type DailyChallenge,
  type SpiderDaily,
  type SudokuDaily,
} from "@/lib/daily/challenge";

describe("dias", () => {
  test.each(["2026-10-12", "2028-02-29", "2026-12-31"])("%s é dia", (d) => expect(isDayKey(d)).toBe(true));
  test.each(["2026-02-29", "2026-13-01", "2026-10-32", "2026-1-01", "20261012", "", null, 20261012, "2026-10-12T00:00"])("%p não é dia", (d) =>
    expect(isDayKey(d)).toBe(false),
  );

  test("tem desafio do primeiro dia até hoje, nem antes nem no futuro", () => {
    const today = "2026-11-05";
    expect(isOpenDay(DAILY_START, today)).toBe(true);
    expect(isOpenDay(today, today)).toBe(true);
    expect(isOpenDay("2026-10-31", today)).toBe(true);
    expect(isOpenDay("2026-11-06", today)).toBe(false);
    expect(isOpenDay("2026-10-11", today)).toBe(false);
    expect(isOpenDay("2026-02-30", today)).toBe(false);
  });

  test("jogos com desafio", () => {
    expect(isDailyGame("sudoku")).toBe(true);
    expect(isDailyGame("paciencia-spider")).toBe(true);
    expect(isDailyGame("connect4")).toBe(false);
  });

  test.each([
    ["2026-10-12T00:00:00-03:00", 24 * 3600_000],
    ["2026-10-12T23:59:59-03:00", 1000],
    ["2026-10-12T21:00:00-03:00", 3 * 3600_000],
    ["2026-10-13T02:30:00Z", 30 * 60_000],
  ])("próximo desafio a partir de %s", (iso, ms) => {
    expect(msToNextDay(new Date(iso).getTime())).toBe(ms);
  });
});

describe("partida do desafio", () => {
  test("Sudoku: sempre expert, e o puzzle guardado monta a mesma partida que o seed", () => {
    const data = makeChallenge("sudoku", 1234) as SudokuDaily;
    expect(data.difficulty).toBe("expert");
    expect(data.seed).toBe(1234);
    const g = gameFrom(data.difficulty, data.seed, data);
    const same = newSudoku("expert", 1234);
    expect(g.puzzle).toEqual(same.puzzle);
    expect(g.solution).toEqual(same.solution);
    expect(g.values).toEqual(data.puzzle);
    // começar de novo não mexe no puzzle guardado
    g.values[g.puzzle.indexOf(0)] = 5;
    expect(data.puzzle).toEqual(same.puzzle);
  });

  test("Spider: sempre 4 naipes, baralho completo, e o baralho guardado monta a mesma partida que o seed", () => {
    const data = makeChallenge("paciencia-spider", 99) as SpiderDaily;
    expect(data.suits).toBe(4);
    expect([...data.deck].sort((a, b) => a - b)).toEqual(Array.from({ length: 104 }, (_, i) => i));
    const g = dealGame(data.suits, data.seed, data.deck);
    const same = newSpider(4, 99);
    expect(g.cols).toEqual(same.cols);
    expect(g.stock).toEqual(same.stock);
    expect(g.hidden).toEqual(same.hidden);
  });

  test("seeds diferentes, partidas diferentes", () => {
    expect((makeChallenge("paciencia-spider", 1) as SpiderDaily).deck).not.toEqual((makeChallenge("paciencia-spider", 2) as SpiderDaily).deck);
  });
});

describe("vitória do desafio", () => {
  const sudoku: DailyChallenge = { game: "sudoku", day: "2026-10-12", data: { difficulty: "expert", seed: 7, puzzle: [], solution: [] } };
  const spider: DailyChallenge = { game: "paciencia-spider", day: "2026-10-12", data: { suits: 4, seed: 7, deck: [] } };

  test("vale com o mesmo seed e o mesmo nível", () => {
    expect(matchesChallenge(sudoku, { difficulty: "expert" }, 7)).toBe(true);
    expect(matchesChallenge(spider, { suits: 4 }, 7)).toBe(true);
  });

  test("outro seed, outro nível ou seed em texto: não vale", () => {
    expect(matchesChallenge(sudoku, { difficulty: "expert" }, 8)).toBe(false);
    expect(matchesChallenge(sudoku, { difficulty: "easy" }, 7)).toBe(false);
    expect(matchesChallenge(sudoku, { difficulty: "expert" }, "7")).toBe(false);
    expect(matchesChallenge(spider, { suits: 1 }, 7)).toBe(false);
    expect(matchesChallenge(spider, { suits: 4 }, undefined)).toBe(false);
  });
});

describe("dias sem desafio", () => {
  test("do primeiro dia até hoje, do mais novo ao mais antigo", () => {
    expect(missingDays([], "2026-10-14")).toEqual(["2026-10-14", "2026-10-13", "2026-10-12"]);
    expect(missingDays(["2026-10-12", "2026-10-14"], "2026-10-14")).toEqual(["2026-10-13"]);
    expect(missingDays(["2026-10-12", "2026-10-13"], "2026-10-13")).toEqual([]);
  });

  test("atravessa mês e respeita o limite (fica com os mais novos)", () => {
    const got = missingDays([], "2026-11-02", 5);
    expect(got).toEqual(["2026-11-02", "2026-11-01", "2026-10-31", "2026-10-30", "2026-10-29"]);
    expect(missingDays([], "2026-11-02")).toHaveLength(22);
  });

  test("antes do primeiro dia: nada", () => {
    expect(missingDays([], "2026-10-11")).toEqual([]);
  });
});
