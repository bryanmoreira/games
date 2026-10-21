import { makeDeck, manilhaOf, shuffle, strength, type Rng } from "./deck";
import type { Action, Card, GameState, HandMode, HandResult, HandState, Round, Seat, ShoutKind, Team } from "./types";

export const WIN_SCORE = 12;
export const BET_STEPS = [1, 3, 6, 9, 12];

export const ALL_SEATS: Seat[] = [0, 1, 2, 3];

export const teamOf = (s: Seat): Team => (s % 2) as Team;
/** Próximo lugar na mesa; com `players`, pula quem não está na partida (1×1). */
export const nextSeat = (s: Seat, players: Seat[] = ALL_SEATS): Seat => players[(players.indexOf(s) + 1) % players.length];
export const partnerOf = (s: Seat): Seat => ((s + 2) % 4) as Seat;
export const other = (t: Team): Team => (1 - t) as Team;

export function nextBetValue(value: number): number | null {
  const i = BET_STEPS.indexOf(value);
  return i >= 0 && i < BET_STEPS.length - 1 ? BET_STEPS[i + 1] : null;
}

/** Lugares que formam uma mesa: 4 (duplas) ou 2 em times diferentes (1×1). */
export function validPlayers(seats: number[]): boolean {
  const ps = [...new Set(seats)];
  if (ps.length === 4) return ps.every((p) => ALL_SEATS.includes(p as Seat));
  return ps.length === 2 && ps.every((p) => ALL_SEATS.includes(p as Seat)) && teamOf(ps[0] as Seat) !== teamOf(ps[1] as Seat);
}

function dealHand(dealer: Seat, scores: [number, number], rng: Rng, players: Seat[]): HandState {
  const deck = shuffle(makeDeck(), rng);
  // quem não está na partida (1×1) fica sem cartas
  const hands: Card[][] = [[], [], [], []];
  players.forEach((p, i) => (hands[p] = deck.slice(i * 3, i * 3 + 3)));
  const vira = deck[players.length * 3];
  const at11 = [scores[0] === WIN_SCORE - 1, scores[1] === WIN_SCORE - 1];
  let mode: HandMode = "normal";
  let mao11Team: Team | null = null;
  if (at11[0] && at11[1]) mode = "ferro";
  else if (at11[0] || at11[1]) {
    mode = "mao11";
    mao11Team = at11[0] ? 0 : 1;
  }
  const first = nextSeat(dealer, players);
  return {
    dealer,
    vira,
    manilha: manilhaOf(vira.rank),
    hands,
    rounds: [{ leader: first, plays: [], winner: null, winningSeat: null }],
    turn: first,
    value: mode === "mao11" ? 3 : 1,
    bet: null,
    lastRaiseTeam: null,
    mode,
    mao11Team,
    result: null,
  };
}

export function newGame(rng: Rng = Math.random, dealer: Seat = 0, players: Seat[] = ALL_SEATS): GameState {
  const ps = [...new Set(players)].sort((a, b) => a - b);
  if (!validPlayers(ps)) throw new Error("Truco precisa de 4 jogadores ou 2 em times diferentes");
  const scores: [number, number] = [0, 0];
  const hand = dealHand(ps.includes(dealer) ? dealer : ps[0], scores, rng, ps);
  return { players: ps, scores, phase: hand.mode === "mao11" ? "mao11" : "playing", winner: null, handNo: 1, hand, shout: null };
}

/** Vencedor da mão a partir dos resultados das vazas. null = indefinido, "tie" = ninguém pontua. */
export function handWinner(w: (Team | "tie")[]): Team | "tie" | null {
  if (w.length < 2) return null;
  const [a, b, c] = w;
  if (w.length === 2) {
    if (a !== "tie" && a === b) return a;
    if (a === "tie" && b !== "tie") return b;
    if (a !== "tie" && b === "tie") return a;
    return null;
  }
  if (c !== "tie") return c;
  if (a !== "tie") return a;
  return "tie";
}

export function roundResult(round: Round, manilha: HandState["manilha"]): { winner: Team | "tie"; seat: Seat } {
  const best: [number, number] = [-2, -2];
  const bestSeat: [Seat, Seat] = [0, 1];
  for (const p of round.plays) {
    const t = teamOf(p.seat);
    const s = strength(p.card, manilha, p.hidden);
    if (s > best[t]) {
      best[t] = s;
      bestSeat[t] = p.seat;
    }
  }
  if (best[0] === best[1]) return { winner: "tie", seat: round.leader };
  const t: Team = best[0] > best[1] ? 0 : 1;
  return { winner: t, seat: bestSeat[t] };
}

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

const fail = (error: string): Result => ({ ok: false, error });

function shout(s: GameState, seat: Seat, kind: ShoutKind, value?: number) {
  s.shout = { id: (s.shout?.id ?? 0) + 1, seat, kind, value };
}

function endHand(s: GameState, winner: Team | null, points: number, reason: HandResult["reason"]) {
  const h = s.hand;
  h.result = { winner, points, reason };
  h.bet = null;
  if (winner !== null) s.scores[winner] = Math.min(WIN_SCORE, s.scores[winner] + points);
  s.phase = "handEnd";
}

export function canTruco(s: GameState, seat: Seat): boolean {
  const h = s.hand;
  return (
    s.phase === "playing" &&
    h.mode === "normal" &&
    h.bet === null &&
    h.turn === seat &&
    h.lastRaiseTeam !== teamOf(seat) &&
    nextBetValue(h.value) !== null
  );
}

export function applyAction(state: GameState, action: Action, rng: Rng = Math.random): Result {
  const s: GameState = structuredClone(state);
  const h = s.hand;

  switch (action.type) {
    case "play": {
      if (s.phase !== "playing") return fail("fase inválida");
      if (h.bet) return fail("aposta pendente");
      if (h.turn !== action.seat) return fail("não é sua vez");
      const cards = h.hands[action.seat];
      const card = cards[action.index];
      if (!card) return fail("carta inválida");
      const round = h.rounds[h.rounds.length - 1];
      const hidden = !!action.hidden;
      if (hidden && h.rounds.length === 1) return fail("não pode cobrir na primeira");
      cards.splice(action.index, 1);
      round.plays.push({ seat: action.seat, card, hidden });
      if (round.plays.length < s.players.length) {
        h.turn = nextSeat(action.seat, s.players);
      } else {
        const r = roundResult(round, h.manilha);
        round.winner = r.winner;
        round.winningSeat = r.winner === "tie" ? null : r.seat;
        s.phase = "roundEnd";
      }
      return { ok: true, state: s };
    }

    case "truco": {
      if (!canTruco(s, action.seat)) return fail("não pode trucar");
      const v = nextBetValue(h.value)!;
      h.bet = { from: action.seat, team: teamOf(action.seat), value: v };
      h.lastRaiseTeam = teamOf(action.seat);
      shout(s, action.seat, "truco", v);
      return { ok: true, state: s };
    }

    case "accept":
    case "raise":
    case "run": {
      if (s.phase !== "playing" || !h.bet) return fail("sem aposta");
      if (teamOf(action.seat) === h.bet.team) return fail("seu time pediu");
      const bet = h.bet;
      if (action.type === "accept") {
        h.value = bet.value;
        h.bet = null;
        shout(s, action.seat, "accept");
      } else if (action.type === "run") {
        shout(s, action.seat, "run");
        endHand(s, bet.team, h.value, "run");
      } else {
        const v = nextBetValue(bet.value);
        if (v === null) return fail("já está em doze");
        h.value = bet.value;
        h.bet = { from: action.seat, team: teamOf(action.seat), value: v };
        h.lastRaiseTeam = teamOf(action.seat);
        shout(s, action.seat, "truco", v);
      }
      return { ok: true, state: s };
    }

    case "mao11": {
      if (s.phase !== "mao11" || teamOf(action.seat) !== h.mao11Team) return fail("não é mão de 11");
      if (action.play) {
        shout(s, action.seat, "mao11play");
        s.phase = "playing";
      } else {
        shout(s, action.seat, "mao11run");
        endHand(s, other(h.mao11Team), 1, "mao11run");
      }
      return { ok: true, state: s };
    }

    case "advance": {
      if (s.phase === "roundEnd") {
        const winners = h.rounds.map((r) => r.winner as Team | "tie");
        const w = handWinner(winners);
        if (w !== null) {
          endHand(s, w === "tie" ? null : w, w === "tie" ? 0 : h.value, w === "tie" ? "tie" : "rounds");
        } else {
          const last = h.rounds[h.rounds.length - 1];
          const leader = last.winningSeat ?? last.leader;
          h.rounds.push({ leader, plays: [], winner: null, winningSeat: null });
          h.turn = leader;
          s.phase = "playing";
        }
        return { ok: true, state: s };
      }
      if (s.phase === "handEnd") {
        const w = s.scores.findIndex((x) => x >= WIN_SCORE);
        if (w >= 0) {
          s.winner = w as Team;
          s.phase = "gameOver";
          return { ok: true, state: s };
        }
        s.hand = dealHand(nextSeat(h.dealer, s.players), s.scores, rng, s.players);
        s.handNo++;
        s.phase = s.hand.mode === "mao11" ? "mao11" : "playing";
        return { ok: true, state: s };
      }
      return fail("nada para avançar");
    }
  }
}
