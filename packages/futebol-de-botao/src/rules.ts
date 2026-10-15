import {
  BALL_DAMP,
  BALL_INV_MASS,
  BALL_R,
  BALL_WALLS,
  BOUNCE_BALL_PLAYER,
  BOUNCE_PLAYERS,
  BOUNCE_POST,
  BOUNCE_WALL,
  CENTER_R,
  FORMATIONS,
  GOAL_HALF,
  HALF_H,
  HALF_W,
  KICK_POWER,
  KICK_RANGE,
  MARGIN,
  PLAYER_ACCEL,
  PLAYER_DAMP,
  PLAYER_INV_MASS,
  PLAYER_KICK_ACCEL,
  PLAYER_R,
  POST_R,
  POSTS,
  type Segment,
} from "./field";
import {
  FREEZE_TICKS,
  GOAL_TICKS,
  GOALS_TO_WIN,
  MATCH_TICKS,
  MAX_PLAYERS,
  teamOf,
  type Action,
  type Disc,
  type GameState,
  type Player,
  type Team,
} from "./types";

type Result = { ok: true; state: GameState } | { ok: false; error: string };

/** Partida nova com os lugares ocupados (pares = vermelho, ímpares = azul). */
export function newGame(seats: number[]): GameState {
  const count = [0, 0];
  const players: Player[] = [...seats]
    .filter((s) => Number.isInteger(s) && s >= 0 && s < MAX_PLAYERS)
    .sort((a, b) => a - b)
    .map((seat) => {
      const team = teamOf(seat);
      return { seat, team, number: ++count[team], x: 0, y: 0, vx: 0, vy: 0, dx: 0, dy: 0, kick: false, kickReady: true };
    });
  const s: GameState = {
    tick: 0,
    phase: "kickoff",
    wait: FREEZE_TICKS,
    timeLeft: MATCH_TICKS,
    golden: false,
    score: [0, 0],
    kickoffTeam: 0,
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    players,
    goals: [],
    lastTouch: null,
    maxDeficit: [0, 0],
    winner: null,
    kicks: 0,
    posts: 0,
  };
  resetPositions(s);
  return s;
}

/** Bola no centro e cada time na formação do seu campo. */
export function resetPositions(s: GameState) {
  s.ball = { x: 0, y: 0, vx: 0, vy: 0 };
  for (const team of [0, 1] as Team[]) {
    const mine = s.players.filter((p) => p.team === team);
    const spots = FORMATIONS[Math.min(3, mine.length)] ?? FORMATIONS[3];
    mine.forEach((p, i) => {
      const spot = spots[i % spots.length];
      p.x = team === 0 ? spot.x : -spot.x;
      p.y = team === 0 ? spot.y : -spot.y;
      p.vx = p.vy = 0;
    });
  }
  s.lastTouch = null;
}

const clampAxis = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-1, Math.min(1, n)) : 0;
};

/** Ações: só a entrada de cada jogador (direção + chute). O tempo anda pelo `step`. */
export function applyAction(s: GameState, a: Action): Result {
  if (a.type === "advance") return { ok: true, state: s };
  if (a.type !== "input") return { ok: false, error: "Ação inválida" };
  const i = s.players.findIndex((p) => p.seat === a.seat);
  if (i < 0) return { ok: false, error: "Fora da partida" };
  let dx = clampAxis(a.dx);
  let dy = clampAxis(a.dy);
  const len = Math.hypot(dx, dy);
  if (len > 1) {
    dx /= len;
    dy /= len;
  }
  const players = s.players.slice();
  players[i] = { ...players[i], dx, dy, kick: !!a.kick };
  return { ok: true, state: { ...s, players } };
}

export const isOver = (s: GameState) => s.phase === "over";

// ---------- física ----------

/** Choque entre dois discos com massas e coeficiente de quique. Devolve se encostaram. */
function collideDiscs(a: Disc, ra: number, ima: number, b: Disc, rb: number, imb: number, bounce: number): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const min = ra + rb;
  if (dist >= min || dist === 0) return false;
  const nx = dx / dist;
  const ny = dy / dist;
  const overlap = min - dist;
  const total = ima + imb;
  a.x -= nx * overlap * (ima / total);
  a.y -= ny * overlap * (ima / total);
  b.x += nx * overlap * (imb / total);
  b.y += ny * overlap * (imb / total);
  const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rel < 0) {
    const j = (-(1 + bounce) * rel) / total;
    a.vx -= nx * j * ima;
    a.vy -= ny * j * ima;
    b.vx += nx * j * imb;
    b.vy += ny * j * imb;
  }
  return true;
}

/** Disco contra ponto fixo (trave). */
function collidePoint(d: Disc, r: number, px: number, py: number, pr: number, bounce: number): boolean {
  const dx = d.x - px;
  const dy = d.y - py;
  const dist = Math.hypot(dx, dy);
  const min = r + pr;
  if (dist >= min || dist === 0) return false;
  const nx = dx / dist;
  const ny = dy / dist;
  d.x = px + nx * min;
  d.y = py + ny * min;
  const vn = d.vx * nx + d.vy * ny;
  if (vn < 0) {
    d.vx -= (1 + bounce) * vn * nx;
    d.vy -= (1 + bounce) * vn * ny;
  }
  return true;
}

/** Disco contra segmento (parede). */
function collideSegment(d: Disc, r: number, w: Segment, bounce: number) {
  const ex = w.bx - w.ax;
  const ey = w.by - w.ay;
  const t = Math.max(0, Math.min(1, ((d.x - w.ax) * ex + (d.y - w.ay) * ey) / (ex * ex + ey * ey)));
  collidePoint(d, r, w.ax + ex * t, w.ay + ey * t, 0, bounce);
}

/** Dentro do retângulo onde os botões podem andar. */
function keepInside(p: Player) {
  const mx = HALF_W + MARGIN - PLAYER_R;
  const my = HALF_H + MARGIN - PLAYER_R;
  if (p.x < -mx) (p.x = -mx), (p.vx = Math.max(0, p.vx));
  if (p.x > mx) (p.x = mx), (p.vx = Math.min(0, p.vx));
  if (p.y < -my) (p.y = -my), (p.vy = Math.max(0, p.vy));
  if (p.y > my) (p.y = my), (p.vy = Math.min(0, p.vy));
}

/** Antes do primeiro toque: cada time no seu campo; quem não sai, fora do círculo central. */
function kickoffBarrier(s: GameState, p: Player) {
  const side = p.team === 0 ? -1 : 1;
  const dist = Math.hypot(p.x, p.y);
  const kicking = p.team === s.kickoffTeam;
  if (!kicking && dist < CENTER_R + PLAYER_R) {
    const k = (CENTER_R + PLAYER_R) / (dist || 1);
    p.x = dist ? p.x * k : side * (CENTER_R + PLAYER_R);
    p.y = dist ? p.y * k : 0;
    p.vx = p.vy = 0;
  }
  // o time que sai pode entrar no círculo central do outro lado; fora isso, a linha do meio é parede
  if (p.x * side < 0 && !(kicking && dist < CENTER_R)) {
    p.x = 0;
    p.vx = 0;
  }
}

/**
 * Um passo de física (1/60 s). Muda o estado no lugar e o devolve: o servidor chama 60 vezes por
 * segundo e copiar tudo a cada passo não compensa.
 */
export function step(s: GameState): GameState {
  if (s.phase === "over") return s;
  s.tick++;

  if (s.phase === "kickoff" && s.wait > 0) {
    // "prepara": todo mundo parado na formação
    s.wait--;
    return s;
  }

  const frozenBall = s.phase === "kickoff";

  for (const p of s.players) {
    const accel = p.kick ? PLAYER_KICK_ACCEL : PLAYER_ACCEL;
    p.vx = (p.vx + p.dx * accel) * PLAYER_DAMP;
    p.vy = (p.vy + p.dy * accel) * PLAYER_DAMP;
    p.x += p.vx;
    p.y += p.vy;
    if (!p.kick) p.kickReady = true;
  }
  const b = s.ball;
  b.vx *= BALL_DAMP;
  b.vy *= BALL_DAMP;
  b.x += b.vx;
  b.y += b.vy;

  // botões entre si
  for (let i = 0; i < s.players.length; i++)
    for (let j = i + 1; j < s.players.length; j++)
      collideDiscs(s.players[i], PLAYER_R, PLAYER_INV_MASS, s.players[j], PLAYER_R, PLAYER_INV_MASS, BOUNCE_PLAYERS);

  // botões na bola
  for (const p of s.players) {
    if (collideDiscs(p, PLAYER_R, PLAYER_INV_MASS, b, BALL_R, BALL_INV_MASS, BOUNCE_BALL_PLAYER)) touch(s, p);
  }

  // chute: encostado (com folga) e com o botão apertado
  for (const p of s.players) {
    if (!p.kick || !p.kickReady) continue;
    const dx = b.x - p.x;
    const dy = b.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist - PLAYER_R - BALL_R > KICK_RANGE || dist === 0) continue;
    b.vx += (dx / dist) * KICK_POWER * BALL_INV_MASS;
    b.vy += (dy / dist) * KICK_POWER * BALL_INV_MASS;
    p.kickReady = false;
    s.kicks++;
    touch(s, p);
  }

  for (const w of BALL_WALLS) collideSegment(b, BALL_R, w, BOUNCE_WALL);
  for (const post of POSTS) {
    if (collidePoint(b, BALL_R, post.x, post.y, POST_R, BOUNCE_POST) && Math.hypot(b.vx, b.vy) > 1) s.posts++;
    for (const p of s.players) collidePoint(p, PLAYER_R, post.x, post.y, POST_R, BOUNCE_POST);
  }

  for (const p of s.players) {
    keepInside(p);
    if (s.phase === "kickoff") kickoffBarrier(s, p);
  }

  // até o primeiro toque, a bola não sai do centro
  if (frozenBall && s.phase === "kickoff") {
    b.x = b.y = b.vx = b.vy = 0;
  }

  if (s.phase === "goal") {
    if (--s.wait <= 0) afterGoal(s);
    return s;
  }

  // gol: bola inteira além da linha, entre as traves
  if (Math.abs(b.y) < GOAL_HALF && Math.abs(b.x) > HALF_W + BALL_R) {
    scoreGoal(s, b.x > 0 ? 0 : 1);
    return s;
  }

  if (!s.golden) {
    s.timeLeft--;
    if (s.timeLeft <= 0) {
      s.timeLeft = 0;
      if (s.score[0] !== s.score[1]) finish(s, s.score[0] > s.score[1] ? 0 : 1);
      else s.golden = true;
    }
  }
  return s;
}

/** Bola tocada: na saída, começa o jogo. */
function touch(s: GameState, p: Player) {
  s.lastTouch = p.seat;
  if (s.phase === "kickoff") s.phase = "play";
}

function scoreGoal(s: GameState, team: Team) {
  const last = s.players.find((p) => p.seat === s.lastTouch);
  s.score[team]++;
  s.goals.push({ team, seat: last?.seat ?? null, own: !!last && last.team !== team, tick: s.tick });
  const other = (1 - team) as Team;
  s.maxDeficit[other] = Math.max(s.maxDeficit[other], s.score[team] - s.score[other]);
  s.phase = "goal";
  s.wait = GOAL_TICKS;
  s.kickoffTeam = other;
}

function afterGoal(s: GameState) {
  const [a, b] = s.score;
  if (s.golden || a >= GOALS_TO_WIN || b >= GOALS_TO_WIN || (s.timeLeft <= 0 && a !== b)) {
    finish(s, a > b ? 0 : 1);
    return;
  }
  resetPositions(s);
  s.phase = "kickoff";
  s.wait = FREEZE_TICKS;
}

function finish(s: GameState, winner: Team) {
  s.phase = "over";
  s.winner = winner;
  for (const p of s.players) p.vx = p.vy = 0;
}
