import * as truco from "@truco/game";
import * as c4 from "@truco/connect4";
import * as stop from "@truco/stop";
import type { GameId } from "@truco/game";

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
  /** false: sem IA no lobby e ninguém joga no lugar de quem cai. */
  bots?: boolean;
  /** Opções do lobby: padrão e validação do que o host mandou. */
  settings?: { initial: unknown; parse(raw: unknown, prev: unknown): unknown };
  /** Partida nova; `prev` é a partida anterior no "De novo". */
  newGame(prev: S | null, setup: GameSetup): S;
  applyAction(s: S, a: A): Result<S>;
  viewFor(s: S, seat: number): V;
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
}

// Tempo da animação de embaralhar/distribuir no cliente
const DEAL_MS = 2600;
// Tempo da peça caindo no tabuleiro
const DROP_MS = 700;

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
};

export const GAMES: Record<GameId, GameAdapter> = {
  "truco-paulista": trucoAdapter,
  connect4: connect4Adapter,
  stop: stopAdapter,
};
