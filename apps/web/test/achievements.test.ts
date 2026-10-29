import { afterEach, describe, expect, test, setSystemTime } from "bun:test";
import {
  ACHIEVEMENT_BY_CODE,
  ACHIEVEMENTS,
  bestStreak,
  currentStreak,
  dailyStreaks,
  dayKey,
  dayStreaks,
  newAchievements,
  nextDay,
  prevDay,
  type ResultRow,
} from "@/lib/stats/achievements";
import { isSoloGame, STAT_GAMES } from "@/lib/stats/games";

type Data = Record<string, unknown>;

const row = (outcome: string, data: Data = {}, mode = "online"): ResultRow => ({ mode, outcome, placement: null, data, createdAt: new Date(0) });
const win = (data: Data = {}, mode?: string) => row("win", data, mode);
const loss = (data: Data = {}, mode?: string) => row("loss", data, mode);
const draw = (data: Data = {}) => row("draw", data);
const times = (n: number, make: () => ResultRow) => Array.from({ length: n }, make);
const ctx = (results: ResultRow[], bestDays = 0) => ({ results, bestDays });
/** Desafio do dia `day` terminado em `at` (padrão: no próprio dia, meio-dia de Brasília). */
const dailyRow = (day: string, at = day, outcome = "win"): ResultRow => ({ ...row(outcome, {}, "solo"), daily: day, createdAt: new Date(`${at}T12:00:00-03:00`) });
/** Palavra do dia do Verbete: a chave guarda o modo (`AAAA-MM-DD:2`). */
const verbeteDay = (day: string, mode: number, at = day, outcome = "win"): ResultRow => ({
  ...row(outcome, { mode, attempts: 3 }, "solo"),
  daily: `${day}:${mode}`,
  createdAt: new Date(`${at}T12:00:00-03:00`),
});
/** `n` dias seguidos a partir de 01/08/2026. */
const run = (n: number, from = 1) => Array.from({ length: n }, (_, i) => `2026-08-${String(i + from).padStart(2, "0")}`);
const dailyCases = (): Record<string, Case> => ({
  daily_first: { ok: [win({}, "solo"), dailyRow("2026-10-12")], almost: [win({}, "solo"), dailyRow("2026-10-12", "2026-10-12", "loss")] },
  daily_week: {
    ok: run(7).map((d) => dailyRow(d)),
    // 6 no dia + o 7º rejogado no dia seguinte; e 3 + buraco + 4
    almost: [...run(6).map((d) => dailyRow(d)), dailyRow("2026-08-07", "2026-08-08"), ...run(3, 10).map((d) => dailyRow(d)), ...run(4, 14).map((d) => dailyRow(d))],
  },
  daily_30: {
    ok: run(30).map((d) => dailyRow(d, "2026-10-01")),
    almost: [...run(29).map((d) => dailyRow(d)), ...times(10, () => win({}, "solo")), dailyRow("2026-08-30", "2026-08-30", "loss")],
  },
});
const withGame = (game: string, cases: Record<string, Case>) => Object.fromEntries(Object.entries(cases).map(([k, v]) => [`${game}:${k}`, v]));

/** Para cada conquista: o mínimo que destrava e o "quase" que ainda não destrava. */
interface Case {
  ok: ResultRow[];
  almost: ResultRow[];
  okDays?: number;
  almostDays?: number;
}

const firstCase: Case = { ok: [loss(), win()], almost: [loss(), draw(), loss()] };
const streakCase: Case = {
  ok: [loss(), ...times(5, win)],
  almost: [...times(4, win), loss(), ...times(4, win), draw(), ...times(4, win)],
};
const winsCase = (n: number): Case => ({
  ok: [...times(n, win), ...times(5, loss)],
  almost: [...times(n - 1, win), ...times(n, loss), ...times(n, draw)],
});

const CASES: Record<string, Case> = {
  days_7: { ok: [], almost: [], okDays: 7, almostDays: 6 },
  days_30: { ok: [], almost: [], okDays: 30, almostDays: 29 },

  "truco-paulista:first": firstCase,
  "truco-paulista:shutout": {
    ok: [win({ scores: [12, 0] })],
    almost: [win({ scores: [12, 1] }), win({}), loss({ scores: [0, 12] })],
  },
  "truco-paulista:streak_5": streakCase,
  "truco-paulista:wins_10": winsCase(10),
  "truco-paulista:wins_50": winsCase(50),
  "truco-paulista:wins_100": winsCase(100),

  "connect4:first": firstCase,
  "connect4:quick": { ok: [win({ pieces: 4 })], almost: [win({ pieces: 5 }), loss({ pieces: 4 }), win({})] },
  "connect4:ai_10": {
    ok: times(10, () => win({}, "ai")),
    almost: [...times(9, () => win({}, "ai")), ...times(5, () => win({}, "online")), ...times(5, () => loss({}, "ai"))],
  },
  "connect4:streak_5": streakCase,

  "ludo:first": firstCase,
  "ludo:hunter": { ok: [loss({ captures: 5 })], almost: [win({ captures: 4 }), loss({ abandoned: true }), win({})] },
  "ludo:untouched": { ok: [win({ lost: 0 })], almost: [win({ lost: 1 }), loss({ lost: 0 }), win({})] },
  "ludo:comeback": { ok: [win({ comeback: true })], almost: [win({ comeback: false }), loss({ comeback: true }), win({})] },
  "ludo:full_table": { ok: [win({ players: 4 })], almost: [win({ players: 3 }), loss({ players: 4 }), win({})] },
  "ludo:streak_5": streakCase,
  "domino:first": firstCase,
  "domino:pneu": { ok: [win({ scores: [6, 0] })], almost: [win({ scores: [6, 1] }), loss({ scores: [0, 6] }), win({})] },
  "domino:comeback": { ok: [win({ deficit: 4 })], almost: [win({ deficit: 3 }), loss({ deficit: 5 }), win({})] },
  "domino:cruzada": {
    ok: [loss({ wins: { simples: 0, carroca: 0, laelo: 0, cruzada: 1 } })],
    almost: [win({ wins: { simples: 2, carroca: 1, laelo: 1, cruzada: 0 } }), loss({ abandoned: true }), win({})],
  },
  "domino:laelo": {
    ok: [loss({ wins: { simples: 0, carroca: 0, laelo: 1, cruzada: 0 } })],
    almost: [win({ wins: { simples: 2, carroca: 1, laelo: 0, cruzada: 1 } }), loss({ abandoned: true }), win({})],
  },
  "domino:both_modes": {
    ok: [win({ mode: "1x1" }), win({ mode: "duplas" })],
    almost: [win({ mode: "1x1" }), win({ mode: "1x1" }), loss({ mode: "duplas" })],
  },
  "domino:streak_5": streakCase,
  "domino:wins_10": winsCase(10),
  "domino:wins_50": winsCase(50),
  "domino:wins_100": winsCase(100),
  "blackjack:first": firstCase,
  "blackjack:natural": { ok: [loss({ blackjacks: 1 })], almost: [win({ blackjacks: 0 }), loss({ abandoned: true }), win({})] },
  "blackjack:doubles": { ok: [loss({ doublesWon: 5 })], almost: [win({ doublesWon: 4 }), loss({ abandoned: true }), win({})] },
  "blackjack:split_sweep": { ok: [loss({ splitSweeps: 1 })], almost: [win({ splitSweeps: 0, splits: 3 }), loss({ abandoned: true })] },
  "blackjack:streak_5": streakCase,
  "blackjack:break_bank": { ok: [win({ final: 2000 })], almost: [win({ final: 1995 }), loss({ abandoned: true }), win({})] },
  "blackjack:comeback": { ok: [win({ low: 200, final: 1010 })], almost: [win({ low: 205 }), loss({ low: 0 }), draw({ low: 100 }), win({})] },
  "buraco:first": firstCase,
  "buraco:lixeiro": { ok: [loss({ maxPile: 10 })], almost: [win({ maxPile: 9 }), loss({ abandoned: true }), win({})] },
  "buraco:limpinha": {
    ok: [win({ limpa: 1, suja: 0, real: 0 }), win({ limpa: 0, suja: 0, real: 1 })],
    almost: [win({ limpa: 2, suja: 1, real: 0 }), win({ limpa: 0, suja: 0, real: 0 }), loss({ limpa: 2, suja: 0, real: 0 }), win({})],
  },
  "buraco:streak_5": streakCase,
  "buraco:real": { ok: [loss({ real: 1 })], almost: [win({ real: 0 }), loss({ abandoned: true }), win({})] },
  "buraco:comeback": { ok: [win({ deficit: 1000 })], almost: [win({ deficit: 999 }), loss({ deficit: 1500 }), win({})] },
  "futebol-de-botao:first": firstCase,
  "futebol-de-botao:hat_trick": { ok: [win({ goals: 3 })], almost: [win({ goals: 2 }), loss({ goals: 3 }), win({})] },
  "futebol-de-botao:wall": { ok: [win({ ga: 0 })], almost: [win({ ga: 1 }), loss({ ga: 0 }), win({})] },
  "futebol-de-botao:lightning": { ok: [win({ ms: 59_000 })], almost: [win({ ms: 60_000 }), loss({ ms: 30_000 }), win({})] },
  "futebol-de-botao:comeback": { ok: [win({ deficit: 2 })], almost: [win({ deficit: 1 }), loss({ deficit: 3 }), win({})] },
  "futebol-de-botao:golden": { ok: [win({ golden: true })], almost: [win({ golden: false }), loss({ golden: true }), win({})] },
  "futebol-de-botao:scorer": {
    ok: [...times(16, () => loss({ goals: 3 })), win({ goals: 2 })],
    almost: [...times(16, () => win({ goals: 3 })), loss({ goals: 1 }), loss({ abandoned: true })],
  },

  "tijolada:first": { ok: [loss({}, "solo"), win({ ms: 60_000 })], almost: [...times(5, () => loss({ lines: 200 }, "solo")), loss(), draw()] },
  "tijolada:tetra": { ok: [loss({ tetras: 1 }, "solo")], almost: [loss({ tetras: 0 }, "solo"), win({ tetras: 0 }), loss({ abandoned: true })] },
  "tijolada:lines_100": { ok: [loss({ lines: 100 }, "solo")], almost: [loss({ lines: 99 }, "solo"), win({ lines: 150 }), loss({ abandoned: true })] },
  "tijolada:level_15": { ok: [loss({ level: 15 }, "solo")], almost: [loss({ level: 14 }, "solo"), win({ level: 18 })] },
  "tijolada:score_100k": { ok: [loss({ score: 100_000 }, "solo")], almost: [loss({ score: 99_999 }, "solo"), win({ score: 200_000 })] },
  "tijolada:streak_5": {
    ok: [win(), win(), loss({}, "solo"), win(), win(), win()],
    almost: [...times(4, win), loss(), ...times(4, win), draw(), ...times(4, win)],
  },
  "tijolada:lines_1000": {
    ok: [...times(9, () => loss({ lines: 100 }, "solo")), win({ lines: 100 })],
    almost: [...times(9, () => loss({ lines: 100 }, "solo")), win({ lines: 99 }), loss({ abandoned: true })],
  },

  "otrio:first": firstCase,
  "otrio:quick": { ok: [win({ colorPieces: 3 })], almost: [win({ colorPieces: 4 }), loss({ pieces: 3 }), win({ pieces: 3 }), win({})] },
  "otrio:stack": { ok: [win({ how: "stack" })], almost: [win({ how: "line" }), win({ how: "stair" }), loss({ how: "stack" }), win({})] },
  "otrio:stair": { ok: [win({ how: "stair" })], almost: [win({ how: "line" }), win({ how: "stack" }), loss({ how: "stair" }), win({})] },
  "otrio:all_kinds": {
    ok: [win({ how: "line" }), loss(), win({ how: "stair" }), win({ how: "stack" })],
    almost: [win({ how: "line" }), win({ how: "stair" }), win({ how: "line" }), loss({ how: "stack" })],
  },
  "otrio:full_table": { ok: [win({ players: 4 })], almost: [win({ players: 3 }), win({ players: 2 }), loss({ players: 4 }), win({})] },
  "otrio:streak_5": streakCase,

  "jogo-da-velha:first": firstCase,
  "jogo-da-velha:fork": { ok: [win({ fork: true })], almost: [win({ fork: false }), loss({ fork: true }), win({})] },
  "jogo-da-velha:second": {
    ok: [win({ starter: false, level: "medium" }, "ai")],
    almost: [
      win({ starter: false, level: "easy" }, "ai"),
      win({ starter: true, level: "hard" }, "ai"),
      win({ starter: false, level: "medium" }, "online"),
      loss({ starter: false, level: "hard" }, "ai"),
      win({}, "ai"),
    ],
  },
  "jogo-da-velha:wall": {
    ok: times(5, () => row("draw", { level: "hard" }, "ai")),
    almost: [...times(4, () => row("draw", { level: "hard" }, "ai")), row("draw", { level: "medium" }, "ai"), row("draw", { level: "hard" }, "online"), loss({ level: "hard" }, "ai")],
  },
  "jogo-da-velha:draws_10": { ok: times(10, draw), almost: [...times(9, draw), ...times(5, win), ...times(5, loss)] },
  "jogo-da-velha:streak_5": streakCase,

  "xadrez:first": firstCase,
  "xadrez:blitz": { ok: [win({ end: "mate", moves: 20 })], almost: [win({ end: "mate", moves: 21 }), win({ end: "resign", moves: 10 }), loss({ end: "mate", moves: 5 }), win({})] },
  "xadrez:promotion": { ok: [win({ promotions: 1 })], almost: [win({ promotions: 0 }), loss({ promotions: 2 }), draw({ promotions: 1 }), win({})] },
  "xadrez:comeback": { ok: [win({ behind: 5 })], almost: [win({ behind: 4 }), loss({ behind: 9 }), draw({ behind: 6 })] },
  "xadrez:untouched": { ok: [win({ lostQueen: false })], almost: [win({ lostQueen: true }), loss({ lostQueen: false }), win({ abandoned: true })] },
  "xadrez:master": {
    ok: [win({ level: "hard" }, "ai")],
    almost: [win({ level: "medium" }, "ai"), win({ level: "hard" }, "online"), loss({ level: "hard" }, "ai")],
  },
  "xadrez:streak_5": streakCase,
  "xadrez:wins_10": winsCase(10),
  "xadrez:wins_50": winsCase(50),
  "xadrez:wins_100": winsCase(100),

  "damas:first": firstCase,
  "damas:chain": { ok: [loss({ bestChain: 3 })], almost: [win({ bestChain: 2 }), loss({ abandoned: true })] },
  "damas:untouched": { ok: [win({ lost: 0 })], almost: [win({ lost: 1 }), loss({ lost: 0 }), draw({ lost: 0 }), win({})] },
  "damas:kings": { ok: [draw({ kings: 3 })], almost: [win({ kings: 2 }), loss({ abandoned: true })] },
  "damas:comeback": { ok: [win({ behind: 3 })], almost: [win({ behind: 2 }), loss({ behind: 5 }), draw({ behind: 4 })] },
  "damas:master": {
    ok: [win({ level: "hard" }, "ai")],
    almost: [win({ level: "medium" }, "ai"), win({ level: "hard" }, "online"), loss({ level: "hard" }, "ai")],
  },
  "damas:streak_5": streakCase,
  "damas:wins_10": winsCase(10),
  "damas:wins_50": winsCase(50),
  "damas:wins_100": winsCase(100),

  "batalha-naval:first": firstCase,
  "batalha-naval:sharp": {
    ok: [win({ hits: 6, shots: 10 })],
    almost: [win({ hits: 59, shots: 100 }), loss({ hits: 10, shots: 10 }), win({ hits: 0, shots: 0 }), win({})],
  },
  "batalha-naval:flawless": { ok: [win({ shipsLost: 0 })], almost: [win({ shipsLost: 1 }), loss({ shipsLost: 0 }), win({})] },
  "batalha-naval:streak_5": streakCase,

  "stop:first": firstCase,
  "stop:perfect_round": { ok: [loss({ perfectRounds: 1 })], almost: [win({ perfectRounds: 0 }), win({})] },
  "stop:stops_10": {
    ok: [loss({ stops: 3 }), win({ stops: 3 }), draw({ stops: 4 })],
    almost: [loss({ stops: 3 }), win({ stops: 3 }), draw({ stops: 3 }), win({})],
  },
  "stop:wins_10": winsCase(10),
  "stop:wins_50": winsCase(50),

  "codenames:master": { ok: [win({ role: "master" })], almost: [loss({ role: "master" }), win({ role: "agent" })] },
  "codenames:agent": { ok: [win({ role: "agent" })], almost: [loss({ role: "agent" }), win({ role: "master" })] },
  "codenames:clue_3": { ok: [loss({ bestClue: 3 })], almost: [win({ bestClue: 2 }), win({})] },
  "codenames:wins_10": winsCase(10),

  "sudoku:first": { ok: [win({}, "solo")], almost: [] },
  "sudoku:all_levels": {
    ok: ["easy", "medium", "hard", "expert"].map((difficulty) => win({ difficulty }, "solo")),
    almost: [...["easy", "medium", "hard", "hard"].map((difficulty) => win({ difficulty }, "solo")), loss({ difficulty: "expert" }, "solo")],
  },
  "sudoku:perfect": {
    ok: [win({ mistakes: 0, hints: 0 }, "solo")],
    almost: [win({ mistakes: 0, hints: 1 }, "solo"), win({ mistakes: 1, hints: 0 }, "solo"), win({}, "solo")],
  },
  "sudoku:expert_20": {
    ok: [win({ difficulty: "expert", timeMs: 20 * 60_000 - 1 }, "solo")],
    almost: [win({ difficulty: "expert", timeMs: 20 * 60_000 }, "solo"), win({ difficulty: "hard", timeMs: 60_000 }, "solo"), win({ difficulty: "expert" }, "solo")],
  },
  "sudoku:wins_10": winsCase(10),
  "sudoku:wins_50": winsCase(50),
  "sudoku:wins_100": winsCase(100),
  ...withGame("sudoku", dailyCases()),

  "paciencia-spider:first": { ok: [win({}, "solo")], almost: [] },
  "paciencia-spider:suits_2": { ok: [win({ suits: 2 }, "solo")], almost: [win({ suits: 1 }, "solo"), win({ suits: 4 }, "solo")] },
  "paciencia-spider:suits_4": { ok: [win({ suits: 4 }, "solo")], almost: [win({ suits: 1 }, "solo"), win({ suits: 2 }, "solo")] },
  "paciencia-spider:wins_10": winsCase(10),
  "paciencia-spider:wins_50": winsCase(50),
  "paciencia-spider:wins_100": winsCase(100),
  ...withGame("paciencia-spider", dailyCases()),

  "verbete:first": { ok: [loss({ mode: 1 }, "solo"), win({ mode: 1 }, "solo")], almost: [loss({ mode: 1 }, "solo"), loss({ mode: 4 }, "solo")] },
  "verbete:seer": {
    ok: [win({ mode: 1, attempts: 1 }, "solo")],
    almost: [win({ mode: 1, attempts: 2 }, "solo"), win({ mode: 2, attempts: 1 }, "solo"), loss({ mode: 1, attempts: 1 }, "solo")],
  },
  "verbete:close": {
    ok: [win({ mode: 2, attempts: 7 }, "solo")],
    almost: [win({ mode: 1, attempts: 5 }, "solo"), loss({ mode: 1, attempts: 6 }, "solo"), win({ mode: 4, attempts: 8 }, "solo"), win({ attempts: 6 }, "solo")],
  },
  "verbete:duo_4": {
    ok: [win({ mode: 2, attempts: 4 }, "solo")],
    almost: [win({ mode: 2, attempts: 5 }, "solo"), win({ mode: 1, attempts: 3 }, "solo"), loss({ mode: 2, attempts: 4 }, "solo")],
  },
  "verbete:quartet": { ok: [win({ mode: 4, attempts: 9 }, "solo")], almost: [loss({ mode: 4, attempts: 9 }, "solo"), win({ mode: 2, attempts: 2 }, "solo")] },
  "verbete:daily_5": {
    // um modo vencido por dia basta, e cada dia conta uma vez
    ok: run(5).map((d, i) => verbeteDay(d, [1, 2, 4][i % 3])),
    almost: [
      ...run(4).flatMap((d) => [verbeteDay(d, 1), verbeteDay(d, 2), verbeteDay(d, 4)]),
      verbeteDay("2026-08-05", 1, "2026-08-06"),
      verbeteDay("2026-08-05", 2, "2026-08-05", "loss"),
    ],
  },
  "verbete:wins_50": winsCase(50),

  "quente-ou-frio:first": { ok: [loss({ attempts: 9 }, "solo"), win({ attempts: 80 }, "solo")], almost: [loss({ attempts: 9 }, "solo")] },
  "quente-ou-frio:bullseye": {
    ok: [win({ attempts: 10, hints: 3 }, "solo")],
    almost: [win({ attempts: 11, hints: 0 }, "solo"), loss({ attempts: 2, hints: 0 }, "solo"), loss({ abandoned: true }, "solo")],
  },
  "quente-ou-frio:nose": {
    ok: [win({ attempts: 30, hints: 0 }, "solo")],
    almost: [win({ attempts: 31, hints: 0 }, "solo"), win({ attempts: 12, hints: 1 }, "solo"), loss({ attempts: 5, hints: 0 }, "solo")],
  },
  "quente-ou-frio:no_hints_10": {
    ok: times(10, () => win({ attempts: 90, hints: 0 }, "solo")),
    almost: [...times(9, () => win({ attempts: 90, hints: 0 }, "solo")), win({ attempts: 90, hints: 1 }, "solo"), loss({ attempts: 9, hints: 0 }, "solo")],
  },
  "quente-ou-frio:streak_5": streakCase,
  "quente-ou-frio:daily_week": {
    ok: run(7).map((d) => dailyRow(d)),
    almost: [...run(6).map((d) => dailyRow(d)), dailyRow("2026-08-07", "2026-08-08")],
  },
  "quente-ou-frio:wins_50": winsCase(50),
  "caca-palavras:first": { ok: [win({ level: "easy" }, "solo")], almost: [] },
  "caca-palavras:eagle": {
    ok: [win({ level: "hard", hints: 0 }, "solo")],
    almost: [win({ level: "hard", hints: 1 }, "solo"), win({ level: "medium", hints: 0 }, "solo"), win({ level: "hard" }, "solo")],
  },
  "caca-palavras:quick": {
    ok: [win({ level: "medium", timeMs: 2 * 60_000 - 1 }, "solo")],
    almost: [win({ level: "medium", timeMs: 2 * 60_000 }, "solo"), win({ level: "easy", timeMs: 30_000 }, "solo"), win({ level: "medium" }, "solo")],
  },
  "caca-palavras:themes_10": {
    ok: ["animais", "frutas", "paises", "brasil", "profissoes", "esportes", "cores", "corpo", "comidas", "cozinha"].map((theme) => win({ theme }, "solo")),
    almost: [...["animais", "frutas", "paises", "brasil", "profissoes", "esportes", "cores", "corpo", "comidas"].map((theme) => win({ theme }, "solo")), win({ theme: "animais" }, "solo")],
  },
  "caca-palavras:all_levels": {
    ok: ["easy", "medium", "hard"].map((level) => win({ level }, "solo")),
    almost: [win({ level: "easy" }, "solo"), win({ level: "medium" }, "solo"), win({ level: "medium" }, "solo")],
  },
  "caca-palavras:wins_10": winsCase(10),
  "caca-palavras:wins_50": winsCase(50),
  "caca-palavras:wins_100": winsCase(100),
  ...withGame("caca-palavras", dailyCases()),
};

const codes = ACHIEVEMENTS.map((a) => a.code);

describe("lista de conquistas", () => {
  test("códigos únicos", () => {
    expect(new Set(codes).size).toBe(codes.length);
    expect(ACHIEVEMENT_BY_CODE.size).toBe(codes.length);
  });

  test("código começa pelo jogo; as gerais não têm jogo", () => {
    for (const a of ACHIEVEMENTS) {
      if (a.game) expect(a.code.startsWith(`${a.game}:`)).toBe(true);
      else expect(a.code).not.toContain(":");
    }
  });

  test("todo jogo do perfil tem conquista e toda conquista tem caso de teste", () => {
    for (const g of STAT_GAMES) expect(ACHIEVEMENTS.some((a) => a.game === g)).toBe(true);
    expect(Object.keys(CASES).sort()).toEqual([...codes].sort());
  });
});

describe.each(ACHIEVEMENTS.map((a) => [a.code, a] as const))("%s", (code, a) => {
  const c = CASES[code];

  test("destrava quando atinge a condição", () => {
    expect(a.check(ctx(c.ok, c.okDays))).toBe(true);
  });

  test("não destrava logo antes", () => {
    expect(a.check(ctx(c.almost, c.almostDays))).toBe(false);
  });

  test("não destrava sem partidas", () => {
    expect(a.check(ctx([]))).toBe(false);
  });

  if (a.game) {
    test("só sai no próprio jogo", () => {
      expect(newAchievements(a.game!, ctx(c.ok, c.okDays), new Set()).map((x) => x.code)).toContain(code);
      for (const other of STAT_GAMES.filter((g) => g !== a.game)) {
        expect(newAchievements(other, ctx(c.ok, c.okDays), new Set()).map((x) => x.code)).not.toContain(code);
      }
    });
  } else {
    test("vale em qualquer jogo", () => {
      for (const g of STAT_GAMES) expect(newAchievements(g, ctx([], c.okDays), new Set()).map((x) => x.code)).toContain(code);
    });
  }
});

describe("detalhes das conquistas", () => {
  const check = (code: string, results: ResultRow[]) => ACHIEVEMENT_BY_CODE.get(code)!.check(ctx(results));

  test("Todos os níveis: precisa das 4 dificuldades de verdade", () => {
    const levels = (...ds: unknown[]) => ds.map((difficulty) => win({ difficulty }, "solo"));
    expect(check("sudoku:all_levels", levels("easy", "medium", "hard", "expert"))).toBe(true);
    expect(check("sudoku:all_levels", levels("easy", "medium", "hard", undefined))).toBe(false);
    expect(check("sudoku:all_levels", levels("easy", "medium", "hard", "insano"))).toBe(false);
    expect(check("sudoku:all_levels", levels("easy", "medium", "hard", "hard", "easy"))).toBe(false);
  });

  test("4 naipes não conta como 2 naipes", () => {
    expect(check("paciencia-spider:suits_2", [win({ suits: 4 }, "solo")])).toBe(false);
  });

  test("Pneu olha o placar do adversário (segunda posição)", () => {
    expect(check("truco-paulista:shutout", [win({ scores: [0, 12] })])).toBe(false);
    expect(check("truco-paulista:shutout", [win({ scores: [12, "0"] })])).toBe(false);
  });

  test("Mão rápida soma o STOP de todas as partidas, ignorando valor que não é número", () => {
    expect(check("stop:stops_10", [...times(9, () => loss({ stops: 1 })), loss({ stops: "x" }), loss({ stops: 1 })])).toBe(true);
  });

  test("desafio diário: só a vitória no próprio dia conta para a semana, rejogar conta para o total", () => {
    const late = run(7).map((d) => dailyRow(d, "2026-09-01"));
    expect(check("sudoku:daily_week", late)).toBe(false);
    expect(check("sudoku:daily_first", late)).toBe(true);
    expect(dailyStreaks(late)).toEqual({ best: 0, current: 0 });
    expect(dailyStreaks(run(7).map((d) => dailyRow(d))).best).toBe(7);
  });

  test("vitória fora do desafio não conta como desafio", () => {
    expect(check("sudoku:daily_first", times(50, () => win({ difficulty: "expert" }, "solo")))).toBe(false);
  });

  test("números guardados como texto também valem", () => {
    expect(check("connect4:quick", [win({ pieces: "4" })])).toBe(true);
  });

  test("abandono (só abandoned) não destrava nada", () => {
    const rs = times(20, () => loss({ abandoned: true }));
    for (const g of STAT_GAMES) expect(newAchievements(g, ctx(rs), new Set())).toEqual([]);
  });
});

describe("newAchievements", () => {
  const sudoku = [win({ difficulty: "expert", timeMs: 60_000, mistakes: 0, hints: 0 }, "solo")];

  test("devolve as novas na ordem da lista", () => {
    expect(newAchievements("sudoku", ctx(sudoku, 7), new Set()).map((a) => a.code)).toEqual(["days_7", "sudoku:first", "sudoku:perfect", "sudoku:expert_20"]);
  });

  test("não devolve as que o jogador já tem", () => {
    const have = new Set(["days_7", "sudoku:first", "connect4:first"]);
    expect(newAchievements("sudoku", ctx(sudoku, 7), have).map((a) => a.code)).toEqual(["sudoku:perfect", "sudoku:expert_20"]);
  });

  test("já tendo todas: nada", () => {
    expect(newAchievements("sudoku", ctx(sudoku, 30), new Set(codes))).toEqual([]);
  });

  test("resultados de jogo solo não destravam conquista de jogo online", () => {
    const got = newAchievements("sudoku", ctx(times(100, () => win({}, "solo"))), new Set());
    expect(got.length).toBeGreaterThan(0);
    expect(got.every((a) => a.game === null || isSoloGame(a.game))).toBe(true);
  });
});

describe("sequência de vitórias", () => {
  const seq = (s: string) => [...s].map((ch) => (ch === "W" ? win() : ch === "D" ? draw() : loss()));

  test.each([
    ["", 0, 0],
    ["L", 0, 0],
    ["W", 1, 1],
    ["WWW", 3, 3],
    ["WWWL", 3, 0],
    ["WWWD", 3, 0],
    ["LWW", 2, 2],
    ["WWWWLWW", 4, 2],
    ["WWDWWW", 3, 3],
    ["WLWLWL", 1, 0],
    ["LLWWWWWL", 5, 0],
  ])("%p: maior %i, atual %i", (s, best, current) => {
    expect(bestStreak(seq(s))).toBe(best);
    expect(currentStreak(seq(s))).toBe(current);
  });

  test("a ordem dos resultados importa (do mais antigo ao mais novo)", () => {
    expect(currentStreak(seq("LWW"))).toBe(2);
    expect(currentStreak(seq("WWL"))).toBe(0);
  });
});

describe("dias", () => {
  test("dayKey usa o horário de Brasília: 23h30 e 00h30 são dias diferentes, mesmo no mesmo dia UTC", () => {
    const a = new Date("2026-03-09T23:30:00-03:00"); // 02:30 UTC do dia 10
    const b = new Date("2026-03-10T00:30:00-03:00"); // 03:30 UTC do dia 10
    expect(a.toISOString().slice(0, 10)).toBe(b.toISOString().slice(0, 10));
    expect(dayKey(a)).toBe("2026-03-09");
    expect(dayKey(b)).toBe("2026-03-10");
    expect(dayStreaks([dayKey(a), dayKey(b)]).best).toBe(2);
  });

  test("21h de Brasília já é outro dia em UTC, mas o mesmo dia aqui", () => {
    expect(dayKey(new Date("2026-03-10T00:30:00Z"))).toBe("2026-03-09");
    expect(dayKey(new Date("2026-03-09T12:00:00Z"))).toBe("2026-03-09");
  });

  test.each([
    ["2026-12-31T23:59:59-03:00", "2026-12-31"],
    ["2027-01-01T02:59:59Z", "2026-12-31"],
    ["2027-01-01T03:00:00Z", "2027-01-01"],
    ["2026-03-01T02:00:00Z", "2026-02-28"],
    ["2028-03-01T02:00:00Z", "2028-02-29"],
  ])("dayKey(%s) = %s", (iso, key) => {
    expect(dayKey(new Date(iso))).toBe(key);
  });

  test.each([
    ["2026-10-12", "2026-10-13"],
    ["2026-01-31", "2026-02-01"],
    ["2026-02-28", "2026-03-01"],
    ["2028-02-28", "2028-02-29"],
    ["2028-02-29", "2028-03-01"],
    ["2026-04-30", "2026-05-01"],
    ["2026-12-31", "2027-01-01"],
  ])("dia seguinte de %s é %s (e volta)", (day, next) => {
    expect(nextDay(day)).toBe(next);
    expect(prevDay(next)).toBe(day);
  });
});

describe("dias seguidos", () => {
  // meio-dia de Brasília de 12/10/2026
  const NOW = new Date("2026-10-12T12:00:00-03:00");
  const at = (d: Date) => setSystemTime(d);
  afterEach(() => setSystemTime());

  test.each([
    ["sem jogos", [], 0, 0],
    ["só hoje", ["2026-10-12"], 1, 1],
    ["só ontem ainda vale", ["2026-10-11"], 1, 1],
    ["anteontem zera a atual", ["2026-10-10"], 1, 0],
    ["três até hoje", ["2026-10-10", "2026-10-11", "2026-10-12"], 3, 3],
    ["três até ontem", ["2026-10-09", "2026-10-10", "2026-10-11"], 3, 3],
    ["buraco quebra", ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-12"], 3, 1],
    ["maior antiga, atual curta", ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-10-11", "2026-10-12"], 4, 2],
    ["fora de ordem e repetidos", ["2026-10-12", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-10"], 3, 3],
    ["virada de mês", ["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"], 4, 0],
    ["virada de ano", ["2025-12-30", "2025-12-31", "2026-01-01"], 3, 0],
    ["fevereiro de ano bissexto", ["2028-02-28", "2028-02-29", "2028-03-01"], 3, 0],
    ["fevereiro de ano comum", ["2026-02-28", "2026-03-01"], 2, 0],
  ] as [string, string[], number, number][])("%s", (_, days, best, current) => {
    at(NOW);
    expect(dayStreaks(days)).toEqual({ best, current });
  });

  test("hoje é o dia de Brasília: 23h30 de 12/10 ainda é dia 12, 00h30 já é 13", () => {
    at(new Date("2026-10-12T23:30:00-03:00"));
    expect(dayStreaks(["2026-10-11"]).current).toBe(1);
    at(new Date("2026-10-13T00:30:00-03:00"));
    expect(dayStreaks(["2026-10-11"]).current).toBe(0);
    expect(dayStreaks(["2026-10-12"]).current).toBe(1);
  });

  test("sequência atual atravessando a virada do ano", () => {
    at(new Date("2027-01-01T10:00:00-03:00"));
    expect(dayStreaks(["2026-12-30", "2026-12-31", "2027-01-01"])).toEqual({ best: 3, current: 3 });
  });

  test("um dia sem jogar zera a atual mas mantém a maior", () => {
    at(new Date("2026-10-14T10:00:00-03:00"));
    expect(dayStreaks(["2026-10-10", "2026-10-11", "2026-10-12"])).toEqual({ best: 3, current: 0 });
  });

  test("7 e 30 dias seguidos destravam as conquistas de dias", () => {
    at(NOW);
    const run = (n: number) => Array.from({ length: n }, (_, i) => `2026-08-${String(i + 1).padStart(2, "0")}`);
    const best = (n: number) => dayStreaks(run(n)).best;
    const daysCodes = (n: number) => newAchievements("stop", ctx([], best(n)), new Set()).map((a) => a.code);
    expect(daysCodes(6)).toEqual([]);
    expect(daysCodes(7)).toEqual(["days_7"]);
    expect(daysCodes(29)).toEqual(["days_7"]);
    expect(daysCodes(30)).toEqual(["days_7", "days_30"]);
  });
});
