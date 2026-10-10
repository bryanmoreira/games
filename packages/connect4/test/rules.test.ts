import { describe, expect, test } from "bun:test";
import { applyAction, COLS, decide, newGame, ROWS, threats, viewFor, type GameState, type Seat } from "../src";

/** rng determinístico (mulberry32) */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Partida com o lugar 0 começando, jogando as colunas em sequência alternada. */
function play(cols: number[], starter: Seat = 0): GameState {
  let s = { ...newGame(), turn: starter, starter };
  for (const col of cols) {
    const r = applyAction(s, { type: "drop", seat: s.turn, col });
    if (!r.ok) throw new Error(`${col}: ${r.error}`);
    s = r.state;
  }
  return s;
}

describe("regras", () => {
  test("peça cai até a casa livre mais baixa", () => {
    const s = play([3, 3, 3]);
    expect(s.cols[3]).toEqual([0, 1, 0]);
    expect(s.moves.at(-1)).toEqual({ col: 3, row: 2, seat: 0 });
    expect(s.turn).toBe(1);
  });

  test("fora da vez, coluna inválida e coluna cheia", () => {
    const s = play([]);
    expect(applyAction(s, { type: "drop", seat: 1, col: 0 })).toEqual({ ok: false, error: "Não é sua vez" });
    expect(applyAction(s, { type: "drop", seat: 0, col: 7 }).ok).toBe(false);
    expect(applyAction(s, { type: "drop", seat: 0, col: -1 }).ok).toBe(false);
    expect(applyAction(s, { type: "drop", seat: 0, col: 1.5 }).ok).toBe(false);
    const full = play([0, 0, 0, 0, 0, 0]);
    expect(applyAction(full, { type: "drop", seat: 0, col: 0 })).toEqual({ ok: false, error: "Coluna cheia" });
  });

  test("não altera o estado original", () => {
    const s = play([]);
    applyAction(s, { type: "drop", seat: 0, col: 2 });
    expect(s.cols[2]).toEqual([]);
  });

  test("vitória horizontal", () => {
    const s = play([0, 0, 1, 1, 2, 2, 3]);
    expect(s.phase).toBe("gameOver");
    expect(s.winner).toBe(0);
    expect(s.winLine).toEqual([0, 1, 2, 3].map((col) => ({ col, row: 0 })));
    expect(s.scores).toEqual([1, 0]);
  });

  test("vitória vertical", () => {
    const s = play([4, 5, 4, 5, 4, 5, 4]);
    expect(s.winner).toBe(0);
    expect(s.winLine).toEqual([0, 1, 2, 3].map((row) => ({ col: 4, row })));
  });

  test("vitória na diagonal ↗", () => {
    // 0: (0,0) (1,1) (2,2) (3,3)
    const s = play([0, 1, 1, 2, 2, 3, 2, 3, 3, 6, 3]);
    expect(s.winner).toBe(0);
    expect(s.winLine).toEqual([0, 1, 2, 3].map((i) => ({ col: i, row: i })));
  });

  test("vitória na diagonal ↘", () => {
    // 0: (3,0) (2,1) (1,2) (0,3)
    const s = play([3, 2, 2, 1, 1, 0, 1, 0, 0, 6, 0]);
    expect(s.winner).toBe(0);
    expect(s.winLine).toEqual([0, 1, 2, 3].map((i) => ({ col: i, row: 3 - i })));
  });

  test("linha de 5 marca as 5 casas", () => {
    const s = play([0, 0, 1, 1, 3, 3, 4, 4, 2]);
    expect(s.winLine?.length).toBe(5);
  });

  test("empate com tabuleiro cheio", () => {
    // partida real que termina sem 4 em linha
    const order = [..."355044234114302533122645021043016026565661"].map(Number);
    let s = { ...newGame(), turn: 0 as Seat, starter: 0 as Seat };
    for (const col of order) {
      const r = applyAction(s, { type: "drop", seat: s.turn, col });
      expect(r.ok).toBe(true);
      if (r.ok) s = r.state;
    }
    expect(s.moves.length).toBe(COLS * ROWS);
    expect(s.phase).toBe("gameOver");
    expect(s.winner).toBeNull();
    expect(s.draws).toBe(1);
    expect(applyAction(s, { type: "drop", seat: s.turn, col: 0 }).ok).toBe(false);
  });

  test("De novo mantém o placar e alterna quem começa", () => {
    const s = play([0, 0, 1, 1, 2, 2, 3], 1);
    const next = newGame(Math.random, s);
    expect(next.scores).toEqual(s.scores);
    expect(next.starter).toBe(0);
    expect(next.turn).toBe(0);
    expect(next.gameNo).toBe(2);
    expect(next.cols.every((c) => c.length === 0)).toBe(true);
  });

  test("visão: só joga na sua vez", () => {
    const s = play([0, 0, 0, 0, 0, 0]);
    expect(viewFor(s, 0).canPlay).toBe(true);
    expect(viewFor(s, 0).playable).toEqual([1, 2, 3, 4, 5, 6]);
    expect(viewFor(s, 1).canPlay).toBe(false);
    expect(viewFor(s, 1).playable).toEqual([]);
  });

  test("ameaças", () => {
    const s = play([0, 6, 1, 6, 2]); // 0 tem três na base
    expect(threats(s.cols, 0)).toContainEqual({ col: 3, row: 0 });
    expect(threats(s.cols, 1)).toEqual([]);
  });
});

describe("IA", () => {
  test("ganha quando pode", () => {
    const s = play([0, 0, 1, 1, 2, 2]); // vez do 0, três na base
    expect(decide(viewFor(s, 0))).toEqual({ type: "drop", seat: 0, col: 3 });
  });

  test("bloqueia a vitória do adversário", () => {
    const s = play([0, 6, 1, 6, 2]); // vez do 1, o 0 ameaça a coluna 3
    expect(decide(viewFor(s, 1))?.col).toBe(3);
  });

  test("bloqueia a vertical", () => {
    const s = play([2, 5, 2, 5, 2]);
    expect(decide(viewFor(s, 1))?.col).toBe(2);
  });

  test("não joga uma peça que dá a vitória por cima", () => {
    // o 1 tem três na linha 1 (colunas 1 a 3): jogar na coluna 4 entrega a (4,1)
    const s = play([1, 0, 3, 2, 0, 2, 6, 1, 6, 3]);
    expect(s.turn).toBe(0);
    expect(threats(s.cols, 1)).toContainEqual({ col: 4, row: 1 });
    for (let i = 0; i < 10; i++) expect(decide(viewFor(s, 0))?.col).not.toBe(4);
  });

  test("não decide fora da vez nem com partida encerrada", () => {
    expect(decide(viewFor(play([]), 1))).toBeNull();
    expect(decide(viewFor(play([0, 0, 1, 1, 2, 2, 3]), 1))).toBeNull();
  });

  test("lance rápido no tabuleiro vazio", () => {
    const t = performance.now();
    decide(viewFor(play([]), 0));
    expect(performance.now() - t).toBeLessThan(500);
  });

  test("simulação: 300 partidas só com IAs terminam", () => {
    const rng = seeded(42);
    let wins = 0;
    let draws = 0;
    for (let g = 0; g < 300; g++) {
      let s = newGame(rng);
      // profundidades diferentes por lado para variar as partidas
      const depth: [number, number] = [1 + (g % 4), 1 + ((g >> 2) % 4)];
      let steps = 0;
      while (s.phase === "playing") {
        const a = decide(viewFor(s, s.turn), { depth: depth[s.turn], rng });
        expect(a).not.toBeNull();
        const r = applyAction(s, a!);
        expect(r.ok).toBe(true);
        if (r.ok) s = r.state;
        expect(++steps).toBeLessThanOrEqual(COLS * ROWS);
      }
      if (s.winner === null) draws++;
      else wins++;
      expect(viewFor(s, 0).canPlay || viewFor(s, 1).canPlay).toBe(false);
    }
    expect(wins + draws).toBe(300);
  }, 20_000);

  test("IA completa vence uma IA rasa quase sempre", () => {
    const rng = seeded(7);
    let strong = 0;
    for (let g = 0; g < 10; g++) {
      let s = newGame(rng);
      const strongSeat = (g % 2) as Seat;
      while (s.phase === "playing") {
        const d = s.turn === strongSeat ? 7 : 1;
        const r = applyAction(s, decide(viewFor(s, s.turn), { depth: d, rng })!);
        if (r.ok) s = r.state;
      }
      if (s.winner === strongSeat) strong++;
    }
    expect(strong).toBeGreaterThanOrEqual(9);
  }, 20_000);
});
