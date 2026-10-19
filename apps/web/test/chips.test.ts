import { describe, expect, test } from "bun:test";
import { achievementChips, currentLoginStreak, LOGIN_CHIPS, loginDay, TIER_CHIPS } from "@/lib/chips-rules";
import { ACHIEVEMENT_BY_CODE, ACHIEVEMENTS } from "@/lib/stats/achievements";

const chipsOf = (code: string) => achievementChips(ACHIEVEMENT_BY_CODE.get(code)!);

describe("conquistas", () => {
  test("valem pelo nível", () => {
    expect(chipsOf("xadrez:first")).toBe(TIER_CHIPS.easy);
    expect(chipsOf("xadrez:streak_5")).toBe(TIER_CHIPS.medium);
    expect(chipsOf("xadrez:wins_10")).toBe(TIER_CHIPS.medium);
    expect(chipsOf("xadrez:wins_100")).toBe(TIER_CHIPS.hard);
    expect(chipsOf("xadrez:master")).toBe(TIER_CHIPS.hard);
    expect(chipsOf("sudoku:daily_first")).toBe(TIER_CHIPS.easy);
    expect(chipsOf("sudoku:daily_30")).toBe(TIER_CHIPS.hard);
    expect(chipsOf("days_7")).toBe(TIER_CHIPS.medium);
    expect(chipsOf("days_30")).toBe(TIER_CHIPS.hard);
  });

  test("toda conquista paga", () => {
    for (const a of ACHIEVEMENTS) expect(achievementChips(a)).toBeGreaterThan(0);
  });
});

describe("login diário", () => {
  test("primeira vez: dia 1", () => {
    expect(loginDay(null, 0, "2026-10-19")).toBe(1);
  });

  test("já pegou hoje: nada", () => {
    expect(loginDay("2026-10-19", 3, "2026-10-19")).toBeNull();
  });

  test("entrou ontem: continua", () => {
    expect(loginDay("2026-10-18", 3, "2026-10-19")).toBe(4);
    expect(loginDay("2026-10-31", 1, "2026-11-01")).toBe(2);
  });

  test("depois do dia 7 recomeça", () => {
    expect(loginDay("2026-10-18", LOGIN_CHIPS.length, "2026-10-19")).toBe(1);
  });

  test("faltou um dia: volta ao 1", () => {
    expect(loginDay("2026-10-17", 5, "2026-10-19")).toBe(1);
  });

  test("sequência que aparece na tela", () => {
    expect(currentLoginStreak(null, 0, "2026-10-19")).toBe(0);
    expect(currentLoginStreak("2026-10-19", 4, "2026-10-19")).toBe(4);
    expect(currentLoginStreak("2026-10-18", 4, "2026-10-19")).toBe(4);
    expect(currentLoginStreak("2026-10-16", 4, "2026-10-19")).toBe(0);
  });
});
