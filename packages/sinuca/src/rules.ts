import { Ev, normalizeShot, simulate, type BallPos, type Shot } from "./physics";
import { FOOT_X, HEAD_X, HL, inKitchen, onCloth, POCKETS, R } from "./table";
import {
  CUE,
  DEFAULT_SETTINGS,
  EIGHT,
  groupOf,
  LEVELS,
  MAX_PLAYERS,
  otherGroup,
  SHOT_MS,
  teamOf,
  type Action,
  type Foul,
  type GameState,
  type Group,
  type Level,
  type SeatStats,
  type Settings,
  type Team,
} from "./types";

export type Rng = () => number;
export type Result = { ok: true; state: GameState } | { ok: false; error: string };

/** Pausa depois de a última bola parar, antes da vez seguinte. */
const SETTLE_MS = 400;

export function parseSettings(raw: unknown, prev: Settings = DEFAULT_SETTINGS): Settings {
  const m = (raw ?? {}) as Record<string, unknown>;
  const level = LEVELS.includes(m.level as Level) ? (m.level as Level) : prev.level;
  const clock = typeof m.clock === "boolean" ? m.clock : prev.clock;
  return { level, clock };
}

/** Mesa válida: dois lugares de times diferentes (1×1) ou os quatro (2×2). */
export function validPlayers(seats: number[]): boolean {
  const ok = seats.every((s) => Number.isInteger(s) && s >= 0 && s < MAX_PLAYERS);
  if (!ok || new Set(seats).size !== seats.length) return false;
  if (seats.length === 4) return true;
  return seats.length === 2 && teamOf(seats[0]) !== teamOf(seats[1]);
}

/** Onde a branca fica para quebrar (na cozinha) e quando volta para a mesa toda. */
export const BREAK_SPOT = { x: HEAD_X - 0.12, y: 0 };
export const TABLE_SPOT = { x: HEAD_X, y: 0 };

/** Triângulo com a 8 no meio, uma lisa e uma listrada nos cantos de trás, o resto sorteado. */
export function rack(rng: Rng): BallPos[] {
  const shuffle = <T>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const solids = shuffle([1, 2, 3, 4, 5, 6, 7]);
  const stripes = shuffle([9, 10, 11, 12, 13, 14, 15]);
  const corners = rng() < 0.5 ? [solids.pop()!, stripes.pop()!] : [stripes.pop()!, solids.pop()!];
  const rest = shuffle([...solids, ...stripes]);
  // bolas quase encostadas (11 µm de folga) com um tremor menor que a folga
  const d = 2 * R * 1.0002;
  const dx = (d * Math.sqrt(3)) / 2;
  const jitter = () => (rng() - 0.5) * 8e-6;
  const out: BallPos[] = [];
  let i = 0;
  for (let row = 0; row < 5; row++) {
    for (let k = 0; k <= row; k++, i++) {
      const n = i === 4 ? EIGHT : i === 10 ? corners[0] : i === 14 ? corners[1] : rest.pop()!;
      out.push({ n, x: FOOT_X + row * dx + jitter(), y: (k - row / 2) * d + jitter() });
    }
  }
  return out;
}

const emptyStats = (): SeatStats => ({ shots: 0, potted: 0, bestRun: 0, bestShot: 0, fouls: 0, breakPot: false });

export function newGame(rng: Rng, seats: number[], settings: Settings = DEFAULT_SETTINGS, prev: GameState | null = null, at = 0): GameState {
  const players = [...seats].sort((a, b) => a - b);
  // na revanche quebra o outro time
  let breaker = players[Math.floor(rng() * players.length)];
  if (prev && players.includes(prev.breaker)) {
    const i = players.indexOf(prev.breaker);
    breaker = players[(i + 1) % players.length];
  }
  return {
    players,
    settings,
    balls: [{ n: CUE, ...BREAK_SPOT }, ...rack(rng)],
    phase: "break",
    turn: breaker,
    inHand: "kitchen",
    groups: [null, null],
    winner: null,
    end: null,
    breaker,
    shotNo: 0,
    last: null,
    run: 0,
    teamShots: [0, 0],
    stats: Array.from({ length: MAX_PLAYERS }, emptyStats),
    deadline: settings.clock ? at + SHOT_MS : null,
  };
}

/** A vez do time é na 8 (todas as bolas do grupo já caíram). */
export function onEight(s: GameState, team: Team): boolean {
  const g = s.groups[team];
  return g !== null && !s.balls.some((b) => groupOf(b.n) === g);
}

/** Bolas que a branca pode tocar primeiro na vez desse lugar. */
export function targetsFor(s: GameState, seat: number): number[] {
  const team = teamOf(seat);
  if (s.phase === "break") return s.balls.filter((b) => b.n !== CUE).map((b) => b.n);
  const g = s.groups[team];
  const all = onEight(s, team) ? s.balls.filter((b) => b.n === EIGHT) : s.balls.filter((b) => b.n !== CUE && b.n !== EIGHT && (g === null || groupOf(b.n) === g));
  // branca na cozinha: só valem as bolas fora dela (se todas estiverem dentro, a falta não tem como ser evitada)
  const out = s.inHand === "kitchen" ? all.filter((b) => !inKitchen(b.x)) : all;
  return (out.length ? out : all).map((b) => b.n);
}

/** A branca pode ficar aqui? */
export function canPlace(s: GameState, x: number, y: number): boolean {
  if (!s.inHand || !Number.isFinite(x) || !Number.isFinite(y) || !onCloth(x, y)) return false;
  if (s.inHand === "kitchen" && !inKitchen(x)) return false;
  return s.balls.every((b) => b.n === CUE || (b.x - x) ** 2 + (b.y - y) ** 2 >= 4 * R * R);
}

/** Primeiro lugar livre a partir de (x, y), andando para o fundo da mesa (para devolver bolas). */
function freeSpot(balls: BallPos[], x: number, y: number, dir: 1 | -1): { x: number; y: number } {
  for (let k = 0; k < 2000; k++) {
    const px = x + dir * k * 0.002;
    if (Math.abs(px) > HL - R) break;
    if (balls.every((b) => (b.x - px) ** 2 + (b.y - y) ** 2 >= 4 * R * R)) return { x: px, y };
  }
  // no limite, tenta o outro lado
  for (let k = 0; k < 2000; k++) {
    const px = x - dir * k * 0.002;
    if (balls.every((b) => (b.x - px) ** 2 + (b.y - y) ** 2 >= 4 * R * R)) return { x: px, y };
  }
  return { x, y };
}

function nextSeat(s: GameState): number {
  const i = s.players.indexOf(s.turn);
  return s.players[(i + 1) % s.players.length];
}

/** Passa a vez; com falta, o próximo põe a branca onde quiser. */
function passTurn(s: GameState, inHand: GameState["inHand"]) {
  s.turn = nextSeat(s);
  s.run = 0;
  s.inHand = inHand;
  if (inHand) {
    const cue = s.balls.find((b) => b.n === CUE);
    if (!cue) {
      const spot = inHand === "kitchen" ? BREAK_SPOT : TABLE_SPOT;
      s.balls.unshift({ n: CUE, ...freeSpot(s.balls, spot.x, spot.y, -1) });
    }
  }
}

function fail(error: string): Result {
  return { ok: false, error };
}

export function applyAction(prev: GameState, a: Action): Result {
  if (prev.phase === "over") return fail("Partida encerrada");
  const s: GameState = structuredClone(prev);

  if (a.type === "timeout") {
    if (s.deadline === null || a.at < s.deadline) return fail("Ainda não");
    s.stats[s.turn].fouls++;
    s.last = null;
    s.shotNo++;
    if (s.phase === "break") {
      // o outro time quebra
      s.turn = nextSeat(s);
      s.breaker = s.turn;
      s.inHand = "kitchen";
    } else {
      passTurn(s, "table");
    }
    s.deadline = s.settings.clock ? a.at + SHOT_MS : null;
    return { ok: true, state: s };
  }

  if (a.type !== "shot") return fail("Ação inválida");
  if (a.seat !== s.turn) return fail("Não é sua vez");
  const shot = normalizeShot(a.shot);
  if (!shot) return fail("Tacada inválida");
  const team = teamOf(a.seat);
  const brk = s.phase === "break";
  const eightTime = !brk && onEight(s, team);

  // bola na mão
  if (a.place) {
    if (!s.inHand) return fail("Sem bola na mão");
    if (!canPlace(s, a.place.x, a.place.y)) return fail("Lugar inválido");
    const cue = s.balls.find((b) => b.n === CUE)!;
    cue.x = a.place.x;
    cue.y = a.place.y;
  }
  let call: number | null = null;
  if (eightTime) {
    if (!Number.isInteger(a.call) || a.call! < 0 || a.call! >= POCKETS.length) return fail("Cante a caçapa da 8");
    call = a.call!;
  }

  const before = s.balls.map((b) => ({ ...b }));
  const kitchenStart = s.inHand === "kitchen";
  const targets = targetsFor(s, a.seat);
  const res = simulate(before, shot);

  // o que aconteceu
  const contacts = res.events.filter((e) => e.kind === Ev.Ball && (e.a === CUE || e.b === CUE));
  const firstEv = contacts[0];
  const first = firstEv ? (firstEv.a === CUE ? firstEv.b : firstEv.a) : null;
  const railAfter = firstEv ? res.events.some((e) => e.kind === Ev.Cushion && e.t >= firstEv.t) : false;
  const cuePotted = res.pocketed.some((p) => p.n === CUE);
  const objects = res.pocketed.filter((p) => p.n !== CUE);
  const eight = res.pocketed.find((p) => p.n === EIGHT);

  let foul: Foul | null = null;
  const st = s.stats[a.seat];
  st.shots++;
  s.shotNo++;
  s.balls = res.balls;

  const finish = (winner: Team, end: GameState["end"]) => {
    s.phase = "over";
    s.winner = winner;
    s.end = end;
    s.inHand = null;
  };

  if (brk) {
    const railBalls = new Set(res.events.filter((e) => e.kind === Ev.Cushion && e.a !== CUE).map((e) => e.a));
    const legal = first !== null && (objects.length > 0 || railBalls.size >= 4);
    if (cuePotted) foul = "scratch";
    else if (!legal) foul = "badBreak";
    st.breakPot = objects.length > 0;
    if (eight) s.balls.push({ n: EIGHT, ...freeSpot(s.balls, FOOT_X, 0, 1) });
    s.phase = "play";
    if (foul) {
      st.fouls++;
      passTurn(s, cuePotted ? "kitchen" : "table");
    } else if (objects.length > 0) {
      s.inHand = null;
    } else {
      passTurn(s, null);
    }
  } else {
    const firstBall = first === null ? null : before.find((b) => b.n === first)!;
    s.teamShots[team]++;
    if (cuePotted) foul = "scratch";
    else if (first === null) foul = "noHit";
    else if (kitchenStart && firstBall && inKitchen(firstBall.x)) foul = "kitchen";
    else if (!targets.includes(first)) foul = "wrongBall";
    else if (objects.length === 0 && !railAfter) foul = "noRail";
    if (foul) st.fouls++;

    if (eight) {
      if (!eightTime) finish((1 - team) as Team, "early");
      else if (foul) finish((1 - team) as Team, "scratchEight");
      else if (eight.pocket !== call) finish((1 - team) as Team, "wrongPocket");
      else {
        st.potted++;
        s.run++;
        st.bestRun = Math.max(st.bestRun, s.run);
        finish(team, "eight");
      }
    } else {
      // mesa aberta: quem encaçapa numa tacada válida fica com o grupo da primeira bola que caiu
      if (!foul && s.groups[team] === null) {
        const firstPot = objects.find((p) => groupOf(p.n) !== null);
        if (firstPot) {
          const g = groupOf(firstPot.n) as Group;
          s.groups[team] = g;
          s.groups[(1 - team) as Team] = otherGroup(g);
        }
      }
      const g = s.groups[team];
      const own = g === null ? 0 : objects.filter((p) => groupOf(p.n) === g).length;
      if (!foul) {
        st.potted += own;
        st.bestShot = Math.max(st.bestShot, own);
      }
      if (!foul && own > 0) {
        s.run += own;
        st.bestRun = Math.max(st.bestRun, s.run);
        s.inHand = null;
      } else {
        passTurn(s, foul ? "table" : null);
      }
    }
  }

  const ms = Math.round(res.time * 1000) + SETTLE_MS;
  s.last = { seat: a.seat, shot, before, call, pocketed: res.pocketed, foul, ms, brk };
  s.deadline = s.settings.clock && s.phase !== "over" ? a.at + ms + SHOT_MS : null;
  return { ok: true, state: s };
}
