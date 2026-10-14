import { describe, expect, test } from "bun:test";
import {
  applyAction,
  BASE,
  cellOf,
  decide,
  HOME,
  HOME_CELLS,
  newGame,
  placementOf,
  SAFE,
  seatColors,
  startOf,
  threatsTo,
  TRACK_CELLS,
  trackIndex,
  viewFor,
  type Action,
  type GameState,
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

/** rng que faz o dado dar `n`. */
const dieIs = (n: number) => () => (n - 1) / 6 + 0.01;

function ok(r: ReturnType<typeof applyAction>): GameState {
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

/** Partida com vermelho (lugar 0) começando e as peças dadas por cor. */
function game(players: number[], pieces: Partial<Record<number, number[]>> = {}): GameState {
  const s = newGame(() => 0, players);
  for (const [c, ps] of Object.entries(pieces)) s.pieces[Number(c)] = [...ps!, ...Array(4 - ps!.length).fill(BASE)];
  return s;
}

const seat = (s: GameState) => s.order[s.turn];
const roll = (s: GameState, n: number) => ok(applyAction(s, { type: "roll", seat: seat(s) }, dieIs(n)));
const move = (s: GameState, piece: number) => ok(applyAction(s, { type: "move", seat: seat(s), piece }));

describe("tabuleiro", () => {
  test("circuito de 52 casas vizinhas, sem repetir, e retas finais ligadas à última casa de cada cor", () => {
    expect(TRACK_CELLS.length).toBe(52);
    expect(new Set(TRACK_CELLS.map((c) => c.join())).size).toBe(52);
    const near = (a: readonly number[], b: readonly number[]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) <= 2 && (a[0] === b[0] || a[1] === b[1] || Math.abs(a[0] - b[0]) === 1);
    for (let i = 0; i < 52; i++) expect(near(TRACK_CELLS[i], TRACK_CELLS[(i + 1) % 52])).toBe(true);
    for (let c = 0; c < 4; c++) {
      const last = cellOf(c, 50)!;
      const first = HOME_CELLS[c][0];
      expect(Math.abs(last[0] - first[0]) + Math.abs(last[1] - first[1])).toBe(1);
      expect(cellOf(c, 55)).toEqual(HOME_CELLS[c][4]);
    }
    expect(TRACK_CELLS[startOf(1)]).toEqual([1, 8]);
  });

  test("8 casas seguras: saídas e estrelas", () => {
    expect([...SAFE].sort((a, b) => a - b)).toEqual([0, 8, 13, 21, 26, 34, 39, 47]);
  });

  test("com 2 jogadores, cores opostas", () => {
    expect(seatColors([0, 1])).toEqual([0, 2, null, null]);
    expect(seatColors([1, 3])).toEqual([null, 1, null, 3]);
    expect(seatColors([0, 1, 2])).toEqual([0, 1, 2, null]);
  });
});

describe("regras", () => {
  test("sai da base com 1 ou 6; com outro número a vez passa", () => {
    let s = roll(game([0, 1, 2, 3]), 3);
    expect(s.phase).toBe("pass");
    expect(s.passReason).toBe("noMoves");
    s = ok(applyAction(s, { type: "advance" }));
    expect(seat(s)).toBe(1);

    s = roll(s, 1);
    expect(viewFor(s, 1).movable).toEqual([0, 1, 2, 3]);
    s = move(s, 2);
    expect(s.pieces[1][2]).toBe(0);
    expect(seat(s)).toBe(2); // 1 não dá jogada extra
  });

  test("6 joga de novo; sem lance com 6, rola de novo; o 3º seis perde a vez", () => {
    let s = roll(game([0, 1]), 6);
    s = move(s, 0);
    expect(seat(s)).toBe(0);
    expect(s.phase).toBe("roll");
    s = roll(s, 6);
    s = move(s, 0);
    expect(s.pieces[0][0]).toBe(6);
    s = roll(s, 6);
    expect(s.phase).toBe("pass");
    expect(s.passReason).toBe("threeSixes");
    s = ok(applyAction(s, { type: "advance" }));
    expect(seat(s)).toBe(1);
    expect(s.sixes).toBe(0);
  });

  test("6 sem peça que ande: rola de novo", () => {
    let s = game([0, 1], { 0: [HOME, HOME, HOME, 53] });
    s = roll(s, 6);
    expect(s.passReason).toBe("noMoves");
    s = ok(applyAction(s, { type: "advance" }));
    expect(seat(s)).toBe(0);
    expect(s.phase).toBe("roll");
    expect(s.sixes).toBe(1);
  });

  test("captura manda a peça à base e dá jogada extra", () => {
    // amarelo (cor 2) na casa 30 do circuito = progresso 4 dele; vermelho em 27 anda 3
    let s = game([0, 1], { 0: [27], 2: [4] });
    s = roll(s, 3);
    s = move(s, 0);
    expect(s.pieces[2][0]).toBe(BASE);
    expect(s.moves.at(-1)!.captured).toEqual([{ color: 2, piece: 0, from: 4 }]);
    expect(s.stats[0].captures).toBe(1);
    expect(s.stats[1].lost).toBe(1);
    expect(seat(s)).toBe(0);
    expect(s.phase).toBe("roll");
  });

  test("captura leva todas as peças da casa (sem bloqueio)", () => {
    let s = game([0, 1], { 0: [27], 2: [4, 4] });
    s = roll(s, 3);
    s = move(s, 0);
    expect(s.pieces[2].slice(0, 2)).toEqual([BASE, BASE]);
  });

  test("na casa segura não há captura", () => {
    // estrela do vermelho: progresso 8; amarelo parado lá (progresso 34 dele)
    expect(trackIndex(2, 34)).toBe(8);
    let s = game([0, 1], { 0: [5], 2: [34] });
    s = roll(s, 3);
    s = move(s, 0);
    expect(s.pieces[2][0]).toBe(34);
    expect(seat(s)).toBe(1);
  });

  test("peça passa por cima de duas da mesma cor (sem bloqueio)", () => {
    let s = game([0, 1], { 0: [10], 2: [40, 40] });
    expect(trackIndex(2, 40)).toBe(14);
    s = roll(s, 5);
    s = move(s, 0);
    expect(s.pieces[0][0]).toBe(15);
  });

  test("reta final não tem captura e chegada exige número exato", () => {
    let s = game([0, 1], { 0: [53, 20] });
    s = roll(s, 4);
    expect(viewFor(s, 0).movable).toEqual([1]); // 53 + 4 passa da chegada
    s = game([0, 1], { 0: [53] });
    s = roll(s, 3);
    s = move(s, 0);
    expect(s.pieces[0][0]).toBe(HOME);
    expect(seat(s)).toBe(0); // chegada dá jogada extra
  });

  test("quem leva as 4 peças vence na hora", () => {
    let s = game([0, 1, 2], { 0: [HOME, HOME, HOME, 50], 1: [HOME, 10] });
    s = roll(s, 6);
    s = move(s, 3);
    expect(s.phase).toBe("gameOver");
    expect(s.winner).toBe(0);
    expect(s.scores[0]).toBe(1);
    expect(placementOf(s, 0)).toBe(1);
    expect(placementOf(s, 1)).toBe(2);
    expect(placementOf(s, 2)).toBe(3);
    expect(applyAction(s, { type: "roll", seat: 1 }).ok).toBe(false);
  });

  test("virada: marca quem está com 0 na chegada quando um adversário tem 3", () => {
    let s = game([0, 1], { 0: [HOME, HOME, 53], 2: [10] });
    s = roll(s, 3);
    s = move(s, 2);
    expect(s.stats[1].trailed).toBe(true);
    expect(s.stats[0].trailed).toBe(false);
  });

  test("valida vez e fase", () => {
    const s = game([0, 1]);
    expect(applyAction(s, { type: "roll", seat: 1 }).ok).toBe(false);
    expect(applyAction(s, { type: "move", seat: 0, piece: 0 }).ok).toBe(false);
    expect(applyAction(s, { type: "advance" }).ok).toBe(false);
    const r = roll(s, 6);
    expect(applyAction(r, { type: "roll", seat: 0 }).ok).toBe(false);
    expect(applyAction(r, { type: "move", seat: 0, piece: 9 }).ok).toBe(false);
  });

  test("De novo: placar mantido e quem começa passa ao próximo", () => {
    const a = newGame(() => 0, [0, 2, 3]);
    expect(a.starter).toBe(0);
    expect(a.order).toEqual([0, 2, 3]);
    const b = newGame(() => 0, [0, 2, 3], { ...a, scores: [1, 0, 2, 0] });
    expect(b.starter).toBe(2);
    expect(b.order).toEqual([2, 3, 0]);
    expect(b.scores).toEqual([1, 0, 2, 0]);
    expect(b.gameNo).toBe(2);
  });
});

describe("IA", () => {
  test("captura quando dá", () => {
    let s = game([0, 1], { 0: [27, 3], 2: [4] });
    s = roll(s, 3);
    expect(decide(viewFor(s, 0), () => 0)).toEqual({ type: "move", seat: 0, piece: 0 });
  });

  test("foge da peça ameaçada", () => {
    // amarelo a 2 casas atrás da peça 0 do vermelho; a peça 1 está tranquila
    let s = game([0, 1], { 0: [20, 40], 2: [44] });
    expect(threatsTo(s, 0, trackIndex(0, 20))).toBe(1);
    s = roll(s, 5);
    expect(decide(viewFor(s, 0), () => 0)).toEqual({ type: "move", seat: 0, piece: 0 });
  });

  test("rola quando é a vez", () => {
    expect(decide(viewFor(game([0, 1]), 0))).toEqual({ type: "roll", seat: 0 });
    expect(decide(viewFor(game([0, 1]), 1))).toBeNull();
  });
});

describe("simulação", () => {
  test("300 partidas só com IAs terminam com um vencedor", () => {
    for (let g = 0; g < 300; g++) {
      const rng = seeded(g + 1);
      const players = [[0, 1], [0, 1, 2], [0, 1, 2, 3], [1, 3]][g % 4];
      let s = newGame(rng, players);
      for (let steps = 0; s.phase !== "gameOver"; steps++) {
        if (steps > 5000) throw new Error(`partida ${g} travada`);
        let a: Action | null;
        if (s.phase === "pass") a = { type: "advance" };
        else a = decide(viewFor(s, s.order[s.turn]), rng);
        if (!a) throw new Error("ninguém pode agir");
        s = ok(applyAction(s, a, rng));
        if (s.pieces.flat().some((x) => x < BASE || x > HOME)) throw new Error("peça fora do tabuleiro");
      }
      expect(s.players).toContain(s.winner!);
      expect(s.pieces[s.colorOf[s.winner!]!].every((x) => x === HOME)).toBe(true);
    }
  });

  test("a IA vence a jogada aleatória com folga", () => {
    let aiWins = 0;
    for (let g = 0; g < 200; g++) {
      const rng = seeded(1000 + g);
      let s = newGame(rng, [0, 1]);
      while (s.phase !== "gameOver") {
        const cur = s.order[s.turn];
        let a: Action | null;
        if (s.phase === "pass") a = { type: "advance" };
        else if (cur === 1 && s.phase === "move") {
          const v = viewFor(s, 1);
          a = { type: "move", seat: 1, piece: v.movable[Math.floor(rng() * v.movable.length)] };
        } else a = decide(viewFor(s, cur), rng);
        s = ok(applyAction(s, a!, rng));
      }
      if (s.winner === 0) aiWins++;
    }
    expect(aiWins).toBeGreaterThan(120);
  });
});
