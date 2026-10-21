// Desenho das peças como um bloco só: cada casa sabe se a vizinha é da mesma peça e só ganha borda,
// luz e sombra nos lados de fora. Em unidades de casa (1 = uma casa), para o canvas e para o SVG.

/**
 * Lado aberto = a vizinha daquele lado é da mesma peça. As diagonais servem para os cantos de dentro
 * (dois lados abertos e a diagonal de fora da peça).
 */
export interface Open {
  t: boolean;
  r: boolean;
  b: boolean;
  l: boolean;
  tl: boolean;
  tr: boolean;
  bl: boolean;
  br: boolean;
}

export interface Part {
  x: number;
  y: number;
  w: number;
  h: number;
  tone: "base" | "light" | "dark";
}

/** Folga entre peças diferentes. */
const GAP = 0.06;
/** Luz em cima e sombra embaixo; dos lados, mais finas. */
const EDGE = 0.14;
const SIDE = 0.08;
/** Do lado aberto, a casa passa um pouco para dentro da vizinha (sem isso o antisserrilhado deixa um fio entre elas). */
const OVERLAP = 0.03;

const CORNERS = [
  { sx: -1, sy: -1, key: "tl" },
  { sx: 1, sy: -1, key: "tr" },
  { sx: -1, sy: 1, key: "bl" },
  { sx: 1, sy: 1, key: "br" },
] as const;

const sideOpen = (o: Open, sx: number, sy: number) => [sx < 0 ? o.l : o.r, sy < 0 ? o.t : o.b] as const;

/** Retângulos de uma casa (base, luz e sombra) a partir dos lados abertos. */
export function cellParts(x: number, y: number, o: Open): Part[] {
  const parts: Part[] = [];
  const add = (x0: number, y0: number, x1: number, y1: number, tone: Part["tone"]) => {
    if (x1 > x0 && y1 > y0) parts.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, tone });
  };
  // base em 3×3 pedaços: a borda de cada lado só existe se o lado é aberto, e o canto só se a diagonal também for
  const xs = [x + (o.l ? -OVERLAP : GAP), x + GAP, x + 1 - GAP, x + 1 - (o.r ? -OVERLAP : GAP)];
  const ys = [y + (o.t ? -OVERLAP : GAP), y + GAP, y + 1 - GAP, y + 1 - (o.b ? -OVERLAP : GAP)];
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      if (i !== 1 && j !== 1) {
        const corner = CORNERS.find((c) => c.sx === i - 1 && c.sy === j - 1)!;
        if (!o[corner.key]) continue;
      }
      // os pedaços se sobrepõem onde se encontram, pelo mesmo motivo do OVERLAP
      add(xs[i] - (i > 0 ? OVERLAP : 0), ys[j] - (j > 0 ? OVERLAP : 0), xs[i + 1] + (i < 2 ? OVERLAP : 0), ys[j + 1] + (j < 2 ? OVERLAP : 0), "base");
    }
  const x0 = xs[0];
  const x1 = xs[3];
  const y0 = ys[0];
  const y1 = ys[3];
  // luz em cima ganha no canto de cima à direita, sombra embaixo ganha no de baixo à esquerda
  if (!o.t) add(x0, y0, x1, y0 + EDGE, "light");
  if (!o.l) add(x0, y0, x0 + SIDE, y1 - (o.b ? 0 : EDGE), "light");
  if (!o.b) add(x0, y1 - EDGE, x1, y1, "dark");
  if (!o.r) add(x1 - SIDE, y0 + (o.t ? 0 : EDGE), x1, y1, "dark");
  // canto de dentro: a luz e a sombra das vizinhas dobram o canto em vez de parar antes dele
  for (const { sx, sy, key } of CORNERS) {
    const [ox, oy] = sideOpen(o, sx, sy);
    if (!ox || !oy || o[key]) continue;
    const vx = sx > 0 ? [x + 1 - GAP - SIDE, x + 1 - GAP] : [x + GAP, x + GAP + SIDE];
    const hy = sy > 0 ? [y + 1 - GAP - EDGE, y + 1 - GAP] : [y + GAP, y + GAP + EDGE];
    const hx = sx > 0 ? [vx[0], x + 1 + OVERLAP] : [x - OVERLAP, vx[1]];
    const vy = sy > 0 ? [hy[0], y + 1 + OVERLAP] : [y - OVERLAP, hy[1]];
    add(hx[0], hy[0], hx[1], hy[1], sy < 0 ? "light" : "dark");
    add(vx[0], vy[0], vx[1], vy[1], sx < 0 ? "light" : "dark");
  }
  return parts;
}

/** Contorno de fora de um grupo de casas (a sombra de onde a peça cai): segmentos [x1, y1, x2, y2]. */
export function outline(cells: [number, number][], inset = GAP + 0.04): [number, number, number, number][] {
  const has = new Set(cells.map(([x, y]) => `${x},${y}`));
  const segs: [number, number, number, number][] = [];
  for (const [x, y] of cells) {
    const o = openOf((dx, dy) => has.has(`${x + dx},${y + dy}`));
    const x0 = x + (o.l ? 0 : inset);
    const x1 = x + 1 - (o.r ? 0 : inset);
    const y0 = y + (o.t ? 0 : inset);
    const y1 = y + 1 - (o.b ? 0 : inset);
    if (!o.t) segs.push([x0, y0, x1, y0]);
    if (!o.b) segs.push([x0, y1, x1, y1]);
    if (!o.l) segs.push([x0, y0, x0, y1]);
    if (!o.r) segs.push([x1, y0, x1, y1]);
    // canto de dentro: liga as linhas das duas vizinhas
    for (const { sx, sy, key } of CORNERS) {
      const [ox, oy] = sideOpen(o, sx, sy);
      if (!ox || !oy || o[key]) continue;
      const cx = sx > 0 ? x + 1 - inset : x + inset;
      const cy = sy > 0 ? y + 1 - inset : y + inset;
      segs.push([cx, cy, sx > 0 ? x + 1 : x, cy]);
      segs.push([cx, cy, cx, sy > 0 ? y + 1 : y]);
    }
  }
  return segs;
}

/** Lados (e diagonais) abertos de uma casa, dado quem é da mesma peça (por deslocamento). */
export const openOf = (same: (dx: number, dy: number) => boolean): Open => ({
  t: same(0, -1),
  r: same(1, 0),
  b: same(0, 1),
  l: same(-1, 0),
  tl: same(-1, -1),
  tr: same(1, -1),
  bl: same(-1, 1),
  br: same(1, 1),
});

/** Clareia (+) ou escurece (-) uma cor #rrggbb. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

export const toneColor = (color: string, tone: Part["tone"]) => (tone === "base" ? color : shade(color, tone === "light" ? 0.35 : -0.35));
