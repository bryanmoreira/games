import type { GameState, PlayerView } from "./types";

export function viewFor(s: GameState, seat: number): PlayerView {
  const { deck, memory, history, ...visible } = s;
  const canPlay = s.phase === "playing" && s.turn === seat;
  const capacity = 4;
  return {
    ...structuredClone(visible), seat,
    cards: deck.map((value, i) => s.open.includes(i) || s.owners[i] !== null || s.phase === "gameOver" ? value : null),
    memory: memory.slice(-capacity).map(index => ({ index, value: deck[index] })),
    canPlay, legal: canPlay ? deck.flatMap((_, i) => s.owners[i] === null && !s.open.includes(i) ? [i] : []) : [],
    flips: history.length,
  };
}
