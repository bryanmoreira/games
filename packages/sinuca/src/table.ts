/*
 * Geometria da mesa, em metros, com a origem no centro do pano: x ao longo do comprimento (a cabeceira, de onde
 * se quebra, fica em x < 0) e y ao longo da largura. Medidas de uma mesa de 8 pés (área de jogo 2,24 × 1,12 m)
 * com bolas de 57,15 mm.
 *
 * As tabelas são segmentos na linha do bico da borracha (onde a bola encosta); as bocas das caçapas têm as
 * quinas da tabela e as "mandíbulas" (segmentos inclinados que levam para dentro da caçapa). A bola cai quando
 * o centro dela entra no círculo de queda da caçapa, que fica todo além da borda do pano.
 *
 * Tudo aqui é constante literal (sem seno e cosseno), para dar o mesmo número em qualquer motor de JavaScript.
 */

/** Raio da bola. */
export const R = 0.028575;
/** Meio comprimento e meia largura da área de jogo. */
export const HL = 1.12;
export const HW = 0.56;

/** Boca da caçapa do canto (entre os bicos das tabelas) e do meio: 1,5 e 1,6 bola, mais justas que as oficiais. */
export const CORNER_MOUTH = 0.086;
export const SIDE_MOUTH = 0.092;

/** Linha de cabeceira (atrás dela fica a "cozinha", onde a branca é posta na quebra) e marca do pé. */
export const HEAD_X = -HL / 2;
export const FOOT_X = HL / 2;

export interface Segment {
  ax: number;
  ay: number;
  /** direção unitária de a para b */
  dx: number;
  dy: number;
  len: number;
  /** normal unitária para o lado de onde a bola vem */
  nx: number;
  ny: number;
}

export interface Pocket {
  /** centro e raio do círculo de queda */
  x: number;
  y: number;
  r: number;
  /** meio da boca e direção para fora da mesa (para mirar) */
  mx: number;
  my: number;
  ox: number;
  oy: number;
  corner: boolean;
  /** contorno da boca para o desenho: ponta da tabela, fim da mandíbula, fim da outra mandíbula, outra ponta */
  poly: { x: number; y: number }[];
}

function seg(ax: number, ay: number, bx: number, by: number, nx: number, ny: number): Segment {
  const len = Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
  return { ax, ay, dx: (bx - ax) / len, dy: (by - ay) / len, len, nx, ny };
}

const C = CORNER_MOUTH / Math.SQRT2;
const S = SIDE_MOUTH / 2;
const SQ = Math.SQRT1_2;

/** Mandíbulas: a do canto faz 142° com a tabela, a do meio 104°. */
const CORNER_JAW = 0.045;
const CJ_ALONG = 0.788011; // cos 38°
const CJ_OUT = 0.615661; // sen 38°
const SIDE_JAW = 0.035;
const SJ_ALONG = 0.241922; // cos 76°
const SJ_OUT = 0.970296; // sen 76°

const segments: Segment[] = [];
const points: { x: number; y: number }[] = [];
const pockets: Pocket[] = [];

// Tabelas compridas (em cima e embaixo), cada uma em duas partes por causa da caçapa do meio, e as curtas.
for (const sy of [1, -1]) {
  const y = sy * HW;
  segments.push(seg(-HL + C, y, -S, y, 0, -sy));
  segments.push(seg(S, y, HL - C, y, 0, -sy));
}
for (const sx of [1, -1]) {
  const x = sx * HL;
  segments.push(seg(x, -HW + C, x, HW - C, -sx, 0));
}

// Caçapas do canto: quinas das tabelas, mandíbulas e círculo de queda.
for (const sx of [1, -1]) {
  for (const sy of [1, -1]) {
    // a = ponta da tabela comprida, b = ponta da tabela curta
    const ax = sx * (HL - C);
    const ay = sy * HW;
    const bx = sx * HL;
    const by = sy * (HW - C);
    const aex = ax + sx * CORNER_JAW * CJ_ALONG;
    const aey = ay + sy * CORNER_JAW * CJ_OUT;
    const bex = bx + sx * CORNER_JAW * CJ_OUT;
    const bey = by + sy * CORNER_JAW * CJ_ALONG;
    // normais das mandíbulas apontam para o eixo da caçapa
    segments.push(seg(ax, ay, aex, aey, sx * CJ_OUT, -sy * CJ_ALONG));
    segments.push(seg(bx, by, bex, bey, -sx * CJ_ALONG, sy * CJ_OUT));
    points.push({ x: ax, y: ay }, { x: bx, y: by }, { x: aex, y: aey }, { x: bex, y: bey });
    const mx = sx * (HL - C / 2);
    const my = sy * (HW - C / 2);
    const poly = [{ x: ax, y: ay }, { x: aex, y: aey }, { x: bex, y: bey }, { x: bx, y: by }];
    pockets.push({ x: mx + sx * SQ * 0.042, y: my + sy * SQ * 0.042, r: 0.035, mx, my, ox: sx * SQ, oy: sy * SQ, corner: true, poly });
  }
}

// Caçapas do meio.
for (const sy of [1, -1]) {
  const y = sy * HW;
  const poly: { x: number; y: number }[] = [];
  for (const sx of [1, -1]) {
    const ax = sx * S;
    const aex = ax - sx * SIDE_JAW * SJ_ALONG;
    const aey = y + sy * SIDE_JAW * SJ_OUT;
    segments.push(seg(ax, y, aex, aey, -sx * SJ_OUT, -sy * SJ_ALONG));
    points.push({ x: ax, y }, { x: aex, y: aey });
    if (sx === 1) poly.push({ x: ax, y }, { x: aex, y: aey });
    else poly.push({ x: aex, y: aey }, { x: ax, y });
  }
  pockets.push({ x: 0, y: y + sy * 0.036, r: 0.035, mx: 0, my: y, ox: 0, oy: sy, corner: false, poly });
}

/**
 * Caçapas em ordem fixa (é o índice que vai no protocolo para cantar a 8):
 * 0 canto direito de cima, 1 canto direito de baixo, 2 canto esquerdo de cima, 3 canto esquerdo de baixo,
 * 4 meio de cima, 5 meio de baixo. "Cima" é y > 0.
 */
export const POCKETS: readonly Pocket[] = pockets;
export const SEGMENTS: readonly Segment[] = segments;
/** Quinas (bicos arredondados das tabelas e pontas das mandíbulas). */
export const POINTS: readonly { x: number; y: number }[] = points;

/** A bola cabe nesse lugar do pano? (dentro das tabelas) */
export function onCloth(x: number, y: number): boolean {
  return Math.abs(x) <= HL - R && Math.abs(y) <= HW - R;
}

/** Atrás da linha de cabeceira (na cozinha). */
export function inKitchen(x: number): boolean {
  return x <= HEAD_X;
}
