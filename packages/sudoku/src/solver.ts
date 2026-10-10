import { ALL, bit, boxOf, CELL_UNITS, colOf, digits, PEERS, popcount, rowOf, shuffle, SIZE, unitAt, UNITS } from "./board";
import type { Technique, Unit } from "./types";

// ---------- força bruta (unicidade e tabuleiro completo) ----------

/**
 * Backtracking com a casa de menos opções primeiro. Para ao achar `limit` soluções.
 * Com `rng`, tenta os números em ordem aleatória (para gerar tabuleiros completos).
 */
function search(grid: number[], limit: number, rng?: () => number): { count: number; first: number[] | null } {
  const g = grid.slice();
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let i = 0; i < SIZE; i++) {
    const v = g[i];
    if (!v) continue;
    const b = bit(v);
    if (rows[rowOf(i)] & b || cols[colOf(i)] & b || boxes[boxOf(i)] & b) return { count: 0, first: null };
    rows[rowOf(i)] |= b;
    cols[colOf(i)] |= b;
    boxes[boxOf(i)] |= b;
  }
  let count = 0;
  let first: number[] | null = null;

  const rec = (): boolean => {
    let best = -1;
    let bestMask = 0;
    let bestN = 10;
    for (let i = 0; i < SIZE; i++) {
      if (g[i]) continue;
      const m = ALL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const n = popcount(m);
      if (n === 0) return false;
      if (n < bestN) {
        best = i;
        bestMask = m;
        bestN = n;
        if (n === 1) break;
      }
    }
    if (best < 0) {
      count++;
      if (!first) first = g.slice();
      return count >= limit;
    }
    const opts = digits(bestMask);
    if (rng) shuffle(opts, rng);
    const r = rowOf(best);
    const c = colOf(best);
    const bx = boxOf(best);
    for (const d of opts) {
      const b = bit(d);
      g[best] = d;
      rows[r] |= b;
      cols[c] |= b;
      boxes[bx] |= b;
      if (rec()) return true;
      rows[r] &= ~b;
      cols[c] &= ~b;
      boxes[bx] &= ~b;
    }
    g[best] = 0;
    return false;
  };
  rec();
  return { count, first };
}

/** Quantas soluções o tabuleiro tem (até `limit`). */
export function countSolutions(grid: number[], limit = 2): number {
  return search(grid, limit).count;
}

export function solve(grid: number[]): number[] | null {
  return search(grid, 1).first;
}

/** Tabuleiro completo aleatório. */
export function randomSolution(rng: () => number): number[] {
  return search(new Array(SIZE).fill(0), 1, rng).first!;
}

// ---------- solver lógico (dificuldade e dicas) ----------

/** Nível de cada técnica: 1 = únicos, 2 = pares e linhas apontadas, 3 = triplas e asas. */
export const TIER: Record<Technique, number> = {
  single: 1,
  hidden: 1,
  pointing: 2,
  claiming: 2,
  pair: 2,
  hiddenPair: 2,
  triple: 3,
  hiddenTriple: 3,
  xwing: 3,
  ywing: 3,
};

export type Step =
  | { type: "place"; technique: "single" | "hidden"; cell: number; value: number; unit?: Unit }
  | { type: "eliminate"; technique: Technique; removals: [cell: number, mask: number][] };

/** Candidatos de cada casa vazia (0 nas preenchidas). */
export function candidates(values: number[]): number[] {
  return values.map((v, i) => {
    if (v) return 0;
    let m = ALL;
    for (const p of PEERS[i]) if (values[p]) m &= ~bit(values[p]);
    return m;
  });
}

/** Coloca `value` e tira o número dos candidatos das casas vizinhas. */
export function place(values: number[], cand: number[], cell: number, value: number) {
  values[cell] = value;
  cand[cell] = 0;
  for (const p of PEERS[cell]) cand[p] &= ~bit(value);
}

function nakedSingle(cand: number[]): Step | null {
  for (let i = 0; i < SIZE; i++) if (cand[i] && popcount(cand[i]) === 1) return { type: "place", technique: "single", cell: i, value: digits(cand[i])[0] };
  return null;
}

// blocos primeiro: é onde o jogador costuma procurar
const HIDDEN_ORDER = [...Array.from({ length: 9 }, (_, i) => 18 + i), ...Array.from({ length: 18 }, (_, i) => i)];

function hiddenSingle(cand: number[]): Step | null {
  for (const u of HIDDEN_ORDER) {
    for (let d = 1; d <= 9; d++) {
      let at = -1;
      let n = 0;
      for (const i of UNITS[u]) if (cand[i] & bit(d)) (at = i), n++;
      if (n === 1) return { type: "place", technique: "hidden", cell: at, value: d, unit: unitAt(u) };
    }
  }
  return null;
}

/** Junta as remoções que de fato tiram algum candidato. */
function removals(cand: number[], cells: Iterable<number>, mask: number): [number, number][] {
  const out: [number, number][] = [];
  for (const i of cells) if (cand[i] & mask) out.push([i, cand[i] & mask]);
  return out;
}

/** Número preso numa linha/coluna dentro do bloco (pointing) ou num bloco dentro da linha/coluna (claiming). */
function intersections(cand: number[]): Step | null {
  for (let u = 0; u < 27; u++) {
    for (let d = 1; d <= 9; d++) {
      const where = UNITS[u].filter((i) => cand[i] & bit(d));
      if (where.length < 2) continue;
      // bloco → linha/coluna; linha/coluna → bloco
      const others = u >= 18 ? [CELL_UNITS[where[0]][0], CELL_UNITS[where[0]][1]] : [CELL_UNITS[where[0]][2]];
      for (const o of others) {
        if (!where.every((i) => CELL_UNITS[i].includes(o))) continue;
        const rm = removals(cand, UNITS[o].filter((i) => !UNITS[u].includes(i)), bit(d));
        if (rm.length) return { type: "eliminate", technique: u >= 18 ? "pointing" : "claiming", removals: rm };
      }
    }
  }
  return null;
}

function combos<T>(arr: T[], k: number, start = 0, acc: T[] = [], out: T[][] = []): T[][] {
  if (acc.length === k) out.push(acc.slice());
  else for (let i = start; i < arr.length; i++) combos(arr, k, i + 1, [...acc, arr[i]], out);
  return out;
}

/** k casas de uma unidade que juntas só aceitam k números: esses números saem das outras casas. */
function nakedSubset(cand: number[], k: number): Step | null {
  for (let u = 0; u < 27; u++) {
    const open = UNITS[u].filter((i) => cand[i] && popcount(cand[i]) <= k);
    for (const set of combos(open, k)) {
      const union = set.reduce((m, i) => m | cand[i], 0);
      if (popcount(union) !== k) continue;
      const rm = removals(cand, UNITS[u].filter((i) => !set.includes(i)), union);
      if (rm.length) return { type: "eliminate", technique: k === 2 ? "pair" : "triple", removals: rm };
    }
  }
  return null;
}

/** k números que numa unidade só cabem nas mesmas k casas: os outros candidatos dessas casas saem. */
function hiddenSubset(cand: number[], k: number): Step | null {
  for (let u = 0; u < 27; u++) {
    const ds = digits(ALL).filter((d) => {
      const n = UNITS[u].filter((i) => cand[i] & bit(d)).length;
      return n >= 2 && n <= k;
    });
    for (const set of combos(ds, k)) {
      const cells = new Set<number>();
      for (const d of set) for (const i of UNITS[u]) if (cand[i] & bit(d)) cells.add(i);
      if (cells.size !== k) continue;
      const keep = set.reduce((m, d) => m | bit(d), 0);
      const rm = removals(cand, cells, ALL & ~keep);
      if (rm.length) return { type: "eliminate", technique: k === 2 ? "hiddenPair" : "hiddenTriple", removals: rm };
    }
  }
  return null;
}

function xwing(cand: number[]): Step | null {
  for (const [base, cover] of [
    [0, 9],
    [9, 0],
  ]) {
    for (let d = 1; d <= 9; d++) {
      // linhas (ou colunas) onde o número só cabe em 2 lugares
      const spots = Array.from({ length: 9 }, (_, k) =>
        UNITS[base + k].map((i, pos) => (cand[i] & bit(d) ? pos : -1)).filter((p) => p >= 0),
      );
      for (let a = 0; a < 9; a++) {
        if (spots[a].length !== 2) continue;
        for (let b = a + 1; b < 9; b++) {
          if (spots[b].length !== 2 || spots[b][0] !== spots[a][0] || spots[b][1] !== spots[a][1]) continue;
          const keep = new Set([...UNITS[base + a], ...UNITS[base + b]]);
          const cells = spots[a].flatMap((p) => UNITS[cover + p]).filter((i) => !keep.has(i));
          const rm = removals(cand, cells, bit(d));
          if (rm.length) return { type: "eliminate", technique: "xwing", removals: rm };
        }
      }
    }
  }
  return null;
}

function ywing(cand: number[]): Step | null {
  for (let p = 0; p < SIZE; p++) {
    if (popcount(cand[p]) !== 2) continue;
    const [a, b] = digits(cand[p]);
    const wings = PEERS[p].filter((i) => popcount(cand[i]) === 2 && popcount(cand[i] & cand[p]) === 1);
    for (const x of wings) {
      if (!(cand[x] & bit(a))) continue;
      const c = cand[x] & ~bit(a);
      for (const y of wings) {
        if (y === x || cand[y] !== (bit(b) | c)) continue;
        const cells = PEERS[x].filter((i) => i !== y && PEERS[y].includes(i));
        const rm = removals(cand, cells, c);
        if (rm.length) return { type: "eliminate", technique: "ywing", removals: rm };
      }
    }
  }
  return null;
}

/** Próximo passo lógico, do mais simples ao mais difícil, até o nível `maxTier`. */
export function nextStep(cand: number[], maxTier = 3): Step | null {
  const finders: [number, () => Step | null][] = [
    [1, () => hiddenSingle(cand)],
    [1, () => nakedSingle(cand)],
    [2, () => intersections(cand)],
    [2, () => nakedSubset(cand, 2)],
    [2, () => hiddenSubset(cand, 2)],
    [3, () => nakedSubset(cand, 3)],
    [3, () => hiddenSubset(cand, 3)],
    [3, () => xwing(cand)],
    [3, () => ywing(cand)],
  ];
  for (const [tier, find] of finders) {
    if (tier > maxTier) break;
    const s = find();
    if (s) return s;
  }
  return null;
}

export interface Grade {
  solved: boolean;
  /** técnica mais difícil que foi preciso usar */
  tier: number;
  used: Set<Technique>;
}

/** Resolve só com lógica (sem chutar) até o nível `maxTier`. Resolver assim prova que a solução é única. */
export function solveLogic(puzzle: number[], maxTier = 3): Grade {
  const values = puzzle.slice();
  const cand = candidates(values);
  const used = new Set<Technique>();
  let tier = 0;
  let empty = values.filter((v) => !v).length;
  while (empty) {
    const s = nextStep(cand, maxTier);
    if (!s) return { solved: false, tier, used };
    used.add(s.technique);
    tier = Math.max(tier, TIER[s.technique]);
    if (s.type === "place") {
      place(values, cand, s.cell, s.value);
      empty--;
    } else for (const [i, m] of s.removals) cand[i] &= ~m;
  }
  return { solved: true, tier, used };
}
