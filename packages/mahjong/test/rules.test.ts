import { describe, expect, test } from "bun:test";
import {
  applyAction,
  deal,
  expand,
  gameFrom,
  getLayout,
  goneOf,
  groupOf,
  isFree,
  isLayout,
  KINDS,
  LAYOUT_IDS,
  matches,
  moves,
  mulberry32,
  newGame,
  remaining,
  TILE_COUNT,
  validPlan,
  type GameState,
} from "../src";

const play = (s: GameState, a: Parameters<typeof applyAction>[1]) => {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};

describe("formatos", () => {
  test("32 formatos, todos com 144 casas sem peça sobreposta", () => {
    expect(LAYOUT_IDS).toHaveLength(32);
    expect(new Set(LAYOUT_IDS).size).toBe(32);
    for (const id of LAYOUT_IDS) {
      const l = getLayout(id);
      expect(l.slots).toHaveLength(TILE_COUNT);
      const seen = new Set<string>();
      for (const s of l.slots) {
        // duas peças do mesmo andar não podem se encostar por dentro
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) expect(seen.has(`${s.z}/${s.x + dx}/${s.y + dy}`)).toBe(false);
        seen.add(`${s.z}/${s.x}/${s.y}`);
      }
    }
  });

  test("tartaruga: 5 andares, a peça do topo e as das pontas começam livres", () => {
    const l = getLayout("tartaruga");
    expect(l.depth).toBe(5);
    const gone = l.slots.map(() => false);
    const top = l.slots.findIndex((s) => s.z === 4);
    expect(isFree(l, gone, top)).toBe(true);
    // a peça do meio do primeiro andar começa presa
    const mid = l.slots.findIndex((s) => s.z === 0 && s.x === 14 && s.y === 6);
    expect(isFree(l, gone, mid)).toBe(false);
    const leftEnd = l.slots.findIndex((s) => s.z === 0 && s.x === 0);
    expect(isFree(l, gone, leftEnd)).toBe(true);
  });

  test("forma compacta: coluna solta e repetição de 2 em 2", () => {
    expect(expand([[0, [[0, [[2, 3], 10]]]]])).toEqual([
      { x: 2, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 6, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
    ]);
  });

  test("isLayout", () => {
    expect(isLayout("tartaruga")).toBe(true);
    expect(isLayout("turtle")).toBe(false);
    expect(isLayout(3)).toBe(false);
  });
});

describe("peças", () => {
  test("flores com flores, estações com estações, o resto só com o igual", () => {
    expect(KINDS).toBe(42);
    expect(matches(34, 37)).toBe(true);
    expect(matches(38, 41)).toBe(true);
    expect(matches(37, 38)).toBe(false);
    expect(matches(5, 5)).toBe(true);
    expect(matches(5, 6)).toBe(false);
  });

  test("o sorteio usa as 144 peças: 4 de cada tipo comum e 1 de cada flor e estação", () => {
    const { kinds } = deal("tartaruga", 1);
    const count = new Map<number, number>();
    for (const k of kinds) count.set(k, (count.get(k) ?? 0) + 1);
    for (let k = 0; k < 34; k++) expect(count.get(k)).toBe(4);
    for (let k = 34; k < 42; k++) expect(count.get(k)).toBe(1);
  });

  test("mesmo seed, mesma mesa", () => {
    expect(deal("dragao", 42)).toEqual(deal("dragao", 42));
    expect(deal("dragao", 42).kinds).not.toEqual(deal("dragao", 43).kinds);
  });
});

describe("jogadas", () => {
  test("par livre e igual sai; preso ou diferente não", () => {
    let s = gameFrom({ layout: "tartaruga", seed: 7, ...deal("tartaruga", 7) });
    expect(s.plan).toEqual(deal("tartaruga", 7).solution);
    const [a, b] = moves(s)[0];
    s = play(s, { type: "pair", a, b });
    expect(remaining(s)).toBe(142);
    expect(applyAction(s, { type: "pair", a, b }).ok).toBe(false);

    const l = getLayout("tartaruga");
    const gone = goneOf(s);
    const stuck = l.slots.findIndex((_, i) => !gone[i] && !isFree(l, gone, i));
    const twin = s.kinds.findIndex((k, i) => i !== stuck && !gone[i] && matches(k, s.kinds[stuck]));
    expect(applyAction(s, { type: "pair", a: stuck, b: twin }).ok).toBe(false);

    const free = moves(s).flat();
    const odd = free.find((i) => free.some((j) => !matches(s.kinds[i], s.kinds[j])))!;
    const other = free.find((j) => !matches(s.kinds[odd], s.kinds[j]))!;
    expect(applyAction(s, { type: "pair", a: odd, b: other }).ok).toBe(false);
    expect(applyAction(s, { type: "pair", a: odd, b: odd }).ok).toBe(false);
  });

  test("desfazer devolve o último par e conta", () => {
    let s = newGame("ponte", 3);
    const [a, b] = moves(s)[0];
    s = play(s, { type: "pair", a, b });
    s = play(s, { type: "undo" });
    expect(s.removed).toEqual([]);
    expect(s.undos).toBe(1);
    expect(s.last).toMatchObject({ type: "undo", a, b });
    expect(validPlan(getLayout("ponte"), s.kinds, goneOf(s), s.plan!)).toBe(true);
    expect(applyAction(s, { type: "undo" }).ok).toBe(false);
  });

  test("dica aponta um par que dá para tirar e conta", () => {
    let s = newGame("tartaruga", 11);
    s = play(s, { type: "hint" });
    expect(s.hints).toBe(1);
    const last = s.last as { a: number; b: number };
    expect(applyAction(s, { type: "pair", a: last.a, b: last.b }).ok).toBe(true);
  });

  test("embaralhar troca as peças que sobram, sem mexer nas que saíram", () => {
    let s = newGame("tartaruga", 5);
    for (let k = 0; k < 10; k++) {
      const [a, b] = moves(s)[0];
      s = play(s, { type: "pair", a, b });
    }
    const t = play(s, { type: "shuffle", seed: 99 });
    expect(t.shuffles).toBe(1);
    for (const i of s.removed) expect(t.kinds[i]).toBe(s.kinds[i]);
    const multiset = (g: GameState) => g.kinds.filter((_, i) => !g.removed.includes(i)).map(groupOf).sort((x, y) => x - y);
    expect(multiset(t)).toEqual(multiset(s));
    expect(t.kinds).not.toEqual(s.kinds);
    expect(validPlan(getLayout("tartaruga"), t.kinds, goneOf(t), t.plan!)).toBe(true);
  });

  test("limpar a mesa vence; depois disso nada mais vale", () => {
    const d = deal("bloco", 8);
    let s = gameFrom({ layout: "bloco", seed: 8, ...d });
    for (const [a, b] of d.solution) s = play(s, { type: "pair", a, b });
    expect(s.won).toBe(true);
    expect(remaining(s)).toBe(0);
    expect(applyAction(s, { type: "undo" }).ok).toBe(false);
  });
});

describe("simulação", () => {
  test("a solução do sorteio limpa a mesa em todos os formatos", () => {
    for (const id of LAYOUT_IDS) {
      for (let seed = 1; seed <= 10; seed++) {
        const d = deal(id, seed * 7919);
        let s = gameFrom({ layout: id, seed, ...d });
        for (const [a, b] of d.solution) s = play(s, { type: "pair", a, b });
        expect(s.won).toBe(true);
      }
    }
  });

  test("seguindo a dica desde o começo, limpa a mesa sem travar", () => {
    for (const id of LAYOUT_IDS) {
      let s = newGame(id, 1234);
      for (let step = 0; step < 72; step++) {
        s = play(s, { type: "hint" });
        const { a, b } = s.last as { a: number; b: number };
        s = play(s, { type: "pair", a, b });
      }
      expect(s.won).toBe(true);
      expect(s.shuffles).toBe(0);
    }
  });

  test("lances ao acaso e depois a dica: embaralhando ou desfazendo quando trava, todas acabam", () => {
    const rng = mulberry32(2026);
    for (let game = 0; game < 24; game++) {
      let s = newGame(LAYOUT_IDS[game % LAYOUT_IDS.length], Math.floor(rng() * 2 ** 32));
      for (let step = 0; step < 1000 && !s.won; step++) {
        const ms = moves(s);
        if (!ms.length) {
          // embaralhar só resolve se ainda dá para limpar a mesa com algum arranjo; senão, desfaz até dar
          let t = play(s, { type: "shuffle", seed: Math.floor(rng() * 2 ** 32) });
          while (!t.plan) {
            s = play(s, { type: "undo" });
            t = play(s, { type: "shuffle", seed: Math.floor(rng() * 2 ** 32) });
          }
          s = t;
        } else if (step < 25) {
          const [a, b] = ms[Math.floor(rng() * ms.length)];
          s = play(s, { type: "pair", a, b });
        } else {
          s = play(s, { type: "hint" });
          const { a, b } = s.last as { a: number; b: number };
          s = play(s, { type: "pair", a, b });
        }
        // o plano guardado sempre vale
        if (s.plan) expect(validPlan(getLayout(s.layout), s.kinds, goneOf(s), s.plan)).toBe(true);
      }
      expect(s.won).toBe(true);
    }
  }, 60_000);
});
