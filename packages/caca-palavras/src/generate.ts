import { DIRS, LEVEL_CONF, colOf, lineCells, mulberry32, rowOf, shuffle, wordCells, type Level } from "./board";
import { THEME_BY_ID } from "./themes";

/** Palavra escondida: começa em `start` e segue a direção `dir` (índice de DIRS). */
export interface Placed {
  word: string;
  start: number;
  dir: number;
}

export interface Puzzle {
  level: Level;
  theme: string;
  seed: number;
  size: number;
  /** size × size letras, linha a linha */
  grid: string;
  /** na ordem da lista na tela (alfabética) */
  words: Placed[];
}

// Letras de enchimento: a frequência do português achatada (raiz quadrada), para a grade ter cara de
// português sem formar palavra curta demais por acaso. Sem K, W e Y.
const FREQ: Record<string, number> = {
  A: 14.6, E: 12.6, O: 10.7, S: 7.8, R: 6.5, I: 6.2, N: 5, D: 5, M: 4.7, U: 4.6, T: 4.3, C: 3.9, L: 2.8,
  P: 2.5, V: 1.7, G: 1.3, H: 1.3, Q: 1.2, B: 1, F: 1, Z: 0.5, J: 0.4, X: 0.2,
};
const FILL = Object.entries(FREQ).flatMap(([l, f]) => Array<string>(Math.round(Math.sqrt(f) * 10)).fill(l));

const reverse = (s: string) => [...s].reverse().join("");

/** Uma palavra dentro da outra (ou dentro dela ao contrário): as duas na mesma grade confundem. */
const clash = (a: string, b: string) => a.includes(b) || b.includes(a) || a.includes(reverse(b)) || b.includes(reverse(a));

/** Onde a palavra aparece na grade, em qualquer direção. Cada lugar vira "primeira-última casa" (a palavra lida ao contrário conta uma vez). */
export function occurrences(grid: string, size: number, word: string): string[] {
  const out = new Set<string>();
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== word[0]) continue;
    const r = rowOf(size, i);
    const c = colOf(size, i);
    for (const [dr, dc] of DIRS) {
      const er = r + dr * (word.length - 1);
      const ec = c + dc * (word.length - 1);
      if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
      let k = 1;
      while (k < word.length && grid[(r + dr * k) * size + c + dc * k] === word[k]) k++;
      if (k === word.length) {
        const end = er * size + ec;
        out.add(i < end ? `${i}-${end}` : `${end}-${i}`);
      }
    }
  }
  return [...out];
}

const placeKey = (size: number, p: Placed) => {
  const cells = wordCells(size, p.start, p.dir, p.word.length);
  const a = cells[0];
  const b = cells[cells.length - 1];
  return a < b ? `${a}-${b}` : `${b}-${a}`;
};

/** Escolhe as palavras: cabem na grade e nenhuma está dentro de outra. */
function pickWords(pool: readonly string[], size: number, n: number, rng: () => number): string[] | null {
  const out: string[] = [];
  for (const word of shuffle(pool.filter((x) => x.length >= 3 && x.length <= size), rng)) {
    if (out.some((o) => clash(o, word))) continue;
    out.push(word);
    if (out.length === n) return out;
  }
  return null;
}

/** Uma tentativa de montar a grade. null = não deu (o chamador tenta de novo com o mesmo rng). */
function attempt(level: Level, pool: readonly string[], rng: () => number): { grid: string; words: Placed[] } | null {
  const { size, words: n, dirs } = LEVEL_CONF[level];
  const chosen = pickWords(pool, size, n, rng);
  if (!chosen) return null;
  const cells: (string | null)[] = Array(size * size).fill(null);
  const placed: Placed[] = [];

  // as maiores primeiro: as curtas encaixam nos buracos que sobram
  for (const word of [...chosen].sort((a, b) => b.length - a.length)) {
    let done = false;
    for (let t = 0; t < 300 && !done; t++) {
      const dir = dirs[Math.floor(rng() * dirs.length)];
      const [dr, dc] = DIRS[dir];
      const len = word.length;
      // começos possíveis para a palavra caber nessa direção
      const rMin = dr < 0 ? len - 1 : 0;
      const rMax = dr > 0 ? size - len : size - 1;
      const cMin = dc < 0 ? len - 1 : 0;
      const cMax = dc > 0 ? size - len : size - 1;
      const r = rMin + Math.floor(rng() * (rMax - rMin + 1));
      const c = cMin + Math.floor(rng() * (cMax - cMin + 1));
      const at = wordCells(size, r * size + c, dir, len);
      // pode cruzar outra palavra só onde a letra é a mesma, e não pode ficar inteira por cima de outra
      if (!at.every((i, k) => cells[i] === null || cells[i] === word[k])) continue;
      if (at.every((i) => cells[i] !== null)) continue;
      at.forEach((i, k) => (cells[i] = word[k]));
      placed.push({ word, start: r * size + c, dir });
      done = true;
    }
    if (!done) return null;
  }

  // enche o resto e troca letras até cada palavra aparecer uma vez só
  const free = cells.map((x) => x === null);
  const letters = cells.map((x) => x ?? FILL[Math.floor(rng() * FILL.length)]);
  for (let round = 0; round < 40; round++) {
    const grid = letters.join("");
    const redo = new Set<number>();
    for (const p of placed) {
      const own = placeKey(size, p);
      for (const occ of occurrences(grid, size, p.word)) {
        if (occ === own) continue;
        const [a, b] = occ.split("-").map(Number);
        const extra = lineCells(size, a, b)!.filter((i) => free[i]);
        // repetida só com letras de outras palavras: não tem o que trocar
        if (!extra.length) return null;
        extra.forEach((i) => redo.add(i));
      }
    }
    if (!redo.size) return { grid, words: placed.sort((a, b) => a.word.localeCompare(b.word)) };
    for (const i of redo) letters[i] = FILL[Math.floor(rng() * FILL.length)];
  }
  return null;
}

/** Grade do nível com palavras do tema. O mesmo `seed` dá sempre a mesma grade. */
export function generate(level: Level, theme: string, seed: number): Puzzle {
  const t = THEME_BY_ID.get(theme);
  if (!t) throw new Error(`tema desconhecido: ${theme}`);
  const rng = mulberry32(seed);
  for (let i = 0; i < 200; i++) {
    const r = attempt(level, t.words, rng);
    if (r) return { level, theme, seed, size: LEVEL_CONF[level].size, ...r };
  }
  throw new Error(`não deu para montar a grade (${level}, ${theme}, ${seed})`);
}
