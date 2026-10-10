import * as truco from "@truco/game";
import * as c4 from "@truco/connect4";
import type { GameId } from "@truco/game";

type Result<S> = { ok: true; state: S } | { ok: false; error: string };

/** O que o servidor de salas precisa saber de cada jogo. */
export interface GameAdapter<S = any, A = any, V = any> {
  seats: number;
  /** Partida nova; `prev` é a partida anterior no "De novo". */
  newGame(prev: S | null): S;
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

export const GAMES: Record<GameId, GameAdapter> = {
  "truco-paulista": trucoAdapter,
  connect4: connect4Adapter,
};
