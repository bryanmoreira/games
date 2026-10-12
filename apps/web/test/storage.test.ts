import { beforeEach, describe, expect, test } from "bun:test";
import { applyAction as spiderAction, newGame as newSpider, type GameState as SpiderState } from "@truco/spider";
import { newGame as newSudoku, type GameState as SudokuState } from "@truco/sudoku";
import * as spider from "@/lib/spider/storage";
import * as sudoku from "@/lib/sudoku/storage";

/** localStorage de mentira; `quota` faz o setItem falhar acima de N caracteres, `broken` faz tudo lançar erro. */
class FakeStorage {
  map = new Map<string, string>();
  broken = false;
  quota = Infinity;
  writes = 0;
  getItem(k: string) {
    if (this.broken) throw new Error("bloqueado");
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.broken) throw new Error("bloqueado");
    this.writes++;
    if (v.length > this.quota) throw new Error("QuotaExceededError");
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  clear() {
    this.map.clear();
  }
}

let store: FakeStorage;
beforeEach(() => {
  store = new FakeStorage();
  (globalThis as { localStorage: unknown }).localStorage = store;
});

// gerar sudoku custa um pouco: um só para o arquivo todo
const SUDOKU = newSudoku("medium", 7);

describe("sudoku: partida salva", () => {
  test("salva e carrega de volta igual", () => {
    const g: SudokuState = { ...SUDOKU, values: SUDOKU.solution.map((v, i) => (i < 3 ? v : SUDOKU.values[i])), mistakes: 2, elapsed: 4321 };
    sudoku.saveGame(g);
    expect(sudoku.loadGame()).toEqual(g);
  });

  test("nada salvo: null", () => {
    expect(sudoku.loadGame()).toBeNull();
  });

  test("JSON inválido ou corrompido: null sem quebrar", () => {
    for (const raw of ["{", "null", "42", '"texto"', "[]", "{}", '{"values":[1,2,3],"solution":[]}', '{"values":"x","solution":[]}']) {
      store.map.set("sudoku.game", raw);
      expect(sudoku.loadGame()).toBeNull();
    }
  });

  test("sem a solução (formato antigo): null", () => {
    const { solution: _, ...old } = SUDOKU;
    store.map.set("sudoku.game", JSON.stringify(old));
    expect(sudoku.loadGame()).toBeNull();
  });

  test("partida meio quebrada: null (começa outra)", () => {
    const broken: Record<string, unknown>[] = [
      { values: new Array(81).fill(0), solution: [] },
      { ...SUDOKU, difficulty: "insano" },
      { ...SUDOKU, notes: undefined },
      { ...SUDOKU, puzzle: SUDOKU.puzzle.slice(1) },
      { ...SUDOKU, solution: SUDOKU.solution.map(String) },
      { ...SUDOKU, history: [{ values: SUDOKU.values }] },
      { ...SUDOKU, history: "x" },
      { ...SUDOKU, mistakes: "1" },
      { ...SUDOKU, elapsed: null },
      { ...SUDOKU, won: 0 },
      { ...SUDOKU, lost: undefined },
      { ...SUDOKU, last: "x" },
    ];
    for (const g of broken) {
      store.map.set("sudoku.game", JSON.stringify(g));
      expect(sudoku.loadGame()).toBeNull();
    }
  });

  test("localStorage que lança erro: null e salvar não quebra", () => {
    store.broken = true;
    expect(sudoku.loadGame()).toBeNull();
    expect(() => sudoku.saveGame(SUDOKU)).not.toThrow();
  });

  test("histórico grande demais: salva só os últimos 50 desfazer", () => {
    const step = { values: SUDOKU.values, notes: SUDOKU.notes };
    const g: SudokuState = { ...SUDOKU, history: Array.from({ length: 200 }, () => step) };
    store.quota = JSON.stringify({ ...g, history: g.history.slice(-50) }).length;
    sudoku.saveGame(g);
    expect(sudoku.loadGame()!.history).toHaveLength(50);
  });

  test("nem cortando cabe: não salva e não quebra", () => {
    store.quota = 10;
    expect(() => sudoku.saveGame(SUDOKU)).not.toThrow();
    expect(sudoku.loadGame()).toBeNull();
  });
});

describe("sudoku: nível", () => {
  test("salva e carrega", () => {
    sudoku.saveLevel("expert");
    expect(sudoku.loadLevel()).toBe("expert");
  });

  test("nada salvo ou nível desconhecido: fácil", () => {
    expect(sudoku.loadLevel()).toBe("easy");
    store.map.set("sudoku.level", "impossivel");
    expect(sudoku.loadLevel()).toBe("easy");
  });

  test("localStorage que lança erro: fácil, e salvar não quebra", () => {
    store.broken = true;
    expect(sudoku.loadLevel()).toBe("easy");
    expect(() => sudoku.saveLevel("hard")).not.toThrow();
  });
});

describe("sudoku: recordes", () => {
  test("primeiro tempo do nível é recorde", () => {
    expect(sudoku.saveBest("easy", 90_000)).toBe(true);
    expect(sudoku.loadBests()).toEqual({ easy: 90_000 });
  });

  test("só tempo menor vira recorde; empate não", () => {
    sudoku.saveBest("easy", 90_000);
    expect(sudoku.saveBest("easy", 95_000)).toBe(false);
    expect(sudoku.saveBest("easy", 90_000)).toBe(false);
    expect(sudoku.saveBest("easy", 80_000)).toBe(true);
    expect(sudoku.loadBests()).toEqual({ easy: 80_000 });
  });

  test("cada nível tem o seu", () => {
    sudoku.saveBest("easy", 90_000);
    sudoku.saveBest("hard", 600_000);
    expect(sudoku.loadBests()).toEqual({ easy: 90_000, hard: 600_000 });
  });

  test("JSON inválido: sem recordes", () => {
    store.map.set("sudoku.best", "{oops");
    expect(sudoku.loadBests()).toEqual({});
  });

  // comportamento atual: com localStorage quebrado, diz que foi recorde mesmo sem conseguir salvar
  test("localStorage que lança erro: não quebra e conta como recorde", () => {
    store.broken = true;
    expect(sudoku.loadBests()).toEqual({});
    expect(sudoku.saveBest("easy", 90_000)).toBe(true);
  });
});

describe("spider: partida salva", () => {
  test("salva e carrega de volta igual, depois de jogar", () => {
    const r = spiderAction(newSpider(2, 11), { type: "deal" });
    if (!r.ok) throw new Error(r.error);
    const g: SpiderState = { ...r.state, elapsed: 12_345 };
    expect(g.history).toHaveLength(1);
    spider.saveGame(g);
    expect(spider.loadGame()).toEqual(g);
  });

  test("nada salvo: null", () => {
    expect(spider.loadGame()).toBeNull();
  });

  test("JSON inválido ou corrompido: null sem quebrar", () => {
    for (const raw of ["{", "null", "7", '"x"', "[]", "{}", '{"cols":[[1],[2]]}', '{"cols":"x"}']) {
      store.map.set("spider.game", raw);
      expect(spider.loadGame()).toBeNull();
    }
  });

  test("partida meio quebrada: null (começa outra)", () => {
    const g = newSpider(1, 3);
    const broken: Record<string, unknown>[] = [
      { cols: g.cols },
      { ...g, hidden: g.hidden.slice(1) },
      { ...g, cols: [...g.cols.slice(1), ["x"]] },
      { ...g, stock: undefined },
      { ...g, done: [1] },
      { ...g, suits: 3 },
      { ...g, moves: "0" },
      { ...g, elapsed: "10" },
      { ...g, history: [{ cols: g.cols }] },
      { ...g, won: "não" },
      { ...g, last: 5 },
    ];
    for (const b of broken) {
      store.map.set("spider.game", JSON.stringify(b));
      expect(spider.loadGame()).toBeNull();
    }
  });

  test("formato antigo sem tempo: carrega com tempo 0", () => {
    const { elapsed: _, ...old } = newSpider(1, 3);
    store.map.set("spider.game", JSON.stringify(old));
    expect(spider.loadGame()).toEqual({ ...old, elapsed: 0 });
  });

  test("localStorage que lança erro: null e salvar não quebra", () => {
    store.broken = true;
    expect(spider.loadGame()).toBeNull();
    expect(() => spider.saveGame(newSpider(1, 1))).not.toThrow();
  });

  test("histórico grande demais: salva só os últimos 100 desfazer", () => {
    const base = newSpider(4, 5);
    const step = { cols: base.cols, hidden: base.hidden, stock: base.stock, done: base.done };
    const g: SpiderState = { ...base, history: Array.from({ length: 300 }, () => step) as SpiderState["history"] };
    store.quota = JSON.stringify({ ...g, history: g.history.slice(-100) }).length;
    spider.saveGame(g);
    expect(spider.loadGame()!.history).toHaveLength(100);
  });

  test("nem cortando cabe: não salva e não quebra", () => {
    store.quota = 10;
    expect(() => spider.saveGame(newSpider(1, 1))).not.toThrow();
    expect(spider.loadGame()).toBeNull();
  });
});

describe("spider: naipes", () => {
  test("salva e carrega", () => {
    for (const s of [1, 2, 4] as const) {
      spider.saveSuits(s);
      expect(spider.loadSuits()).toBe(s);
    }
  });

  test("nada salvo ou valor inválido: 1 naipe", () => {
    expect(spider.loadSuits()).toBe(1);
    for (const raw of ["3", "8", "abc", "", "2.0x"]) {
      store.map.set("spider.suits", raw);
      expect(spider.loadSuits()).toBe(1);
    }
  });

  test("localStorage que lança erro: 1 naipe, e salvar não quebra", () => {
    store.broken = true;
    expect(spider.loadSuits()).toBe(1);
    expect(() => spider.saveSuits(4)).not.toThrow();
  });
});
