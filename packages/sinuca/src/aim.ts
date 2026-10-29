/*
 * Linha de mira: até onde a branca vai reto (bola fantasma no primeiro contato) e o começo do caminho da
 * branca e da bola atingida depois do choque. Os desvios saem da própria física (tacada de verdade só com as
 * duas bolas), então já mostram o efeito, a força e o desvio do corte.
 */

import { launchDir, run, strike, toBalls, Ev, type BallPos, type Shot } from "./physics";
import { POINTS, POCKETS, R, SEGMENTS } from "./table";

export interface Pt {
  x: number;
  y: number;
}

export interface AimPreview {
  /** onde a branca está quando encosta (bola fantasma) ou chega na tabela/caçapa */
  ghost: Pt;
  /** bola atingida, ou null se a branca vai direto na tabela */
  target: number | null;
  /** caminho da branca e da bola atingida logo depois do choque (vazios se a tacada não chega) */
  cuePath: Pt[];
  ballPath: Pt[];
  /** direção da bola atingida pelo ângulo do contato (sempre existe quando há bola) */
  ballDir: Pt | null;
}

/** Distância até a branca encostar em algo andando reto na direção d. */
function ray(cue: Pt, d: Pt, balls: readonly BallPos[]): { dist: number; target: number | null } {
  let best = Infinity;
  let target: number | null = null;
  for (const b of balls) {
    if (b.n === 0) continue;
    const px = b.x - cue.x;
    const py = b.y - cue.y;
    const along = px * d.x + py * d.y;
    if (along <= 0) continue;
    const off2 = px * px + py * py - along * along;
    const r2 = 4 * R * R;
    if (off2 >= r2) continue;
    const dist = along - Math.sqrt(r2 - off2);
    if (dist < best) {
      best = dist;
      target = b.n;
    }
  }
  for (const s of SEGMENTS) {
    const vn = d.x * s.nx + d.y * s.ny;
    if (vn >= 0) continue;
    const dd = (cue.x - s.ax) * s.nx + (cue.y - s.ay) * s.ny;
    if (dd < R * 0.25) continue;
    const t = Math.max(0, (dd - R) / -vn);
    const along = (cue.x + d.x * t - s.ax) * s.dx + (cue.y + d.y * t - s.ay) * s.dy;
    if (along >= 0 && along <= s.len && t < best) {
      best = t;
      target = null;
    }
  }
  for (const q of POINTS) {
    const px = q.x - cue.x;
    const py = q.y - cue.y;
    const along = px * d.x + py * d.y;
    if (along <= 0) continue;
    const off2 = px * px + py * py - along * along;
    if (off2 >= R * R) continue;
    const t = along - Math.sqrt(R * R - off2);
    if (t < best) {
      best = t;
      target = null;
    }
  }
  for (const p of POCKETS) {
    const px = p.x - cue.x;
    const py = p.y - cue.y;
    const along = px * d.x + py * d.y;
    if (along <= 0) continue;
    const off2 = px * px + py * py - along * along;
    if (off2 >= p.r * p.r) continue;
    const t = along - Math.sqrt(p.r * p.r - off2);
    if (t < best) {
      best = t;
      target = null;
    }
  }
  return { dist: best === Infinity ? 0 : best, target };
}

/** Corta um caminho no comprimento `len`. */
function clip(path: Pt[], len: number): Pt[] {
  const out: Pt[] = path.length ? [path[0]] : [];
  let left = len;
  for (let i = 1; i < path.length && left > 0; i++) {
    const a = out[out.length - 1];
    const b = path[i];
    const d = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    if (d >= left) {
      out.push({ x: a.x + ((b.x - a.x) * left) / d, y: a.y + ((b.y - a.y) * left) / d });
      break;
    }
    out.push(b);
    left -= d;
  }
  return out;
}

export function aimPreview(balls: readonly BallPos[], shot: Shot, lens = { cue: 0.4, ball: 0.4 }): AimPreview | null {
  const cue = balls.find((b) => b.n === 0);
  if (!cue) return null;
  const d = launchDir(shot);
  const { dist, target } = ray(cue, d, balls);
  const ghost = { x: cue.x + d.x * dist, y: cue.y + d.y * dist };
  if (target === null) return { ghost, target, cuePath: [], ballPath: [], ballDir: null };
  const obj = balls.find((b) => b.n === target)!;
  const nx = obj.x - ghost.x;
  const ny = obj.y - ghost.y;
  const nl = Math.sqrt(nx * nx + ny * ny);
  const ballDir = { x: nx / nl, y: ny / nl };

  // só a branca e a bola atingida, para ver o rumo das duas logo depois do choque
  const pair = toBalls([cue, obj]);
  strike(pair[0], shot);
  const cuePath: Pt[] = [];
  const ballPath: Pt[] = [];
  let hitAt = -1;
  const done = [false, false];
  run(pair, {
    dt: 1 / 1000,
    record: 0.004,
    stop: (bs, ev) => {
      if (hitAt < 0) {
        if (ev.some((e) => e.kind === Ev.Ball)) {
          hitAt = ev.length;
          cuePath.push({ x: bs[0].x, y: bs[0].y });
          ballPath.push({ x: bs[1].x, y: bs[1].y });
        }
        return false;
      }
      // cada caminho para na primeira tabela ou caçapa, ou no comprimento
      for (const e of ev.slice(hitAt)) {
        // outro choque entre as duas encerra os dois caminhos
        if (e.kind === Ev.Ball) done[0] = done[1] = true;
        else done[e.a === 0 ? 0 : 1] = true;
      }
      const paths = [cuePath, ballPath];
      for (let k = 0; k < 2; k++) {
        if (done[k] || bs[k].s === 4) continue;
        paths[k].push({ x: bs[k].x, y: bs[k].y });
        if (bs[k].s === 0) done[k] = true;
      }
      return (done[0] || length(cuePath) > lens.cue) && (done[1] || length(ballPath) > lens.ball);
    },
  });
  return { ghost, target, cuePath: clip(cuePath, lens.cue), ballPath: clip(ballPath, lens.ball), ballDir };
}

function length(path: Pt[]): number {
  let l = 0;
  for (let i = 1; i < path.length; i++) l += Math.sqrt((path[i].x - path[i - 1].x) ** 2 + (path[i].y - path[i - 1].y) ** 2);
  return l;
}
