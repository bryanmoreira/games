import { colorOf, movesFor } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

export function viewFor(state: GameState, seat: Seat): PlayerView {
  const canPlay = state.phase === "playing" && state.turn === seat;
  return { ...structuredClone(state), seat, color: colorOf(state, seat), canPlay, legal: canPlay ? movesFor(state) : [] };
}
