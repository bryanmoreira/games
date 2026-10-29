/*
 * Desenho da mesa de sinuca no canvas. O mundo é em metros (o mesmo da física); a mesa fica deitada (comprimento
 * na horizontal) ou em pé quando a tela é mais alta que larga, com a cabeceira embaixo.
 *
 * As bolas são pintadas pixel a pixel numa esfera com orientação própria (matriz 3×3), então o número e a faixa
 * giram de verdade conforme a bola rola — dá para ver o efeito.
 */

import { CORNER_MOUTH, FOOT_X, HEAD_X, HL, HW, POCKETS, R, SEGMENTS, SIDE_MOUTH } from "@mesa/sinuca";

/** Madeira além do bico da tabela e largura da borracha. */
export const RAIL = 0.12;
const CUSHION_W = 0.042;

export interface Xf {
  /** px por metro (CSS) */
  s: number;
  ox: number;
  oy: number;
  /** 1 = mesa em pé */
  rot: 0 | 1;
}

/** Encaixa a mesa no retângulo w × h. */
export function fit(w: number, h: number): Xf {
  const rot: 0 | 1 = h > w * 1.05 ? 1 : 0;
  const tw = 2 * (HL + RAIL);
  const th = 2 * (HW + RAIL);
  const s = rot ? Math.min(w / th, h / tw) : Math.min(w / tw, h / th);
  return { s, ox: w / 2, oy: h / 2, rot };
}

export function toScreen(xf: Xf, x: number, y: number): [number, number] {
  return xf.rot ? [xf.ox - y * xf.s, xf.oy - x * xf.s] : [xf.ox + x * xf.s, xf.oy - y * xf.s];
}

export function toWorld(xf: Xf, sx: number, sy: number): [number, number] {
  return xf.rot ? [-(sy - xf.oy) / xf.s, -(sx - xf.ox) / xf.s] : [(sx - xf.ox) / xf.s, -(sy - xf.oy) / xf.s];
}

/** Põe o contexto em coordenadas do mundo. */
export function worldTransform(ctx: CanvasRenderingContext2D, xf: Xf, dpr: number) {
  if (xf.rot) ctx.setTransform(0, -xf.s * dpr, -xf.s * dpr, 0, xf.ox * dpr, xf.oy * dpr);
  else ctx.setTransform(xf.s * dpr, 0, 0, -xf.s * dpr, xf.ox * dpr, xf.oy * dpr);
}

type P = { x: number; y: number };

function poly(ctx: CanvasRenderingContext2D, pts: P[]) {
  ctx.beginPath();
  pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  ctx.closePath();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Borrachas: cada tabela vai do bico (onde a bola encosta) até o fundo, com as pontas cortadas no ângulo da
 * mandíbula da caçapa. `nose` é a linha do bico e `n` aponta para o pano.
 */
const CUSHIONS: { pts: P[]; nose: [P, P]; n: P }[] = SEGMENTS.slice(0, 6).map((sg) => {
  const p0 = { x: sg.ax, y: sg.ay };
  const p1 = { x: sg.ax + sg.dx * sg.len, y: sg.ay + sg.dy * sg.len };
  const out = { x: -sg.nx, y: -sg.ny };
  // a mandíbula que sai desta ponta, esticada até o fundo da borracha
  const jaw = (q: P): P => {
    for (const pk of POCKETS) {
      const i = pk.poly.findIndex((v) => Math.abs(v.x - q.x) < 1e-9 && Math.abs(v.y - q.y) < 1e-9);
      if (i === 0 || i === 3) {
        const e = pk.poly[i === 0 ? 1 : 2];
        const d = { x: e.x - q.x, y: e.y - q.y };
        const k = CUSHION_W / (d.x * out.x + d.y * out.y);
        return { x: q.x + d.x * k, y: q.y + d.y * k };
      }
    }
    return { x: q.x + out.x * CUSHION_W, y: q.y + out.y * CUSHION_W };
  };
  return { pts: [p0, p1, jaw(p1), jaw(p0)], nose: [p0, p1], n: { x: sg.nx, y: sg.ny } };
});

let noise: HTMLCanvasElement | null = null;

/** Trama do pano: ruído fininho, repetido em pixels da tela. */
function clothNoise(): HTMLCanvasElement {
  if (noise) return noise;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  const img = x.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() < 0.5 ? 0 : 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.random() * 16;
  }
  x.putImageData(img, 0, 0);
  noise = c;
  return c;
}

/**
 * Onde o buraco é desenhado: logo depois da boca, pouco maior que uma bola (1,3 diâmetro), então a bola na
 * frente quase o tampa. O do meio encosta na linha da tabela; o do canto fica no canto de dentro. A bola some
 * nele quando o centro entra no círculo de queda da física, que fica dentro do desenho.
 */
export function pocketLook(p: (typeof POCKETS)[number]): { x: number; y: number; r: number } {
  const depth = p.corner ? 0.03 : 0.022;
  return { x: p.mx + p.ox * depth, y: p.my + p.oy * depth, r: p.corner ? 0.039 : 0.037 };
}

/** Largura da borda de couro em volta do buraco. */
const RIM = 0.01;
/** Placa de latão do canto (lado do quadrado) e do meio (meia largura). */
const CORNER_PLATE = 0.2;
const SIDE_PLATE = 0.095;

const MC = CORNER_MOUTH / Math.SQRT2;
const MS = SIDE_MOUTH / 2;

/** Pano onde a bola anda: bicos das tabelas, atravessando a boca das caçapas. */
const BED: [number, number][] = [
  [-HL + MC, HW],
  [-MS, HW],
  [MS, HW],
  [HL - MC, HW],
  [HL, HW - MC],
  [HL, -HW + MC],
  [HL - MC, -HW],
  [MS, -HW],
  [-MS, -HW],
  [-HL + MC, -HW],
  [-HL, -HW + MC],
  [-HL, HW - MC],
];

/**
 * Placas de latão onde ficam as caçapas: uma quadrada em cada canto, com o buraco no meio, e uma no meio das
 * tabelas compridas, com relevo, um filete gravado e parafusos.
 */
function drawPlates(ctx: CanvasRenderingContext2D, ow: number, oh: number, iw: number, ih: number, rot: 0 | 1) {
  const lx = rot ? Math.SQRT1_2 : -Math.SQRT1_2;
  const ly = Math.SQRT1_2;
  ctx.save();
  // nada passa da moldura
  roundRect(ctx, -ow, -oh, 2 * ow, 2 * oh, 0.075);
  ctx.clip();

  const plate = (x0: number, y0: number, w: number, h: number, screws: P[]) => {
    const brass = ctx.createLinearGradient(x0 + (lx < 0 ? 0 : w), y0 + h, x0 + (lx < 0 ? w : 0), y0);
    brass.addColorStop(0, "#fbe6a2");
    brass.addColorStop(0.3, "#d8ad4c");
    brass.addColorStop(0.65, "#9a6d22");
    brass.addColorStop(1, "#e2bf68");
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 8;
    roundRect(ctx, x0, y0, w, h, 0.018);
    ctx.fillStyle = brass;
    ctx.fill();
    ctx.restore();
    // relevo: luz numa borda, sombra na outra, e um filete gravado por dentro
    roundRect(ctx, x0, y0, w, h, 0.018);
    ctx.strokeStyle = "rgba(70,45,10,0.8)";
    ctx.lineWidth = 0.003;
    ctx.stroke();
    roundRect(ctx, x0 + 0.003, y0 + 0.003, w - 0.006, h - 0.006, 0.015);
    ctx.strokeStyle = "rgba(255,245,200,0.55)";
    ctx.lineWidth = 0.002;
    ctx.stroke();
    roundRect(ctx, x0 + 0.011, y0 + 0.011, w - 0.022, h - 0.022, 0.01);
    ctx.strokeStyle = "rgba(110,72,18,0.55)";
    ctx.lineWidth = 0.0015;
    ctx.stroke();
    for (const s of screws) {
      const g = ctx.createRadialGradient(s.x + lx * 0.002, s.y + ly * 0.002, 0, s.x, s.y, 0.0065);
      g.addColorStop(0, "#fff3c4");
      g.addColorStop(0.6, "#b98a35");
      g.addColorStop(1, "#5e3f10");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 0.0065, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(60,38,8,0.85)";
      ctx.lineWidth = 0.0014;
      ctx.beginPath();
      ctx.moveTo(s.x - 0.004, s.y - 0.004);
      ctx.lineTo(s.x + 0.004, s.y + 0.004);
      ctx.stroke();
    }
  };

  const mid = (iw + ow) / 2;
  const midY = (ih + oh) / 2;
  // cantos: placa quadrada com o buraco no meio; cobre a madeira e a boca, mas não o pano onde a bola anda
  ctx.save();
  ctx.beginPath();
  ctx.rect(-ow - 1, -oh - 1, 2 * ow + 2, 2 * oh + 2);
  BED.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.clip("evenodd");
  for (const p of POCKETS.filter((k) => k.corner)) {
    const c = pocketLook(p);
    const sx = Math.sign(p.ox);
    const sy = Math.sign(p.oy);
    const inner = CORNER_PLATE - (ow - Math.abs(c.x)); // quanto a placa entra além do centro do buraco
    const x0 = sx > 0 ? c.x - inner : -ow;
    const y0 = sy > 0 ? c.y - inner : -oh;
    // parafusos nas duas pontas da placa, no meio da madeira
    plate(x0, y0, CORNER_PLATE, CORNER_PLATE, [
      { x: sx * (ow - CORNER_PLATE + 0.02), y: sy * midY },
      { x: sx * mid, y: sy * (oh - CORNER_PLATE + 0.02) },
    ]);
  }
  ctx.restore();

  // meio: só sobre a madeira
  ctx.beginPath();
  ctx.rect(-ow - 1, -oh - 1, 2 * ow + 2, 2 * oh + 2);
  ctx.rect(-iw, -ih, 2 * iw, 2 * ih);
  ctx.clip("evenodd");
  for (const sy of [1, -1]) {
    const y0 = sy > 0 ? ih - 0.02 : -oh;
    plate(-SIDE_PLATE, y0, 2 * SIDE_PLATE, oh - ih + 0.02, [
      { x: -SIDE_PLATE + 0.018, y: sy * midY },
      { x: SIDE_PLATE - 0.018, y: sy * midY },
    ]);
  }
  ctx.restore();
}

/**
 * Caçapa: a boca com a sombra descendo para o buraco, o buraco com a parede de dentro iluminada do lado
 * oposto à luz e um aro fino de metal escovado.
 */
function drawPocket(ctx: CanvasRenderingContext2D, p: (typeof POCKETS)[number], iw: number, ih: number, rot: 0 | 1) {
  const { x, y, r } = pocketLook(p);
  // luz de cima à esquerda da tela, em coordenadas do mundo
  const lx = rot ? Math.SQRT1_2 : -Math.SQRT1_2;
  const ly = Math.SQRT1_2;

  // boca: do bico das borrachas até o buraco, o pano vai ficando na sombra
  const [a, ae, be, b] = p.poly;
  const stretch = (q: P, e: P) => {
    // a mandíbula esticada até o fundo da borracha
    const dx = e.x - q.x;
    const dy = e.y - q.y;
    const k = Math.abs(Math.abs(q.y) - HW) < 1e-9 ? (ih - HW) / Math.abs(dy) : (iw - HL) / Math.abs(dx);
    return { x: q.x + dx * k, y: q.y + dy * k };
  };
  const throat = [a, stretch(a, ae), ...(p.corner ? [{ x: Math.sign(p.ox) * iw, y: Math.sign(p.oy) * ih }] : []), stretch(b, be), b];
  const shade = ctx.createLinearGradient(p.mx, p.my, x, y);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = shade;
  poly(ctx, throat);
  // no canto a boca fica sob a placa de latão
  if (!p.corner) ctx.fill();

  // bolso de couro: a borda do couro aparece em volta do buraco, com costura
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 6;
  const leather = ctx.createLinearGradient(x + lx * (r + RIM), y + ly * (r + RIM), x - lx * (r + RIM), y - ly * (r + RIM));
  leather.addColorStop(0, "#6b4a30");
  leather.addColorStop(0.5, "#3b2617");
  leather.addColorStop(1, "#1d120a");
  ctx.fillStyle = leather;
  ctx.beginPath();
  ctx.arc(x, y, r + RIM, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(225,190,140,0.45)";
  ctx.lineWidth = 0.0012;
  ctx.setLineDash([0.0035, 0.0025]);
  ctx.beginPath();
  ctx.arc(x, y, r + RIM * 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // buraco: fundo preto e a parede de dentro clareando do lado longe da luz
  const wall = ctx.createRadialGradient(x + lx * r * 0.3, y + ly * r * 0.3, 0, x, y, r);
  wall.addColorStop(0, "#000");
  wall.addColorStop(0.7, "#030303");
  wall.addColorStop(0.92, "#141210");
  wall.addColorStop(1, "#2c2824");
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.lineWidth = 0.002;
  ctx.stroke();
}

/** Mesa inteira (madeira, pano, caçapas, borrachas, marcas). Desenhada uma vez num canvas próprio. */
export function drawTable(ctx: CanvasRenderingContext2D, xf: Xf, dpr: number, kitchen: boolean) {
  worldTransform(ctx, xf, dpr);
  const ow = HL + RAIL;
  const oh = HW + RAIL;
  const iw = HL + CUSHION_W;
  const ih = HW + CUSHION_W;

  // sombra da mesa e a madeira
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 0.09 * xf.s * dpr;
  roundRect(ctx, -ow, -oh, 2 * ow, 2 * oh, 0.075);
  ctx.fillStyle = "#5b2913";
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, -ow, -oh, 2 * ow, 2 * oh, 0.075);
  ctx.clip();
  // veio
  for (let k = 0; k < 64; k++) {
    const y = -oh + (k / 64) * 2 * oh;
    ctx.strokeStyle = k % 3 ? "rgba(0,0,0,0.10)" : "rgba(255,200,150,0.07)";
    ctx.lineWidth = 0.0015 + (k % 4) * 0.0008;
    ctx.beginPath();
    ctx.moveTo(-ow, y);
    ctx.bezierCurveTo(-ow / 3, y + 0.012 * Math.sin(k * 1.3), ow / 3, y - 0.014 * Math.cos(k * 0.7), ow, y + 0.006 * Math.sin(k));
    ctx.stroke();
  }
  // relevo de cada lado: sombra junto à borracha, brilho no meio e borda escura por fora
  const sides: { pts: P[]; from: P; to: P }[] = [
    { pts: [{ x: -ow, y: oh }, { x: ow, y: oh }, { x: iw, y: ih }, { x: -iw, y: ih }], from: { x: 0, y: ih }, to: { x: 0, y: oh } },
    { pts: [{ x: -ow, y: -oh }, { x: ow, y: -oh }, { x: iw, y: -ih }, { x: -iw, y: -ih }], from: { x: 0, y: -ih }, to: { x: 0, y: -oh } },
    { pts: [{ x: ow, y: -oh }, { x: ow, y: oh }, { x: iw, y: ih }, { x: iw, y: -ih }], from: { x: iw, y: 0 }, to: { x: ow, y: 0 } },
    { pts: [{ x: -ow, y: -oh }, { x: -ow, y: oh }, { x: -iw, y: ih }, { x: -iw, y: -ih }], from: { x: -iw, y: 0 }, to: { x: -ow, y: 0 } },
  ];
  for (const sd of sides) {
    const g = ctx.createLinearGradient(sd.from.x, sd.from.y, sd.to.x, sd.to.y);
    g.addColorStop(0, "rgba(0,0,0,0.6)");
    g.addColorStop(0.08, "rgba(0,0,0,0.15)");
    g.addColorStop(0.35, "rgba(255,214,160,0.17)");
    g.addColorStop(0.6, "rgba(255,214,160,0.04)");
    g.addColorStop(0.9, "rgba(0,0,0,0.15)");
    g.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = g;
    poly(ctx, sd.pts);
    ctx.fill();
  }
  // emenda das quinas
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 0.002;
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    ctx.beginPath();
    ctx.moveTo(sx * iw, sy * ih);
    ctx.lineTo(sx * ow, sy * oh);
    ctx.stroke();
  }
  ctx.restore();
  // filete claro na borda de fora
  ctx.strokeStyle = "rgba(255,210,160,0.22)";
  ctx.lineWidth = 0.003;
  roundRect(ctx, -ow + 0.007, -oh + 0.007, 2 * (ow - 0.007), 2 * (oh - 0.007), 0.068);
  ctx.stroke();

  // pano (até debaixo das borrachas), com a luz da luminária e a trama
  ctx.fillStyle = "#13814a";
  ctx.fillRect(-iw, -ih, 2 * iw, 2 * ih);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-iw, -ih, 2 * iw, 2 * ih);
  ctx.clip();
  const lamp = ctx.createRadialGradient(0, 0, 0.05, 0, 0, HL * 1.15);
  lamp.addColorStop(0, "rgba(255,255,220,0.12)");
  lamp.addColorStop(0.55, "rgba(0,0,0,0)");
  lamp.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = lamp;
  ctx.fillRect(-iw, -ih, 2 * iw, 2 * ih);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = ctx.createPattern(clothNoise(), "repeat")!;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  worldTransform(ctx, xf, dpr);

  drawPlates(ctx, ow, oh, iw, ih, xf.rot);
  for (const p of POCKETS) drawPocket(ctx, p, iw, ih, xf.rot);

  // sombra das borrachas no pano
  for (const c of CUSHIONS) {
    const [a, b] = c.nose;
    const w = 0.024;
    const g = ctx.createLinearGradient(a.x, a.y, a.x + c.n.x * w, a.y + c.n.y * w);
    g.addColorStop(0, "rgba(0,0,0,0.32)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    poly(ctx, [a, b, { x: b.x + c.n.x * w, y: b.y + c.n.y * w }, { x: a.x + c.n.x * w, y: a.y + c.n.y * w }]);
    ctx.fill();
  }
  // borrachas: o topo pega luz perto do bico e escurece até o fundo
  for (const c of CUSHIONS) {
    const [a] = c.nose;
    const g = ctx.createLinearGradient(a.x, a.y, a.x - c.n.x * CUSHION_W, a.y - c.n.y * CUSHION_W);
    g.addColorStop(0, "#1fa05d");
    g.addColorStop(0.25, "#178a4e");
    g.addColorStop(1, "#0a5130");
    ctx.fillStyle = g;
    poly(ctx, c.pts);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 0.0025;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.002;
    ctx.beginPath();
    ctx.moveTo(c.nose[0].x - c.n.x * 0.002, c.nose[0].y - c.n.y * 0.002);
    ctx.lineTo(c.nose[1].x - c.n.x * 0.002, c.nose[1].y - c.n.y * 0.002);
    ctx.stroke();
  }

  // marcas na madeira (madrepérola)
  const mark = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    const g = ctx.createRadialGradient(-0.003, -0.003, 0, 0, 0, 0.012);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.6, "#e8e0cc");
    g.addColorStop(1, "#b9ad92");
    ctx.fillStyle = g;
    ctx.fillRect(-0.0075, -0.0075, 0.015, 0.015);
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 0.0015;
    ctx.strokeRect(-0.0075, -0.0075, 0.015, 0.015);
    ctx.restore();
  };
  const railMid = CUSHION_W + (RAIL - CUSHION_W) * 0.5;
  for (const k of [-3, -2, -1, 1, 2, 3]) {
    mark((k * HL) / 4, HW + railMid);
    mark((k * HL) / 4, -HW - railMid);
  }
  for (const k of [-1, 0, 1]) {
    mark(HL + railMid, (k * HW) / 2);
    mark(-HL - railMid, (k * HW) / 2);
  }

  // linha de cabeceira (só com a branca na cozinha) e marca do pé
  if (kitchen) {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(-HL, -HW, HEAD_X + HL, 2 * HW);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.setLineDash([0.02, 0.015]);
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
  }
  ctx.lineWidth = 0.003;
  ctx.beginPath();
  ctx.moveTo(HEAD_X, -HW);
  ctx.lineTo(HEAD_X, HW);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.beginPath();
  ctx.arc(FOOT_X, 0, 0.006, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------------------------------------
// Bolas

export const BALL_COLORS: Record<number, string> = {
  0: "#f6f2e6",
  1: "#f4c20d",
  2: "#1d4fc4",
  3: "#d8231f",
  4: "#5a2a8c",
  5: "#f2750f",
  6: "#0e7d3c",
  7: "#7c1c1c",
  8: "#121212",
};

export const ballColor = (n: number) => BALL_COLORS[n > 8 ? n - 8 : n];

function hexRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

/** Orientação: matriz 3×3 (colunas = eixos da bola no mundo). */
export type Orient = Float64Array;

export function randomOrient(): Orient {
  // eixo e ângulo ao acaso
  const m = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  rotateOrient(m, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, 1 + Math.random() * 5);
  return m;
}

/** Gira a orientação em torno do eixo (ax, ay, az) por `angle` (radianos, eixo do mundo). */
export function rotateOrient(m: Orient, ax: number, ay: number, az: number, angle: number) {
  const l = Math.sqrt(ax * ax + ay * ay + az * az);
  if (l < 1e-12 || angle === 0) return;
  const x = ax / l;
  const y = ay / l;
  const z = az / l;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  const r = [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
  const out = new Float64Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out[i * 3 + j] = r[i * 3] * m[j] + r[i * 3 + 1] * m[3 + j] + r[i * 3 + 2] * m[6 + j];
  // reortonormaliza as colunas (Gram-Schmidt) para não acumular erro
  const col = (k: number) => [out[k], out[3 + k], out[6 + k]];
  const a = col(0);
  const al = Math.hypot(a[0], a[1], a[2]);
  a[0] /= al;
  a[1] /= al;
  a[2] /= al;
  const b = col(1);
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  b[0] -= d * a[0];
  b[1] -= d * a[1];
  b[2] -= d * a[2];
  const bl = Math.hypot(b[0], b[1], b[2]);
  b[0] /= bl;
  b[1] /= bl;
  b[2] /= bl;
  const cc = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  for (let i = 0; i < 3; i++) {
    m[i * 3] = a[i];
    m[i * 3 + 1] = b[i];
    m[i * 3 + 2] = cc[i];
  }
}

const GLYPH = 40;
const glyphs = new Map<number, Uint8Array>();

/** Número da bola em preto sobre transparente (canal alfa). */
function glyph(n: number): Uint8Array {
  let g = glyphs.get(n);
  if (g) return g;
  const c = document.createElement("canvas");
  c.width = c.height = GLYPH;
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.font = `bold ${n >= 10 ? 21 : 25}px system-ui, sans-serif`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(String(n), GLYPH / 2, GLYPH / 2 + 1.5);
  const d = x.getImageData(0, 0, GLYPH, GLYPH).data;
  g = new Uint8Array(GLYPH * GLYPH);
  for (let i = 0; i < g.length; i++) g[i] = d[i * 4 + 3];
  glyphs.set(n, g);
  return g;
}

// luz fixa na tela: de cima à esquerda
const L = (() => {
  const v = [-0.45, -0.55, 0.9];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((k) => k / l);
})();
const H = (() => {
  const v = [L[0], L[1], L[2] + 1];
  const l = Math.hypot(v[0], v[1], v[2]);
  return v.map((k) => k / l);
})();

/** Pinta a bola `n` com a orientação `m` num canvas de 2·rp + 2 px. */
export function paintBall(canvas: HTMLCanvasElement, n: number, m: Orient, rp: number, rot: 0 | 1, alpha = 1) {
  const size = Math.ceil(rp * 2) + 2;
  if (canvas.width !== size) canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const base = hexRgb(ballColor(n));
  const stripe = n > 8;
  const cue = n === 0;
  const g = n > 0 ? glyph(n) : null;
  const c = size / 2;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = (px + 0.5 - c) / rp;
      const dy = (py + 0.5 - c) / rp;
      const d2 = dx * dx + dy * dy;
      if (d2 >= 1.04) continue;
      const dz = Math.sqrt(Math.max(0, 1 - d2));
      // normal na tela → mundo → corpo da bola
      const wx = rot ? -dy : dx;
      const wy = rot ? -dx : -dy;
      const bx = m[0] * wx + m[3] * wy + m[6] * dz;
      const by = m[1] * wx + m[4] * wy + m[7] * dz;
      const bz = m[2] * wx + m[5] * wy + m[8] * dz;
      let col = base;
      let white = false;
      if (cue) {
        // pintas vermelhas nos seis polos para ver a rotação
        if (Math.abs(bx) > 0.975 || Math.abs(by) > 0.975 || Math.abs(bz) > 0.975) col = [200, 30, 30];
      } else {
        if (stripe && Math.abs(bz) > 0.5) white = true;
        const ax = Math.abs(bx);
        if (ax > 0.86) {
          // círculo do número em ±x do corpo
          const u = (bx > 0 ? by : -by) / 0.51;
          const v = bz / 0.51;
          const gx = Math.floor(((u + 1) / 2) * GLYPH);
          const gy = Math.floor(((1 - v) / 2) * GLYPH);
          const ink = g && gx >= 0 && gy >= 0 && gx < GLYPH && gy < GLYPH ? g[gy * GLYPH + gx] / 255 : 0;
          const w: [number, number, number] = [246, 242, 230];
          col = [w[0] * (1 - ink) + 20 * ink, w[1] * (1 - ink) + 20 * ink, w[2] * (1 - ink) + 20 * ink];
          white = false;
        }
      }
      if (white) col = [246, 242, 230];
      const nl = Math.max(0, dx * L[0] + dy * L[1] + dz * L[2]);
      // borda um pouco mais escura (volume) e o verde do pano refletido na parte de baixo
      const rim = 1 - 0.35 * Math.pow(1 - dz, 2.5);
      const diff = (0.36 + 0.72 * nl) * rim;
      const bounce = Math.max(0, (dx * -L[0] + dy * -L[1]) * 0.6) * (1 - dz) * 0.35;
      const nh = Math.max(0, dx * H[0] + dy * H[1] + dz * H[2]);
      const spec = Math.pow(nh, 80) * 0.95 + Math.pow(nh, 10) * 0.07;
      const o = (py * size + px) * 4;
      data[o] = Math.min(255, col[0] * diff + 255 * spec + 20 * bounce);
      data[o + 1] = Math.min(255, col[1] * diff + 255 * spec + 120 * bounce);
      data[o + 2] = Math.min(255, col[2] * diff + 255 * spec + 60 * bounce);
      // borda suave
      const edge = Math.min(1, Math.max(0, (1 - Math.sqrt(d2)) * rp + 0.5));
      data[o + 3] = 255 * edge * alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Bola parada desenhada uma vez (para ícones). */
export function ballSprite(n: number, rp: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  // número de frente, faixa na horizontal
  const m = new Float64Array([0, 1, 0, 0, 0, 1, 1, 0, 0]);
  paintBall(c, n, m, rp, 0);
  return c;
}

export { R };
