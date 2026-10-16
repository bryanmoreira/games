import { playable } from "./rules";
import { endsOf, sidesFor } from "./tiles";
import type { GameState, Option, PlayerView, Seat } from "./types";

/** O que `seat` vê: a própria mão, quantas peças os outros têm e, no fim da mão, todas abertas. */
export function viewFor(s: GameState, seat: Seat): PlayerView {
  const playing = s.players.includes(seat);
  const mine = playing && s.phase === "playing" && s.turn === seat;
  const options: Option[] = mine ? playable(s, seat).map((tile) => ({ tile, sides: sidesFor(s.board, tile) })) : [];
  return {
    mode: s.mode,
    players: [...s.players],
    seat,
    myHand: playing ? s.hands[seat].map((t) => [...t] as [number, number]) : [],
    handCounts: s.hands.map((h) => h.length),
    revealed: s.phase === "playing" ? null : s.hands.map((h) => h.map((t) => [...t] as [number, number])),
    stockCount: s.stock.length,
    board: structuredClone(s.board),
    ends: endsOf(s.board),
    turn: s.turn,
    phase: s.phase,
    handNo: s.handNo,
    opening: s.opening,
    starter: s.starter,
    doubled: s.doubled,
    events: structuredClone(s.events),
    scores: [...s.scores],
    result: s.result,
    winner: s.winner,
    gameNo: s.gameNo,
    canPlay: options.length > 0,
    canDraw: mine && options.length === 0 && s.stock.length > 0,
    options,
  };
}
