/*
 * IA da sinuca. Para cada bola que pode tocar e cada caçapa, mira pela bola fantasma, corrige o desvio do
 * corte com a própria física (tacada só com as duas bolas) e testa algumas forças e efeitos na mesa inteira.
 * Fica com a tacada que encaçapa sem falta e deixa a branca com a próxima bola mais fácil. Sem tacada boa,
 * joga na defesa: toca numa bola sua sem falta e deixa o adversário sem tacada.
 *
 * Os níveis mudam quantas tacadas ela testa, se pensa na posição da branca e o erro na hora de bater.
 */

import { Ev, MAX_SPEED, run, simulate, strike, toBalls, type BallPos, type Shot } from "./physics";
import { BREAK_SPOT, canPlace, onEight, targetsFor } from "./rules";
import { HEAD_X, HL, HW, POCKETS, R } from "./table";
import { CUE, EIGHT, groupOf, teamOf, type Action, type GameState, type Level, type PlayerView } from "./types";


interface LevelCfg {
  /** desvio-padrão do erro de mira, em graus, e da força (fração) */
  aim: number;
  power: number;
  /** quantas jogadas (bola + caçapa) testar na mesa inteira */
  top: number;
  /** pensa na posição da branca */
  position: boolean;
  spins: [number, number][];
}

const LEVEL: Record<Level, LevelCfg> = {
  easy: { aim: 1.6, power: 0.12, top: 3, position: false, spins: [[0, 0]] },
  medium: { aim: 0.55, power: 0.06, top: 6, position: true, spins: [[0, 0], [0, 0.6], [0, -0.6]] },
  hard: { aim: 0.12, power: 0.02, top: 8, position: true, spins: [[0, 0], [0, 0.7], [0, -0.7], [0.5, 0], [-0.5, 0]] },
};

type Rng = () => number;

function gauss(rng: Rng): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

function rotate(x: number, y: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: x * c - y * s, y: x * s + y * c };
}

/** Caminho reto de a até b livre de bolas (com folga `rad` do centro). */
function clear(balls: readonly BallPos[], ax: number, ay: number, bx: number, by: number, skip: number[], rad = 2 * R): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  for (const b of balls) {
    if (skip.includes(b.n)) continue;
    const t = Math.max(0, Math.min(1, ((b.x - ax) * dx + (b.y - ay) * dy) / len2));
    const px = ax + dx * t - b.x;
    const py = ay + dy * t - b.y;
    if (px * px + py * py < rad * rad * 0.98) return false;
  }
  return true;
}

interface Plan {
  target: number;
  pocket: number;
  /** branca, bola fantasma, direção da bola para a caçapa */
  cue: { x: number; y: number };
  gx: number;
  gy: number;
  ux: number;
  uy: number;
  /** quanto menor, mais fácil */
  cost: number;
}

/** Jogadas geométricas possíveis da branca em (cx, cy). */
function plans(balls: readonly BallPos[], cx: number, cy: number, targets: number[]): Plan[] {
  const out: Plan[] = [];
  for (const n of targets) {
    const b = balls.find((x) => x.n === n);
    if (!b) continue;
    POCKETS.forEach((p, pi) => {
      // mira um pouco para dentro da boca
      const ax = p.mx + p.ox * 0.01;
      const ay = p.my + p.oy * 0.01;
      let ux = ax - b.x;
      let uy = ay - b.y;
      const dist = Math.sqrt(ux * ux + uy * uy);
      ux /= dist;
      uy /= dist;
      // ângulo de entrada na caçapa
      const entry = ux * p.ox + uy * p.oy;
      if (entry < (p.corner ? 0.35 : 0.6)) return;
      const gx = b.x - ux * 2 * R;
      const gy = b.y - uy * 2 * R;
      if (Math.abs(gx) > HL - R || Math.abs(gy) > HW - R) return;
      let vx = gx - cx;
      let vy = gy - cy;
      const cd = Math.sqrt(vx * vx + vy * vy);
      if (cd < 1e-4) return;
      vx /= cd;
      vy /= cd;
      const cut = vx * ux + vy * uy;
      if (cut < 0.2) return;
      if (!clear(balls, b.x, b.y, ax, ay, [n, CUE])) return;
      if (!clear(balls, cx, cy, gx, gy, [n, CUE])) return;
      const cost = (cd + dist * 1.5) / cut / (0.5 + entry);
      out.push({ target: n, pocket: pi, cue: { x: cx, y: cy }, gx, gy, ux, uy, cost });
    });
  }
  return out.sort((a, b) => a.cost - b.cost);
}

/** Direção em que a bola atingida sai com essa tacada (só as duas bolas). */
function objectDir(cue: BallPos, obj: BallPos, shot: Shot): { x: number; y: number } | null {
  const pair = toBalls([cue, obj]);
  strike(pair[0], shot);
  let out: { x: number; y: number } | null = null;
  run(pair, {
    dt: 1 / 400,
    stop: (bs, ev) => {
      if (ev.length === 0) return false;
      if (ev[0].kind === Ev.Ball) {
        const v = Math.sqrt(bs[1].vx ** 2 + bs[1].vy ** 2);
        if (v > 0) out = { x: bs[1].vx / v, y: bs[1].vy / v };
      }
      return true;
    },
  });
  return out;
}

const angleOf = (x: number, y: number) => Math.atan2(y, x);

/** Mira que faz a bola sair na direção (ux, uy), corrigindo o desvio do corte pela física. */
function aimFor(plan: Plan, obj: BallPos, power: number, spin: [number, number]): Shot | null {
  let dx = plan.gx - plan.cue.x;
  let dy = plan.gy - plan.cue.y;
  const l = Math.sqrt(dx * dx + dy * dy);
  dx /= l;
  dy /= l;
  const want = angleOf(plan.ux, plan.uy);
  const cue = { n: CUE, x: plan.cue.x, y: plan.cue.y };
  let shot: Shot = { dx, dy, power, spinX: spin[0], spinY: spin[1] };
  let prevErr = 0;
  let prevAim = 0;
  let aim = 0;
  for (let k = 0; k < 4; k++) {
    const d = objectDir(cue, obj, shot);
    if (!d) return null;
    let err = want - angleOf(d.x, d.y);
    if (err > Math.PI) err -= 2 * Math.PI;
    if (err < -Math.PI) err += 2 * Math.PI;
    if (Math.abs(err) < 0.0004) return shot;
    // secante: quanto a bola gira por grau de mira
    let slope = -3;
    if (k > 0 && aim !== prevAim) slope = (err - prevErr) / (aim - prevAim);
    if (!Number.isFinite(slope) || Math.abs(slope) < 0.2) slope = -3;
    prevErr = err;
    prevAim = aim;
    aim -= err / slope;
    aim = Math.max(-0.2, Math.min(0.2, aim));
    const r = rotate(dx, dy, (aim * 180) / Math.PI);
    shot = { ...shot, dx: r.x, dy: r.y };
  }
  return shot;
}

/** Força pela distância que a bola e a branca precisam andar. */
function powerFor(plan: Plan, obj: BallPos): number {
  const p = POCKETS[plan.pocket];
  const d1 = Math.sqrt((plan.gx - plan.cue.x) ** 2 + (plan.gy - plan.cue.y) ** 2);
  const d2 = Math.sqrt((p.mx - obj.x) ** 2 + (p.my - obj.y) ** 2);
  const cut = (plan.gx - plan.cue.x) / d1 * plan.ux + (plan.gy - plan.cue.y) / d1 * plan.uy;
  // velocidade que chega com folga: v² ≈ 2·a·d nos dois trechos, com o corte tirando energia
  const need = Math.sqrt(2 * 0.12 * (d1 + d2 / Math.max(0.3, cut * cut))) + 0.5;
  return Math.min(0.9, Math.sqrt(Math.max(0, (need - 0.2) / (MAX_SPEED - 0.2))));
}

interface Scored {
  shot: Shot;
  place?: { x: number; y: number };
  call?: number;
  score: number;
}

/** Nota de uma tacada depois de simulada. */
function evaluate(s: GameState, seat: number, before: BallPos[], shot: Shot, plan: Plan | null, cfg: LevelCfg): number {
  // janela maior que a da tacada de verdade: o choque continua exato, só a curva dentro da janela muda (µm)
  const res = simulate(before, shot, { dt: 1 / 400 });
  const team = teamOf(seat);
  const targets = targetsFor(s, seat);
  const first = res.events.find((e) => e.kind === Ev.Ball && (e.a === CUE || e.b === CUE));
  const firstBall = first ? (first.a === CUE ? first.b : first.a) : null;
  const scratch = res.pocketed.some((p) => p.n === CUE);
  const eight = res.pocketed.find((p) => p.n === EIGHT);
  const railAfter = first ? res.events.some((e) => e.kind === Ev.Cushion && e.t >= first.t) : false;
  const objects = res.pocketed.filter((p) => p.n !== CUE);
  const foul = scratch || firstBall === null || !targets.includes(firstBall) || (objects.length === 0 && !railAfter);
  const isEight = onEight(s, team);
  if (eight) {
    if (!isEight || foul || !plan || eight.pocket !== plan.pocket) return -10_000;
    return 10_000;
  }
  if (foul) return -500;
  const g = s.groups[team];
  const mine = (n: number) => (g === null ? n !== EIGHT : groupOf(n) === g);
  const own = objects.filter((p) => mine(p.n)).length;
  const cue = res.balls.find((b) => b.n === CUE);
  let score = 0;
  if (own > 0) {
    score = 300 + own * 20;
    if (cfg.position && cue) {
      // próxima tacada: bolas que ainda são minhas (ou a 8 se acabaram)
      const left = res.balls.filter((b) => b.n !== CUE && mine(b.n)).map((b) => b.n);
      const next = left.length ? left : [EIGHT];
      const best = plans(res.balls, cue.x, cue.y, next)[0];
      score += best ? 120 / (1 + best.cost) : -40;
    }
  } else {
    // defesa: quanto mais difícil para o adversário, melhor
    if (cue) {
      const og = g === null ? null : g === "solids" ? "stripes" : "solids";
      const theirs = res.balls.filter((b) => b.n !== CUE && b.n !== EIGHT && (og === null || groupOf(b.n) === og)).map((b) => b.n);
      const best = plans(res.balls, cue.x, cue.y, theirs.length ? theirs : [EIGHT])[0];
      score = best ? -60 / (0.2 + best.cost) : 40;
    }
  }
  return score;
}

/** Lugares bons para a branca com bola na mão: atrás da bola fantasma das jogadas mais fáceis. */
function placements(s: GameState, targets: number[]): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const cue = s.balls.find((b) => b.n === CUE)!;
  const others = s.balls.filter((b) => b.n !== CUE);
  for (const n of targets) {
    const b = others.find((x) => x.n === n);
    if (!b) continue;
    for (const p of POCKETS) {
      let ux = p.mx - b.x;
      let uy = p.my - b.y;
      const l = Math.sqrt(ux * ux + uy * uy);
      ux /= l;
      uy /= l;
      for (const ang of [0, 15, -15]) {
        for (const back of [0.18, 0.35]) {
          const r = rotate(ux, uy, ang);
          const x = b.x - ux * 2 * R - r.x * back;
          const y = b.y - uy * 2 * R - r.y * back;
          if (canPlace(s, x, y)) out.push({ x, y });
        }
      }
    }
  }
  if (canPlace(s, cue.x, cue.y)) out.push({ x: cue.x, y: cue.y });
  return out;
}

export function decide(v: PlayerView, rng: Rng = Math.random): Action | null {
  if (!v.myTurn || v.seat === null) return null;
  const seat = v.seat;
  const cfg = LEVEL[v.settings.level];
  const s = { ...v, deadline: null } as unknown as GameState;

  if (v.phase === "break") {
    const place = { x: BREAK_SPOT.x, y: (rng() - 0.5) * 0.3 };
    const objects = v.balls.filter((b) => b.n !== CUE);
    const apex = objects.reduce((a, b) => (b.x < a.x ? b : a));
    let dx = apex.x - place.x;
    let dy = apex.y + (rng() - 0.5) * 0.004 - place.y;
    const l = Math.sqrt(dx * dx + dy * dy);
    dx /= l;
    dy /= l;
    const power = v.settings.level === "easy" ? 0.8 : v.settings.level === "medium" ? 0.9 : 1;
    return { type: "shot", seat, shot: { dx, dy, power, spinX: 0, spinY: -0.15 }, place: canPlace(s, place.x, place.y) ? place : undefined, at: 0 };
  }

  const targets = v.targets;
  const isEight = onEight(s, teamOf(seat));
  const spots = v.inHand ? placements(s, targets) : [s.balls.find((b) => b.n === CUE)!];
  // jogadas de todas as posições, as mais fáceis primeiro
  const all: (Plan & { place?: { x: number; y: number } })[] = [];
  for (const spot of spots.slice(0, 24)) {
    for (const p of plans(s.balls.filter((b) => b.n !== CUE), spot.x, spot.y, targets).slice(0, 4)) {
      all.push(v.inHand ? { ...p, place: { x: spot.x, y: spot.y } } : p);
    }
  }
  all.sort((a, b) => a.cost - b.cost);
  const seen = new Set<string>();
  const picked = all.filter((p) => {
    const key = `${p.target}:${p.pocket}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, cfg.top);

  let best: Scored | null = null;
  for (const plan of picked) {
    const obj = s.balls.find((b) => b.n === plan.target)!;
    const before = s.balls.map((b) => (b.n === CUE ? { n: CUE, x: plan.cue.x, y: plan.cue.y } : b));
    const base = powerFor(plan, obj);
    for (const spin of cfg.spins) {
      for (const pw of cfg.position ? [base, Math.min(0.95, base + 0.12)] : [base]) {
        const shot = aimFor(plan, obj, pw, spin);
        if (!shot) continue;
        const score = evaluate(s, seat, before, shot, plan, cfg);
        if (!best || score > best.score) best = { shot, place: plan.place, call: isEight ? plan.pocket : undefined, score };
      }
    }
  }

  // sem jogada boa: defesa
  if (!best || best.score < 100) {
    const cuePos = v.inHand ? spots[0] ?? s.balls.find((b) => b.n === CUE)! : s.balls.find((b) => b.n === CUE)!;
    const before = s.balls.map((b) => (b.n === CUE ? { n: CUE, x: cuePos.x, y: cuePos.y } : b));
    const tries = v.settings.level === "easy" ? 6 : v.settings.level === "medium" ? 14 : 24;
    for (let k = 0; k < tries; k++) {
      const n = targets[Math.floor(rng() * targets.length)];
      const b = s.balls.find((x) => x.n === n);
      if (!b) continue;
      const off = (rng() - 0.5) * 3.6 * R;
      let dx = b.x - cuePos.x;
      let dy = b.y - cuePos.y;
      const l = Math.sqrt(dx * dx + dy * dy);
      dx /= l;
      dy /= l;
      const tx = b.x - dy * off - cuePos.x;
      const ty = b.y + dx * off - cuePos.y;
      const tl = Math.sqrt(tx * tx + ty * ty);
      const shot: Shot = { dx: tx / tl, dy: ty / tl, power: 0.25 + rng() * 0.35, spinX: 0, spinY: (rng() - 0.5) * 0.6 };
      const call = isEight ? 0 : undefined;
      const score = evaluate(s, seat, before, shot, null, cfg);
      if (!best || score > best.score) best = { shot, place: v.inHand ? cuePos : undefined, call, score };
    }
  }
  if (!best) return null;

  // erro de quem bate
  const r = rotate(best.shot.dx, best.shot.dy, gauss(rng) * cfg.aim);
  const shot: Shot = {
    ...best.shot,
    dx: r.x,
    dy: r.y,
    power: Math.max(0.05, Math.min(1, best.shot.power * (1 + gauss(rng) * cfg.power))),
  };
  const place = best.place && v.inHand === "kitchen" && best.place.x > HEAD_X ? undefined : best.place;
  return { type: "shot", seat, shot, ...(place ? { place } : {}), ...(best.call !== undefined ? { call: best.call } : {}), at: 0 };
}
