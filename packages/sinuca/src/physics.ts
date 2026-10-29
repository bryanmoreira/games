/*
 * Física da sinuca.
 *
 * Cada bola tem posição, velocidade e rotação nos três eixos e está em um de quatro estados:
 * - deslizando: o ponto de contato com o pano escorrega; o atrito de deslize (μs) freia a bola e acerta a
 *   rotação até ela "pegar" o rolamento (efeito alto e baixo vivem aqui);
 * - rolando: sem escorregar, freada só pela resistência ao rolamento (μr);
 * - girando no lugar: parada, só com rotação vertical;
 * - parada.
 * Em cada estado o movimento tem fórmula fechada (velocidade linear no tempo, posição quadrática), e as trocas
 * de estado acontecem no instante exato. A rotação vertical (efeito lateral) cai com o atrito de giro (μsp).
 *
 * O tempo anda em janelas de 1/2000 s. Dentro da janela, os choques (bola com bola, tabela, quina e queda na
 * caçapa) são achados pelo instante exato do contato, então nada atravessa nada, por mais forte que seja a
 * tacada; o simulador anda até o choque mais cedo, resolve e continua.
 *
 * Choques:
 * - bola com bola: impulso normal com restituição e atrito entre as bolas, que "arrasta" a bola atingida
 *   (desvio no corte e com efeito) e passa rotação de uma para a outra;
 * - tabela: modelo de Han (2005), com o bico da borracha acima do centro da bola; o efeito muda o ângulo e a
 *   velocidade de saída;
 * - tacada: impulso do taco no ponto escolhido da branca, com o pequeno desvio da branca no efeito lateral.
 *
 * Só usa soma, subtração, multiplicação, divisão e raiz quadrada, que dão o mesmo resultado bit a bit em
 * qualquer motor de JavaScript: o servidor e o navegador simulam a mesma tacada e chegam ao mesmo lugar.
 */

import { HL, HW, POCKETS, POINTS, R, SEGMENTS, type Segment } from "./table";

export const BALL_MASS = 0.17;
export const CUE_MASS = 0.54;
const I = 0.4 * BALL_MASS * R * R;
const G = 9.81;
/** Atrito de deslize, de rolamento e de giro com o pano. */
export const MU_SLIDE = 0.2;
export const MU_ROLL = 0.01;
export const MU_SPIN = 0.03;
/** Restituição entre bolas e com a tabela; atrito bola-tabela. */
export const E_BALL = 0.95;
export const E_CUSHION = 0.85;
export const MU_CUSHION = 0.2;
/** Altura do bico da tabela: 63,5% do diâmetro. sen θ = h/R − 1. */
const SIN_C = 0.27;
const COS_C = Math.sqrt(1 - SIN_C * SIN_C);
/** Desvio da branca no efeito lateral: massa da bola / massa da ponta do taco. */
const SQUIRT_RATIO = 25;
/** Maior distância do centro em que o taco pode bater (fração do raio). */
export const MAX_TIP = 0.5;
/** Velocidade da branca com 100% de força (batendo no centro). */
export const MAX_SPEED = 7.5;

export const DT = 1 / 2000;
const MAX_TIME = 60;
const EPS = 1e-9;

export enum St {
  Still = 0,
  Spinning = 1,
  Sliding = 2,
  Rolling = 3,
  Pocketed = 4,
}

/** Bola na mesa: número (0 = branca) e posição. */
export interface BallPos {
  n: number;
  x: number;
  y: number;
}

export interface Ball {
  n: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wx: number;
  wy: number;
  wz: number;
  s: St;
}

/**
 * Tacada: direção da mira (unitária), força de 0 a 1 e ponto de batida na branca (spinX à direita, spinY para
 * cima), dentro do círculo unitário.
 */
export interface Shot {
  dx: number;
  dy: number;
  power: number;
  spinX: number;
  spinY: number;
}

export enum Ev {
  Ball = 0,
  Cushion = 1,
  Pocket = 2,
}

/** Choque: duas bolas (`b` = outra bola), bola na tabela (`b` = -1) ou bola na caçapa (`b` = caçapa). */
export interface SimEvent {
  t: number;
  kind: Ev;
  a: number;
  b: number;
  /** velocidade do choque, para o som */
  speed: number;
}

export interface Frame {
  t: number;
  /** x, y, wx, wy, wz de cada bola na ordem de `balls`; NaN na posição de quem caiu */
  data: Float64Array;
}

export interface SimResult {
  balls: BallPos[];
  events: SimEvent[];
  /** duração da tacada (até tudo parar), em segundos */
  time: number;
  frames?: Frame[];
  /** bolas encaçapadas, em ordem: número e caçapa */
  pocketed: { n: number; pocket: number }[];
}

export interface SimOptions {
  dt?: number;
  /** grava a posição a cada `record` segundos (para animar) */
  record?: number;
  /** para quando devolver true; chamado a cada choque e a cada janela (usado pela mira) */
  stop?: (balls: Ball[], events: SimEvent[]) => boolean;
}

// ---------------------------------------------------------------------------------------------------------
// Tacada

/** Velocidade da branca para a força escolhida (curva suave no começo, para o toque fino). */
export function speedFor(power: number): number {
  const p = Math.min(1, Math.max(0, power));
  return 0.2 + (MAX_SPEED - 0.2) * p * p;
}

/** Limpa a tacada: direção unitária, força em [0,1] e ponto de batida dentro do círculo. */
export function normalizeShot(shot: Shot): Shot | null {
  const { dx, dy, power, spinX, spinY } = shot;
  if (![dx, dy, power, spinX, spinY].every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-6) return null;
  let sx = spinX;
  let sy = spinY;
  const sl = Math.sqrt(sx * sx + sy * sy);
  if (sl > 1) {
    sx /= sl;
    sy /= sl;
  }
  return { dx: dx / len, dy: dy / len, power: Math.min(1, Math.max(0, power)), spinX: sx, spinY: sy };
}

/** Direção em que a branca sai: a mira desviada um pouco para o lado oposto do efeito lateral. */
export function launchDir(shot: Shot): { x: number; y: number } {
  const a = shot.spinX * MAX_TIP;
  const k = 1 - a * a;
  const tan = (2.5 * a * Math.sqrt(k)) / (1 + SQUIRT_RATIO + 2.5 * k);
  // direita da mira = (dy, -dx)
  const x = shot.dx - tan * shot.dy;
  const y = shot.dy + tan * shot.dx;
  const len = Math.sqrt(x * x + y * y);
  return { x: x / len, y: y / len };
}

/** Dá a tacada na branca: velocidade e rotação do impulso do taco no ponto escolhido. */
export function strike(cue: Ball, shot: Shot) {
  const a = shot.spinX * MAX_TIP * R;
  const b = shot.spinY * MAX_TIP * R;
  const v0 = speedFor(shot.power);
  // velocidade do taco que dá v0 numa tacada no centro
  const vc = (v0 * (1 + BALL_MASS / CUE_MASS)) / 2;
  const F = (2 * CUE_MASS * vc) / (1 + BALL_MASS / CUE_MASS + (2.5 * (a * a + b * b)) / (R * R));
  const d = launchDir(shot);
  const v = F / BALL_MASS;
  cue.vx = d.x * v;
  cue.vy = d.y * v;
  // contato em (a, -c, b) no referencial do taco (x direita, y frente, z cima); torque = r × F
  const wr = (-b * F) / I; // em torno do eixo da direita
  cue.wx = wr * d.y;
  cue.wy = -wr * d.x;
  cue.wz = (a * F) / I;
  setState(cue);
}

// ---------------------------------------------------------------------------------------------------------
// Movimento entre choques

function slip(b: Ball): [number, number] {
  return [b.vx - R * b.wy, b.vy + R * b.wx];
}

/** Escolhe o estado da bola pela velocidade e rotação atuais. */
export function setState(b: Ball) {
  if (b.s === St.Pocketed) return;
  const [ux, uy] = slip(b);
  if (ux * ux + uy * uy > EPS * EPS) b.s = St.Sliding;
  else if (b.vx * b.vx + b.vy * b.vy > EPS * EPS) b.s = St.Rolling;
  else if (Math.abs(b.wz) > EPS) b.s = St.Spinning;
  else {
    b.s = St.Still;
    b.vx = b.vy = b.wx = b.wy = b.wz = 0;
  }
}

const SPIN_DECEL = (5 * MU_SPIN * G) / (2 * R);

/** Tempo até acabar o deslize ou o rolamento. */
function stateEnd(b: Ball): number {
  if (b.s === St.Sliding) {
    const [ux, uy] = slip(b);
    return (2 * Math.sqrt(ux * ux + uy * uy)) / (7 * MU_SLIDE * G);
  }
  if (b.s === St.Rolling) return Math.sqrt(b.vx * b.vx + b.vy * b.vy) / (MU_ROLL * G);
  return Infinity;
}

/** Anda `t` segundos sem trocar de estado. */
function move(b: Ball, t: number) {
  if (b.wz !== 0) {
    const dw = SPIN_DECEL * t;
    b.wz = b.wz > 0 ? Math.max(0, b.wz - dw) : Math.min(0, b.wz + dw);
  }
  if (b.s === St.Sliding) {
    const [ux, uy] = slip(b);
    const un = Math.sqrt(ux * ux + uy * uy);
    if (un === 0) return;
    const ex = ux / un;
    const ey = uy / un;
    const a = MU_SLIDE * G;
    b.x += b.vx * t - 0.5 * a * t * t * ex;
    b.y += b.vy * t - 0.5 * a * t * t * ey;
    b.vx -= a * t * ex;
    b.vy -= a * t * ey;
    const k = ((5 * a) / (2 * R)) * t;
    b.wx -= k * ey;
    b.wy += k * ex;
  } else if (b.s === St.Rolling) {
    const v = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (v === 0) return;
    const ex = b.vx / v;
    const ey = b.vy / v;
    const a = MU_ROLL * G;
    b.x += b.vx * t - 0.5 * a * t * t * ex;
    b.y += b.vy * t - 0.5 * a * t * t * ey;
    b.vx -= a * t * ex;
    b.vy -= a * t * ey;
    b.wx = -b.vy / R;
    b.wy = b.vx / R;
  }
}

/** Anda `t` segundos trocando de estado no instante exato. */
function evolve(b: Ball, t: number) {
  while (t > 0 && b.s !== St.Still && b.s !== St.Pocketed) {
    const tw = b.wz !== 0 ? Math.abs(b.wz) / SPIN_DECEL : Infinity;
    const ts = stateEnd(b);
    const change = Math.min(tw, ts);
    if (change > t) {
      move(b, t);
      return;
    }
    move(b, change);
    t -= change;
    // fecha a troca sem resto de arredondamento
    if (tw <= ts) b.wz = 0;
    if (ts <= tw) {
      if (b.s === St.Sliding) {
        // pegou o rolamento
        b.wx = -b.vy / R;
        b.wy = b.vx / R;
        b.s = b.vx * b.vx + b.vy * b.vy > EPS * EPS ? St.Rolling : St.Spinning;
      } else {
        b.s = St.Spinning;
      }
      if (b.s === St.Spinning) b.vx = b.vy = b.wx = b.wy = 0;
    }
    if (b.s === St.Spinning && b.wz === 0) b.s = St.Still;
  }
}

// ---------------------------------------------------------------------------------------------------------
// Instante do contato (movimento reto dentro da janela)

/** Instante em que dois círculos em movimento reto chegam à distância `dist` se aproximando; ou Infinity. */
function contactTime(px: number, py: number, vx: number, vy: number, dist: number): number {
  // posição relativa p + v t; |p + v t| = dist
  const b = px * vx + py * vy;
  if (b >= 0) return Infinity; // se afastando
  const c = px * px + py * py - dist * dist;
  if (c <= 0) return 0; // já encostadas
  const a = vx * vx + vy * vy;
  const disc = b * b - a * c;
  if (disc < 0) return Infinity;
  return c / (-b + Math.sqrt(disc));
}

/** Instante em que a bola encosta na tabela (segmento), ou Infinity. */
function segmentTime(b: { x: number; y: number }, vx: number, vy: number, s: Segment): number {
  const vn = vx * s.nx + vy * s.ny;
  if (vn >= 0) return Infinity;
  const d = (b.x - s.ax) * s.nx + (b.y - s.ay) * s.ny;
  if (d < R * 0.25) return Infinity; // atrás da tabela
  const t = d <= R ? 0 : (d - R) / -vn;
  const along = (b.x + vx * t - s.ax) * s.dx + (b.y + vy * t - s.ay) * s.dy;
  return along >= 0 && along <= s.len ? t : Infinity;
}

// ---------------------------------------------------------------------------------------------------------
// Choques

function collideBalls(a: Ball, b: Ball): number {
  let nx = b.x - a.x;
  let ny = b.y - a.y;
  const d = Math.sqrt(nx * nx + ny * ny);
  nx /= d;
  ny /= d;
  const rvx = a.vx - b.vx;
  const rvy = a.vy - b.vy;
  const vn = rvx * nx + rvy * ny;
  if (vn <= 0) return 0;
  const jn = ((1 + E_BALL) / 2) * BALL_MASS * vn;
  // escorregamento no ponto de contato: (va - vb) + (ωa + ωb) × (R n)
  const sx = a.wx + b.wx;
  const sy = a.wy + b.wy;
  const sz = a.wz + b.wz;
  let cx = rvx - R * sz * ny;
  let cy = rvy + R * sz * nx;
  const cz = R * (sx * ny - sy * nx);
  const cn = cx * nx + cy * ny;
  cx -= cn * nx;
  cy -= cn * ny;
  a.vx -= (jn / BALL_MASS) * nx;
  a.vy -= (jn / BALL_MASS) * ny;
  b.vx += (jn / BALL_MASS) * nx;
  b.vy += (jn / BALL_MASS) * ny;
  const slipSpeed = Math.sqrt(cx * cx + cy * cy + cz * cz);
  if (slipSpeed > 1e-9) {
    // atrito entre bolas cai com o escorregamento: μ = 0,00995 + 0,108 e^(−1,088 v)
    const x = 1.088 * slipSpeed;
    const mu = 9.951e-3 + 0.108 / (1 + x + (x * x) / 2 + (x * x * x) / 6);
    const jt = Math.min(mu * jn, (BALL_MASS * slipSpeed) / 7);
    const tx = cx / slipSpeed;
    const ty = cy / slipSpeed;
    const tz = cz / slipSpeed;
    a.vx -= (jt / BALL_MASS) * tx;
    a.vy -= (jt / BALL_MASS) * ty;
    b.vx += (jt / BALL_MASS) * tx;
    b.vy += (jt / BALL_MASS) * ty;
    // Δω = −jt R (n × t) / I, igual nas duas
    const k = (jt * R) / I;
    const qx = ny * tz;
    const qy = -nx * tz;
    const qz = nx * ty - ny * tx;
    a.wx -= k * qx;
    a.wy -= k * qy;
    a.wz -= k * qz;
    b.wx -= k * qx;
    b.wy -= k * qy;
    b.wz -= k * qz;
  }
  setState(a);
  setState(b);
  return vn;
}

/** Choque com a tabela (ou quina), com normal (nx, ny) apontando para o lado da bola. Modelo de Han (2005). */
function collideCushion(b: Ball, nx: number, ny: number): number {
  // referencial: x' para dentro da tabela, y' = z × x'
  const xx = -nx;
  const xy = -ny;
  const yx = -xy;
  const yy = xx;
  const vx = b.vx * xx + b.vy * xy;
  const vy = b.vx * yx + b.vy * yy;
  if (vx <= 0) return 0;
  let wx = b.wx * xx + b.wy * xy;
  let wy = b.wx * yx + b.wy * yy;
  let wz = b.wz;
  const m = BALL_MASS;
  const sx = vx * SIN_C + R * wy;
  const sy = -vy - R * wz * COS_C + R * wx * SIN_C;
  const c = vx * COS_C;
  const A = 7 / (2 * m);
  const pzE = (1 + E_CUSHION) * c * m;
  const sl = Math.sqrt(sx * sx + sy * sy);
  const pzS = sl / A;
  let PX: number;
  let PY: number;
  let PZ: number;
  if (pzS <= pzE) {
    PX = (-sx / A) * SIN_C - pzE * COS_C;
    PY = sy / A;
    PZ = (sx / A) * COS_C - pzE * SIN_C;
  } else {
    const f = MU_CUSHION * pzE;
    const ex = sx / sl;
    const ey = sy / sl;
    PX = -f * ex * SIN_C - pzE * COS_C;
    PY = f * ey;
    PZ = f * ex * COS_C - pzE * SIN_C;
  }
  let nvx = vx + PX / m;
  const nvy = vy + PY / m;
  if (nvx > -1e-4) nvx = -1e-4;
  wx += (-R / I) * PY * SIN_C;
  wy += (R / I) * (PX * SIN_C - PZ * COS_C);
  wz += (R / I) * PY * COS_C;
  // de volta ao referencial da mesa
  b.vx = nvx * xx + nvy * yx;
  b.vy = nvx * xy + nvy * yy;
  b.wx = wx * xx + wy * yx;
  b.wy = wx * xy + wy * yy;
  b.wz = wz;
  setState(b);
  return vx;
}

// ---------------------------------------------------------------------------------------------------------
// Simulação

export function toBalls(pos: readonly BallPos[]): Ball[] {
  return pos.map((p) => ({ n: p.n, x: p.x, y: p.y, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, s: St.Still }));
}

function moving(b: Ball) {
  return b.s === St.Sliding || b.s === St.Rolling;
}

type Hit =
  | { kind: 0; t: number; i: number; j: number }
  | { kind: 1; t: number; i: number; nx: number; ny: number }
  | { kind: 2; t: number; i: number; p: number };

/** Choque mais cedo dentro de `w` segundos (movimento reto a partir de agora). */
function earliest(balls: Ball[], w: number): Hit | null {
  let best: Hit | null = null;
  let bt = w;
  const n = balls.length;
  for (let i = 0; i < n; i++) {
    const a = balls[i];
    if (!moving(a)) continue;
    const reach = Math.sqrt(a.vx * a.vx + a.vy * a.vy) * w + 2 * R + 1e-6;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const b = balls[j];
      if (b.s === St.Pocketed) continue;
      if (moving(b) && j < i) continue; // o par já foi visto
      const px = b.x - a.x;
      const py = b.y - a.y;
      const r2 = reach + (moving(b) ? Math.sqrt(b.vx * b.vx + b.vy * b.vy) * w : 0);
      if (px * px + py * py > r2 * r2) continue;
      const t = contactTime(px, py, b.vx - a.vx, b.vy - a.vy, 2 * R);
      if (t <= bt) {
        bt = t;
        best = { kind: 0, t, i, j };
      }
    }
    // tabelas e quinas só perto da borda
    const near = reach + 0.12;
    if (Math.abs(a.x) > HL - near || Math.abs(a.y) > HW - near) {
      for (const s of SEGMENTS) {
        const t = segmentTime(a, a.vx, a.vy, s);
        if (t <= bt) {
          bt = t;
          best = { kind: 1, t, i, nx: s.nx, ny: s.ny };
        }
      }
      for (const q of POINTS) {
        const px = a.x - q.x;
        const py = a.y - q.y;
        const t = contactTime(px, py, a.vx, a.vy, R);
        if (t <= bt) {
          const ex = px + a.vx * t;
          const ey = py + a.vy * t;
          const el = Math.sqrt(ex * ex + ey * ey);
          bt = t;
          best = { kind: 1, t, i, nx: ex / el, ny: ey / el };
        }
      }
      for (let p = 0; p < POCKETS.length; p++) {
        const k = POCKETS[p];
        const t = contactTime(a.x - k.x, a.y - k.y, a.vx, a.vy, k.r);
        if (t <= bt) {
          bt = t;
          best = { kind: 2, t, i, p };
        }
      }
    }
  }
  return best;
}

function snapshot(balls: Ball[], t: number): Frame {
  const data = new Float64Array(balls.length * 5);
  balls.forEach((b, k) => {
    const o = k * 5;
    if (b.s === St.Pocketed) {
      data[o] = data[o + 1] = NaN;
      return;
    }
    data[o] = b.x;
    data[o + 1] = b.y;
    data[o + 2] = b.wx;
    data[o + 3] = b.wy;
    data[o + 4] = b.wz;
  });
  return { t, data };
}

/** Roda as bolas já em movimento até tudo parar. */
export function run(balls: Ball[], opts: SimOptions = {}): SimResult {
  const dt = opts.dt ?? DT;
  const events: SimEvent[] = [];
  const pocketed: { n: number; pocket: number }[] = [];
  const frames: Frame[] | undefined = opts.record ? [snapshot(balls, 0)] : undefined;
  let nextFrame = opts.record ?? Infinity;
  let t = 0;
  let guard = 0;
  while (t < MAX_TIME && balls.some((b) => b.s !== St.Still && b.s !== St.Pocketed)) {
    // a gravação só observa no fim da janela: a mesma tacada anda igual com ou sem gravar (servidor e navegador)
    let remaining = dt;
    while (remaining > 0) {
      const hit = earliest(balls, remaining);
      const step = hit ? hit.t : remaining;
      if (step > 0) for (const b of balls) evolve(b, step);
      t += step;
      remaining -= step;
      if (!hit) break;
      if (++guard > 2_000_000) break;
      const a = balls[hit.i];
      if (hit.kind === 0) {
        const speed = collideBalls(a, balls[hit.j]);
        if (speed > 0) events.push({ t, kind: Ev.Ball, a: a.n, b: balls[hit.j].n, speed });
      } else if (hit.kind === 1) {
        const speed = collideCushion(a, hit.nx, hit.ny);
        if (speed > 0) events.push({ t, kind: Ev.Cushion, a: a.n, b: -1, speed });
      } else {
        events.push({ t, kind: Ev.Pocket, a: a.n, b: hit.p, speed: Math.sqrt(a.vx * a.vx + a.vy * a.vy) });
        pocketed.push({ n: a.n, pocket: hit.p });
        a.s = St.Pocketed;
        a.vx = a.vy = a.wx = a.wy = a.wz = 0;
      }
      if (opts.stop?.(balls, events)) {
        remaining = 0;
        t = MAX_TIME;
      }
    }
    if (opts.stop?.(balls, events)) break;
    if (frames && t >= nextFrame) {
      frames.push(snapshot(balls, t));
      while (nextFrame <= t) nextFrame += opts.record!;
    }
  }
  if (frames) frames.push(snapshot(balls, t));
  return {
    balls: balls.filter((b) => b.s !== St.Pocketed).map((b) => ({ n: b.n, x: b.x, y: b.y })),
    events,
    time: Math.min(t, MAX_TIME),
    frames,
    pocketed,
  };
}

/** Simula a tacada a partir das bolas paradas. A branca é a bola 0. */
export function simulate(pos: readonly BallPos[], shot: Shot, opts: SimOptions = {}): SimResult {
  const balls = toBalls(pos);
  const cue = balls.find((b) => b.n === 0);
  if (cue) strike(cue, shot);
  return run(balls, opts);
}
