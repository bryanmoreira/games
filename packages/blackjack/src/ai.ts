import type { Rng } from "./cards";
import { advise } from "./strategy";
import { BET_STEP, START_CHIPS, type Action, type PlayerView } from "./types";

/** Aposta da IA: um pouco do saldo (mais quando está na frente), com variação. */
function botBet(v: PlayerView, chips: number, rng: Rng): number {
  const base = chips >= START_CHIPS ? 50 : 25;
  const pick = [base, base, base * 2, base / 2 + 15][Math.floor(rng() * 4)];
  const amount = Math.round(pick / BET_STEP) * BET_STEP;
  return Math.max(v.minBet, Math.min(v.maxBet, amount));
}

/** Lance da IA pela visão dela: aposta, recusa o seguro e joga a estratégia básica. */
export function decide(v: PlayerView, rng: Rng = Math.random): Action | null {
  const me = v.table[v.seat];
  if (!me) return null;
  if (v.canBet) return { type: "bet", seat: v.seat, amount: botBet(v, me.chips, rng) };
  if (v.mustInsure) return { type: "insurance", seat: v.seat, take: false };
  if (!v.canStand || !v.turn) return null;
  const up = v.dealer[0];
  const hand = me.hands[v.turn.hand];
  if (!up || !hand) return { type: "stand", seat: v.seat };
  const move = advise(hand.cards, up.rank, { canDouble: v.canDouble, canSplit: v.canSplit });
  return { type: move, seat: v.seat };
}
