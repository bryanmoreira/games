import { describe, expect, test } from "bun:test";
import {
  applyAction,
  canPlace,
  decide,
  EIGHT,
  FOOT_X,
  groupOf,
  HEAD_X,
  newGame,
  R,
  rack,
  validPlayers,
  viewFor,
  type Action,
  type BallPos,
  type GameState,
  type Level,
} from "../src";

/** rng determinístico (mulberry32) */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Partida já na fase de jogo, com as bolas dadas. */
function playing(balls: BallPos[], groups: GameState["groups"] = [null, null], seats = [0, 1]): GameState {
  const s = newGame(seeded(1), seats, { level: "medium", clock: false });
  return { ...s, phase: "play", balls, groups, turn: seats[0], inHand: null };
}

/** Tacada reta da branca no centro da bola `n` (ou na direção dada). */
function shoot(s: GameState, to: { x: number; y: number }, power: number, extra: Partial<Extract<Action, { type: "shot" }>> = {}) {
  const cue = s.balls.find((b) => b.n === 0)!;
  const from = extra.place ?? cue;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const l = Math.hypot(dx, dy);
  const r = applyAction(s, { type: "shot", seat: s.turn, shot: { dx: dx / l, dy: dy / l, power, spinX: 0, spinY: 0 }, at: 0, ...extra });
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

const ball = (n: number, x: number, y: number): BallPos => ({ n, x, y });

describe("triângulo e lugares", () => {
  test("15 bolas, 8 no meio, uma lisa e uma listrada nos cantos de trás, sem encostar", () => {
    for (let k = 0; k < 20; k++) {
      const r = rack(seeded(k));
      expect(r.map((b) => b.n).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      expect(r[4].n).toBe(EIGHT);
      expect(r[0].x).toBeCloseTo(FOOT_X, 4);
      expect(groupOf(r[10].n)).not.toBe(groupOf(r[14].n));
      for (let i = 0; i < 15; i++) for (let j = i + 1; j < 15; j++) expect(Math.hypot(r[i].x - r[j].x, r[i].y - r[j].y)).toBeGreaterThan(2 * R);
    }
  });

  test("1×1 com times diferentes ou 2×2", () => {
    expect(validPlayers([0, 1])).toBe(true);
    expect(validPlayers([0, 3])).toBe(true);
    expect(validPlayers([0, 2])).toBe(false);
    expect(validPlayers([0, 1, 2])).toBe(false);
    expect(validPlayers([0, 1, 2, 3])).toBe(true);
  });

  test("quebra com a branca só na cozinha", () => {
    const s = newGame(seeded(3), [0, 1]);
    expect(s.inHand).toBe("kitchen");
    expect(canPlace(s, HEAD_X - 0.1, 0.2)).toBe(true);
    expect(canPlace(s, HEAD_X + 0.1, 0.2)).toBe(false);
    const bad = applyAction(s, { type: "shot", seat: s.turn, shot: { dx: 1, dy: 0, power: 1, spinX: 0, spinY: 0 }, place: { x: 0, y: 0 }, at: 0 });
    expect(bad.ok).toBe(false);
  });

  test("na revanche quebra o outro", () => {
    const s = newGame(seeded(3), [0, 1]);
    const t = newGame(seeded(4), [0, 1], undefined, s);
    expect(t.breaker).not.toBe(s.breaker);
  });
});

describe("tacadas", () => {
  test("encaçapou na mesa aberta: fica com o grupo e continua", () => {
    const s = playing([ball(0, 0, -0.2), ball(3, 0, 0.3), ball(12, 0.5, -0.3), ball(8, -0.5, 0)]);
    const t = shoot(s, { x: 0, y: 0.3 }, 0.35);
    expect(t.last!.pocketed.map((p) => p.n)).toEqual([3]);
    expect(t.last!.foul).toBeNull();
    expect(t.groups).toEqual(["solids", "stripes"]);
    expect(t.turn).toBe(0);
    expect(t.stats[0].potted).toBe(1);
  });

  test("encaçapou só bola do adversário: passa a vez sem falta", () => {
    const s = playing([ball(0, 0, -0.2), ball(12, 0, 0.3), ball(3, 0.5, -0.3), ball(8, -0.5, 0)], ["solids", "stripes"]);
    const t = shoot(s, { x: 0, y: 0.3 }, 0.35);
    expect(t.last!.foul).toBe("wrongBall");
    expect(t.turn).toBe(1);
    expect(t.inHand).toBe("table");
  });

  test("branca na caçapa é falta e dá bola na mão", () => {
    const s = playing([ball(0, 0, 0.2), ball(3, 0.5, -0.3), ball(8, -0.5, 0)]);
    const t = shoot(s, { x: 0, y: 1 }, 0.4);
    expect(t.last!.foul).toBe("scratch");
    expect(t.turn).toBe(1);
    expect(t.inHand).toBe("table");
    expect(t.balls.some((b) => b.n === 0)).toBe(true);
  });

  test("encostar sem nada bater na tabela é falta", () => {
    const s = playing([ball(0, 0, 0), ball(3, 0.1, 0), ball(8, -0.5, 0)], ["solids", "stripes"]);
    const t = shoot(s, { x: 0.1, y: 0 }, 0.04);
    expect(t.last!.pocketed).toEqual([]);
    expect(t.last!.foul).toBe("noRail");
    expect(t.inHand).toBe("table");
  });

  test("mesa aberta: bater primeiro na 8 é falta", () => {
    const s = playing([ball(0, 0, -0.2), ball(8, 0, 0.1), ball(3, 0.5, -0.3)]);
    expect(shoot(s, { x: 0, y: 0.1 }, 0.3).last!.foul).toBe("wrongBall");
  });

  test("bola na mão na cozinha: a primeira bola tem que estar fora dela", () => {
    const s = { ...playing([ball(0, -0.8, 0), ball(3, -0.7, 0.2), ball(5, 0.3, 0), ball(8, 0.5, 0.3)], ["solids", "stripes"]), inHand: "kitchen" as const };
    expect(shoot(s, { x: -0.7, y: 0.2 }, 0.3).last!.foul).toBe("kitchen");
    expect(shoot(s, { x: 0.3, y: 0 }, 0.3).last!.foul).toBeNull();
  });
});

describe("a 8", () => {
  const eightPos = [ball(0, 0, -0.2), ball(8, 0, 0.3), ball(12, 0.5, -0.3)];

  test("8 antes da hora perde", () => {
    const s = playing([...eightPos, ball(3, -0.5, 0.2)], ["solids", "stripes"]);
    const t = shoot(s, { x: 0, y: 0.3 }, 0.35);
    expect(t.phase).toBe("over");
    expect(t.winner).toBe(1);
    expect(t.end).toBe("early");
  });

  test("tem que cantar a caçapa", () => {
    const s = playing(eightPos, ["solids", "stripes"]);
    expect(viewFor(s, 0).onEight).toBe(true);
    expect(applyAction(s, { type: "shot", seat: 0, shot: { dx: 0, dy: 1, power: 0.35, spinX: 0, spinY: 0 }, at: 0 }).ok).toBe(false);
  });

  test("8 na caçapa cantada ganha", () => {
    const s = playing(eightPos, ["solids", "stripes"]);
    const t = shoot(s, { x: 0, y: 0.3 }, 0.35, { call: 4 });
    expect(t.winner).toBe(0);
    expect(t.end).toBe("eight");
  });

  test("8 em outra caçapa perde", () => {
    const s = playing(eightPos, ["solids", "stripes"]);
    const t = shoot(s, { x: 0, y: 0.3 }, 0.35, { call: 0 });
    expect(t.winner).toBe(1);
    expect(t.end).toBe("wrongPocket");
  });

  test("8 junto com a branca perde", () => {
    // branca segue a 8 para a mesma caçapa
    const s = playing([ball(0, 0, 0.1), ball(8, 0, 0.3), ball(12, 0.5, -0.3)], ["solids", "stripes"]);
    const r = applyAction(s, { type: "shot", seat: 0, shot: { dx: 0, dy: 1, power: 0.6, spinX: 0, spinY: 1 }, call: 4, at: 0 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.last!.pocketed.map((p) => p.n).sort()).toEqual([0, 8]);
    expect(r.state.winner).toBe(1);
    expect(r.state.end).toBe("scratchEight");
  });
});

describe("vez e relógio", () => {
  test("2×2 gira pelos lugares e alterna os times", () => {
    let s = playing([ball(0, 0, 0), ball(3, 0.1, 0), ball(12, 0.5, -0.3), ball(8, -0.5, 0)], ["solids", "stripes"], [0, 1, 2, 3]);
    const order: number[] = [s.turn];
    for (let k = 0; k < 4; k++) {
      s = shoot({ ...s, inHand: null }, { x: 0.9, y: 0.45 }, 0.05);
      order.push(s.turn);
    }
    expect(order).toEqual([0, 1, 2, 3, 0]);
  });

  test("estourar o tempo é falta", () => {
    const s = newGame(seeded(2), [0, 1], { level: "medium", clock: true }, null, 1000);
    expect(applyAction(s, { type: "timeout", at: 2000 }).ok).toBe(false);
    const r = applyAction(s, { type: "timeout", at: 1000 + 45_000 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.turn).not.toBe(s.turn);
      expect(r.state.stats[s.turn].fouls).toBe(1);
    }
  });
});

describe("partidas só com IAs", () => {
  test("terminam sem tacada recusada, com vencedor", () => {
    const rng = seeded(42);
    const levels: Level[] = ["easy", "medium", "hard"];
    for (let g = 0; g < 9; g++) {
      const seats = g % 3 === 2 ? [0, 1, 2, 3] : [0, 1];
      let s = newGame(rng, seats, { level: levels[g % 3], clock: false });
      let shots = 0;
      while (s.phase !== "over" && shots < 250) {
        const a = decide(viewFor(s, s.turn), rng);
        expect(a).not.toBeNull();
        const r = applyAction(s, a!);
        if (!r.ok) throw new Error(`${r.error}: ${JSON.stringify(a)}`);
        s = r.state;
        shots++;
        // nada fora da mesa (uma bola pode parar pendurada na boca da caçapa, um pouco além da tabela)
        for (const b of s.balls) expect(Math.abs(b.x) < 1.12 + 0.05 && Math.abs(b.y) < 0.56 + 0.05).toBe(true);
      }
      expect(s.phase).toBe("over");
      expect(s.winner === 0 || s.winner === 1).toBe(true);
    }
  }, 120_000);
});
