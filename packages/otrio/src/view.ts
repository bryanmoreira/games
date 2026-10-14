import { currentColor, placeableSlots } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

export function viewFor(state: GameState, seat: Seat): PlayerView {
  const color = currentColor(state);
  const canPlay = color !== null && state.owner[color] === seat;
  return {
    ...structuredClone(state),
    seat,
    myColors: state.order.filter((c) => state.owner[c] === seat),
    color,
    canPlay,
    placeable: canPlay ? placeableSlots(state, color) : [],
  };
}
