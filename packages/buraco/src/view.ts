import { sortHand } from "./cards";
import { ctxOf, takeOptions, teamOf } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

/** O que `seat` vê: a própria mão, quantas cartas os outros têm, a mesa e o lixo; no fim da mão, todas as mãos. */
export function viewFor(s: GameState, seat: Seat): PlayerView {
  const playing = s.players.includes(seat);
  const mine = playing && s.phase === "playing" && s.turn === seat;
  const drawing = mine && s.step === "draw";
  const options = drawing ? takeOptions(ctxOf(s, seat)) : [];
  return {
    mode: s.mode,
    players: [...s.players],
    seat,
    team: playing ? teamOf(seat) : null,
    myHand: playing ? sortHand(s.hands[seat]) : [],
    handCounts: s.hands.map((h) => h.length),
    stockCount: s.stock.length,
    pile: structuredClone(s.pile),
    mortosLeft: s.mortos.length,
    mortoTaken: [...s.mortoTaken],
    melds: structuredClone(s.melds),
    turn: s.turn,
    step: s.step,
    phase: s.phase,
    handNo: s.handNo,
    dealer: s.dealer,
    events: structuredClone(s.events),
    eventNo: s.eventNo,
    scores: [...s.scores],
    target: s.target,
    revealed: s.phase === "playing" ? null : s.hands.map((h) => sortHand(h)),
    result: s.result,
    winner: s.winner,
    gameNo: s.gameNo,
    canDraw: drawing && s.stock.length > 0,
    canTake: options.length > 0,
    takeOptions: options,
    canPlay: mine && s.step === "play",
  };
}
