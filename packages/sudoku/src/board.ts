import type { Unit } from "./types";

export const SIZE = 81;
export const ALL = 0x1ff;

export const rowOf = (i: number) => Math.floor(i / 9);
export const colOf = (i: number) => i % 9;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

/** 27 unidades: 0-8 linhas, 9-17 colunas, 18-26 blocos. */
export const UNITS: number[][] = [
  ...Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c)),
  ...Array.from({ length: 9 }, (_, b) =>
    Array.from({ length: 9 }, (_, k) => (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)),
  ),
];

const KINDS: Unit["kind"][] = ["row", "col", "box"];
export const unitAt = (u: number): Unit => ({ kind: KINDS[Math.floor(u / 9)], index: u % 9 });
export const unitIndex = (u: Unit) => KINDS.indexOf(u.kind) * 9 + u.index;
export const unitCells = (u: Unit) => UNITS[unitIndex(u)];

/** As 3 unidades de cada casa: [linha, coluna, bloco]. */
export const CELL_UNITS: number[][] = Array.from({ length: SIZE }, (_, i) => [rowOf(i), 9 + colOf(i), 18 + boxOf(i)]);

/** As 20 casas que dividem linha, coluna ou bloco com cada casa. */
export const PEERS: number[][] = Array.from({ length: SIZE }, (_, i) => {
  const s = new Set<number>();
  for (const u of CELL_UNITS[i]) for (const j of UNITS[u]) if (j !== i) s.add(j);
  return [...s];
});

export const bit = (d: number) => 1 << (d - 1);

export function popcount(m: number): number {
  let n = 0;
  while (m) {
    m &= m - 1;
    n++;
  }
  return n;
}

/** Dígitos ligados numa máscara, em ordem. */
export function digits(m: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (m & bit(d)) out.push(d);
  return out;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
