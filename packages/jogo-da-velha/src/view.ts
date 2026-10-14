import { freeCells } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

export function viewFor(state: GameState, seat: Seat): PlayerView {
  const canPlay = state.phase === "playing" && state.turn === seat;
  return { ...structuredClone(state), seat, canPlay, playable: canPlay ? freeCells(state.board) : [] };
}
