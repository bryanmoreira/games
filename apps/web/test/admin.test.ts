import { describe, expect, test } from "bun:test";
import { deviceLabel, fillDays, lastDays, pct, summarizeDailies, summarizeGames } from "@/lib/admin-rules";

describe("lastDays / fillDays", () => {
  test("dias até hoje, do mais antigo ao mais novo, virando o mês", () => {
    expect(lastDays("2026-11-02", 4)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(lastDays("2026-11-02", 1)).toEqual(["2026-11-02"]);
  });

  test("dia sem linha vira 0 e linha fora da janela é ignorada", () => {
    const days = ["2026-10-14", "2026-10-15", "2026-10-16"];
    expect(fillDays([{ day: "2026-10-16", n: 3 }, { day: "2026-10-01", n: 9 }], days)).toEqual([0, 0, 3]);
  });
});

test("pct", () => {
  expect(pct(1, 3)).toBe(33);
  expect(pct(2, 3)).toBe(67);
  expect(pct(0, 0)).toBeNull();
});

describe("summarizeGames", () => {
  test("soma os modos, junta jogadores e resultado da casa, mais jogados primeiro", () => {
    const out = summarizeGames(
      [
        { game: "xadrez", mode: "online", n: 2 },
        { game: "xadrez", mode: "ai", n: 3 },
        { game: "sudoku", mode: "solo", n: 7 },
        { game: "jogo-que-nao-existe", mode: "online", n: 50 },
      ],
      [
        { game: "xadrez", outcome: "win", n: 1 },
        { game: "xadrez", outcome: "loss", n: 2 },
      ],
      [{ game: "xadrez", n: 4 }],
    );
    expect(out.map((s) => s.game)).toEqual(["sudoku", "xadrez"]);
    expect(out[1]).toEqual({ game: "xadrez", matches: 5, byMode: { solo: 0, ai: 3, online: 2 }, players: 4, house: { win: 1, loss: 2, draw: 0 } });
  });
});

describe("summarizeDailies", () => {
  test("agrupa por dia e jogo; Verbete conta jogadores distintos entre os modos", () => {
    const out = summarizeDailies(
      [
        { game: "verbete", daily: "2026-10-16:1", userId: "a", outcome: "win", timeMs: null },
        { game: "verbete", daily: "2026-10-16:2", userId: "a", outcome: "loss", timeMs: null },
        { game: "verbete", daily: "2026-10-16:1", userId: "b", outcome: "win", timeMs: null },
        { game: "sudoku", daily: "2026-10-15", userId: "a", outcome: "win", timeMs: 60_000 },
        { game: "sudoku", daily: "2026-10-15", userId: "b", outcome: "win", timeMs: 120_000 },
      ],
      ["2026-10-15", "2026-10-16"],
    );
    expect(out.map((r) => r.day)).toEqual(["2026-10-16", "2026-10-15"]);
    expect(out[0].games.verbete).toEqual({ players: 2, plays: 3, wins: 2, avgMs: null });
    expect(out[0].games.sudoku).toEqual({ players: 0, plays: 0, wins: 0, avgMs: null });
    expect(out[1].games.sudoku).toEqual({ players: 2, plays: 2, wins: 2, avgMs: 90_000 });
  });
});

test.each([
  ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36", "Chrome · Windows"],
  ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36 Edg/141.0", "Edge · Windows"],
  ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", "Safari · iOS"],
  ["Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36", "Chrome · Android"],
  ["Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:131.0) Gecko/20100101 Firefox/131.0", "Firefox · macOS"],
  ["curl/8.0", "Outro"],
  [null, "—"],
])("deviceLabel(%p) → %s", (ua, label) => {
  expect(deviceLabel(ua)).toBe(label);
});
