import { describe, expect, test } from "bun:test";
import {
  applyAction,
  BALL_R,
  CENTER_R,
  decide,
  FREEZE_TICKS,
  GOAL_TICKS,
  HALF_W,
  MATCH_TICKS,
  newGame,
  PLAYER_R,
  step,
  viewFor,
  type GameState,
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

const input = (s: GameState, seat: number, dx: number, dy: number, kick = false) => {
  const r = applyAction(s, { type: "input", seat, dx, dy, kick });
  if (!r.ok) throw new Error(r.error);
  return r.state;
};

const run = (s: GameState, ticks: number) => {
  for (let i = 0; i < ticks; i++) step(s);
  return s;
};

/** Partida já rolando (saída feita), com a bola e os botões onde o teste quer. */
function inPlay(seats = [0, 1]): GameState {
  const s = newGame(seats);
  s.phase = "play";
  s.wait = 0;
  for (const p of s.players) p.y = p.team === 0 ? -150 : 150;
  return s;
}

describe("partida nova", () => {
  test("times pelos lugares e números na camisa", () => {
    const s = newGame([0, 1, 2, 3, 5]);
    expect(s.players.map((p) => [p.seat, p.team, p.number])).toEqual([
      [0, 0, 1],
      [1, 1, 1],
      [2, 0, 2],
      [3, 1, 2],
      [5, 1, 3],
    ]);
    expect(s.players.filter((p) => p.team === 0).every((p) => p.x < 0)).toBe(true);
    expect(s.players.filter((p) => p.team === 1).every((p) => p.x > 0)).toBe(true);
    expect(s.phase).toBe("kickoff");
    expect(s.timeLeft).toBe(MATCH_TICKS);
  });

  test("ação de quem não joga e entrada fora do limite", () => {
    const s = newGame([0, 1]);
    expect(applyAction(s, { type: "input", seat: 4, dx: 1, dy: 0, kick: false }).ok).toBe(false);
    const t = input(s, 0, 5, 5);
    const p = t.players[0];
    expect(Math.hypot(p.dx, p.dy)).toBeCloseTo(1);
    // não muda o estado original
    expect(s.players[0].dx).toBe(0);
  });
});

describe("saída de bola", () => {
  test("ninguém se mexe no prepara e o relógio não anda", () => {
    let s = newGame([0, 1]);
    s = input(s, 0, 1, 0);
    const x = s.players[0].x;
    run(s, FREEZE_TICKS);
    expect(s.players[0].x).toBe(x);
    expect(s.timeLeft).toBe(MATCH_TICKS);
  });

  test("quem não sai fica fora do círculo e cada time no seu campo", () => {
    let s = newGame([0, 1]);
    s = input(s, 1, -1, 0);
    run(s, FREEZE_TICKS + 300);
    const blue = s.players[1];
    expect(Math.hypot(blue.x, blue.y)).toBeGreaterThanOrEqual(CENTER_R + PLAYER_R - 0.01);
    expect(s.phase).toBe("kickoff");
    expect(s.ball.x).toBe(0);
  });

  test("o primeiro toque começa o jogo", () => {
    let s = newGame([0, 1]);
    s = input(s, 0, 1, 0);
    for (let i = 0; i < FREEZE_TICKS + 300 && s.phase === "kickoff"; i++) step(s);
    expect(s.phase).toBe("play");
    expect(s.ball.x).toBeGreaterThan(0);
    expect(s.lastTouch).toBe(0);
  });
});

describe("física", () => {
  test("chute só encostado, e de novo só depois de soltar", () => {
    let s = inPlay();
    const red = s.players[0];
    red.x = -PLAYER_R - BALL_R - 2;
    red.y = 0;
    s.ball = { x: 0, y: 0, vx: 0, vy: 0 };
    s = input(s, 0, 0, 0, true);
    step(s);
    expect(s.kicks).toBe(1);
    expect(s.ball.vx).toBeGreaterThan(4);
    // segurando: não chuta de novo
    s.ball = { x: s.players[0].x + PLAYER_R + BALL_R + 1, y: s.players[0].y, vx: 0, vy: 0 };
    step(s);
    expect(s.kicks).toBe(1);
    s = input(s, 0, 0, 0, false);
    step(s);
    s = input(s, 0, 0, 0, true);
    s.ball = { x: s.players[0].x + PLAYER_R + BALL_R + 1, y: s.players[0].y, vx: 0, vy: 0 };
    step(s);
    expect(s.kicks).toBe(2);
  });

  test("chute longe da bola não pega", () => {
    let s = inPlay();
    s.players[0].x = -100;
    s.players[0].y = 0;
    s.ball = { x: 0, y: 0, vx: 0, vy: 0 };
    s = input(s, 0, 0, 0, true);
    step(s);
    expect(s.kicks).toBe(0);
  });

  test("bola quica na lateral e não sai do campo", () => {
    const s = inPlay();
    s.ball = { x: 0, y: 150, vx: 0, vy: 8 };
    run(s, 30);
    expect(s.ball.y).toBeLessThanOrEqual(200 - BALL_R + 0.01);
    expect(s.ball.vy).toBeLessThan(0);
  });

  test("bola na linha de fundo fora do gol volta", () => {
    const s = inPlay();
    s.ball = { x: 380, y: 140, vx: 10, vy: 0 };
    run(s, 30);
    expect(s.ball.x).toBeLessThan(HALF_W);
    expect(s.phase).toBe("play");
  });

  test("bola na trave conta para o som", () => {
    const s = inPlay();
    s.ball = { x: 380, y: 64, vx: 8, vy: 0 };
    run(s, 15);
    expect(s.posts).toBeGreaterThan(0);
  });

  test("botões se empurram e não atravessam", () => {
    let s = inPlay();
    s.players[0].x = -40;
    s.players[0].y = 0;
    s.players[1].x = 40;
    s.players[1].y = 0;
    s = input(input(s, 0, 1, 0), 1, -1, 0);
    run(s, 120);
    expect(s.players[1].x - s.players[0].x).toBeGreaterThanOrEqual(2 * PLAYER_R - 0.5);
  });
});

describe("gols e fim", () => {
  const shoot = (s: GameState, toRight: boolean) => {
    s.ball = { x: toRight ? 380 : -380, y: 0, vx: toRight ? 8 : -8, vy: 0 };
    s.lastTouch = toRight ? 0 : 1;
    for (let i = 0; i < 40 && s.phase !== "goal"; i++) step(s);
    expect(s.phase).toBe("goal");
    run(s, GOAL_TICKS);
  };

  test("gol, comemoração e saída de quem sofreu", () => {
    const s = inPlay();
    shoot(s, true);
    expect(s.score).toEqual([1, 0]);
    expect(s.goals[0]).toMatchObject({ team: 0, seat: 0, own: false });
    expect(s.phase).toBe("kickoff");
    expect(s.kickoffTeam).toBe(1);
    expect(s.ball.x).toBe(0);
  });

  test("gol contra fica marcado", () => {
    const s = inPlay();
    s.ball = { x: -380, y: 0, vx: -8, vy: 0 };
    s.lastTouch = 0;
    run(s, 40);
    expect(s.score).toEqual([0, 1]);
    expect(s.goals[0]).toMatchObject({ team: 1, seat: 0, own: true });
  });

  test("3 gols acabam a partida", () => {
    const s = inPlay();
    for (let i = 0; i < 3; i++) {
      s.phase = "play";
      shoot(s, false);
    }
    expect(s.phase).toBe("over");
    expect(s.winner).toBe(1);
    expect(s.maxDeficit).toEqual([3, 0]);
  });

  test("fim do tempo com vantagem encerra; empatado vira gol de ouro", () => {
    const a = inPlay();
    a.score = [1, 0];
    a.timeLeft = 1;
    step(a);
    expect(a.phase).toBe("over");
    expect(a.winner).toBe(0);

    const b = inPlay();
    b.timeLeft = 1;
    step(b);
    expect(b.golden).toBe(true);
    expect(b.phase).toBe("play");
    shoot(b, false);
    expect(b.phase).toBe("over");
    expect(b.winner).toBe(1);
  });
});

describe("visão e IA", () => {
  test("visão arredonda posições e diz quem sou", () => {
    const s = inPlay();
    s.ball.x = 1.23456;
    const v = viewFor(s, 1);
    expect(v.me).toBe(1);
    expect(v.ball.x).toBe(1.23);
  });

  test("IA vai na bola e chuta rumo ao gol", () => {
    let s = inPlay([0, 1]);
    s.players[0].x = -100;
    s.players[0].y = 0;
    s.players[1].x = 400;
    s.players[1].y = 180;
    s.ball = { x: 0, y: 0, vx: 0, vy: 0 };
    for (let t = 0; t < 600 && s.kicks === 0; t++) {
      if (t % 3 === 0) {
        const a = decide(viewFor(s, 0), () => 0.5);
        if (a) s = applyAction(s, a).ok ? (applyAction(s, a) as { state: GameState }).state : s;
      }
      step(s);
    }
    expect(s.kicks).toBeGreaterThan(0);
    expect(s.ball.vx).toBeGreaterThan(0);
  });

  test("simulação: partidas só com IAs terminam e o placar bate com os gols", () => {
    const rng = seeded(7);
    let over = 0;
    const totals = { goals: 0, ticks: 0 };
    for (let m = 0; m < 30; m++) {
      const size = 1 + (m % 3);
      const seats = Array.from({ length: size * 2 }, (_, i) => i);
      let s = newGame(seats);
      for (let t = 0; t < MATCH_TICKS * 2 && s.phase !== "over"; t++) {
        if (t % 3 === 0)
          for (const p of s.players) {
            const a = decide(viewFor(s, p.seat), rng);
            if (a) {
              const r = applyAction(s, a);
              if (r.ok) s = r.state;
            }
          }
        step(s);
      }
      expect(s.players.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
      if (s.phase === "over") over++;
      expect(s.goals.length).toBe(s.score[0] + s.score[1]);
      totals.goals += s.goals.length;
      totals.ticks += s.tick;
    }
    // quase todas acabam (o gol de ouro pode demorar); e saem gols
    expect(over).toBeGreaterThanOrEqual(24);
    expect(totals.goals / 30).toBeGreaterThan(1);
  }, 60_000);
});
