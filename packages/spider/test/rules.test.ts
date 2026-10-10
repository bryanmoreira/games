import { describe, expect, test } from "bun:test";
import {
  applyAction,
  bestHint,
  canDeal,
  cardOf,
  DECK_SIZE,
  hints,
  isRun,
  legalMoves,
  mulberry32,
  newGame,
  RANK_LABEL,
  scoreOf,
  SUIT_SETS,
  targetsFor,
  type Action,
  type GameState,
  type Suit,
  type SuitCount,
} from "../src";

const SUIT_CHAR: Record<string, Suit> = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };

/**
 * Monta uma mesa à mão. Cartas como "Ks", "10h", "As"; "#" antes da carta = virada para baixo.
 * Colunas não informadas ficam com uma carta qualquer, e o resto das cartas vai para o monte.
 */
function board(suits: SuitCount, cols: string[][], opts: { stock?: boolean; done?: number } = {}): GameState {
  const free = new Set(Array.from({ length: DECK_SIZE }, (_, i) => i));
  const take = (label: string): number => {
    const rank = RANK_LABEL.indexOf(label.slice(0, -1));
    const suit = SUIT_CHAR[label.slice(-1)];
    for (const id of free) {
      const c = cardOf(id, suits);
      if (c.rank === rank && c.suit === suit) {
        free.delete(id);
        return id;
      }
    }
    throw new Error(`sem carta ${label}`);
  };
  const done: number[][] = [];
  for (let d = 0; d < (opts.done ?? 0); d++) done.push(["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A"].map((r) => take(r + "s")));
  const ids = cols.map((c) => c.map((l) => take(l.replace("#", ""))));
  const hidden = cols.map((c) => c.filter((l) => l.startsWith("#")).length);
  while (ids.length < 10) {
    const filler = [...free].pop();
    if (filler !== undefined) free.delete(filler);
    ids.push(filler === undefined ? [] : [filler]);
    hidden.push(0);
  }
  // o resto vai para o monte (múltiplo de 10); o que sobra fica fora do jogo
  const rest = [...free];
  const stock = opts.stock === false ? [] : rest.slice(0, Math.min(50, rest.length - (rest.length % 10)));
  return {
    suits,
    seed: 0,
    cols: ids,
    hidden,
    stock,
    done,
    moves: 0,
    history: [],
    won: false,
    last: null,
  };
}

function act(s: GameState, a: Action): GameState {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

function allIds(s: GameState): number[] {
  return [...s.cols.flat(), ...s.stock, ...s.done.flat()];
}

function checkInvariants(s: GameState) {
  const ids = allIds(s);
  expect(ids.length).toBe(DECK_SIZE);
  expect(new Set(ids).size).toBe(DECK_SIZE);
  s.cols.forEach((c, i) => {
    expect(s.hidden[i]).toBeGreaterThanOrEqual(0);
    // a carta de cima está sempre virada
    if (c.length) expect(s.hidden[i]).toBeLessThan(c.length);
    else expect(s.hidden[i]).toBe(0);
  });
  expect(s.stock.length % 10).toBe(0);
  for (const run of s.done) if (run.length === 13) expect(run.map((id) => cardOf(id, s.suits).rank)).toEqual([13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
}

describe("baralho", () => {
  test("104 cartas: 8 naipes completos, repetidos conforme a dificuldade", () => {
    for (const suits of [1, 2, 4] as SuitCount[]) {
      const cards = Array.from({ length: DECK_SIZE }, (_, i) => cardOf(i, suits));
      for (const suit of SUIT_SETS[suits]) {
        for (let rank = 1; rank <= 13; rank++)
          expect(cards.filter((c) => c.suit === suit && c.rank === rank).length).toBe(8 / suits);
      }
    }
  });

  test("mesma semente, mesmo embaralhamento", () => {
    expect(newGame(4, 42).cols).toEqual(newGame(4, 42).cols);
    expect(newGame(4, 42).cols).not.toEqual(newGame(4, 43).cols);
  });
});

describe("início", () => {
  test("4 colunas com 6, 6 com 5, só a de cima virada, 50 no monte", () => {
    const s = newGame(2, 7);
    expect(s.cols.map((c) => c.length)).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    expect(s.hidden).toEqual([5, 5, 5, 5, 4, 4, 4, 4, 4, 4]);
    expect(s.stock.length).toBe(50);
    expect(scoreOf(s)).toBe(500);
    checkInvariants(s);
  });
});

describe("movimentos", () => {
  test("carta vai sobre outra um ponto acima, de qualquer naipe", () => {
    const s = board(4, [["9h"], ["8s"]]);
    const n = act(s, { type: "move", from: 1, index: 0, to: 0 });
    expect(n.cols[0].map((id) => cardOf(id, 4).rank)).toEqual([9, 8]);
    expect(n.cols[1]).toEqual([]);
  });

  test("não vai sobre carta que não é um ponto acima", () => {
    const s = board(4, [["10h"], ["8s"]]);
    expect(applyAction(s, { type: "move", from: 1, index: 0, to: 0 }).ok).toBe(false);
  });

  test("grupo do mesmo naipe em ordem move junto", () => {
    const s = board(4, [["Kd"], ["Qs", "Js", "10s"]]);
    expect(isRun(s, 1, 0)).toBe(true);
    const n = act(s, { type: "move", from: 1, index: 0, to: 0 });
    expect(n.cols[0].length).toBe(4);
  });

  test("grupo de naipes misturados não move junto, só a parte de cima", () => {
    const s = board(4, [["Kd"], ["Qs", "Jh", "10h"], ["Qc"]]);
    expect(isRun(s, 1, 0)).toBe(false);
    expect(applyAction(s, { type: "move", from: 1, index: 0, to: 0 }).ok).toBe(false);
    expect(isRun(s, 1, 1)).toBe(true);
    expect(act(s, { type: "move", from: 1, index: 1, to: 2 }).cols[2].length).toBe(3);
  });

  test("carta virada para baixo não move", () => {
    const s = board(4, [["#9h", "3c"], ["10s"]]);
    expect(applyAction(s, { type: "move", from: 0, index: 0, to: 1 }).ok).toBe(false);
  });

  test("coluna vazia aceita qualquer carta ou grupo", () => {
    const s = board(4, [[], ["#4d", "7s", "6s", "5s"]]);
    expect(targetsFor(s, 1, 1)).toContain(0);
    const n = act(s, { type: "move", from: 1, index: 1, to: 0 });
    expect(n.cols[0].length).toBe(3);
  });

  test("carta descoberta vira para cima", () => {
    const s = board(4, [["#3c", "#4d", "9h"], ["10s"]]);
    const n = act(s, { type: "move", from: 0, index: 2, to: 1 });
    expect(n.hidden[0]).toBe(1);
    expect(n.cols[0].length).toBe(2);
  });

  test("cada jogada custa 1 ponto", () => {
    const s = board(4, [["9h"], ["8s"]]);
    const n = act(s, { type: "move", from: 1, index: 0, to: 0 });
    expect(n.moves).toBe(1);
    expect(scoreOf(n)).toBe(499);
  });
});

describe("sequência completa", () => {
  const RUN = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

  test("K até A do mesmo naipe sai da mesa e vale 100", () => {
    const s = board(4, [["#5d", ...RUN.map((r) => r + "h")], ["Ah"]]);
    const n = act(s, { type: "move", from: 1, index: 0, to: 0 });
    expect(n.done.at(-1)!.map((id) => cardOf(id, 4).rank)).toEqual([13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
    expect(n.cols[0].length).toBe(1);
    expect(n.hidden[0]).toBe(0); // a carta de baixo virou
    expect(n.last).toMatchObject({ type: "move", completed: 1 });
    expect(scoreOf(n)).toBe(scoreOf(s) - 1 + 100);
  });

  test("K até A de naipes misturados não sai", () => {
    const s = board(4, [[...RUN.map((r, i) => r + (i === 5 ? "s" : "h"))], ["Ah"]]);
    const n = act(s, { type: "move", from: 1, index: 0, to: 0 });
    expect(n.cols[0].length).toBe(13);
    expect(n.last?.completed).toBe(0);
  });

  test("8 sequências = vitória", () => {
    const s = board(1, [[...RUN.map((r) => r + "s")], ["As"]], { done: 7, stock: false });
    const n = act(s, { type: "move", from: 1, index: 0, to: 0 });
    expect(n.done.filter((d) => d.length === 13).length).toBe(8);
    expect(n.won).toBe(true);
    expect(applyAction(n, { type: "deal" }).ok).toBe(false);
  });
});

describe("monte", () => {
  test("distribui uma carta virada em cada coluna", () => {
    const s = newGame(4, 3);
    const n = act(s, { type: "deal" });
    expect(n.stock.length).toBe(40);
    expect(n.cols.map((c) => c.length)).toEqual(s.cols.map((c) => c.length + 1));
    expect(n.hidden).toEqual(s.hidden);
    checkInvariants(n);
  });

  test("não distribui com coluna vazia", () => {
    const s = board(4, [[], ["5s"]]);
    expect(canDeal(s)).toBe(false);
    expect(applyAction(s, { type: "deal" })).toEqual({ ok: false, error: "Preencha as colunas vazias" });
  });

  test("5 distribuições e acabou", () => {
    let s = newGame(4, 5);
    for (let i = 0; i < 5; i++) s = act(s, { type: "deal" });
    expect(s.stock.length).toBe(0);
    expect(applyAction(s, { type: "deal" }).ok).toBe(false);
  });
});

describe("desfazer", () => {
  test("volta a posição, mas a jogada continua contando", () => {
    const s = board(4, [["#3c", "9h"], ["10s"]]);
    const n = act(s, { type: "move", from: 0, index: 1, to: 1 });
    const u = act(n, { type: "undo" });
    expect(u.cols).toEqual(s.cols);
    expect(u.hidden).toEqual(s.hidden);
    expect(u.moves).toBe(2);
    expect(scoreOf(u)).toBe(498);
    expect(u.last?.type).toBe("undo");
  });

  test("desfazer sequência completa devolve os 100 pontos", () => {
    const RUN = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const s = board(4, [[...RUN.map((r) => r + "h")], ["Ah"]]);
    const n = act(s, { type: "move", from: 1, index: 0, to: 0 });
    const u = act(n, { type: "undo" });
    expect(u.done.length).toBe(s.done.length);
    expect(scoreOf(u)).toBe(scoreOf(s) - 2);
  });

  test("sem histórico não desfaz", () => {
    expect(applyAction(newGame(1, 1), { type: "undo" }).ok).toBe(false);
  });

  test("desfazer tudo volta ao começo", () => {
    let s = newGame(2, 11);
    const start = s;
    let steps = 0;
    for (let i = 0; i < 40; i++) {
      const h = bestHint(s);
      if (!h) break;
      s = act(s, h.type === "deal" ? { type: "deal" } : { type: "move", ...h.move });
      steps++;
    }
    for (let i = 0; i < steps; i++) s = act(s, { type: "undo" });
    expect(s.cols).toEqual(start.cols);
    expect(s.stock).toEqual(start.stock);
    expect(s.history.length).toBe(0);
  });
});

describe("dicas", () => {
  test("prefere completar sequência", () => {
    const RUN = ["K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
    const s = board(4, [[...RUN.map((r) => r + "h")], ["Ah"], ["3c", "2d"]]);
    expect(bestHint(s)).toEqual({ type: "move", move: { from: 1, index: 0, to: 0 } });
  });

  test("não sugere desfazer encaixe do mesmo naipe", () => {
    const s = board(4, [["8s", "7s"], ["8h"]]);
    expect(legalMoves(s)).toContainEqual({ from: 0, index: 1, to: 1 });
    expect(hints(s)).not.toContainEqual({ from: 0, index: 1, to: 1 });
  });

  test("prefere juntar do mesmo naipe", () => {
    const s = board(4, [["#2c", "7s"], ["8h"], ["8s"]]);
    expect(hints(s)[0]).toEqual({ from: 0, index: 1, to: 2 });
  });

  test("sem jogada útil, manda distribuir", () => {
    const s = board(4, [["5h"], ["5d"], ["5s"], ["5c"], ["Qh"], ["Qd"], ["Qs"], ["Qc"], ["2h"], ["2d"]]);
    expect(legalMoves(s)).toEqual([]);
    expect(bestHint(s)).toEqual({ type: "deal" });
  });
});

describe("simulação", () => {
  /** Joga seguindo as dicas (às vezes escolhe a 2ª ou 3ª) até vencer ou travar. */
  function play(suits: SuitCount, seed: number) {
    const rng = mulberry32(seed + 999);
    let s = newGame(suits, seed);
    for (let step = 0; step < 3000; step++) {
      checkInvariants(s);
      if (s.won) return { won: true, s };
      const h = hints(s);
      let a: Action | null = null;
      if (h.length) a = { type: "move", ...h[rng() < 0.8 ? 0 : Math.floor(rng() * Math.min(3, h.length))] };
      else {
        const b = bestHint(s);
        if (b) a = b.type === "deal" ? { type: "deal" } : { type: "move", ...b.move };
      }
      if (!a) return { won: false, s };
      // de vez em quando desfaz e refaz, para exercitar o histórico
      if (rng() < 0.03 && s.history.length) s = act(s, { type: "undo" });
      else s = act(s, a);
    }
    throw new Error(`partida ${suits}/${seed} não terminou`);
  }

  for (const suits of [1, 2, 4] as SuitCount[]) {
    test(`200 partidas com ${suits} naipe(s) terminam sem estado inválido`, () => {
      let wins = 0;
      for (let seed = 1; seed <= 200; seed++) if (play(suits, seed).won) wins++;
      if (suits === 1) expect(wins).toBeGreaterThan(0);
      console.log(`${suits} naipe(s): ${wins}/200 vitórias`);
    });
  }
});
