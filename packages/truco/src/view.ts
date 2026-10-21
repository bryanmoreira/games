import { canTruco, nextBetValue, partnerOf, teamOf } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

export function viewFor(s: GameState, seat: Seat): PlayerView {
  const h = s.hand;
  const team = teamOf(seat);
  const ferro = h.mode === "ferro";
  const responding = s.phase === "playing" && !!h.bet && h.bet.team !== team;

  return {
    seat,
    players: s.players,
    scores: s.scores,
    phase: s.phase,
    winner: s.winner,
    handNo: s.handNo,
    dealer: h.dealer,
    vira: h.vira,
    manilha: h.manilha,
    myHand: h.hands[seat].map((c) => (ferro ? null : c)),
    partnerHand: s.phase === "mao11" && h.mao11Team === team && s.players.length === 4 ? h.hands[partnerOf(seat)] : null,
    handCounts: h.hands.map((c) => c.length),
    rounds: h.rounds.map((r) => ({
      ...r,
      plays: r.plays.map((p) => ({ ...p, card: p.hidden && p.seat !== seat ? null : p.card })),
    })),
    turn: h.turn,
    value: h.value,
    bet: h.bet,
    lastRaiseTeam: h.lastRaiseTeam,
    mode: h.mode,
    mao11Team: h.mao11Team,
    result: h.result,
    shout: s.shout,
    canPlay: s.phase === "playing" && !h.bet && h.turn === seat,
    canHide: h.rounds.length > 1,
    canTruco: canTruco(s, seat),
    mustRespond: responding,
    canRaise: responding && nextBetValue(h.bet!.value) !== null,
    mustDecideMao11: s.phase === "mao11" && h.mao11Team === team,
    nextBet: nextBetValue(h.value),
  };
}
