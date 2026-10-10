import { describe, expect, test } from "bun:test";
import {
  applyAction,
  bestHint,
  bit,
  candidates,
  countSolutions,
  DIFFICULTIES,
  generate,
  isLocked,
  LEVELS,
  MAX_MISTAKES,
  mulberry32,
  newGame,
  PEERS,
  randomSolution,
  remaining,
  solveLogic,
  SIZE,
  UNITS,
  type Action,
  type GameState,
} from "../src";

// puzzle conhecido (fácil, só únicos) e a solução dele
const P = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
const S = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
const grid = (s: string) => [...s].map(Number);

function game(): GameState {
  const puzzle = grid(P);
  return {
    difficulty: "easy",
    seed: 0,
    puzzle,
    solution: grid(S),
    values: puzzle.slice(),
    notes: new Array(SIZE).fill(0),
    mistakes: 0,
    hints: 0,
    elapsed: 0,
    history: [],
    won: false,
    lost: false,
    last: null,
  };
}

function act(s: GameState, a: Action): GameState {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

const valid = (g: number[]) => UNITS.every((u) => new Set(u.map((i) => g[i])).size === 9 && u.every((i) => g[i] >= 1 && g[i] <= 9));

describe("tabuleiro", () => {
  test("cada casa tem 20 vizinhas e 27 unidades de 9", () => {
    expect(PEERS.every((p) => p.length === 20)).toBe(true);
    expect(UNITS.length).toBe(27);
    expect(UNITS.every((u) => u.length === 9)).toBe(true);
  });

  test("tabuleiro aleatório é válido", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 20; i++) expect(valid(randomSolution(rng))).toBe(true);
  });

  test("conta soluções", () => {
    expect(countSolutions(grid(P))).toBe(1);
    expect(countSolutions(new Array(SIZE).fill(0))).toBe(2);
    const broken = grid(P);
    broken[1] = 5; // dois 5 na primeira linha
    expect(countSolutions(broken)).toBe(0);
  });
});

describe("solver lógico", () => {
  test("resolve o puzzle fácil só com únicos", () => {
    const g = solveLogic(grid(P), 1);
    expect(g.solved).toBe(true);
    expect(g.tier).toBe(1);
  });

  test("não resolve tabuleiro com várias soluções", () => {
    const p = grid(P);
    for (let i = 0; i < 40; i++) p[i] = 0;
    if (countSolutions(p) > 1) expect(solveLogic(p).solved).toBe(false);
  });

  test("candidatos excluem números das vizinhas", () => {
    const c = candidates(grid(P));
    expect(c[0]).toBe(0); // pista
    // casa (0,2): linha tem 5,3,7; coluna 8; bloco 5,3,6,9,8 → sobram 1,2,4
    expect(c[2]).toBe(bit(1) | bit(2) | bit(4));
  });
});

describe("gerador", () => {
  for (const d of DIFFICULTIES) {
    test(`${d}: solução única, no nível certo e determinístico`, () => {
      const lv = LEVELS[d];
      for (let seed = 1; seed <= 6; seed++) {
        const { puzzle, solution } = generate(d, seed);
        expect(valid(solution)).toBe(true);
        expect(puzzle.every((v, i) => v === 0 || v === solution[i])).toBe(true);
        expect(countSolutions(puzzle)).toBe(1);
        expect(puzzle.filter(Boolean).length).toBeGreaterThanOrEqual(lv.minGivens);
        const g = solveLogic(puzzle, lv.maxTier);
        expect(g.solved).toBe(true);
        expect(g.tier).toBeGreaterThanOrEqual(lv.minTier);
        // pistas simétricas (giro de 180°)
        expect(puzzle.every((v, i) => !v === !puzzle[SIZE - 1 - i])).toBe(true);
      }
      expect(generate(d, 42)).toEqual(generate(d, 42));
    }, 30_000);
  }

  test("médio tem menos pistas que fácil", () => {
    const n = (d: "easy" | "medium") => generate(d, 3).puzzle.filter(Boolean).length;
    expect(n("medium")).toBeLessThan(n("easy"));
  });
});

describe("regras", () => {
  test("número certo fica fixo e limpa anotações vizinhas", () => {
    let s = game();
    s = act(s, { type: "note", cell: 3, value: 6 }); // (0,3) vizinha de (0,2)
    s = act(s, { type: "note", cell: 2, value: 4 });
    expect(s.notes[3]).toBe(bit(6));
    s = act(s, { type: "set", cell: 3, value: 6 });
    expect(s.values[3]).toBe(6);
    expect(s.notes[3]).toBe(0);
    expect(isLocked(s, 3)).toBe(true);
    expect(applyAction(s, { type: "set", cell: 3, value: 2 }).ok).toBe(false);
    expect(applyAction(s, { type: "erase", cell: 3 }).ok).toBe(false);
    expect(s.notes[2]).toBe(bit(4));
  });

  test("pista não muda", () => {
    expect(applyAction(game(), { type: "set", cell: 0, value: 1 }).ok).toBe(false);
    expect(applyAction(game(), { type: "note", cell: 0, value: 1 }).ok).toBe(false);
  });

  test("número errado conta erro, fica na casa e pode ser apagado", () => {
    let s = act(game(), { type: "set", cell: 2, value: 1 });
    expect(s.values[2]).toBe(1);
    expect(s.mistakes).toBe(1);
    expect(s.last?.wrong).toBe(true);
    s = act(s, { type: "erase", cell: 2 });
    expect(s.values[2]).toBe(0);
    expect(s.mistakes).toBe(1);
  });

  test("3 erros param a partida e continuar zera os erros", () => {
    let s = game();
    s = act(s, { type: "set", cell: 2, value: 1 });
    s = act(s, { type: "set", cell: 2, value: 2 });
    expect(s.lost).toBe(false);
    s = act(s, { type: "set", cell: 2, value: 1 });
    expect(s.mistakes).toBe(MAX_MISTAKES);
    expect(s.lost).toBe(true);
    expect(applyAction(s, { type: "set", cell: 2, value: 4 }).ok).toBe(false);
    expect(applyAction(s, { type: "undo" }).ok).toBe(false);
    s = act(s, { type: "revive" });
    expect(s.lost).toBe(false);
    expect(s.mistakes).toBe(0);
    s = act(s, { type: "set", cell: 2, value: 4 });
    expect(s.values[2]).toBe(4);
  });

  test("anotação liga e desliga, e não vale em casa preenchida", () => {
    let s = act(game(), { type: "note", cell: 2, value: 1 });
    s = act(s, { type: "note", cell: 2, value: 2 });
    expect(s.notes[2]).toBe(bit(1) | bit(2));
    s = act(s, { type: "note", cell: 2, value: 1 });
    expect(s.notes[2]).toBe(bit(2));
    s = act(s, { type: "set", cell: 2, value: 1 }); // errado: limpa a anotação da casa
    expect(s.notes[2]).toBe(0);
    expect(applyAction(s, { type: "note", cell: 2, value: 3 }).ok).toBe(false);
  });

  test("desfazer volta números e anotações, mas não os erros", () => {
    let s = act(game(), { type: "note", cell: 2, value: 4 });
    s = act(s, { type: "set", cell: 2, value: 1 });
    s = act(s, { type: "undo" });
    expect(s.values[2]).toBe(0);
    expect(s.notes[2]).toBe(bit(4));
    expect(s.mistakes).toBe(1);
    s = act(s, { type: "undo" });
    expect(s.notes[2]).toBe(0);
    expect(applyAction(s, { type: "undo" }).ok).toBe(false);
  });

  test("completar linha, coluna e bloco", () => {
    let s = game();
    // completa a linha 0 menos a última casa
    for (let c = 0; c < 8; c++) if (!s.values[c]) s = act(s, { type: "set", cell: c, value: s.solution[c] });
    expect(s.last?.completed).toEqual([]);
    s = act(s, { type: "set", cell: 8, value: s.solution[8] });
    expect(s.last?.completed).toContainEqual({ kind: "row", index: 0 });
  });

  test("dica corrige número errado primeiro", () => {
    let s = act(game(), { type: "set", cell: 2, value: 1 });
    expect(bestHint(s)).toMatchObject({ cell: 2, value: 4, reason: { kind: "wrong" } });
    s = act(s, { type: "hint" });
    expect(s.values[2]).toBe(4);
    expect(s.hints).toBe(1);
    expect(s.mistakes).toBe(1);
  });

  test("dica aponta a unidade do único escondido", () => {
    const h = bestHint(game())!;
    expect(h.value).toBe(S.charCodeAt(h.cell) - 48);
    if (h.reason.kind === "unit") expect(UNITS.some((u) => u.includes(h.cell))).toBe(true);
  });

  test("vence ao preencher tudo certo", () => {
    let s = game();
    for (let i = 0; i < SIZE; i++) if (!s.values[i]) s = act(s, { type: "set", cell: i, value: s.solution[i] });
    expect(s.won).toBe(true);
    expect(remaining(s, 5)).toBe(0);
    expect(applyAction(s, { type: "set", cell: 2, value: 1 }).ok).toBe(false);
  });
});

describe("simulação", () => {
  // só dicas, em todos os níveis: precisa sempre terminar e nunca revelar sem lógica
  test("centenas de partidas resolvidas só com dicas", () => {
    let reveals = 0;
    for (let n = 0; n < 200; n++) {
      const d = DIFFICULTIES[n % 4];
      let s = newGame(d, 1000 + n);
      const rng = mulberry32(n);
      let guard = 0;
      while (!s.won) {
        // de vez em quando erra ou anota, como um jogador
        const empty = s.values.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
        const cell = empty[Math.floor(rng() * empty.length)];
        const r = rng();
        if (r < 0.05 && !s.lost) {
          const wrong = ((s.solution[cell] % 9) + 1) as number;
          s = act(s, { type: "set", cell, value: wrong });
        } else if (r < 0.1) s = act(s, { type: "note", cell, value: 1 + Math.floor(rng() * 9) });
        if (s.lost) s = act(s, { type: "revive" });
        s = act(s, { type: "hint" });
        if (s.last?.reason?.kind === "reveal") reveals++;
        if (++guard > 400) throw new Error("não terminou");
      }
      expect(s.values).toEqual(s.solution);
    }
    expect(reveals).toBe(0);
  }, 120_000);
});
