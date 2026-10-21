import { isDouble, type Board, type Placed, type Side, type Tile } from "@mesa/domino";

/**
 * Desenho da mesa do dominó em unidades de meia peça (peça deitada = 2 × 1). A primeira peça fica no
 * centro; a ponta direita anda para a direita e, ao chegar no limite `lim`, dobra para baixo e volta
 * em zigue-zague; a ponta esquerda faz o mesmo para cima. Carroças entram atravessadas.
 */

/** Peça posicionada: centro, rotação (graus) e os números de cima/baixo da peça em pé antes de girar. */
export interface Spot {
  key: number;
  cx: number;
  cy: number;
  rot: number;
  a: number;
  b: number;
}

interface Cursor {
  x: number;
  y: number;
  dir: 1 | -1;
  /** A última peça da fileira é carroça atravessada (o canto desce mais para não encostar). */
  double: boolean;
}

/** Coloca uma peça no braço e devolve onde ficou (o cursor anda junto). */
function place(c: Cursor, inner: number, outer: number, double: boolean, lim: number, v: 1 | -1, key: number): Spot {
  const len = double ? 1 : 2;
  if (c.dir * (c.x + c.dir * len) > lim) {
    // canto: a peça desce (ou sobe) em pé debaixo da ponta e a fileira seguinte volta
    const drop = c.double ? 0.5 : 0;
    const spot: Spot = { key, cx: c.x - c.dir * 0.5, cy: c.y + v * (1.5 + drop), rot: v > 0 ? 0 : 180, a: inner, b: outer };
    c.y += v * (2 + drop);
    c.x -= c.dir;
    c.dir = (-c.dir) as 1 | -1;
    c.double = false;
    return spot;
  }
  let spot: Spot;
  if (double) spot = { key, cx: c.x + c.dir * 0.5, cy: c.y, rot: 0, a: inner, b: outer };
  else spot = { key, cx: c.x + c.dir, cy: c.y, rot: c.dir > 0 ? -90 : 90, a: inner, b: outer };
  c.x += c.dir * len;
  c.double = double;
  return spot;
}

export interface Layout {
  spots: Spot[];
  /** Próxima casa de cada ponta, para mostrar onde a peça escolhida entra. */
  next: Record<Side, (t: Tile) => Spot>;
  box: { x0: number; y0: number; x1: number; y1: number };
}

export function layoutBoard(b: Board, lim: number): Layout {
  const spots: Spot[] = [];
  const f = b.first;
  const half = f && isDouble(f.tile) ? 0.5 : 1;
  const right: Cursor = { x: half, y: 0, dir: 1, double: half === 0.5 };
  const left: Cursor = { x: -half, y: 0, dir: -1, double: half === 0.5 };
  if (f) spots.push({ key: f.n, cx: 0, cy: 0, rot: isDouble(f.tile) ? 0 : -90, a: f.inner, b: f.outer });
  const arm = (ps: Placed[], c: Cursor, v: 1 | -1) => {
    for (const p of ps) spots.push(place(c, p.inner, p.outer, isDouble(p.tile), lim, v, p.n));
  };
  arm(b.right, right, 1);
  arm(b.left, left, -1);

  const ends = f ? [b.left.at(-1)?.outer ?? f.inner, b.right.at(-1)?.outer ?? f.outer] : [0, 0];
  const ghost = (side: Side) => (t: Tile) => {
    const end = side === "left" ? ends[0] : ends[1];
    const c = { ...(side === "left" ? left : right) };
    return place(c, end, t[0] === end ? t[1] : t[0], isDouble(t), lim, side === "left" ? -1 : 1, -1);
  };

  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of spots) {
    const flat = s.rot === 90 || s.rot === -90;
    const w = flat ? 1 : 0.5;
    const h = flat ? 0.5 : 1;
    x0 = Math.min(x0, s.cx - w);
    x1 = Math.max(x1, s.cx + w);
    y0 = Math.min(y0, s.cy - h);
    y1 = Math.max(y1, s.cy + h);
  }
  if (!spots.length) [x0, y0, x1, y1] = [-1, -1, 1, 1];
  return { spots, next: { left: ghost("left"), right: ghost("right") }, box: { x0, y0, x1, y1 } };
}

/** Mesa fictícia de 24 peças comuns, 12 para cada lado, para escolher a largura da fileira. */
const FULL: Board = {
  first: { tile: [1, 2], inner: 1, outer: 2, seat: 0, n: 0 },
  left: Array.from({ length: 12 }, (_, i) => ({ tile: [1, 2] as Tile, inner: 1, outer: 1, seat: 0, n: 1 + i })),
  right: Array.from({ length: 12 }, (_, i) => ({ tile: [1, 2] as Tile, inner: 2, outer: 2, seat: 0, n: 13 + i })),
};

/** Metade da largura da fileira que deixa uma mesa cheia maior na área `w` × `h` (px). */
export function bestLimit(w: number, h: number): number {
  let best = { lim: 7, scale: 0 };
  for (let lim = 3; lim <= 16; lim++) {
    const { box } = layoutBoard(FULL, lim);
    const scale = Math.min(w / (box.x1 - box.x0 + 1), h / (box.y1 - box.y0 + 1));
    if (scale > best.scale + 0.01) best = { lim, scale };
  }
  return best.lim;
}
