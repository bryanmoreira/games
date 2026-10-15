"use client";

import { useEffect, useRef } from "react";
import {
  BALL_R,
  CENTER_R,
  GOAL_DEPTH,
  GOAL_HALF,
  HALF_H,
  HALF_W,
  MARGIN,
  PLAYER_R,
  POST_R,
  TICK_MS,
  type Disc,
  type PlayerView,
  type Team,
} from "@truco/futebol-de-botao";

export const TEAM_COLORS = [
  { fill: "#e5484d", dark: "#8f1d22" },
  { fill: "#3e7bfa", dark: "#1a3d94" },
] as const;

/** Tela = R × campo. O meu time sempre ataca para a direita (deitado) ou para cima (em pé). */
export interface Rot {
  a: number;
  b: number;
  c: number;
  d: number;
}

export function rotationFor(team: Team | null, portrait: boolean): Rot {
  const f = team === 1 ? -1 : 1;
  return portrait ? { a: 0, b: f, c: -f, d: 0 } : { a: f, b: 0, c: 0, d: f };
}

/** Direção na tela (x para a direita, y para baixo) → direção no campo. */
export const screenToField = (r: Rot, sx: number, sy: number) => ({ x: r.a * sx + r.c * sy, y: r.b * sx + r.d * sy });

// mundo desenhado: campo + margem onde os botões andam
const WX = HALF_W + MARGIN + 4;
const WY = HALF_H + MARGIN + 4;
/** Quadros de atraso na hora de desenhar: dá folga para a rede oscilar sem travar. */
const DELAY_TICKS = 3;
/** Distância que vira "teletransporte" (saída de bola depois do gol), sem deslizar. */
const SNAP = 60;

interface Snapshot {
  tick: number;
  ball: Disc;
  players: Map<number, Disc & { kick: boolean }>;
}

/**
 * Quadros recebidos do servidor e a hora em que chegaram. Desenha um pouco no passado, entre dois
 * quadros, para o movimento ficar liso mesmo com a rede irregular.
 */
export class FrameBuffer {
  private list: Snapshot[] = [];
  private base: number | null = null;

  push(v: PlayerView) {
    const last = this.list.at(-1);
    // partida nova (o passo voltou): começa do zero
    if (last && v.tick < last.tick) this.reset();
    if (last && v.tick === last.tick) return;
    const at = performance.now() - v.tick * TICK_MS;
    // a referência acompanha o quadro que chegou mais cedo, e sobe devagar se a rede piorar
    this.base = this.base === null ? at : Math.min(at, this.base + 1);
    this.list.push({ tick: v.tick, ball: v.ball, players: new Map(v.players.map((p) => [p.seat, p])) });
    if (this.list.length > 30) this.list.shift();
  }

  reset() {
    this.list = [];
    this.base = null;
  }

  sample(now: number): Snapshot | null {
    if (!this.list.length || this.base === null) return null;
    const t = (now - this.base) / TICK_MS - DELAY_TICKS;
    let i = this.list.length - 1;
    while (i > 0 && this.list[i].tick > t) i--;
    const a = this.list[i];
    const b = this.list[i + 1];
    if (!b) {
      // sem o próximo quadro ainda: segue a velocidade por pouco tempo
      const k = Math.max(0, Math.min(4, t - a.tick));
      const ahead = (d: Disc): Disc => ({ ...d, x: d.x + d.vx * k, y: d.y + d.vy * k });
      return { tick: t, ball: ahead(a.ball), players: new Map([...a.players].map(([s, p]) => [s, { ...p, ...ahead(p) }])) };
    }
    const k = Math.max(0, Math.min(1, (t - a.tick) / (b.tick - a.tick)));
    const mix = <D extends Disc>(p: D, q: D | undefined): D => {
      if (!q || Math.hypot(q.x - p.x, q.y - p.y) > SNAP) return q ?? p;
      return { ...q, x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k };
    };
    return { tick: t, ball: mix(a.ball, b.ball), players: new Map([...a.players].map(([s, p]) => [s, mix(p, b.players.get(s))])) };
  }
}

/**
 * O campo em canvas, redesenhado a cada quadro de tela. Em pé (tela mais alta que larga), o campo
 * deita na vertical. `onRotate` avisa a rotação atual para os controles.
 */
export function Field({
  frames,
  view,
  names,
  onRotate,
}: {
  frames: FrameBuffer;
  view: PlayerView;
  names: string[];
  onRotate: (r: Rot) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  // o desenho lê sempre a visão e os nomes mais novos sem reiniciar o laço
  const latest = useRef({ view, names });
  latest.current = { view, names };

  const me = view.players.find((p) => p.seat === view.me);
  const team = me ? me.team : null;

  useEffect(() => {
    const el = box.current!;
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let rot = rotationFor(team, false);

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = el.clientWidth;
      h = el.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      rot = rotationFor(team, h > w * 1.15);
      onRotate(rot);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    // gols já vistos: entrar ou recarregar no meio da partida não solta confete velho
    let goals = latest.current.view.goals.length;
    let burst: Particle[] = [];
    const fx: BallFx = { trail: [], spin: 0, last: null };
    let last = performance.now();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const v = latest.current.view;
      if (v.goals.length < goals) burst = [];
      if (v.goals.length > goals) burst = burst.concat(goalBurst(v.goals[v.goals.length - 1].team));
      goals = v.goals.length;
      const snap = frames.sample(now);
      const toScreen = draw(ctx, w, h, dpr, rot, snap, v, latest.current.names, fx, now);
      burst = stepParticles(ctx, burst, dt, toScreen.at, toScreen.scale);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [frames, team, onRotate]);

  return (
    <div ref={box} className="absolute inset-0">
      <canvas ref={canvas} className="h-full w-full" aria-label="Campo" />
    </div>
  );
}

/** Rastro e giro da bola entre um quadro de tela e outro. */
interface BallFx {
  trail: { x: number; y: number; at: number; speed: number }[];
  spin: number;
  last: { x: number; y: number } | null;
}

/** Velocidade (por passo) a partir da qual a bola deixa rastro: só chute ou rebote forte. */
const TRAIL_SPEED = 3.4;
const TRAIL_MS = 220;

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dpr: number,
  rot: Rot,
  snap: Snapshot | null,
  view: PlayerView,
  names: string[],
  fx: BallFx,
  now: number,
) {
  const portrait = rot.a === 0;
  const worldW = portrait ? WY * 2 : WX * 2;
  const worldH = portrait ? WX * 2 : WY * 2;
  const s = Math.min(w / worldW, h / worldH);
  const cx = w / 2;
  const cy = h / 2;
  const toScreen = (x: number, y: number) => ({ x: cx + (rot.a * x + rot.b * y) * s, y: cy + (rot.c * x + rot.d * y) * s });

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // campo no sistema do jogo (girado)
  ctx.setTransform(dpr * s * rot.a, dpr * s * rot.c, dpr * s * rot.b, dpr * s * rot.d, dpr * cx, dpr * cy);
  ctx.fillStyle = "#3f7f33";
  roundRect(ctx, -WX, -WY, WX * 2, WY * 2, 18);
  ctx.fill();
  const stripes = 10;
  const sw = (HALF_W * 2) / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 ? "#4c9a3e" : "#55a646";
    ctx.fillRect(-HALF_W + i * sw, -HALF_H, sw + 0.5, HALF_H * 2);
  }

  // redes, com a cor do time que defende
  for (const side of [-1, 1]) {
    const t = side < 0 ? 0 : 1;
    const x0 = side < 0 ? -HALF_W - GOAL_DEPTH : HALF_W;
    ctx.fillStyle = `${TEAM_COLORS[t].fill}55`;
    ctx.fillRect(x0, -GOAL_HALF, GOAL_DEPTH, GOAL_HALF * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = -GOAL_HALF + 10; y < GOAL_HALF; y += 10) {
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + GOAL_DEPTH, y);
    }
    for (let x = x0 + 9; x < x0 + GOAL_DEPTH; x += 9) {
      ctx.moveTo(x, -GOAL_HALF);
      ctx.lineTo(x, GOAL_HALF);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x0, -GOAL_HALF, GOAL_DEPTH, GOAL_HALF * 2);
  }

  // linhas
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.strokeRect(-HALF_W, -HALF_H, HALF_W * 2, HALF_H * 2);
  ctx.beginPath();
  ctx.moveTo(0, -HALF_H);
  ctx.lineTo(0, HALF_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, CENTER_R, 0, Math.PI * 2);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.strokeRect(side < 0 ? -HALF_W : HALF_W - 80, -120, 80, 240);
  }
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // traves
  for (const [x, y] of [
    [-HALF_W, -GOAL_HALF],
    [-HALF_W, GOAL_HALF],
    [HALF_W, -GOAL_HALF],
    [HALF_W, GOAL_HALF],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, POST_R, 0, Math.PI * 2);
    ctx.fillStyle = "#f4f4f4";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#222";
    ctx.stroke();
  }

  // botões e bola na tela (o texto não gira)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const players = view.players.map((p) => ({ ...p, ...(snap?.players.get(p.seat) ?? {}) }));
  const ball = snap?.ball ?? view.ball;

  // rastro da bola forte (por baixo dos botões)
  const speed = Math.hypot(ball.vx, ball.vy);
  const moved = fx.last ? Math.hypot(ball.x - fx.last.x, ball.y - fx.last.y) : 0;
  // saída de bola depois do gol: teletransporte não vira rastro nem giro
  if (moved > SNAP) fx.trail = [];
  else fx.spin += moved / BALL_R;
  fx.last = { x: ball.x, y: ball.y };
  if (speed > TRAIL_SPEED && moved <= SNAP) fx.trail.push({ x: ball.x, y: ball.y, at: now, speed });
  fx.trail = fx.trail.filter((t) => now - t.at < TRAIL_MS);
  if (fx.trail.length > 1) {
    ctx.lineCap = "round";
    for (let i = 1; i < fx.trail.length; i++) {
      const a = toScreen(fx.trail[i - 1].x, fx.trail[i - 1].y);
      const c = toScreen(fx.trail[i].x, fx.trail[i].y);
      const k = 1 - (now - fx.trail[i].at) / TRAIL_MS;
      const strength = Math.min(1, (fx.trail[i].speed - TRAIL_SPEED) / 3 + 0.35);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(c.x, c.y);
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * k * strength})`;
      ctx.lineWidth = BALL_R * s * 2 * (0.35 + 0.65 * k);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
  }
  const pr = PLAYER_R * s;
  const font = Math.max(10, Math.round(pr * 0.95));

  for (const p of players) {
    const { x, y } = toScreen(p.x, p.y);
    const color = TEAM_COLORS[p.team];
    ctx.beginPath();
    ctx.arc(x + 1.5, y + 2.5, pr, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();
    if (p.seat === view.me) {
      ctx.beginPath();
      ctx.arc(x, y, pr + Math.max(3, pr * 0.3), 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,215,90,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, pr, 0, Math.PI * 2);
    ctx.fillStyle = color.fill;
    ctx.fill();
    // segurando o chute: borda branca
    ctx.lineWidth = Math.max(2, pr * 0.16);
    ctx.strokeStyle = p.kick ? "#ffffff" : color.dark;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `700 ${font}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(p.number), x, y + 1);
    const name = names[p.seat];
    if (name) {
      ctx.font = `600 ${Math.max(9, Math.round(font * 0.62))}px system-ui, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText(name, x, y - pr - Math.max(7, font * 0.55));
    }
  }

  const b = toScreen(ball.x, ball.y);
  const br = BALL_R * s;
  ctx.beginPath();
  ctx.arc(b.x + 1.5, b.y + 2, br, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fill();
  soccerBall(ctx, b.x, b.y, br, fx.spin);
  return { at: toScreen, scale: s };
}

/** Pontas de um pentágono de raio `r` em (x, y), girado `a`. */
const pentagon = (x: number, y: number, r: number, a: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const t = a + (i * 2 * Math.PI) / 5 - Math.PI / 2;
    return [x + Math.cos(t) * r, y + Math.sin(t) * r] as const;
  });

/** Bola de futebol: branca, pentágono preto no meio e gomos na borda, girando com o caminho andado. */
function soccerBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "#1b1b1b";
  ctx.strokeStyle = "#1b1b1b";
  ctx.lineWidth = Math.max(0.8, r * 0.09);
  const center = pentagon(x, y, r * 0.42, spin);
  const poly = (pts: readonly (readonly [number, number])[]) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  };
  poly(center);
  for (let i = 0; i < 5; i++) {
    // costura do pentágono do meio até o gomo da borda
    const t = spin + (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const [vx, vy] = center[i];
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(x + Math.cos(t) * r * 0.8, y + Math.sin(t) * r * 0.8);
    ctx.stroke();
    poly(pentagon(x + Math.cos(t) * r * 1.02, y + Math.sin(t) * r * 1.02, r * 0.36, t + Math.PI / 5));
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.2, r * 0.14);
  ctx.strokeStyle = "#111";
  ctx.stroke();
}

// ---------- confete do gol ----------

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** segundos de vida restantes e total */
  life: number;
  max: number;
  size: number;
  color: string;
  spin: number;
  angle: number;
  /** anel que se abre na boca do gol */
  ring?: boolean;
}

const BURST = 90;

/** Explosão saindo da rede onde a bola entrou, para dentro do campo, nas cores de quem marcou. */
function goalBurst(team: Team): Particle[] {
  const side = team === 0 ? 1 : -1; // o vermelho marca no gol da direita
  const gx = side * HALF_W;
  const colors = [TEAM_COLORS[team].fill, TEAM_COLORS[team].fill, "#ffffff", "#f5b942"];
  const out: Particle[] = [{ x: gx, y: 0, vx: 0, vy: 0, life: 0.7, max: 0.7, size: 0, color: TEAM_COLORS[team].fill, spin: 0, angle: 0, ring: true }];
  for (let i = 0; i < BURST; i++) {
    // leque de ~150° virado para o meio do campo
    const a = Math.PI * (side > 0 ? 1 : 0) + (Math.random() - 0.5) * Math.PI * 0.85;
    const speed = 250 + Math.random() * 520;
    const max = 1 + Math.random() * 0.9;
    out.push({
      x: gx,
      y: (Math.random() - 0.5) * GOAL_HALF * 1.6,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: max,
      max,
      size: 4 + Math.random() * 6,
      color: colors[i % colors.length],
      spin: (Math.random() - 0.5) * 14,
      angle: Math.random() * Math.PI,
    });
  }
  return out;
}

/** Anda, freia, gira e apaga as partículas; desenha na tela. Devolve as que ainda vivem. */
function stepParticles(ctx: CanvasRenderingContext2D, ps: Particle[], dt: number, at: (x: number, y: number) => { x: number; y: number }, s: number) {
  if (!ps.length) return ps;
  const drag = Math.pow(0.12, dt);
  const alive: Particle[] = [];
  for (const p of ps) {
    p.life -= dt;
    if (p.life <= 0) continue;
    alive.push(p);
    const k = p.life / p.max;
    const { x, y } = at(p.x, p.y);
    if (p.ring) {
      ctx.beginPath();
      ctx.arc(x, y, (1 - k) * 160 * s + 4, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = k;
      ctx.lineWidth = Math.max(2, 8 * s * k);
      ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= drag;
    p.vy *= drag;
    p.angle += p.spin * dt;
    const size = Math.max(2, p.size * s * 1.4);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.fillStyle = p.color;
    ctx.fillRect(-size / 2, -size / 4, size, size / 2);
    ctx.restore();
  }
  return alive;
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

/** Desenho do campo em SVG (página do jogo, "Como jogar" e prévia de link). */
export function FieldArt({ className, players = DEFAULT_ART }: { className?: string; players?: { x: number; y: number; team: Team; n: number; kick?: boolean }[] }) {
  const ball = { x: 60, y: -20 };
  return (
    <svg viewBox={`${-WX} ${-WY} ${WX * 2} ${WY * 2}`} className={className} aria-hidden="true">
      <rect x={-WX} y={-WY} width={WX * 2} height={WY * 2} rx="18" fill="#3f7f33" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={-HALF_W + i * 84} y={-HALF_H} width="84.5" height={HALF_H * 2} fill={i % 2 ? "#4c9a3e" : "#55a646"} />
      ))}
      {[-1, 1].map((side) => (
        <rect
          key={side}
          x={side < 0 ? -HALF_W - GOAL_DEPTH : HALF_W}
          y={-GOAL_HALF}
          width={GOAL_DEPTH}
          height={GOAL_HALF * 2}
          fill={`${TEAM_COLORS[side < 0 ? 0 : 1].fill}66`}
          stroke="#fff"
          strokeWidth="3"
        />
      ))}
      <g fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3">
        <rect x={-HALF_W} y={-HALF_H} width={HALF_W * 2} height={HALF_H * 2} />
        <path d={`M0 ${-HALF_H}V${HALF_H}`} />
        <circle r={CENTER_R} />
        <rect x={-HALF_W} y="-120" width="80" height="240" />
        <rect x={HALF_W - 80} y="-120" width="80" height="240" />
      </g>
      {[
        [-HALF_W, -GOAL_HALF],
        [-HALF_W, GOAL_HALF],
        [HALF_W, -GOAL_HALF],
        [HALF_W, GOAL_HALF],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={POST_R} fill="#f4f4f4" stroke="#222" strokeWidth="2" />
      ))}
      {players.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={PLAYER_R * 1.6} fill={TEAM_COLORS[p.team].fill} stroke={p.kick ? "#fff" : TEAM_COLORS[p.team].dark} strokeWidth="4" />
          <text x={p.x} y={p.y + 1} fill="#fff" fontSize="26" fontWeight="700" textAnchor="middle" dominantBaseline="middle" fontFamily="system-ui, sans-serif">
            {p.n}
          </text>
        </g>
      ))}
      <SoccerBallSvg x={ball.x} y={ball.y} r={BALL_R * 1.6} />
    </svg>
  );
}

const DEFAULT_ART: { x: number; y: number; team: Team; n: number; kick?: boolean }[] = [
  { x: 18, y: -6, team: 0, n: 1, kick: true },
  { x: -170, y: 110, team: 0, n: 2 },
  { x: 150, y: -90, team: 1, n: 1 },
  { x: 290, y: 40, team: 1, n: 2 },
];

/** A mesma bola em SVG (ilustrações). */
function SoccerBallSvg({ x, y, r }: { x: number; y: number; r: number }) {
  const pts = (cx: number, cy: number, pr: number, a: number) =>
    pentagon(cx, cy, pr, a)
      .map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`)
      .join(" ");
  const id = `ball-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g>
      <clipPath id={id}>
        <circle cx={x} cy={y} r={r} />
      </clipPath>
      <circle cx={x} cy={y} r={r} fill="#fff" />
      <g clipPath={`url(#${id})`} fill="#1b1b1b">
        <polygon points={pts(x, y, r * 0.42, 0)} />
        {Array.from({ length: 5 }, (_, i) => {
          const t = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          return <polygon key={i} points={pts(x + Math.cos(t) * r * 1.02, y + Math.sin(t) * r * 1.02, r * 0.36, t + Math.PI / 5)} />;
        })}
      </g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#111" strokeWidth="3" />
    </g>
  );
}
