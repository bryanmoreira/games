import { LAYOUT_DEFS, type CompactMap } from "./layouts";

// Geometria do tabuleiro. Coordenadas em meias peças: a peça em (x, y) ocupa x..x+2 e y..y+2 no andar z.
// Uma peça está livre quando nenhuma peça de cima encosta nela e um dos lados (esquerdo ou direito) está vazio.

export interface Slot {
  x: number;
  y: number;
  z: number;
}

export interface Layout {
  id: string;
  name: string;
  /** casas na ordem de desenho: andar, depois coluna, depois linha */
  slots: Slot[];
  /** largura e altura em meias peças; andares */
  width: number;
  height: number;
  depth: number;
  /** peças de cima que cobrem cada casa */
  over: number[][];
  left: number[][];
  right: number[][];
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function expand(map: CompactMap): Slot[] {
  const slots: Slot[] = [];
  for (const [z, rows] of map) {
    for (const [y, cells] of rows) {
      for (const c of Array.isArray(cells) ? cells : [cells]) {
        if (Array.isArray(c)) for (let k = 0; k < c[1]; k++) slots.push({ x: c[0] + k * 2, y, z });
        else slots.push({ x: c, y, z });
      }
    }
  }
  return slots.sort((a, b) => a.z - b.z || a.x - b.x || a.y - b.y);
}

function build(id: string, name: string, map: CompactMap): Layout {
  const slots = expand(map);
  const n = slots.length;
  const over: number[][] = slots.map(() => []);
  const left: number[][] = slots.map(() => []);
  const right: number[][] = slots.map(() => []);
  for (let i = 0; i < n; i++) {
    const a = slots[i];
    for (let j = 0; j < n; j++) {
      const b = slots[j];
      if (Math.abs(a.y - b.y) > 1) continue;
      if (b.z > a.z && Math.abs(a.x - b.x) <= 1) over[i].push(j);
      else if (b.z === a.z && b.x === a.x - 2) left[i].push(j);
      else if (b.z === a.z && b.x === a.x + 2) right[i].push(j);
    }
  }
  return {
    id,
    name,
    slots,
    width: Math.max(...slots.map((s) => s.x)) + 2,
    height: Math.max(...slots.map((s) => s.y)) + 2,
    depth: Math.max(...slots.map((s) => s.z)) + 1,
    over,
    left,
    right,
  };
}

const cache = new Map<string, Layout>();

export const LAYOUT_IDS: readonly string[] = LAYOUT_DEFS.map((l) => l.id);

export const isLayout = (v: unknown): v is string => typeof v === "string" && LAYOUT_IDS.includes(v);

export const layoutName = (id: string) => LAYOUT_DEFS.find((l) => l.id === id)?.name ?? id;

export function getLayout(id: string): Layout {
  let l = cache.get(id);
  if (!l) {
    const def = LAYOUT_DEFS.find((d) => d.id === id);
    if (!def) throw new Error(`Formato desconhecido: ${id}`);
    l = build(def.id, def.name, def.map);
    cache.set(id, l);
  }
  return l;
}

/** `gone[i]`: a peça da casa i já saiu. */
export function isFree(l: Layout, gone: readonly boolean[], i: number): boolean {
  if (gone[i]) return false;
  if (l.over[i].some((j) => !gone[j])) return false;
  return l.left[i].every((j) => gone[j]) || l.right[i].every((j) => gone[j]);
}

export function freeSlots(l: Layout, gone: readonly boolean[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < l.slots.length; i++) if (isFree(l, gone, i)) out.push(i);
  return out;
}
