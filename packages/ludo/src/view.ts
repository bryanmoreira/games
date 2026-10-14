import { cloneState, currentSeat, movablePieces } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

export function viewFor(state: GameState, seat: Seat): PlayerView {
  const current = currentSeat(state);
  const mine = current === seat;
  const myColor = state.colorOf[seat] ?? null;
  const canMove = mine && state.phase === "move" && state.die !== null;
  return {
    ...cloneState(state),
    seat,
    myColor,
    current,
    canRoll: mine && state.phase === "roll",
    canMove,
    movable: canMove ? movablePieces(state, myColor!, state.die!) : [],
  };
}
