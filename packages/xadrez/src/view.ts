import { inCheck } from "./board";
import { canOfferDraw, colorOf, movesFor, posOf, timeLeft } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

/** Visão de um lugar. `now` (relógio do servidor) desconta o tempo da vez em andamento. */
export function viewFor(state: GameState, seat: Seat, now = state.clock?.since ?? 0): PlayerView {
  const canPlay = state.phase === "playing" && state.turn === seat;
  return {
    ...structuredClone(state),
    seat,
    color: colorOf(state, seat),
    canPlay,
    legal: canPlay ? movesFor(state) : [],
    check: inCheck(posOf(state)),
    timeLeft: timeLeft(state, now),
    canOfferDraw: canOfferDraw(state, seat),
    mustAnswerDraw: state.phase === "playing" && state.drawOffer === 1 - seat,
  };
}
