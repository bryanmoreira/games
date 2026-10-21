import type { Kind, Rot } from "./types";

type Cell = readonly [number, number];

/** Blocos de cada peça nascendo, dentro da caixa (x para a direita, y para baixo). */
const SPAWN: Record<Kind, { size: number; cells: Cell[] }> = {
  1: { size: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
  2: { size: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  3: { size: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
  4: { size: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  5: { size: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  6: { size: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  7: { size: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
};

// girar à direita dentro da caixa: (x, y) → (size-1-y, x)
const rotate = (cells: Cell[], size: number): Cell[] => cells.map(([x, y]) => [size - 1 - y, x] as const);

/** SHAPES[kind][rot]: blocos da peça em cada giro. */
export const SHAPES: Record<Kind, Cell[][]> = Object.fromEntries(
  (Object.entries(SPAWN) as unknown as [string, { size: number; cells: Cell[] }][]).map(([k, { size, cells }]) => {
    const rots = [cells];
    for (let i = 1; i < 4; i++) rots.push(rotate(rots[i - 1], size));
    return [k, rots];
  }),
) as Record<Kind, Cell[][]>;

export const boxSize = (kind: Kind) => SPAWN[kind].size;

// Chutes de parede: deslocamentos testados em ordem ao girar (y para baixo).
// Chave "de>para"; tabela das peças de 3 e a do I à parte. O O não chuta.
const K = (pairs: [number, number][]): Cell[] => pairs.map(([x, y]) => [x, -y] as const);
const KICKS_3: Record<string, Cell[]> = {
  "0>1": K([[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]),
  "1>0": K([[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]),
  "1>2": K([[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]),
  "2>1": K([[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]),
  "2>3": K([[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]),
  "3>2": K([[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]),
  "3>0": K([[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]),
  "0>3": K([[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]),
};
const KICKS_I: Record<string, Cell[]> = {
  "0>1": K([[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]]),
  "1>0": K([[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]]),
  "1>2": K([[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]),
  "2>1": K([[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]),
  "2>3": K([[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]]),
  "3>2": K([[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]]),
  "3>0": K([[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]]),
  "0>3": K([[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]),
};
const NO_KICK: Cell[] = [[0, 0]];

export function kicks(kind: Kind, from: Rot, to: Rot): Cell[] {
  if (kind === 2) return NO_KICK;
  return (kind === 1 ? KICKS_I : KICKS_3)[`${from}>${to}`];
}

// ---------- sorteio ----------

/** Próximo número do gerador (mulberry32, só inteiros: igual no navegador e no servidor). */
export function nextRandom(state: number): [value: number, state: number] {
  const s = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [(t ^ (t >>> 14)) >>> 0, s];
}

/** Saco das 7 peças embaralhado; devolve o estado novo do gerador. */
export function bag(state: number): [Kind[], number] {
  const out: Kind[] = [1, 2, 3, 4, 5, 6, 7];
  let st = state;
  for (let i = out.length - 1; i > 0; i--) {
    const [v, n] = nextRandom(st);
    st = n;
    const j = v % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return [out, st];
}
