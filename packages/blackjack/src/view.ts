import { handValue } from "./cards";
import { canDoubleHand, canSplitHand, insuranceCost, maxBetFor } from "./rules";
import { DECKS, MIN_BET, type GameState, type PlayerView, type Seat } from "./types";

/** O que `seat` vê (a mesa de blackjack é aberta; só a carta fechada da banca fica escondida). `now`: hora do servidor. */
export function viewFor(s: GameState, seat: Seat | null, now = 0): PlayerView {
  const me = seat !== null && s.players.includes(seat) ? s.table[seat] : null;
  const dealer = s.dealer.map((c, i) => (s.hidden && i === 1 ? null : structuredClone(c)));
  const turn = me && s.phase === "play" && s.turn?.seat === me.seat ? me.hands[s.turn.hand] : null;
  const hand = turn && !turn.done ? turn : null;
  return {
    seat: seat ?? -1,
    settings: { ...s.settings },
    players: [...s.players],
    table: structuredClone(s.table),
    dealer,
    dealerTotal: handValue(dealer).total,
    phase: s.phase,
    round: s.round,
    turn: s.turn ? { ...s.turn } : null,
    shoeLeft: s.shoe.length,
    shoeSize: DECKS * 52,
    shuffleNo: s.shuffleNo,
    events: structuredClone(s.events),
    eventNo: s.eventNo,
    gameNo: s.gameNo,
    timeLeft: s.deadline === null ? null : Math.max(0, s.deadline - now),
    canBet: !!me && s.phase === "bet" && me.bet === null,
    minBet: MIN_BET,
    maxBet: me ? maxBetFor(me.chips) : 0,
    mustInsure: !!me && s.phase === "insurance" && me.insurance === null && me.hands.length > 0,
    insuranceCost: me && me.hands.length ? insuranceCost(me.hands[0].bet) : 0,
    canHit: !!hand,
    canStand: !!hand,
    canDouble: !!hand && canDoubleHand(me!, hand),
    canSplit: !!hand && canSplitHand(me!, hand),
  };
}
