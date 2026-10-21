import { advanceTo, end, input, newGame, playedMs } from "./rules";
import { COUNTDOWN_TICKS, KEYS, type Game, type Key } from "./types";

// 1×1: cada navegador roda a própria partida (sem atraso nas teclas) e manda os comandos com o passo
// em que aconteceram. O servidor refaz as duas partidas com as mesmas peças e decide quem acabou primeiro.

/** Quanto a partida no servidor espera os comandos de um jogador antes de seguir sem eles (1,5 s). */
export const LAG_TICKS = 90;
/** Comando marcado com passo à frente do servidor além disso é puxado para agora. */
const AHEAD_TICKS = 30;

export type VersusPhase = "countdown" | "playing" | "over";

export interface VersusState {
  seed: number;
  /** Lugares na partida; `games[i]` é a partida de `players[i]`. */
  players: number[];
  games: Game[];
  /** Correções de cada partida: mudou, o navegador troca a dele pela do servidor. */
  rev: number[];
  /** Passos desde o começo (negativo na contagem). */
  tick: number;
  phase: VersusPhase;
  /** Lugar que venceu; null com empate (ou partida em andamento). */
  winner: number | null;
  /** Passo em que o perdedor acabou. */
  endTick: number | null;
  gameNo: number;
}

export type VersusAction =
  | { type: "input"; seat: number; tick: number; key: Key }
  | { type: "abandon"; seat: number }
  | { type: "advance" };

type Result = { ok: true; state: VersusState } | { ok: false; error: string };

export function newVersus(seats: number[], seed: number, prev?: VersusState | null): VersusState {
  return {
    seed,
    players: seats.slice(0, 2),
    games: seats.slice(0, 2).map(() => newGame(seed, "versus")),
    rev: seats.slice(0, 2).map(() => 0),
    tick: -COUNTDOWN_TICKS,
    phase: "countdown",
    winner: null,
    endTick: null,
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
}

/** Muda o estado no lugar (o servidor guarda um só por sala). */
export function applyVersus(s: VersusState, a: VersusAction): Result {
  if (a.type === "advance") return { ok: true, state: s };
  const i = s.players.indexOf(a.seat);
  if (i < 0) return { ok: false, error: "Fora da partida" };
  const g = s.games[i];
  if (a.type === "abandon") {
    if (s.phase !== "over" && !g.over) {
      end(g);
      resolve(s);
    }
    return { ok: true, state: s };
  }
  if (a.type !== "input") return { ok: false, error: "Ação inválida" };
  if (!KEYS.includes(a.key) || !Number.isInteger(a.tick)) return { ok: false, error: "Comando inválido" };
  if (s.phase !== "playing" || g.over) return { ok: true, state: s };
  let t = a.tick;
  // chegou tarde demais (ou adiantado): vale agora, e o navegador recebe a partida do servidor
  if (t < g.tick) {
    t = g.tick;
    s.rev[i]++;
  } else if (t > s.tick + AHEAD_TICKS) {
    t = Math.max(g.tick, s.tick);
    s.rev[i]++;
  }
  advanceTo(g, t);
  input(g, a.key);
  resolve(s);
  return { ok: true, state: s };
}

/** Um passo do servidor: as partidas sem comandos andam sozinhas, com LAG_TICKS de folga. */
export function stepVersus(s: VersusState): VersusState {
  if (s.phase === "over") return s;
  s.tick++;
  if (s.tick >= 0) s.phase = "playing";
  if (s.phase !== "playing") return s;
  for (const g of s.games) advanceTo(g, s.tick - LAG_TICKS);
  resolve(s);
  return s;
}

/**
 * Alguém acabou: espera as outras partidas chegarem àquele passo (podem acabar antes dele) e só então
 * decide. Perde quem acabou primeiro; no mesmo passo, empate.
 */
function resolve(s: VersusState) {
  if (s.phase === "over") return;
  const ends = s.games.filter((g) => g.over).map((g) => g.overTick!);
  if (!ends.length) return;
  const first = Math.min(...ends);
  if (!s.games.every((g) => g.over || g.tick >= first)) return;
  const losers = s.games.map((g, i) => (g.over && g.overTick === first ? i : -1)).filter((i) => i >= 0);
  s.phase = "over";
  s.endTick = first;
  s.winner = losers.length === s.games.length ? null : s.players[s.games.findIndex((_, i) => !losers.includes(i))];
}

export const isVersusOver = (s: VersusState) => s.phase === "over";

// ---------- visão ----------

/** Partida na mensagem: o campo vira texto (um dígito por casa). */
export type PackedGame = Omit<Game, "board" | "ids"> & { board: string; ids: string };

export const pack = (g: Game): PackedGame => ({ ...g, board: g.board.join(""), ids: g.ids.map((n) => n.toString(36)).join("") });
// partida salva antes de existir `ids`: sem número de peça (blocos da mesma cor se juntam)
export const unpack = (p: PackedGame): Game =>
  structuredClone({ ...p, board: Array.from(p.board, Number), ids: p.ids ? Array.from(p.ids, (c) => parseInt(c, 36)) : new Array(p.board.length).fill(0) });

export interface VersusPlayer {
  seat: number;
  rev: number;
  game: PackedGame;
}

/** Nada é escondido: as peças são as mesmas para os dois. */
export interface VersusView {
  me: number | null;
  tick: number;
  phase: VersusPhase;
  winner: number | null;
  endTick: number | null;
  gameNo: number;
  players: VersusPlayer[];
}

export function versusView(s: VersusState, seat: number | null): VersusView {
  return {
    me: seat,
    tick: s.tick,
    phase: s.phase,
    winner: s.winner,
    endTick: s.endTick,
    gameNo: s.gameNo,
    players: s.players.map((p, i) => ({ seat: p, rev: s.rev[i], game: pack(s.games[i]) })),
  };
}

/** Resultado de um lugar na partida terminada. */
export function versusOutcome(s: VersusState, seat: number) {
  const i = s.players.indexOf(seat);
  const g = s.games[i];
  return {
    outcome: s.winner === null ? ("draw" as const) : s.winner === seat ? ("win" as const) : ("loss" as const),
    data: {
      ms: playedMs({ ...g, overTick: g.overTick ?? s.endTick }),
      score: g.score,
      lines: g.lines,
      level: g.level,
      tetras: g.tetras,
    },
  };
}
