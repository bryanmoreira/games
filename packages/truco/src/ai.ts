import { strength, type Rng } from "./deck";
import { nextBetValue, other, teamOf, WIN_SCORE } from "./rules";
import type { Action, Card, PlayerView, Rank } from "./types";

const BET_THRESHOLD: Record<number, number> = { 3: 1.5, 6: 1.9, 9: 2.3, 12: 2.7 };

function cardPower(c: Card | null, manilha: Rank): number {
  const s = strength(c, manilha);
  if (s >= 10) return 1 + (s - 10) * 0.15;
  if (s >= 8) return 0.6;
  if (s === 7) return 0.4;
  if (s >= 5) return 0.15;
  return 0;
}

function handPower(v: PlayerView, cards: (Card | null)[] = v.myHand): number {
  const team = teamOf(v.seat);
  let p = cards.reduce((sum, c) => sum + cardPower(c, v.manilha), 0);
  for (const r of v.rounds) {
    if (r.winner === team) p += 0.9;
    else if (r.winner === other(team)) p -= 0.7;
    else if (r.winner === "tie") p += 0.2;
  }
  return p;
}

function choosePlay(v: PlayerView, rng: Rng): Action {
  const seat = v.seat;
  const team = teamOf(seat);
  const round = v.rounds[v.rounds.length - 1];
  const roundIdx = v.rounds.length - 1;
  const play = (index: number, hidden = false): Action => ({ type: "play", seat, index, hidden });

  if (v.mode === "ferro") return play(Math.floor(rng() * v.myHand.length));

  let opp = -2;
  let mate = -2;
  for (const p of round.plays) {
    const s = strength(p.card, v.manilha, p.hidden);
    if (teamOf(p.seat) === team) mate = Math.max(mate, s);
    else opp = Math.max(opp, s);
  }

  const cards = v.myHand.map((c, i) => ({ i, s: strength(c, v.manilha) })).sort((a, b) => a.s - b.s);
  const lowest = cards[0];
  const highest = cards[cards.length - 1];
  const weWonBefore = v.rounds.slice(0, -1).some((r) => r.winner === team);

  if (round.plays.length === 0) {
    if (roundIdx === 0 && cards.length === 3 && highest.s >= 10 && cards[1].s >= 6) return play(cards[1].i);
    return play(highest.i);
  }

  const last = round.plays.length === v.players.length - 1;
  if (mate > opp && (last || mate >= 8)) return play(lowest.i, v.canHide && lowest.s < 7);

  const target = Math.max(opp, mate > opp ? mate : -2);
  const winner = cards.find((c) => c.s > target);
  if (winner) return play(winner.i);

  const tie = cards.find((c) => c.s === opp);
  if (tie && (roundIdx === 0 || weWonBefore)) return play(tie.i);

  return play(lowest.i, v.canHide);
}

export function decide(v: PlayerView, rng: Rng = Math.random): Action | null {
  const seat = v.seat;
  const team = teamOf(seat);
  const noise = () => (rng() - 0.5) * 0.5;

  if (v.mustDecideMao11) {
    const both = [...v.myHand, ...(v.partnerHand ?? [])];
    const combined = both.reduce((s, c) => s + cardPower(c, v.manilha), 0);
    // sem parceiro (1×1) só as 3 cartas da mão: a régua cai pela metade
    const need = (1.8 + (v.scores[other(team)] >= 9 ? 0.4 : 0)) * (both.length / 6);
    return { type: "mao11", seat, play: combined + noise() >= need };
  }

  if (v.mustRespond && v.bet) {
    const p = handPower(v) + noise();
    const t = BET_THRESHOLD[v.bet.value] ?? 2;
    const desperate = v.scores[other(team)] + v.value >= WIN_SCORE;
    const next = nextBetValue(v.bet.value);
    if (v.canRaise && next && p >= (BET_THRESHOLD[next] ?? 3)) return { type: "raise", seat };
    if (p >= t - 0.5 || desperate) return { type: "accept", seat };
    return { type: "run", seat };
  }

  if (v.canPlay) {
    if (v.canTruco && v.nextBet) {
      const p = handPower(v) + noise();
      const bluff = rng() < 0.06;
      if (p >= (BET_THRESHOLD[v.nextBet] ?? 3) || bluff) return { type: "truco", seat };
    }
    return choosePlay(v, rng);
  }

  return null;
}
