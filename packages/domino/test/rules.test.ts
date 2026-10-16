import { describe, expect, test } from "bun:test";
import {
  applyAction,
  decide,
  endsOf,
  lacks,
  lineOf,
  makeSet,
  newGame,
  openingOf,
  sidesFor,
  tile,
  validPlayers,
  viewFor,
  winType,
  type Action,
  type GameState,
  type Seat,
  type Tile,
} from "../src";

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

function ok(r: ReturnType<typeof applyAction>): GameState {
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

/** Mão montada à mão: `hands[seat]`, mesa vazia, sem saída obrigatória, vez de `turn`. */
function setup(players: Seat[], hands: Record<number, Tile[]>, turn: Seat, stock: Tile[] = []): GameState {
  const s = newGame(seeded(1), players);
  s.hands = [0, 1, 2, 3].map((p) => (hands[p] ?? []).map(([a, b]) => tile(a, b)));
  s.stock = stock.map(([a, b]) => tile(a, b));
  s.opening = null;
  s.turn = turn;
  s.starter = turn;
  return s;
}

const play = (s: GameState, tile: Tile, side?: "left" | "right") => ok(applyAction(s, { type: "play", seat: s.turn, tile, side }));

describe("peças", () => {
  test("28 peças sem repetir, de 0-0 a 6-6", () => {
    const set = makeSet();
    expect(set.length).toBe(28);
    expect(new Set(set.map((t) => t.join())).size).toBe(28);
    expect(set.reduce((n, t) => n + t[0] + t[1], 0)).toBe(168);
  });

  test("mesa: 4 jogadores ou 2 em duplas diferentes", () => {
    expect(validPlayers([0, 1, 2, 3])).toBe(true);
    expect(validPlayers([0, 1])).toBe(true);
    expect(validPlayers([1, 2])).toBe(true);
    expect(validPlayers([0, 2])).toBe(false);
    expect(validPlayers([0, 1, 2])).toBe(false);
  });
});

describe("distribuição e saída", () => {
  test("duplas: 7 para cada, sem monte; sai quem tem a sena, obrigado a jogá-la", () => {
    const s = newGame(seeded(7), [0, 1, 2, 3]);
    expect(s.mode).toBe("duplas");
    expect(s.hands.map((h) => h.length)).toEqual([7, 7, 7, 7]);
    expect(s.stock.length).toBe(0);
    expect(s.opening).toEqual([6, 6]);
    expect(s.hands[s.turn].some((t) => t[0] === 6 && t[1] === 6)).toBe(true);
    const other = s.hands[s.turn].find((t) => !(t[0] === 6 && t[1] === 6))!;
    expect(applyAction(s, { type: "play", seat: s.turn, tile: other }).ok).toBe(false);
    const v = viewFor(s, s.turn);
    expect(v.options.map((o) => o.tile)).toEqual([[6, 6]]);
  });

  test("1×1: 7 para cada e 14 no monte", () => {
    const s = newGame(seeded(3), [0, 1]);
    expect(s.mode).toBe("1x1");
    expect(s.hands.map((h) => h.length)).toEqual([7, 7, 0, 0]);
    expect(s.stock.length).toBe(14);
  });

  test("1×1 sem sena nas mãos: sai a maior carroça; sem carroça, a peça mais pesada", () => {
    expect(openingOf({ players: [0, 1], hands: [[[5, 5], [2, 6]], [[3, 3], [6, 5]], [], []] })).toEqual({ seat: 0, tile: [5, 5] });
    expect(openingOf({ players: [0, 1], hands: [[[1, 6], [2, 4]], [[2, 5], [3, 4]], [], []] })).toEqual({ seat: 0, tile: [1, 6] });
  });

  test("nas mãos seguintes sai quem bateu, com qualquer peça", () => {
    let s = setup([0, 1, 2, 3], { 0: [[1, 2]], 1: [[3, 3]], 2: [[4, 4]], 3: [[5, 5]] }, 0);
    s = play(s, [1, 2]);
    expect(s.phase).toBe("handEnd");
    s = ok(applyAction(s, { type: "advance" }, seeded(9)));
    expect(s.phase).toBe("playing");
    expect(s.handNo).toBe(2);
    expect(s.turn).toBe(0);
    expect(s.opening).toBeNull();
    expect(viewFor(s, 0).options.length).toBe(7);
  });
});

describe("mesa", () => {
  test("encaixa nas pontas; carroça mantém as duas pontas", () => {
    let s = setup([0, 1, 2, 3], { 0: [[6, 6], [0, 0]], 1: [[6, 3], [0, 1]], 2: [[3, 3], [0, 2]], 3: [[6, 1], [0, 3]] }, 0);
    s = play(s, [6, 6]);
    expect(endsOf(s.board)).toEqual([6, 6]);
    s = play(s, [3, 6]);
    expect(endsOf(s.board)).toEqual([6, 3]);
    s = play(s, [3, 3]);
    expect(endsOf(s.board)).toEqual([6, 3]);
    s = play(s, [1, 6], "left");
    expect(endsOf(s.board)).toEqual([1, 3]);
    expect(lineOf(s.board).map((x) => [x.l, x.r])).toEqual([
      [1, 6],
      [6, 6],
      [6, 3],
      [3, 3],
    ]);
  });

  test("peça que entra dos dois lados pede a ponta; pontas iguais não", () => {
    let s = setup([0, 1], { 0: [[2, 5], [0, 0]], 1: [[2, 4], [5, 6], [0, 1]] }, 0);
    s = play(s, [2, 5]);
    // 2-4 só na esquerda; 5-6 só na direita
    expect(sidesFor(s.board, [2, 4])).toEqual(["left"]);
    expect(sidesFor(s.board, [2, 5])).toEqual(["left", "right"]);
    expect(applyAction(s, { type: "play", seat: 1, tile: [2, 4], side: "right" }).ok).toBe(false);
    const b = { first: { tile: [3, 3] as Tile, inner: 3, outer: 3, seat: 0, n: 0 }, left: [], right: [] };
    expect(sidesFor(b, [3, 5])).toEqual(["right"]);
  });

  test("sem lance com o monte vazio passa sozinho e fica registrado com as pontas", () => {
    // 0 sai 6-6; 1 não tem 6 e passa; 2 joga
    let s = setup([0, 1, 2, 3], { 0: [[6, 6], [0, 0]], 1: [[1, 1], [0, 1]], 2: [[6, 2], [0, 2]], 3: [[2, 3], [0, 3]] }, 0);
    s = play(s, [6, 6]);
    expect(s.turn).toBe(2);
    expect(s.events.at(-1)).toEqual({ kind: "pass", seat: 1, ends: [6, 6] });
    expect(lacks(s)[1].has(6)).toBe(true);
  });

  test("1×1: sem peça compra até poder jogar; não compra tendo peça", () => {
    let s = setup([0, 1], { 0: [[6, 6], [0, 0]], 1: [[1, 1], [2, 2]] }, 0, [[3, 4], [6, 1], [4, 5]]);
    s = play(s, [6, 6]);
    expect(s.turn).toBe(1);
    expect(viewFor(s, 1).canDraw).toBe(true);
    s = ok(applyAction(s, { type: "draw", seat: 1 })); // 4-5: não serve
    expect(s.turn).toBe(1);
    expect(s.hands[1].length).toBe(3);
    s = ok(applyAction(s, { type: "draw", seat: 1 })); // 1-6: serve
    expect(viewFor(s, 1).canDraw).toBe(false);
    expect(applyAction(s, { type: "draw", seat: 1 }).ok).toBe(false);
    expect(viewFor(s, 1).options.map((o) => o.tile)).toEqual([[1, 6]]);
  });
});

describe("pontuação", () => {
  test("tipos de batida", () => {
    expect(winType([2, 3], [5, 3])).toBe("simples");
    expect(winType([4, 4], [4, 1])).toBe("carroca");
    expect(winType([2, 5], [5, 2])).toBe("laelo");
    expect(winType([2, 5], [2, 5])).toBe("laelo");
    expect(winType([3, 3], [3, 3])).toBe("cruzada");
    // pontas iguais com peça comum não é lá-e-lô
    expect(winType([3, 5], [3, 3])).toBe("simples");
  });

  test("batida soma para a dupla e conta para quem bateu", () => {
    let s = setup([0, 1, 2, 3], { 0: [[6, 6], [6, 1]], 1: [[1, 1], [0, 1]], 2: [[6, 2], [2, 2]], 3: [[2, 3], [0, 3]] }, 0);
    s = play(s, [6, 6]); // 1 passa
    s = play(s, [2, 6]); // 2
    s = play(s, [2, 3], "right"); // 3: pontas 6 | 3
    s = play(s, [1, 6], "left"); // 0 bate: última 1-6 → simples
    expect(s.result).toMatchObject({ kind: "batida", seat: 0, team: 0, win: "simples", points: 1 });
    expect(s.scores).toEqual([1, 0]);
    expect(s.stats[0].wins.simples).toBe(1);
  });

  test("cruzada vale 4 e carroça vale 2", () => {
    const b = (l: number, r: number) => ({
      first: { tile: [Math.min(l, r), Math.max(l, r)] as Tile, inner: l, outer: r, seat: 0, n: 0 },
      left: [],
      right: [],
    });
    let s = setup([0, 1], { 0: [[4, 4]], 1: [[0, 0]] }, 0);
    s.board = b(4, 4);
    s.board.first!.tile = [4, 4];
    s = play(s, [4, 4]);
    expect(s.result).toMatchObject({ win: "cruzada", points: 4 });

    let t = setup([0, 1], { 0: [[4, 4]], 1: [[0, 0]] }, 0);
    t.board = b(4, 1);
    t = play(t, [4, 4]);
    expect(t.result).toMatchObject({ win: "carroca", points: 2 });
  });

  test("jogo fechado: menos pontos na mão marca 1; empate não marca", () => {
    // na mesa todas as peças com 0 menos a 0-0; jogando a 0-0 as pontas ficam 0 | 0 e ninguém tem 0
    const closing = (hands: Tile[][]) => {
      const s = setup([0, 1, 2, 3], {}, 0);
      s.board = {
        first: { tile: [0, 1], inner: 0, outer: 0, seat: 0, n: 0 },
        left: [],
        right: [2, 3, 4, 5, 6].map((b, i) => ({ tile: [0, b] as Tile, inner: 0, outer: 0, seat: 0, n: i + 1 })),
      };
      s.hands = hands;
      return play(s, [0, 0]);
    };
    const f = closing([[[0, 0], [3, 3]], [[5, 6]], [[1, 2]], [[6, 6]]]);
    // dupla 0: 3-3 + 1-2 = 9; dupla 1: 5-6 + 6-6 = 23
    expect(f.result).toMatchObject({ kind: "fechado", seat: 0, team: 0, points: 1, pips: [9, 23] });
    expect(f.scores).toEqual([1, 0]);
    expect(f.stats[0].closed).toBe(1);
    expect(f.doubled).toBe(false);

    const e = closing([[[0, 0], [2, 3]], [[1, 4]], [[2, 2]], [[1, 3]]]);
    expect(e.result).toMatchObject({ kind: "fechado", team: null, points: 0, pips: [9, 9] });
    expect(e.scores).toEqual([0, 0]);
    expect(e.doubled).toBe(true);
    // a mão seguinte sai com quem fechou
    const next = ok(applyAction(e, { type: "advance" }, seeded(4)));
    expect(next.turn).toBe(0);
    expect(next.doubled).toBe(true);
  });

  test("empate no fechado: a mão seguinte vale o dobro", () => {
    let s = setup([0, 1, 2, 3], { 0: [[1, 2]], 1: [[3, 3]], 2: [[4, 4]], 3: [[5, 5]] }, 0);
    s.doubled = true;
    s = play(s, [1, 2]);
    expect(s.result).toMatchObject({ points: 2, doubled: true });
    expect(s.doubled).toBe(false);
  });

  test("partida acaba ao chegar a 6; o fim espera o advance", () => {
    let s = setup([0, 1, 2, 3], { 0: [[1, 2]], 1: [[3, 3]], 2: [[4, 4]], 3: [[5, 5]] }, 0);
    s.scores = [5, 0];
    s = play(s, [1, 2]);
    expect(s.winner).toBe(0);
    expect(s.phase).toBe("handEnd");
    s = ok(applyAction(s, { type: "advance" }));
    expect(s.phase).toBe("gameOver");
  });

  test("guarda a maior desvantagem de cada dupla", () => {
    let s = setup([0, 1, 2, 3], { 1: [[1, 2]], 0: [[3, 3]], 2: [[4, 4]], 3: [[5, 5]] }, 1);
    s.scores = [0, 3];
    s.maxDeficit = [3, 0];
    s = play(s, [1, 2]);
    expect(s.scores).toEqual([0, 4]);
    expect(s.maxDeficit).toEqual([4, 0]);
  });
});

describe("visão", () => {
  test("esconde as mãos alheias e abre todas no fim da mão", () => {
    const s = newGame(seeded(11), [0, 1, 2, 3]);
    const v = viewFor(s, 0);
    expect(v.myHand).toEqual(s.hands[0]);
    expect(v.handCounts).toEqual([7, 7, 7, 7]);
    expect(v.revealed).toBeNull();
    expect(JSON.stringify(v)).not.toContain(JSON.stringify(s.hands[1]));
  });
});

describe("IA", () => {
  test("bate quando pode", () => {
    const s = setup([0, 1, 2, 3], { 0: [[1, 2]], 1: [[3, 3], [1, 1]], 2: [[4, 4], [1, 1]], 3: [[5, 5], [1, 1]] }, 0);
    expect(decide(viewFor(s, 0))).toMatchObject({ type: "play", tile: [1, 2] });
  });

  test("compra quando não tem jogo", () => {
    let s = setup([0, 1], { 0: [[6, 6], [0, 0]], 1: [[1, 1], [2, 2]] }, 0, [[3, 4]]);
    s = play(s, [6, 6]);
    expect(decide(viewFor(s, 1))).toEqual({ type: "draw", seat: 1 });
  });

  test("não joga fora da vez", () => {
    const s = newGame(seeded(5), [0, 1, 2, 3]);
    const other = ((s.turn + 1) % 4) as Seat;
    expect(decide(viewFor(s, other))).toBeNull();
  });
});

/** Partida inteira só com IAs; devolve o estado final e o número de passos. */
function simulate(players: Seat[], seed: number) {
  const rng = seeded(seed);
  let s = newGame(rng, players);
  let steps = 0;
  while (s.phase !== "gameOver") {
    if (++steps > 5000) throw new Error("partida travou");
    let a: Action | null;
    if (s.phase === "handEnd") a = { type: "advance" };
    else a = decide(viewFor(s, s.turn), rng);
    if (!a) throw new Error(`ninguém age (vez de ${s.turn})`);
    const r = applyAction(s, a, rng);
    if (!r.ok) throw new Error(r.error);
    // conservação: as 28 peças estão sempre em algum lugar, sem repetir
    const all = [
      ...r.state.hands.flat(),
      ...r.state.stock,
      ...(r.state.board.first ? [r.state.board.first.tile] : []),
      ...r.state.board.left.map((p) => p.tile),
      ...r.state.board.right.map((p) => p.tile),
    ];
    if (new Set(all.map((t) => t.join())).size !== 28 || all.length !== 28) throw new Error("peças sumiram");
    s = r.state;
  }
  return s;
}

describe("simulação", () => {
  test("300 partidas em duplas e 300 no 1×1 terminam com um vencedor", () => {
    const kinds = { batida: 0, fechado: 0 };
    for (const players of [[0, 1, 2, 3], [0, 1]] as Seat[][]) {
      for (let i = 0; i < 300; i++) {
        const s = simulate(players, i + 1);
        expect(s.winner).not.toBeNull();
        expect(Math.max(...s.scores)).toBeGreaterThanOrEqual(6);
        kinds[s.result!.kind]++;
      }
    }
    expect(kinds.batida).toBeGreaterThan(0);
  }, 60_000);

  test("a IA ganha bem mais do que perde de quem joga a primeira peça que encaixa", () => {
    let wins = 0;
    const N = 200;
    for (let i = 0; i < N; i++) {
      const rng = seeded(1000 + i);
      let s = newGame(rng, [0, 1, 2, 3]);
      while (s.phase !== "gameOver") {
        let a: Action | null;
        if (s.phase === "handEnd") a = { type: "advance" };
        else {
          const v = viewFor(s, s.turn);
          if (s.turn % 2 === 0) a = decide(v, rng);
          else a = v.canDraw ? { type: "draw", seat: s.turn } : { type: "play", seat: s.turn, tile: v.options[0].tile, side: v.options[0].sides[0] };
        }
        s = ok(applyAction(s, a!, rng));
      }
      if (s.winner === 0) wins++;
    }
    expect(wins / N).toBeGreaterThan(0.55);
  }, 60_000);
});
