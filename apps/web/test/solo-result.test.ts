import { describe, expect, test } from "bun:test";
import { parseSoloResult } from "@/lib/stats/solo-result";

const DAY = 24 * 60 * 60 * 1000;
const sudoku = (over: Record<string, unknown> = {}) => ({ difficulty: "medium", timeMs: 300_000, mistakes: 1, hints: 2, ...over });
const spider = (over: Record<string, unknown> = {}) => ({ suits: 2, moves: 150, score: 900, timeMs: 600_000, ...over });

const caca = (over: Record<string, unknown> = {}) => ({ level: "medium", theme: "frutas", timeMs: 240_000, hints: 1, words: 12, ...over });

describe("caca-palavras", () => {
  test("vitória válida passa só com os campos esperados", () => {
    expect(parseSoloResult("caca-palavras", caca({ extra: "x" }))).toEqual({
      game: "caca-palavras",
      data: { level: "medium", theme: "frutas", timeMs: 240_000, hints: 1, words: 12 },
    });
  });

  test("palavras têm que ser as do nível", () => {
    expect(parseSoloResult("caca-palavras", caca({ level: "easy", words: 8 }))).not.toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ level: "hard", words: 16 }))).not.toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ level: "easy", words: 12 }))).toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ words: 0 }))).toBeNull();
  });

  test("dicas de 0 até o número de palavras", () => {
    expect(parseSoloResult("caca-palavras", caca({ hints: 0 }))).not.toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ hints: 12 }))).not.toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ hints: 13 }))).toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ hints: -1 }))).toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ hints: 1.5 }))).toBeNull();
  });

  test("nível, tema e tempo inválidos: recusa", () => {
    expect(parseSoloResult("caca-palavras", caca({ level: "expert" }))).toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ theme: "nada" }))).toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ theme: undefined }))).toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ timeMs: 999 }))).toBeNull();
    expect(parseSoloResult("caca-palavras", caca({ timeMs: DAY + 1 }))).toBeNull();
  });
});

const mahjong = (over: Record<string, unknown> = {}) => ({ layout: "tartaruga", timeMs: 400_000, hints: 2, shuffles: 1, undos: 5, ...over });

describe("mahjong", () => {
  test("vitória válida passa só com os campos esperados", () => {
    expect(parseSoloResult("mahjong", mahjong({ extra: "x" }))).toEqual({
      game: "mahjong",
      data: { layout: "tartaruga", timeMs: 400_000, hints: 2, shuffles: 1, undos: 5 },
    });
  });

  test("formato tem que existir", () => {
    expect(parseSoloResult("mahjong", mahjong({ layout: "turtle" }))).toBeNull();
    expect(parseSoloResult("mahjong", mahjong({ layout: undefined }))).toBeNull();
  });

  test("o tempo já tem os 30 s de cada dica e embaralhada", () => {
    expect(parseSoloResult("mahjong", mahjong({ hints: 10, shuffles: 3, timeMs: 13 * 30_000 }))).not.toBeNull();
    expect(parseSoloResult("mahjong", mahjong({ hints: 10, shuffles: 3, timeMs: 13 * 30_000 - 1 }))).toBeNull();
  });

  test("contagens inválidas: recusa", () => {
    expect(parseSoloResult("mahjong", mahjong({ hints: -1 }))).toBeNull();
    expect(parseSoloResult("mahjong", mahjong({ shuffles: 1.5 }))).toBeNull();
    expect(parseSoloResult("mahjong", mahjong({ undos: "3" }))).toBeNull();
    expect(parseSoloResult("mahjong", mahjong({ timeMs: 999 }))).toBeNull();
  });
});

describe("sudoku", () => {
  test("vitória válida passa só com os campos esperados", () => {
    expect(parseSoloResult("sudoku", sudoku({ extra: "x", userId: "outro" }))).toEqual({
      game: "sudoku",
      data: { difficulty: "medium", timeMs: 300_000, mistakes: 1, hints: 2 },
    });
  });

  test("todas as dificuldades conhecidas", () => {
    for (const difficulty of ["easy", "medium", "hard", "expert"]) expect(parseSoloResult("sudoku", sudoku({ difficulty }))).not.toBeNull();
  });

  test("dificuldade desconhecida ou ausente: recusa", () => {
    expect(parseSoloResult("sudoku", sudoku({ difficulty: "insane" }))).toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ difficulty: "EASY" }))).toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ difficulty: undefined }))).toBeNull();
  });

  test("erros de 0 a 99", () => {
    expect(parseSoloResult("sudoku", sudoku({ mistakes: 0 }))).not.toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ mistakes: 99 }))).not.toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ mistakes: 100 }))).toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ mistakes: -1 }))).toBeNull();
  });

  test("dicas de 0 a 81", () => {
    expect(parseSoloResult("sudoku", sudoku({ hints: 0 }))).not.toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ hints: 81 }))).not.toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ hints: 82 }))).toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ hints: -1 }))).toBeNull();
  });

  test("erros e dicas precisam ser inteiros", () => {
    expect(parseSoloResult("sudoku", sudoku({ mistakes: 1.5 }))).toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ hints: "2" }))).toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ mistakes: undefined }))).toBeNull();
    expect(parseSoloResult("sudoku", sudoku({ hints: null }))).toBeNull();
  });
});

describe("paciência spider", () => {
  test("vitória válida passa só com os campos esperados", () => {
    expect(parseSoloResult("paciencia-spider", spider({ extra: true, difficulty: "easy" }))).toEqual({
      game: "paciencia-spider",
      data: { suits: 2, moves: 150, score: 900, timeMs: 600_000 },
    });
  });

  test("naipes só 1, 2 ou 4", () => {
    for (const suits of [1, 2, 4]) expect(parseSoloResult("paciencia-spider", spider({ suits }))).not.toBeNull();
    for (const suits of [0, 3, 5, 8, 2.5, "2"]) expect(parseSoloResult("paciencia-spider", spider({ suits }))).toBeNull();
  });

  test("jogadas de 1 a 100.000", () => {
    expect(parseSoloResult("paciencia-spider", spider({ moves: 1 }))).not.toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ moves: 100_000 }))).not.toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ moves: 0 }))).toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ moves: 100_001 }))).toBeNull();
  });

  test("pontos de -100.000 a 2000 (negativo pode)", () => {
    expect(parseSoloResult("paciencia-spider", spider({ score: -100_000 }))).not.toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ score: -5 }))).not.toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ score: 2000 }))).not.toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ score: 2001 }))).toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ score: -100_001 }))).toBeNull();
  });

  test("jogadas e pontos precisam ser inteiros", () => {
    expect(parseSoloResult("paciencia-spider", spider({ moves: 10.1 }))).toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ score: "900" }))).toBeNull();
    expect(parseSoloResult("paciencia-spider", spider({ score: NaN }))).toBeNull();
  });
});

describe("tempo", () => {
  for (const [game, make] of [
    ["sudoku", sudoku],
    ["paciencia-spider", spider],
  ] as const) {
    test(`${game}: de 1s a 24h, limites inclusos`, () => {
      expect(parseSoloResult(game, make({ timeMs: 1000 }))).not.toBeNull();
      expect(parseSoloResult(game, make({ timeMs: DAY }))).not.toBeNull();
      expect(parseSoloResult(game, make({ timeMs: 999 }))).toBeNull();
      expect(parseSoloResult(game, make({ timeMs: DAY + 1 }))).toBeNull();
    });

    test(`${game}: tempo que não é inteiro: recusa`, () => {
      for (const timeMs of [1500.5, "5000", NaN, Infinity, -5000, null, undefined, [5000], { v: 5000 }]) {
        expect(parseSoloResult(game, make({ timeMs }))).toBeNull();
      }
    });
  }
});

describe("pedido inválido", () => {
  test("jogo desconhecido ou ausente: recusa", () => {
    expect(parseSoloResult("truco", sudoku())).toBeNull();
    expect(parseSoloResult("Sudoku", sudoku())).toBeNull();
    expect(parseSoloResult(undefined, sudoku())).toBeNull();
    expect(parseSoloResult(null, spider())).toBeNull();
  });

  test("sem dados: recusa sem quebrar", () => {
    expect(parseSoloResult("sudoku", undefined)).toBeNull();
    expect(parseSoloResult("sudoku", null)).toBeNull();
    expect(parseSoloResult("paciencia-spider", {})).toBeNull();
    expect(parseSoloResult("sudoku", "timeMs=5000")).toBeNull();
    expect(parseSoloResult("paciencia-spider", 5000)).toBeNull();
  });
});

describe("verbete", () => {
  const vb = (over: Record<string, unknown> = {}) => ({ mode: 1, answers: ["festa"], guesses: ["tempo", "festa"], ...over });

  test("vitória: refaz os chutes e guarda só os campos esperados", () => {
    expect(parseSoloResult("verbete", vb({ extra: 1 }))).toEqual({
      game: "verbete",
      outcome: "win",
      data: { mode: 1, attempts: 2, answers: ["festa"], guesses: ["tempo", "festa"] },
    });
  });

  test("derrota: os 6 chutes sem acertar", () => {
    const r = parseSoloResult("verbete", vb({ guesses: Array(6).fill("tempo") }));
    expect(r?.outcome).toBe("loss");
    expect(r?.data.attempts).toBe(6);
  });

  test("acento é tirado antes de guardar", () => {
    expect(parseSoloResult("verbete", vb({ answers: ["suíte"], guesses: ["SUITE"] }))?.data).toEqual({ mode: 1, attempts: 1, answers: ["suite"], guesses: ["suite"] });
  });

  test("dueto e quarteto", () => {
    expect(parseSoloResult("verbete", vb({ mode: 2, answers: ["festa", "livro"], guesses: ["livro", "festa"] }))?.outcome).toBe("win");
    expect(parseSoloResult("verbete", vb({ mode: 4, answers: ["festa", "livro", "porta", "mundo"], guesses: Array(9).fill("tempo") }))?.outcome).toBe("loss");
  });

  test("partida sem terminar: recusa", () => {
    expect(parseSoloResult("verbete", vb({ guesses: ["tempo"] }))).toBeNull();
    expect(parseSoloResult("verbete", vb({ guesses: [] }))).toBeNull();
  });

  test("chute inválido, chute depois do fim ou chutes demais: recusa", () => {
    expect(parseSoloResult("verbete", vb({ guesses: ["zzzzz", "festa"] }))).toBeNull();
    expect(parseSoloResult("verbete", vb({ guesses: ["festa", "tempo"] }))).toBeNull();
    expect(parseSoloResult("verbete", vb({ guesses: Array(7).fill("tempo") }))).toBeNull();
  });

  test("respostas erradas para o modo, repetidas ou fora das respostas: recusa", () => {
    expect(parseSoloResult("verbete", vb({ mode: 2 }))).toBeNull();
    expect(parseSoloResult("verbete", vb({ mode: 3 }))).toBeNull();
    expect(parseSoloResult("verbete", vb({ mode: 2, answers: ["festa", "festa"], guesses: ["festa"] }))).toBeNull();
    expect(parseSoloResult("verbete", vb({ answers: ["ababa"], guesses: ["ababa"] }))).toBeNull();
    expect(parseSoloResult("verbete", vb({ answers: "festa" }))).toBeNull();
    expect(parseSoloResult("verbete", vb({ guesses: [1, 2] }))).toBeNull();
  });
});

describe("tijolada", () => {
  const tij = (over: Record<string, unknown> = {}) => ({ score: 12_000, lines: 34, level: 4, tetras: 3, pieces: 95, timeMs: 240_000, ...over });

  test("partida solo vai como derrota, só com os números esperados", () => {
    expect(parseSoloResult("tijolada", tij({ extra: 1 }))).toEqual({
      game: "tijolada",
      outcome: "loss",
      data: { score: 12_000, lines: 34, level: 4, tetras: 3, pieces: 95, timeMs: 240_000 },
    });
  });

  test("nível tem que sair das linhas", () => {
    expect(parseSoloResult("tijolada", tij({ level: 5 }))).toBeNull();
    expect(parseSoloResult("tijolada", tij({ lines: 300, level: 20, pieces: 800 }))).not.toBeNull();
    expect(parseSoloResult("tijolada", tij({ lines: 300, level: 21, pieces: 800 }))).toBeNull();
  });

  test("linhas demais para as peças, 4 linhas demais ou pontos impossíveis: recusa", () => {
    expect(parseSoloResult("tijolada", tij({ pieces: 80 }))).toBeNull();
    expect(parseSoloResult("tijolada", tij({ tetras: 9 }))).toBeNull();
    expect(parseSoloResult("tijolada", tij({ score: 10_000_000 }))).toBeNull();
  });

  test("campos ausentes ou quebrados: recusa", () => {
    expect(parseSoloResult("tijolada", tij({ score: undefined }))).toBeNull();
    expect(parseSoloResult("tijolada", tij({ lines: 1.5 }))).toBeNull();
    expect(parseSoloResult("tijolada", tij({ timeMs: 10 }))).toBeNull();
  });
});
