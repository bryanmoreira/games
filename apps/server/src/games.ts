import * as truco from "@truco/game";
import * as c4 from "@truco/connect4";
import * as stop from "@truco/stop";
import * as bn from "@truco/batalha-naval";
import * as cn from "@truco/codenames";
import * as otrio from "@truco/otrio";
import type { GameId, PlayerReport } from "@truco/game";

type Result<S> = { ok: true; state: S } | { ok: false; error: string };

/** O que o servidor de salas precisa saber de cada jogo. */
/** Quem joga a partida nova (lugares ocupados) e as opções do lobby. */
export interface GameSetup {
  seats: number[];
  settings: unknown;
}

export interface GameAdapter<S = any, A = any, V = any> {
  seats: number;
  /** Mínimo de lugares ocupados para começar; sem ele, a mesa precisa estar cheia. */
  minSeats?: number;
  /** Além do mínimo, os lugares ocupados formam uma mesa válida (ex.: mestre e agente em cada time). */
  canStart?(seats: number[]): boolean;
  /** Quem pode agir age sem esperar os outros (ex.: posicionar a frota): o bot não espera o humano. */
  simultaneous?: boolean;
  /** false: sem IA no lobby e ninguém joga no lugar de quem cai. */
  bots?: boolean;
  /** Opções do lobby: padrão e validação do que o host mandou. */
  settings?: { initial: unknown; parse(raw: unknown, prev: unknown): unknown };
  /** Partida nova; `prev` é a partida anterior no "De novo". */
  newGame(prev: S | null, setup: GameSetup): S;
  applyAction(s: S, a: A): Result<S>;
  viewFor(s: S, seat: number): V;
  /** Visão de quem está na sala sem lugar na partida (assistindo); sem ela, o espectador não vê a mesa. */
  spectate?(s: S): V;
  /** Lance do bot a partir da visão dele. */
  decide(v: V): A | null;
  /** Ação vinda do cliente (sem assento) com o assento de quem mandou. */
  withSeat(a: unknown, seat: number): A;
  /** Quem pode agir agora. */
  actors(s: S): number[];
  /** ms até um "advance" automático, ou null. */
  pause(s: S): number | null;
  over(s: S): boolean;
  /** Tempo da animação no cliente depois desta transição (bots esperam). */
  animMs(prev: S | null, next: S): number;
  /** Identifica a fase com relógio: enquanto for a mesma, o relógio não reinicia a cada ação. */
  phaseKey?(s: S): string;
  /** Ação que avisa o jogo de quem está desconectado (null se nada mudou). */
  away?(s: S, seats: number[]): A | null;
  /** Resultado de um lugar na partida terminada (o que vai para o perfil). */
  outcome(s: S, seat: number): Omit<PlayerReport, "userId">;
}

// Tempo da animação de embaralhar/distribuir no cliente
const DEAL_MS = 2600;
// Tempo da peça caindo no tabuleiro
const DROP_MS = 700;
// Mira descendo + impacto do tiro
const SHOT_MS = 900;
// Anel encaixando no tabuleiro
const RING_MS = 450;

const trucoAdapter: GameAdapter<truco.GameState, truco.Action, truco.PlayerView> = {
  seats: 4,
  newGame: () => truco.newGame(Math.random, Math.floor(Math.random() * 4) as truco.Seat),
  applyAction: truco.applyAction,
  viewFor: (s, seat) => truco.viewFor(s, seat as truco.Seat),
  decide: (v) => truco.decide(v),
  withSeat: (a, seat) => truco.withSeat(a as truco.ClientAction, seat as truco.Seat),
  actors: (s) =>
    [0, 1, 2, 3].filter((seat) => {
      const v = truco.viewFor(s, seat as truco.Seat);
      return v.canPlay || v.mustRespond || v.mustDecideMao11;
    }),
  pause: (s) => (s.phase === "roundEnd" ? 1400 : s.phase === "handEnd" ? 2600 : null),
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (!prev || prev.handNo !== next.handNo ? DEAL_MS : 0),
  outcome: (s, seat) => {
    const team = truco.teamOf(seat as truco.Seat);
    return {
      outcome: s.winner === team ? "win" : "loss",
      data: { scores: [s.scores[team], s.scores[1 - team]], hands: s.handNo },
    };
  },
};

const connect4Adapter: GameAdapter<c4.GameState, c4.Action, c4.PlayerView> = {
  seats: 2,
  newGame: (prev) => c4.newGame(Math.random, prev),
  applyAction: c4.applyAction,
  viewFor: (s, seat) => c4.viewFor(s, seat as c4.Seat),
  decide: (v) => c4.decide(v),
  withSeat: (a, seat) => ({ type: "drop", col: Number((a as { col?: unknown })?.col), seat: seat as c4.Seat }),
  actors: (s) => (s.phase === "playing" ? [s.turn] : []),
  pause: () => null,
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.moves.length > prev.moves.length ? DROP_MS : 0),
  outcome: (s, seat) => ({
    outcome: s.winner === null ? "draw" : s.winner === seat ? "win" : "loss",
    data: { pieces: s.moves.filter((m) => m.seat === seat).length, moves: s.moves.length },
  }),
};

const stopAdapter: GameAdapter<stop.GameState, stop.Action, stop.PlayerView> = {
  seats: stop.MAX_PLAYERS,
  minSeats: stop.MIN_PLAYERS,
  bots: false,
  settings: {
    initial: stop.DEFAULT_SETTINGS,
    parse: (raw, prev) => stop.parseSettings(raw, prev as stop.Settings),
  },
  newGame: (prev, { seats, settings }) =>
    stop.newGame(Math.random, { players: seats, settings: stop.parseSettings(settings) }, prev),
  applyAction: (s, a) => stop.applyAction(s, a),
  viewFor: (s, seat) => stop.viewFor(s, seat),
  decide: () => null,
  withSeat: (a, seat) => ({ ...(a as stop.ClientAction), seat }) as stop.Action,
  actors: (s) => (s.phase === "gameOver" ? [] : s.players),
  pause: (s) => {
    switch (s.phase) {
      case "letter":
        return stop.LETTER_MS;
      case "writing":
        return s.settings.time > 0 ? s.settings.time * 1000 : null;
      case "review":
        return stop.REVIEW_MS;
      case "roundEnd":
        return stop.ROUND_END_MS;
      default:
        return null;
    }
  },
  over: (s) => s.phase === "gameOver",
  animMs: () => 0,
  phaseKey: (s) => `${s.gameNo}:${s.phaseNo}`,
  away: (s, seats) => {
    const away = s.players.filter((p) => seats.includes(p));
    return away.length === s.away.length && away.every((p) => s.away.includes(p)) ? null : { type: "away", seats: away };
  },
  outcome: (s, seat) => {
    const score = s.scores[seat] ?? 0;
    const all = s.players.map((p) => s.scores[p] ?? 0);
    const top = Math.max(...all);
    const atTop = all.filter((x) => x === top).length;
    const mine = s.history.map((r) => r.points[seat] ?? []);
    return {
      // vitória só para o primeiro lugar sozinho; empate no topo é empate
      outcome: score === top ? (atTop > 1 ? "draw" : "win") : "loss",
      placement: 1 + all.filter((x) => x > score).length,
      data: {
        score,
        players: s.players.length,
        unique: mine.flat().filter((p) => p === 10).length,
        stops: s.history.filter((r) => r.stoppedBy === seat).length,
        perfectRounds: mine.filter((pts) => pts.length > 0 && pts.every((p) => p === 10)).length,
      },
    };
  },
};

const batalhaNavalAdapter: GameAdapter<bn.GameState, bn.Action, bn.PlayerView> = {
  seats: 2,
  simultaneous: true,
  newGame: (prev) => bn.newGame(Math.random, prev),
  applyAction: bn.applyAction,
  viewFor: (s, seat) => bn.viewFor(s, seat as bn.Seat),
  decide: (v) => bn.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    return m.type === "place"
      ? { type: "place", seat: seat as bn.Seat, ships: m.ships as bn.Ship[] }
      : { type: "shoot", seat: seat as bn.Seat, col: Number(m.col), row: Number(m.row) };
  },
  actors: (s) => (s.phase === "placing" ? ([0, 1] as const).filter((p) => !s.fleets[p]) : s.phase === "battle" ? [s.turn] : []),
  pause: () => null,
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.shots.length > prev.shots.length ? SHOT_MS : 0),
  outcome: (s, seat) => {
    const mine = s.shots.filter((x) => x.seat === seat);
    return {
      outcome: s.winner === seat ? "win" : "loss",
      data: {
        shots: mine.length,
        hits: mine.filter((x) => x.hit).length,
        shipsLost: s.shots.filter((x) => x.seat !== seat && x.sunk !== null).length,
      },
    };
  },
};

const codenamesAdapter: GameAdapter<cn.GameState, cn.Action, cn.PlayerView> = {
  seats: cn.SEATS,
  minSeats: 4,
  canStart: cn.canStart,
  bots: false,
  settings: {
    initial: cn.DEFAULT_SETTINGS,
    parse: (raw, prev) => cn.parseSettings(raw, prev as cn.Settings),
  },
  newGame: (prev, { seats, settings }) => cn.newGame(Math.random, { players: seats, settings: cn.parseSettings(settings) }, prev),
  applyAction: cn.applyAction,
  viewFor: (s, seat) => cn.viewFor(s, seat),
  spectate: (s) => cn.viewFor(s, null),
  decide: () => null,
  withSeat: (a, seat) => ({ ...(a as cn.ClientAction), seat }) as cn.Action,
  actors: (s) =>
    s.players.filter((p) => (s.phase === "clue" ? cn.canClue(s, p) : s.phase === "guess" ? cn.canGuess(s, p) : false)),
  pause: (s) => (s.phase !== "gameOver" && s.settings.time > 0 ? s.settings.time * 1000 : null),
  over: (s) => s.phase === "gameOver",
  animMs: () => 0,
  phaseKey: (s) => `${s.gameNo}:${s.phaseNo}`,
  outcome: (s, seat) => {
    const team = cn.teamOf(seat);
    // dica que mais rendeu: palavras do próprio time achadas com ela
    const bestClue = Math.max(0, ...s.clues.filter((c) => c.seat === seat).map((c) => c.guesses.filter((g) => s.cards[g]?.key === team).length));
    return {
      outcome: s.winner === team ? "win" : "loss",
      data: { role: cn.roleOf(seat), assassin: s.reason === "assassin" && s.winner !== team, bestClue },
    };
  },
};

const otrioAdapter: GameAdapter<otrio.GameState, otrio.Action, otrio.PlayerView> = {
  seats: otrio.MAX_PLAYERS,
  minSeats: otrio.MIN_PLAYERS,
  newGame: (prev, { seats }) => otrio.newGame(Math.random, seats, prev),
  applyAction: otrio.applyAction,
  viewFor: (s, seat) => otrio.viewFor(s, seat),
  decide: (v) => otrio.decide(v),
  withSeat: (a, seat) => {
    const m = (a ?? {}) as Record<string, unknown>;
    return { type: "place", seat, cell: Number(m.cell), size: Number(m.size) as otrio.Size };
  },
  actors: (s) => {
    const color = otrio.currentColor(s);
    return color === null ? [] : [s.owner[color]!];
  },
  pause: () => null,
  over: (s) => s.phase === "gameOver",
  animMs: (prev, next) => (prev && next.moves.length > prev.moves.length ? RING_MS : 0),
  outcome: (s, seat) => ({
    outcome: s.winner === null ? "draw" : s.winner === seat ? "win" : "loss",
    data: {
      pieces: s.moves.filter((m) => m.seat === seat).length,
      // vencedor: a forma da trinca e quantas peças da cor vencedora foram usadas
      ...(s.winner === seat && s.win ? { how: s.win.kind, colorPieces: s.moves.filter((m) => m.color === s.winColor).length } : {}),
      players: s.players.length,
      moves: s.moves.length,
    },
  }),
};

export const GAMES: Record<GameId, GameAdapter> = {
  "truco-paulista": trucoAdapter,
  connect4: connect4Adapter,
  stop: stopAdapter,
  "batalha-naval": batalhaNavalAdapter,
  codenames: codenamesAdapter,
  otrio: otrioAdapter,
};
