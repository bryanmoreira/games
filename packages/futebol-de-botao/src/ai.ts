import { attackDir, BALL_R, GOAL_HALF, HALF_H, HALF_W, KICK_RANGE, PLAYER_R } from "./field";
import type { Action, Player, PlayerView } from "./types";

type Input = Extract<Action, { type: "input" }>;

/**
 * IA de um botão, pela visão (o campo inteiro é público). Uma regra por papel:
 * - quem está mais perto da bola vai nela, contornando por trás para empurrar rumo ao gol, e chuta
 *   quando a bola está alinhada com o gol (ou quando está perto do próprio gol, para afastar);
 * - os outros: um fica entre a bola e o próprio gol; o terceiro espera mais à frente.
 * A direção sai em 8 sentidos, como as setas do teclado.
 */
export function decide(v: PlayerView, rng: () => number = Math.random): Input | null {
  const me = v.players.find((p) => p.seat === v.me);
  if (!me || v.phase === "over") return null;
  const idle: Input = { type: "input", seat: me.seat, dx: 0, dy: 0, kick: false };
  if (v.phase === "goal") return idle;

  const dir = attackDir(me.team);
  const b = v.ball;
  // onde a bola vai estar daqui a pouco
  const bx = b.x + b.vx * 8;
  const by = b.y + b.vy * 8;
  const mates = v.players.filter((p) => p.team === me.team);
  const dist = (p: Player) => Math.hypot(p.x - bx, p.y - by);
  const chaser = mates.reduce((best, p) => (dist(p) < dist(best) ? p : best));

  // na saída de bola, só o mais perto do time que sai vai na bola; o outro time espera
  if (v.phase === "kickoff" && (me.team !== v.kickoffTeam || chaser.seat !== me.seat)) return idle;

  if (chaser.seat === me.seat) return chase(me, v, dir, bx, by, rng);

  const others = mates.filter((p) => p.seat !== chaser.seat).sort((a, c) => a.seat - c.seat);
  const role = others.findIndex((p) => p.seat === me.seat);
  const ownGoalX = -dir * HALF_W;
  if (role === 0) {
    // zagueiro: entre o próprio gol e a bola, mais recuado quando a bola está no campo dele
    const tx = ownGoalX + (bx - ownGoalX) * (bx * dir < 0 ? 0.3 : 0.5);
    const ty = by * 0.5;
    return moveTo(me, tx, ty, false);
  }
  // apoio: à frente, do lado oposto da bola
  const tx = Math.max(-HALF_W + 60, Math.min(HALF_W - 60, bx + dir * 120));
  const ty = by > 0 ? -90 : 90;
  return moveTo(me, tx, ty, false);
}

function chase(me: Player, v: PlayerView, dir: number, bx: number, by: number, rng: () => number): Input {
  const b = v.ball;
  const [gx, gy] = aim(v, me, dir, bx, by, rng);
  let ax = gx - bx;
  let ay = gy - by;
  const al = Math.hypot(ax, ay) || 1;
  ax /= al;
  ay /= al;

  const ownGoalDist = Math.abs(b.x + dir * HALF_W);
  const touching = Math.hypot(b.x - me.x, b.y - me.y) - PLAYER_R - BALL_R <= KICK_RANGE + 1;
  // de onde o botão está, a bola está na frente dele rumo ao gol?
  const tx = b.x - me.x;
  const ty = b.y - me.y;
  const tl = Math.hypot(tx, ty) || 1;
  const aligned = (tx * ax + ty * ay) / tl;

  if (touching && me.kickReady && (aligned > 0.6 || (ownGoalDist < 160 && (tx * dir) / tl > 0))) {
    return { ...moveTo(me, b.x, b.y, true), kick: true };
  }

  // ponto atrás da bola, na linha do gol
  const back = PLAYER_R + BALL_R + 2;
  const px = bx - ax * back;
  const py = by - ay * back;
  // está do lado errado da bola: contorna por um dos lados para não empurrar contra
  if (aligned < 0.3) {
    const side = (me.y - by) * ax - (me.x - bx) * ay >= 0 ? 1 : -1;
    const wide = back + 22;
    return moveTo(me, bx - ax * wide - ay * side * wide, by - ay * wide + ax * side * wide, false);
  }
  return moveTo(me, aligned > 0.85 ? bx : px, aligned > 0.85 ? by : py, false);
}

/**
 * Para onde mandar a bola: o canto ou o meio do gol, direto ou tabelando na lateral, escolhendo o
 * caminho mais livre de adversários (assim dois botões não ficam empurrando a bola de frente).
 */
function aim(v: PlayerView, me: Player, dir: number, bx: number, by: number, rng: () => number): [number, number] {
  const gx = dir * (HALF_W + 20);
  const opponents = v.players.filter((p) => p.team !== me.team);
  let best: [number, number] = [gx, 0];
  let bestScore = -Infinity;
  for (const gy of [-GOAL_HALF * 0.6, 0, GOAL_HALF * 0.6]) {
    for (const bank of [0, -1, 1]) {
      // tabela: mira no reflexo do gol além da lateral
      const ty = bank === 0 ? gy : bank * 2 * (HALF_H - BALL_R) - gy;
      const lx = gx - bx;
      const ly = ty - by;
      const len = Math.hypot(lx, ly) || 1;
      let clear = 200;
      for (const o of opponents) {
        const t = ((o.x - bx) * lx + (o.y - by) * ly) / (len * len);
        if (t <= 0 || t >= 1) continue;
        const d = Math.hypot(o.x - (bx + lx * t), o.y - (by + ly * t)) - PLAYER_R - BALL_R;
        clear = Math.min(clear, d + t * 60);
      }
      // prefere o direto e o meio; um pouco de sorte desempata
      const score = clear - (bank ? 25 : 0) - Math.abs(gy) * 0.1 + rng() * 6;
      if (score > bestScore) {
        bestScore = score;
        best = [gx, ty];
      }
    }
  }
  return best;
}

/** Direção em 8 sentidos rumo ao alvo, freando perto dele. */
function moveTo(me: Player, tx: number, ty: number, kick: boolean): Input {
  // compensa a velocidade atual para não passar do ponto
  const dx = tx - (me.x + me.vx * 6);
  const dy = ty - (me.y + me.vy * 6);
  const d = Math.hypot(dx, dy);
  if (d < 6) return { type: "input", seat: me.seat, dx: 0, dy: 0, kick };
  const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
  const round = (n: number) => (Math.abs(n) < 0.3 ? 0 : Math.sign(n));
  return { type: "input", seat: me.seat, dx: round(Math.cos(a)), dy: round(Math.sin(a)), kick };
}
