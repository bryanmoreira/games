// Grade quadrada guardada como texto (uma letra por casa, linha a linha). Casa = índice r * size + c.

export type Level = "easy" | "medium" | "hard";
export const LEVELS: readonly Level[] = ["easy", "medium", "hard"];
export const isLevel = (v: unknown): v is Level => v === "easy" || v === "medium" || v === "hard";

/** As 8 direções, em sentido horário a partir da direita: [linha, coluna]. */
export const DIRS: readonly (readonly [number, number])[] = [
  [0, 1], // →
  [1, 1], // ↘
  [1, 0], // ↓
  [1, -1], // ↙
  [0, -1], // ←
  [-1, -1], // ↖
  [-1, 0], // ↑
  [-1, 1], // ↗
];

/** Tamanho da grade, quantas palavras e em que direções elas podem estar. */
export const LEVEL_CONF: Record<Level, { size: number; words: number; dirs: readonly number[] }> = {
  easy: { size: 10, words: 8, dirs: [0, 2] },
  medium: { size: 12, words: 12, dirs: [0, 1, 2, 7] },
  hard: { size: 15, words: 16, dirs: [0, 1, 2, 3, 4, 5, 6, 7] },
};

export const rowOf = (size: number, i: number) => Math.floor(i / size);
export const colOf = (size: number, i: number) => i % size;

/** Casas da palavra que começa em `start` e anda `len` casas na direção `dir`. */
export function wordCells(size: number, start: number, dir: number, len: number): number[] {
  const [dr, dc] = DIRS[dir];
  const r = rowOf(size, start);
  const c = colOf(size, start);
  return Array.from({ length: len }, (_, k) => (r + dr * k) * size + c + dc * k);
}

/** Casas em linha reta de `from` até `to` (inclusive), ou null se não estão na mesma linha, coluna ou diagonal. */
export function lineCells(size: number, from: number, to: number): number[] | null {
  const dr = rowOf(size, to) - rowOf(size, from);
  const dc = colOf(size, to) - colOf(size, from);
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return Array.from({ length: n + 1 }, (_, k) => from + (sr * size + sc) * k);
}

/**
 * Ponta da seleção ao arrastar: a casa mais perto do dedo numa das 8 direções a partir de `from`.
 * `r` e `c` em casas (o canto de cima à esquerda da grade é 0, 0; o centro da primeira casa é 0,5).
 */
export function snap(size: number, from: number, r: number, c: number): number {
  const r0 = rowOf(size, from);
  const c0 = colOf(size, from);
  const dr = r - (r0 + 0.5);
  const dc = c - (c0 + 0.5);
  if (Math.abs(dr) < 0.5 && Math.abs(dc) < 0.5) return from;
  const dir = (Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) + 8) % 8;
  const [ur, uc] = DIRS[dir];
  let k = Math.round(ur && uc ? (Math.abs(dr) + Math.abs(dc)) / 2 : Math.abs(ur ? dr : dc));
  // não passa da borda
  const room = (p: number, u: number) => (u > 0 ? size - 1 - p : u < 0 ? p : Infinity);
  k = Math.max(0, Math.min(k, room(r0, ur), room(c0, uc)));
  return (r0 + ur * k) * size + c0 + uc * k;
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
