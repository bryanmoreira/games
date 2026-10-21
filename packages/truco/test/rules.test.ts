import { describe, expect, test } from "bun:test";
import {
  applyAction, decide, handWinner, makeCard, manilhaOf, newGame, roundResult, strength, viewFor,
  type Action, type GameState, type Seat,
} from "../src";

function act(s: GameState, a: Action): GameState {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

function stateWithScores(scores: [number, number]): GameState {
  const s = newGame();
  s.scores = scores;
  s.phase = "handEnd";
  return act(s, { type: "advance" });
}

describe("cartas", () => {
  test("manilha é a carta seguinte à vira", () => {
    expect(manilhaOf("3")).toBe("4");
    expect(manilhaOf("7")).toBe("Q");
    expect(manilhaOf("K")).toBe("A");
    expect(manilhaOf("Q")).toBe("J");
  });

  test("ordem das manilhas: ouros < espadas < copas < paus", () => {
    const m = "5" as const;
    const order = (["diamonds", "spades", "hearts", "clubs"] as const).map((s) => strength(makeCard(m, s), m));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(strength(makeCard("5", "diamonds"), m)).toBeGreaterThan(strength(makeCard("3", "clubs"), m));
  });

  test("ordem comum: 4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3", () => {
    const m = "4" as const;
    const seq = (["5", "6", "7", "Q", "J", "K", "A", "2", "3"] as const).map((r) => strength(makeCard(r, "hearts"), m));
    expect(seq).toEqual([...seq].sort((a, b) => a - b));
  });
});

describe("vazas e empates", () => {
  test("handWinner", () => {
    expect(handWinner([0])).toBeNull();
    expect(handWinner([0, 0])).toBe(0);
    expect(handWinner([0, 1])).toBeNull();
    expect(handWinner(["tie", 1])).toBe(1);
    expect(handWinner([1, "tie"])).toBe(1);
    expect(handWinner(["tie", "tie"])).toBeNull();
    expect(handWinner([0, 1, 1])).toBe(1);
    expect(handWinner([0, 1, "tie"])).toBe(0);
    expect(handWinner(["tie", "tie", 0])).toBe(0);
    expect(handWinner(["tie", "tie", "tie"])).toBe("tie");
  });

  test("cartas iguais de times diferentes empatam; do mesmo time não", () => {
    const m = "7" as const;
    const tie = roundResult({
      leader: 0, winner: null, winningSeat: null,
      plays: [
        { seat: 0, card: makeCard("3", "hearts"), hidden: false },
        { seat: 1, card: makeCard("3", "spades"), hidden: false },
        { seat: 2, card: makeCard("4", "hearts"), hidden: false },
        { seat: 3, card: makeCard("5", "hearts"), hidden: false },
      ],
    }, m);
    expect(tie.winner).toBe("tie");
    const win = roundResult({
      leader: 0, winner: null, winningSeat: null,
      plays: [
        { seat: 0, card: makeCard("3", "hearts"), hidden: false },
        { seat: 1, card: makeCard("2", "spades"), hidden: false },
        { seat: 2, card: makeCard("3", "clubs"), hidden: false },
        { seat: 3, card: makeCard("Q", "clubs"), hidden: false },
      ],
    }, m);
    expect(win).toEqual({ winner: 0, seat: 0 });
  });

  test("carta coberta perde", () => {
    const r = roundResult({
      leader: 0, winner: null, winningSeat: null,
      plays: [
        { seat: 0, card: makeCard("3", "hearts"), hidden: true },
        { seat: 1, card: makeCard("4", "spades"), hidden: false },
        { seat: 2, card: makeCard("4", "hearts"), hidden: true },
        { seat: 3, card: makeCard("5", "hearts"), hidden: false },
      ],
    }, "7");
    expect(r.winner).toBe(1);
  });

  test("não pode cobrir na primeira vaza", () => {
    const s = newGame();
    const r = applyAction(s, { type: "play", seat: s.hand.turn, index: 0, hidden: true });
    expect(r.ok).toBe(false);
  });
});

describe("truco", () => {
  test("aceitar, aumentar e correr", () => {
    let s = newGame();
    const p = s.hand.turn;
    const opp = ((p + 1) % 4) as Seat;
    s = act(s, { type: "truco", seat: p });
    expect(s.hand.bet?.value).toBe(3);
    expect(applyAction(s, { type: "play", seat: p, index: 0 }).ok).toBe(false);
    expect(applyAction(s, { type: "accept", seat: ((p + 2) % 4) as Seat }).ok).toBe(false);

    const accepted = act(s, { type: "accept", seat: opp });
    expect(accepted.hand.value).toBe(3);
    expect(accepted.hand.bet).toBeNull();
    expect(applyAction(accepted, { type: "truco", seat: p }).ok).toBe(false);

    const raised = act(s, { type: "raise", seat: opp });
    expect(raised.hand.value).toBe(3);
    expect(raised.hand.bet?.value).toBe(6);
    const ran = act(raised, { type: "run", seat: p });
    expect(ran.phase).toBe("handEnd");
    expect(ran.scores[opp % 2]).toBe(3);

    const ranFirst = act(s, { type: "run", seat: opp });
    expect(ranFirst.scores[p % 2]).toBe(1);
  });
});

describe("mão de 11 e mão de ferro", () => {
  test("mão de 11: decide jogar (vale 3, sem truco) ou correr (+1 adversário)", () => {
    const s = stateWithScores([11, 4]);
    expect(s.phase).toBe("mao11");
    expect(s.hand.mode).toBe("mao11");
    const v = viewFor(s, 0);
    expect(v.partnerHand).toHaveLength(3);
    expect(viewFor(s, 1).partnerHand).toBeNull();
    expect(applyAction(s, { type: "mao11", seat: 1, play: true }).ok).toBe(false);

    const run = act(s, { type: "mao11", seat: 2, play: false });
    expect(run.scores).toEqual([11, 5]);

    const play = act(s, { type: "mao11", seat: 0, play: true });
    expect(play.phase).toBe("playing");
    expect(play.hand.value).toBe(3);
    expect(applyAction(play, { type: "truco", seat: play.hand.turn }).ok).toBe(false);
  });

  test("mão de ferro: cartas escondidas até do dono", () => {
    const s = stateWithScores([11, 11]);
    expect(s.hand.mode).toBe("ferro");
    expect(s.phase).toBe("playing");
    expect(viewFor(s, 0).myHand.every((c) => c === null)).toBe(true);
    expect(s.hand.value).toBe(1);
    expect(applyAction(s, { type: "truco", seat: s.hand.turn }).ok).toBe(false);
  });
});

describe("simulação com IAs", () => {
  test("300 partidas terminam com vencedor em 12", () => {
    for (let g = 0; g < 300; g++) {
      let s = newGame();
      let steps = 0;
      while (s.phase !== "gameOver") {
        if (++steps > 5000) throw new Error("partida travada");
        if (s.phase === "roundEnd" || s.phase === "handEnd") {
          s = act(s, { type: "advance" });
          continue;
        }
        let action: Action | null = null;
        for (const seat of [0, 1, 2, 3] as Seat[]) {
          action = decide(viewFor(s, seat));
          if (action) break;
        }
        if (!action) throw new Error("ninguém pode agir na fase " + s.phase);
        s = act(s, action);
      }
      expect(Math.max(...s.scores)).toBe(12);
      expect(s.scores[s.winner!]).toBe(12);
    }
  });
});
