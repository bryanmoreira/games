// Desenho de cada casa como um bloco em relevo: face no meio e quatro bordas inclinadas, com luz em cima
// e à esquerda e sombra embaixo e à direita. Serve para o canvas (em px) e para o SVG (em casas).

export type Tone = "face" | "top" | "left" | "bottom" | "right";

export interface Facet {
  tone: Tone;
  points: [number, number][];
}

/** Largura da borda inclinada, em fração da casa. */
export const BEVEL = 0.16;

/** As cinco partes de um bloco de (x0, y0) a (x1, y1); `b` = largura da borda. */
export function bevelFacets(x0: number, y0: number, x1: number, y1: number, b: number): Facet[] {
  const [xa, xb, ya, yb] = [x0 + b, x1 - b, y0 + b, y1 - b];
  return [
    { tone: "top", points: [[x0, y0], [x1, y0], [xb, ya], [xa, ya]] },
    { tone: "left", points: [[x0, y0], [xa, ya], [xa, yb], [x0, y1]] },
    { tone: "bottom", points: [[x0, y1], [xa, yb], [xb, yb], [x1, y1]] },
    { tone: "right", points: [[x1, y0], [x1, y1], [xb, yb], [xb, ya]] },
    { tone: "face", points: [[xa, ya], [xb, ya], [xb, yb], [xa, yb]] },
  ];
}

const TONE: Record<Tone, number> = { face: 0, top: 0.45, left: 0.22, bottom: -0.42, right: -0.25 };

export const toneColor = (color: string, tone: Tone) => (tone === "face" ? color : shade(color, TONE[tone]));

/** Contorno de fora de um grupo de casas (a sombra de onde a peça cai): segmentos [x1, y1, x2, y2]. */
export function outline(cells: [number, number][], inset = 0.1): [number, number, number, number][] {
  const has = new Set(cells.map(([x, y]) => `${x},${y}`));
  const same = (x: number, y: number) => has.has(`${x},${y}`);
  const segs: [number, number, number, number][] = [];
  for (const [x, y] of cells) {
    const t = same(x, y - 1);
    const b = same(x, y + 1);
    const l = same(x - 1, y);
    const r = same(x + 1, y);
    const x0 = x + (l ? 0 : inset);
    const x1 = x + 1 - (r ? 0 : inset);
    const y0 = y + (t ? 0 : inset);
    const y1 = y + 1 - (b ? 0 : inset);
    if (!t) segs.push([x0, y0, x1, y0]);
    if (!b) segs.push([x0, y1, x1, y1]);
    if (!l) segs.push([x0, y0, x0, y1]);
    if (!r) segs.push([x1, y0, x1, y1]);
    // canto de dentro (dois lados da peça e a diagonal fora dela): liga as linhas das duas vizinhas
    for (const [sx, sy, ox, oy] of [
      [-1, -1, l, t],
      [1, -1, r, t],
      [-1, 1, l, b],
      [1, 1, r, b],
    ] as const) {
      if (!ox || !oy || same(x + sx, y + sy)) continue;
      const cx = sx > 0 ? x + 1 - inset : x + inset;
      const cy = sy > 0 ? y + 1 - inset : y + inset;
      segs.push([cx, cy, sx > 0 ? x + 1 : x, cy]);
      segs.push([cx, cy, cx, sy > 0 ? y + 1 : y]);
    }
  }
  return segs;
}

/** Clareia (+) ou escurece (-) uma cor #rrggbb. */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
