"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  aimPreview,
  canPlace,
  EIGHT,
  Ev,
  groupOf,
  HEAD_X,
  HL,
  HW,
  MAX_TIP,
  POCKETS,
  R,
  SHOT_MS,
  simulate,
  teamOf,
  type AimPreview,
  type BallPos,
  type Foul,
  type Frame,
  type GameState,
  type PlayerView,
  type SimEvent,
  type Team,
} from "@mesa/sinuca";
import type { RoomInfo, SeatInfo } from "@mesa/truco";
import { send } from "@/lib/socket";
import { SINUCA_PATH } from "@/lib/sinuca/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playClackSound, playCueSound, playCushionSound, playFoulSound, playPocketSound } from "@/lib/sinuca/sound";
import { drawTable, fit, paintBall, pocketLook, randomOrient, rotateOrient, toScreen, toWorld, worldTransform, type Orient, type Xf } from "./render";
import { NudgeButton, PowerBar, SpinBall } from "./Controls";
import { BallArt, MiniBall } from "./MiniBall";
import { HowToPlay } from "./HowToPlay";

const FOUL_LABEL: Record<Foul, string> = {
  scratch: "BRANCA NA CAÇAPA",
  noHit: "NÃO TOCOU",
  wrongBall: "BOLA ERRADA",
  noRail: "SEM TABELA",
  kitchen: "COZINHA",
  badBreak: "QUEBRA FRACA",
  time: "TEMPO",
};

const END_LABEL: Record<NonNullable<GameState["end"]>, string> = {
  eight: "8 CANTADA",
  early: "8 ANTES DA HORA",
  wrongPocket: "8 NA CAÇAPA ERRADA",
  scratchEight: "8 COM FALTA",
};

/** Animação da última tacada, simulada aqui com a mesma física do servidor. */
interface Anim {
  shotNo: number;
  frames: Frame[];
  events: SimEvent[];
  order: number[];
  pockets: Map<number, { t: number; pocket: number }>;
  start: number;
  /** tempo simulado até tudo parar */
  end: number;
  played: number;
  frame: number;
  prevT: number;
  cue: { x: number; y: number; dx: number; dy: number; side: number };
}

const SINK = 0.28;
const DEFAULT_POWER = 0.45;

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  useAudioUnlock();
  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const portrait = usePortrait();

  const myTurn = view.myTurn && view.seat !== null;
  const cueBall = view.balls.find((b) => b.n === 0);

  // ----- animação da tacada
  const seen = useRef(view.shotNo);
  const anim = useRef<Anim | null>(null);
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);

  useEffect(() => {
    if (view.shotNo === seen.current) return;
    seen.current = view.shotNo;
    const last = view.last;
    if (!last) {
      // tempo estourado: sem tacada
      anim.current = null;
      setAnimating(false);
      setToast({ text: `FALTA · ${FOUL_LABEL.time}`, key: view.shotNo });
      playFoulSound();
      return;
    }
    const res = simulate(last.before, last.shot, { record: 1 / 120 });
    // a física é a mesma do servidor, bit a bit; se um dia divergir, a animação termina encaixando no servidor
    if (res.balls.some((b) => !view.balls.some((v) => v.n === b.n && v.x === b.x && v.y === b.y)))
      console.warn("sinuca: tacada simulada diferente da do servidor");
    const pockets = new Map<number, { t: number; pocket: number }>();
    for (const e of res.events) if (e.kind === Ev.Pocket) pockets.set(e.a, { t: e.t, pocket: e.b });
    const cue = last.before.find((b) => b.n === 0)!;
    anim.current = {
      shotNo: view.shotNo,
      frames: res.frames!,
      events: res.events,
      order: last.before.map((b) => b.n),
      pockets,
      start: performance.now(),
      end: res.time,
      played: 0,
      frame: 0,
      prevT: 0,
      cue: { x: cue.x, y: cue.y, dx: last.shot.dx, dy: last.shot.dy, side: last.shot.spinX },
    };
    setAnimating(true);
    playCueSound(last.shot.power);
  }, [view.shotNo, view.last]);

  const onAnimEnd = useCallback(() => {
    anim.current = null;
    setAnimating(false);
    const last = view.last;
    if (last?.foul) {
      setToast({ text: `FALTA · ${FOUL_LABEL[last.foul]}`, key: view.shotNo });
      playFoulSound();
    }
  }, [view.last, view.shotNo]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // ----- mira
  const [aim, setAim] = useState({ x: 1, y: 0 });
  const [spin, setSpin] = useState({ x: 0, y: 0 });
  const [power, setPower] = useState<number | null>(null);
  const [lastPower, setLastPower] = useState(DEFAULT_POWER);
  const [place, setPlace] = useState<{ x: number; y: number } | null>(null);
  const [call, setCall] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  // vez nova: mira na bola mais perto que pode tocar, efeito no centro
  useEffect(() => {
    setSent(false);
    if (!myTurn || !cueBall) return;
    setPlace(view.inHand ? { x: cueBall.x, y: cueBall.y } : null);
    setCall(null);
    setSpin({ x: 0, y: 0 });
    const targets = view.balls.filter((b) => view.targets.includes(b.n));
    const near = targets.sort((a, b) => Math.hypot(a.x - cueBall.x, a.y - cueBall.y) - Math.hypot(b.x - cueBall.x, b.y - cueBall.y))[0];
    if (near) {
      const l = Math.hypot(near.x - cueBall.x, near.y - cueBall.y);
      setAim({ x: (near.x - cueBall.x) / l, y: (near.y - cueBall.y) / l });
    }
  }, [view.shotNo, view.turn, myTurn]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAct = myTurn && !animating && !sent && view.phase !== "over";
  const ballsNow: BallPos[] = useMemo(
    () => (place && myTurn ? view.balls.map((b) => (b.n === 0 ? { n: 0, x: place.x, y: place.y } : b)) : view.balls),
    [view.balls, place, myTurn],
  );
  const shotPower = power ?? lastPower;
  const preview: AimPreview | null = useMemo(
    () => (canAct ? aimPreview(ballsNow, { dx: aim.x, dy: aim.y, power: Math.max(0.05, shotPower), spinX: spin.x, spinY: spin.y }) : null),
    [canAct, ballsNow, aim, spin, shotPower],
  );
  // caçapa cantada: a escolhida ou a que a 8 está indo
  const autoCall = useMemo(() => {
    if (!view.onEight || !preview || preview.target !== EIGHT || !preview.ballDir) return null;
    const eight = view.balls.find((b) => b.n === EIGHT)!;
    let best = 0;
    let bestScore = -Infinity;
    POCKETS.forEach((p, i) => {
      const dx = p.mx - eight.x;
      const dy = p.my - eight.y;
      const l = Math.hypot(dx, dy);
      const score = (dx * preview.ballDir!.x + dy * preview.ballDir!.y) / l;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    return best;
  }, [view.onEight, view.balls, preview]);
  const called = call ?? autoCall;

  const shoot = (p: number) => {
    if (!canAct) return;
    setLastPower(p);
    setSent(true);
    send({
      t: "action",
      action: {
        type: "shot",
        shot: { dx: aim.x, dy: aim.y, power: p, spinX: spin.x, spinY: spin.y },
        ...(view.inHand && place ? { place } : {}),
        ...(view.onEight ? { call: called ?? 0 } : {}),
      },
    });
  };

  const nudge = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    setAim((v) => ({ x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) }));
  };

  // setas do teclado giram a mira
  useEffect(() => {
    if (!canAct) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const sign = e.key === "ArrowLeft" || e.key === "ArrowUp" ? 1 : -1;
        nudge(sign * (e.shiftKey ? 1 : 0.1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canAct]);

  // ----- som e fim
  useEndSound(view, animating);
  const leave = () => {
    send({ t: "leave" });
    router.push(SINUCA_PATH);
  };

  const over = view.phase === "over";
  const me = view.seat !== null ? view.stats[view.seat] : null;

  const tableProps: CanvasProps = {
    view,
    balls: ballsNow,
    anim,
    onAnimEnd,
    canAct,
    aim,
    setAim,
    spin,
    power,
    preview,
    place,
    setPlace,
    called,
    setCall,
    inHand: myTurn ? view.inHand : null,
    tips,
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-4">
          <TeamPanel view={view} room={room} team={0} animating={animating} />
          <TeamPanel view={view} room={room} team={1} animating={animating} />
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 lg:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          <TipsButton on={tips} onClick={toggleTips} label="Dicas das bolas" />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <section className={`relative flex min-h-0 flex-1 ${portrait ? "flex-col" : "flex-row"}`}>
        <TableCanvas {...tableProps} />
        {toast && (
          <div key={toast.key} className="banner pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-red-600/90 px-4 py-1.5 font-display text-sm text-white shadow-lg sm:text-base">
            {toast.text}
          </div>
        )}
        {view.seat !== null && !over && (
          <aside className={`flex shrink-0 items-center gap-2 ${portrait ? "flex-row px-3 pb-3 pt-1" : "flex-col px-3 py-3"}`}>
            <SpinBall value={spin} onChange={setSpin} disabled={!canAct} size={portrait ? 60 : 76} />
            <div className={`flex gap-2 ${portrait ? "flex-col" : "flex-row"}`}>
              <NudgeButton dir={1} onNudge={nudge} disabled={!canAct} />
              <NudgeButton dir={-1} onNudge={nudge} disabled={!canAct} />
            </div>
            <PowerBar vertical={!portrait} disabled={!canAct} onChange={setPower} onRelease={shoot} />
          </aside>
        )}
        {canAct && (view.inHand || view.onEight) && (
          <div className={`pointer-events-none absolute z-10 flex gap-2 font-display text-xs sm:text-sm ${portrait ? "bottom-24 left-1/2 -translate-x-1/2" : "bottom-3 left-1/2 -translate-x-1/2"}`}>
            {view.inHand && <Chip>{view.inHand === "kitchen" ? "BRANCA NA COZINHA" : "BOLA NA MÃO"}</Chip>}
            {view.onEight && <Chip gold>CANTE A CAÇAPA</Chip>}
          </div>
        )}
      </section>

      {over && !animating && view.seat !== null && (
        <GameEnd
          won={view.winner === view.team}
          badge={view.end ? <span className="rounded-full bg-white/10 px-3 py-1 font-display text-sm text-white/80">{END_LABEL[view.end]}</span> : undefined}
          onLeave={leave}
          onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
        >
          {me && (
            <div className="flex gap-6 font-display">
              <EndStat label="BOLAS" value={me.potted} gold />
              <EndStat label="SEQUÊNCIA" value={me.bestRun} />
              <EndStat label="TACADAS" value={me.shots} />
            </div>
          )}
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="SINUCA" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Chip({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return <span className={`rounded-full px-3 py-1 shadow-lg ${gold ? "bg-gold text-stone-900" : "bg-black/70 text-white"}`}>{children}</span>;
}

function usePortrait() {
  const [p, setP] = useState(false);
  useEffect(() => {
    const on = () => setP(window.innerHeight > window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return p;
}

/** Vitória e derrota tocam quando a última bola para. */
function useEndSound(view: PlayerView, animating: boolean) {
  const done = useRef(view.phase === "over");
  useEffect(() => {
    if (view.phase !== "over") {
      done.current = false;
      return;
    }
    if (animating || done.current || view.seat === null) return;
    done.current = true;
    if (view.winner === view.team) playWinSound();
    else playLoseSound();
  }, [view.phase, animating, view.winner, view.team, view.seat]);
}

// ---------------------------------------------------------------------------------------------------------
// Placar de cada time

function TeamPanel({ view, room, team, animating }: { view: PlayerView; room: RoomInfo; team: Team; animating: boolean }) {
  const seats = view.players.filter((s) => teamOf(s) === team);
  const group = view.groups[team];
  const turnHere = teamOf(view.turn) === team && view.phase !== "over";
  const shooter = turnHere ? view.turn : seats[0];
  const mine = view.team === team;
  const onEight = group !== null && !view.balls.some((b) => groupOf(b.n) === group);
  const nums = group === "solids" ? [1, 2, 3, 4, 5, 6, 7] : group === "stripes" ? [9, 10, 11, 12, 13, 14, 15] : [];
  return (
    <div
      className={`flex min-w-0 items-center gap-1.5 rounded-2xl px-1.5 py-1 transition sm:gap-2 sm:px-2 ${turnHere && !animating ? "bg-gold/15 ring-1 ring-gold/60" : "bg-black/30"} ${team === 1 ? "flex-row-reverse text-right" : ""}`}
    >
      <div className={`flex shrink-0 ${team === 1 ? "flex-row-reverse" : ""} -space-x-2`}>
        {seats.map((s) => (
          <Face key={s} seat={room.seats[s]} active={turnHere && s === view.turn} clock={turnHere && s === view.turn ? view.timeLeft : null} animating={animating} />
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={`truncate font-display text-[11px] leading-none sm:text-sm ${mine ? "text-gold" : "text-white/80"}`}>{room.seats[shooter]?.name ?? ""}</span>
        <div className={`flex gap-[2px] ${team === 1 ? "flex-row-reverse" : ""}`}>
          {nums.map((n) => (
            <MiniBall key={n} n={n} gone={!view.balls.some((b) => b.n === n)} />
          ))}
          {group && <MiniBall n={EIGHT} gone={!onEight} />}
        </div>
      </div>
    </div>
  );
}

function Face({ seat, active, clock, animating }: { seat: SeatInfo | undefined; active: boolean; clock: number | null; animating: boolean }) {
  const left = useCountdown(clock, animating);
  const frac = left === null ? 1 : Math.max(0, Math.min(1, left / SHOT_MS));
  const C = 2 * Math.PI * 17;
  return (
    <div className="relative h-8 w-8 sm:h-10 sm:w-10">
      <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 bg-stone-800 font-display text-sm ${active ? "border-gold" : "border-white/20"}`}>
        <SeatFace seat={seat} />
      </div>
      {active && left !== null && (
        <svg viewBox="0 0 40 40" className="pointer-events-none absolute -inset-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.5rem)] -rotate-90">
          <circle cx="20" cy="20" r="17" fill="none" stroke={frac < 0.25 ? "#ef4444" : "#f2c14e"} strokeWidth="3" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

/** Tempo que falta, descendo no cliente a partir do que o servidor mandou. */
function useCountdown(ms: number | null, paused: boolean): number | null {
  const [now, setNow] = useState(() => performance.now());
  const base = useRef({ ms, at: performance.now() });
  useEffect(() => {
    base.current = { ms, at: performance.now() };
  }, [ms]);
  useEffect(() => {
    if (ms === null) return;
    const t = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(t);
  }, [ms]);
  if (ms === null || base.current.ms === null) return null;
  const left = base.current.ms - (now - base.current.at);
  // durante a tacada o relógio ainda não começou a valer
  return paused ? SHOT_MS : Math.min(SHOT_MS, left);
}

// ---------------------------------------------------------------------------------------------------------
// Canvas da mesa

interface CanvasProps {
  view: PlayerView;
  balls: BallPos[];
  anim: React.MutableRefObject<Anim | null>;
  onAnimEnd: () => void;
  canAct: boolean;
  aim: { x: number; y: number };
  setAim: (a: { x: number; y: number }) => void;
  spin: { x: number; y: number };
  power: number | null;
  preview: AimPreview | null;
  place: { x: number; y: number } | null;
  setPlace: (p: { x: number; y: number }) => void;
  called: number | null;
  setCall: (p: number) => void;
  inHand: GameState["inHand"];
  /** dicas no hover ligadas */
  tips: boolean;
}

/** Dica da bola no hover: número, grupo e de quem é. */
function BallTip({ view, n, at, r }: { view: PlayerView; n: number; at: [number, number]; r: number }) {
  const group = groupOf(n);
  const title = n === 0 ? "BRANCA" : `BOLA ${n}`;
  const kind = n === 0 ? "a do taco" : n === EIGHT ? "a preta" : group === "solids" ? "lisa" : "listrada";
  const owner = (() => {
    if (n === 0) return { text: "TODOS JOGAM COM ELA", tone: "bg-white/15 text-white" };
    if (n === EIGHT) return { text: "POR ÚLTIMO", tone: "bg-white/15 text-white" };
    const team = view.groups.findIndex((g) => g === group);
    if (team < 0) return { text: "MESA ABERTA", tone: "bg-white/15 text-white" };
    if (view.team === null) return { text: `TIME ${team + 1}`, tone: "bg-white/15 text-white" };
    return team === view.team ? { text: "SUA", tone: "bg-gold text-stone-900" } : { text: "DO ADVERSÁRIO", tone: "bg-red-500/80 text-white" };
  })();
  // em cima da bola; perto do topo, embaixo
  const below = at[1] < 110;
  return (
    <div
      key={n}
      className="banner pointer-events-none absolute z-20 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-2xl bg-stone-950/90 py-2 pl-2 pr-3 shadow-2xl ring-1 ring-white/10 backdrop-blur"
      style={{ left: at[0], top: below ? at[1] + r + 10 : undefined, bottom: below ? undefined : `calc(100% - ${at[1] - r - 10}px)` }}
    >
      <BallArt n={n} className="h-10 w-10 shrink-0" />
      <div className="flex flex-col items-start gap-1 leading-none">
        <span className="font-display text-sm">{title}</span>
        <span className="text-xs text-white/50">{kind}</span>
        <span className={`rounded-full px-2 py-0.5 font-display text-[10px] ${owner.tone}`}>{owner.text}</span>
      </div>
    </div>
  );
}

function TableCanvas(props: CanvasProps) {
  const box = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLCanvasElement>(null);
  const fg = useRef<HTMLCanvasElement>(null);
  const [xf, setXf] = useState<Xf | null>(null);
  const [dpr, setDpr] = useState(1);
  const live = useRef(props);
  live.current = props;
  const orients = useRef(new Map<number, Orient>());
  const sprites = useRef(new Map<number, { c: HTMLCanvasElement; dirty: boolean; rp: number }>());
  const drag = useRef<null | "aim" | "place">(null);
  const [badPlace, setBadPlace] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<{ n: number; x: number; y: number } | null>(null);
  // tacada nova ou dicas desligadas: some a dica (as bolas vão andar)
  useEffect(() => setHover(null), [props.view.shotNo, props.tips]);
  const badRef = useRef(badPlace);
  badRef.current = badPlace;

  // tamanho
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const d = Math.min(3, window.devicePixelRatio || 1);
      setDpr(d);
      setXf(fit(r.width, r.height));
      for (const c of [bg.current!, fg.current!]) {
        c.width = Math.round(r.width * d);
        c.height = Math.round(r.height * d);
        c.style.width = `${r.width}px`;
        c.style.height = `${r.height}px`;
      }
      for (const s of sprites.current.values()) s.dirty = true;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // fundo
  const kitchen = props.inHand === "kitchen";
  useEffect(() => {
    if (!xf) return;
    const ctx = bg.current!.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bg.current!.width, bg.current!.height);
    drawTable(ctx, xf, dpr, kitchen);
  }, [xf, dpr, kitchen]);

  // laço de desenho
  useEffect(() => {
    if (!xf) return;
    let raf = 0;
    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const draw = (now: number) => {
      const p = live.current;
      const c = fg.current!;
      const ctx = c.getContext("2d")!;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      const rp = R * xf.s * dpr;
      const shown: { n: number; x: number; y: number; k: number }[] = [];
      const a = p.anim.current;
      let stick: { x: number; y: number; dx: number; dy: number; side: number; pull: number; alpha: number } | null = null;

      if (a) {
        const t = (now - a.start) / 1000;
        const fr = a.frames;
        while (a.frame < fr.length - 2 && fr[a.frame + 1].t <= t) a.frame++;
        const f0 = fr[a.frame];
        const f1 = fr[Math.min(fr.length - 1, a.frame + 1)];
        const u = f1.t > f0.t ? Math.max(0, Math.min(1, (t - f0.t) / (f1.t - f0.t))) : 1;
        const dt = Math.max(0, t - a.prevT);
        a.prevT = t;
        a.order.forEach((n, i) => {
          const o = i * 5;
          const pk = a.pockets.get(n);
          if (pk && t >= pk.t) {
            // caindo na caçapa
            const k = (t - pk.t) / SINK;
            if (k >= 1) return;
            const last = lastValid(fr, i, pk.t);
            const pp = pocketLook(POCKETS[pk.pocket]);
            shown.push({ n, x: last.x + (pp.x - last.x) * k, y: last.y + (pp.y - last.y) * k, k: 1 - 0.45 * k });
            return;
          }
          let x = f0.data[o];
          let y = f0.data[o + 1];
          if (Number.isNaN(x)) return;
          if (!Number.isNaN(f1.data[o])) {
            x += (f1.data[o] - x) * u;
            y += (f1.data[o + 1] - y) * u;
          }
          const wx = f0.data[o + 2];
          const wy = f0.data[o + 3];
          const wz = f0.data[o + 4];
          const w = Math.hypot(wx, wy, wz);
          if (w > 1e-6 && dt > 0) {
            rotateOrient(orientOf(orients.current, n), wx, wy, wz, w * dt);
            markDirty(sprites.current, n);
          }
          shown.push({ n, x, y, k: 1 });
        });
        while (a.played < a.events.length && a.events[a.played].t <= t) {
          const e = a.events[a.played++];
          if (e.kind === Ev.Ball) playClackSound(e.speed);
          else if (e.kind === Ev.Cushion) playCushionSound(e.speed);
          else playPocketSound();
        }
        if (t < 0.3) stick = { ...a.cue, pull: -0.03 * Math.min(1, t / 0.08), alpha: 1 - t / 0.3 };
        if (t > a.end + SINK) p.onAnimEnd();
      } else {
        for (const b of p.balls) shown.push({ n: b.n, x: b.x, y: b.y, k: 1 });
        const cue = p.balls.find((b) => b.n === 0);
        if (p.canAct && cue) stick = { x: cue.x, y: cue.y, dx: p.aim.x, dy: p.aim.y, side: p.spin.x, pull: 0.012 + (p.power ?? 0) * 0.24, alpha: 1 };
      }

      // linhas da mira e caçapas cantadas (em metros)
      worldTransform(ctx, xf, dpr);
      const px = (n: number) => n / xf.s;
      if (!a && p.canAct) {
        if (p.view.onEight) {
          POCKETS.forEach((pk, i) => {
            ctx.beginPath();
            const look = pocketLook(pk);
            ctx.arc(look.x, look.y, look.r + 0.014, 0, Math.PI * 2);
            ctx.lineWidth = px(i === p.called ? 3 : 1.5);
            ctx.strokeStyle = i === p.called ? "#f2c14e" : "rgba(255,255,255,0.35)";
            ctx.stroke();
          });
        }
        const cue = p.balls.find((b) => b.n === 0);
        if (cue && p.preview) drawAim(ctx, px, cue, p.preview, p.view.targets);
        if (p.inHand && cue) {
          ctx.setLineDash([px(4), px(4)]);
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = px(1.5);
          ctx.beginPath();
          ctx.arc(cue.x, cue.y, R * 1.6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const bad = badRef.current;
        if (bad) {
          ctx.fillStyle = "rgba(239,68,68,0.45)";
          ctx.beginPath();
          ctx.arc(bad.x, bad.y, R, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // sombras
      const [ox, oy] = shadowOffset(xf);
      for (const b of shown) {
        // sombra suave: escura embaixo da bola, sumindo para fora
        const r = R * b.k * 1.25;
        const g = ctx.createRadialGradient(b.x + ox, b.y + oy, 0, b.x + ox, b.y + oy, r);
        g.addColorStop(0, "rgba(0,0,0,0.5)");
        g.addColorStop(0.6, "rgba(0,0,0,0.3)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x + ox, b.y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // bolas (pintadas em pixels, na tela)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const b of shown) {
        const sp = spriteOf(sprites.current, b.n);
        if (sp.dirty || sp.rp !== rp) {
          paintBall(sp.c, b.n, orientOf(orients.current, b.n), rp, xf.rot);
          sp.dirty = false;
          sp.rp = rp;
        }
        const [sx, sy] = toScreen(xf, b.x, b.y);
        const size = sp.c.width * b.k;
        ctx.globalAlpha = b.k < 1 ? Math.max(0, (b.k - 0.55) / 0.45) : 1;
        ctx.drawImage(sp.c, sx * dpr - size / 2, sy * dpr - size / 2, size, size);
        ctx.globalAlpha = 1;
      }

      // taco
      if (stick) {
        worldTransform(ctx, xf, dpr);
        drawStick(ctx, stick);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [xf, dpr]);

  // ----- toque na mesa
  const world = (e: React.PointerEvent): [number, number] => {
    const r = box.current!.getBoundingClientRect();
    return toWorld(xf!, e.clientX - r.left, e.clientY - r.top);
  };

  const aimAt = (x: number, y: number) => {
    const cue = props.balls.find((b) => b.n === 0);
    if (!cue) return;
    const dx = x - cue.x;
    const dy = y - cue.y;
    const l = Math.hypot(dx, dy);
    if (l < R * 0.5) return;
    props.setAim({ x: dx / l, y: dy / l });
  };

  const tryPlace = (x: number, y: number) => {
    const s = { ...(props.view as unknown as GameState), inHand: props.inHand };
    // na cozinha, a branca encosta na linha de cabeceira em vez de travar
    const cx = Math.max(-HL + R, Math.min(props.inHand === "kitchen" ? HEAD_X : HL - R, x));
    const cy = Math.max(-HW + R, Math.min(HW - R, y));
    if (canPlace(s, cx, cy)) {
      props.setPlace({ x: cx, y: cy });
      setBadPlace(null);
    } else setBadPlace({ x: cx, y: cy });
  };

  return (
    <div
      ref={box}
      className={`relative min-h-0 min-w-0 flex-1 touch-none select-none ${props.canAct ? "cursor-crosshair" : ""}`}
      style={{ background: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(255,226,170,0.10), rgba(0,0,0,0) 70%)" }}
      onPointerDown={(e) => {
        if (!xf || !props.canAct) return;
        const [x, y] = world(e);
        (e.target as Element).setPointerCapture(e.pointerId);
        const cue = props.balls.find((b) => b.n === 0);
        const touchR = Math.max(R * 2.2, 22 / xf.s);
        if (props.inHand && cue && Math.hypot(x - cue.x, y - cue.y) < touchR) {
          drag.current = "place";
          return;
        }
        if (props.view.onEight) {
          const hit = POCKETS.findIndex((pk) => Math.hypot(x - pk.mx, y - pk.my) < Math.max(0.06, 20 / xf.s));
          if (hit >= 0) {
            props.setCall(hit);
            return;
          }
        }
        drag.current = "aim";
        aimAt(x, y);
      }}
      onPointerMove={(e) => {
        if (!xf) return;
        const [x, y] = world(e);
        if (!drag.current) {
          // dica: a bola debaixo do mouse (só com mouse, parada e com as dicas ligadas)
          const over = props.tips && e.pointerType === "mouse" && !props.anim.current ? props.balls.find((b) => Math.hypot(b.x - x, b.y - y) < R * 1.15) : undefined;
          setHover((h) => (over?.n === h?.n ? h : over ? { n: over.n, x: over.x, y: over.y } : null));
          return;
        }
        setHover(null);
        if (drag.current === "place") tryPlace(x, y);
        else aimAt(x, y);
      }}
      onPointerLeave={() => setHover(null)}
      onPointerUp={() => {
        drag.current = null;
        setBadPlace(null);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setBadPlace(null);
      }}
    >
      <canvas ref={bg} className="absolute inset-0" />
      <canvas ref={fg} className="absolute inset-0" />
      {hover && xf && <BallTip view={props.view} n={hover.n} at={toScreen(xf, hover.x, hover.y)} r={R * xf.s} />}
    </div>
  );
}

function orientOf(map: Map<number, Orient>, n: number): Orient {
  let m = map.get(n);
  if (!m) {
    m = randomOrient();
    map.set(n, m);
  }
  return m;
}

function spriteOf(map: Map<number, { c: HTMLCanvasElement; dirty: boolean; rp: number }>, n: number) {
  let s = map.get(n);
  if (!s) {
    s = { c: document.createElement("canvas"), dirty: true, rp: 0 };
    map.set(n, s);
  }
  return s;
}

function markDirty(map: Map<number, { c: HTMLCanvasElement; dirty: boolean; rp: number }>, n: number) {
  const s = map.get(n);
  if (s) s.dirty = true;
}

/** Sombra para baixo e à direita na tela, em metros do mundo. */
function shadowOffset(xf: Xf): [number, number] {
  const sx = R * 0.22;
  const sy = R * 0.3;
  // tela (sx, sy↓) → mundo
  return xf.rot ? [-sy, -sx] : [sx, -sy];
}

/** Última posição antes de a bola cair. */
function lastValid(frames: Frame[], i: number, t: number): { x: number; y: number } {
  let k = frames.length - 1;
  while (k > 0 && (frames[k].t > t || Number.isNaN(frames[k].data[i * 5]))) k--;
  return { x: frames[k].data[i * 5], y: frames[k].data[i * 5 + 1] };
}

function drawAim(ctx: CanvasRenderingContext2D, px: (n: number) => number, cue: BallPos, pv: AimPreview, targets: number[]) {
  const legal = pv.target === null || targets.includes(pv.target);
  ctx.lineCap = "round";
  // linha até o contato
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = px(1.6);
  const dx = pv.ghost.x - cue.x;
  const dy = pv.ghost.y - cue.y;
  const l = Math.hypot(dx, dy);
  if (l > R) {
    ctx.beginPath();
    ctx.moveTo(cue.x + (dx / l) * R, cue.y + (dy / l) * R);
    ctx.lineTo(pv.ghost.x - (dx / l) * R, pv.ghost.y - (dy / l) * R);
    ctx.stroke();
  }
  // bola fantasma
  ctx.beginPath();
  ctx.arc(pv.ghost.x, pv.ghost.y, R, 0, Math.PI * 2);
  ctx.strokeStyle = legal ? "rgba(255,255,255,0.9)" : "rgba(239,68,68,0.95)";
  ctx.lineWidth = px(1.8);
  ctx.stroke();
  ctx.fillStyle = legal ? "rgba(255,255,255,0.12)" : "rgba(239,68,68,0.18)";
  ctx.fill();
  if (!legal) {
    const k = R * 0.5;
    ctx.beginPath();
    ctx.moveTo(pv.ghost.x - k, pv.ghost.y - k);
    ctx.lineTo(pv.ghost.x + k, pv.ghost.y + k);
    ctx.moveTo(pv.ghost.x - k, pv.ghost.y + k);
    ctx.lineTo(pv.ghost.x + k, pv.ghost.y - k);
    ctx.stroke();
    return;
  }
  // rumo da bola atingida e da branca
  const path = (pts: { x: number; y: number }[], color: string, width: number, from = 0) => {
    if (pts.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = px(width);
    ctx.beginPath();
    ctx.moveTo(pts[from].x, pts[from].y);
    for (let i = from + 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  };
  // caminho curto demais (bola colada na tabela ou tacada que não chega): mostra a direção do choque
  const first = pv.ballPath[0];
  const last = pv.ballPath[pv.ballPath.length - 1];
  if (first && last && Math.hypot(last.x - first.x, last.y - first.y) > 2 * R) path(pv.ballPath, "rgba(255,255,255,0.85)", 1.6);
  else if (pv.ballDir && pv.target !== null) {
    const ox = pv.ghost.x + pv.ballDir.x * 2 * R;
    const oy = pv.ghost.y + pv.ballDir.y * 2 * R;
    path([{ x: ox, y: oy }, { x: ox + pv.ballDir.x * 0.25, y: oy + pv.ballDir.y * 0.25 }], "rgba(255,255,255,0.85)", 1.6);
  }
  path(pv.cuePath, "rgba(190,225,255,0.75)", 1.4);
}

function drawStick(ctx: CanvasRenderingContext2D, s: { x: number; y: number; dx: number; dy: number; side: number; pull: number; alpha: number }) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, s.alpha);
  // o taco aponta para a branca, deslocado para o lado do efeito
  const off = s.side * MAX_TIP * R;
  ctx.translate(s.x + s.dy * off, s.y - s.dx * off);
  ctx.rotate(Math.atan2(s.dy, s.dx) + Math.PI);
  const start = R + Math.max(0.004, s.pull);
  const len = 1.45;
  const seg = (a: number, b: number, w0: number, w1: number, color: string | CanvasGradient) => {
    ctx.beginPath();
    ctx.moveTo(start + a, -w0 / 2);
    ctx.lineTo(start + b, -w1 / 2);
    ctx.lineTo(start + b, w1 / 2);
    ctx.lineTo(start + a, w0 / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  const w = (t: number) => 0.012 + (0.028 - 0.012) * (t / len);
  // sombra
  ctx.save();
  ctx.translate(0.008, -0.012);
  seg(0, len, w(0), w(len), "rgba(0,0,0,0.3)");
  ctx.restore();
  seg(0, 0.006, w(0), w(0.006), "#3a72d8");
  seg(0.006, 0.026, w(0.006), w(0.026), "#f3efe4");
  const shaft = ctx.createLinearGradient(0, -0.02, 0, 0.02);
  shaft.addColorStop(0, "#c99a5f");
  shaft.addColorStop(0.5, "#ecd3a4");
  shaft.addColorStop(1, "#b98a52");
  seg(0.026, 0.85, w(0.026), w(0.85), shaft);
  seg(0.85, 0.87, w(0.85), w(0.87), "#e9e2d0");
  seg(0.87, len, w(0.87), w(len), "#4a2412");
  ctx.restore();
}
