import { describe, expect, test } from "bun:test";
import * as truco from "@mesa/truco";
import * as c4 from "@mesa/connect4";
import * as stop from "@mesa/stop";
import * as bn from "@mesa/batalha-naval";
import * as cn from "@mesa/codenames";
import * as otrio from "@mesa/otrio";
import * as velha from "@mesa/jogo-da-velha";
import * as damas from "@mesa/damas";
import * as ludo from "@mesa/ludo";
import * as domino from "@mesa/domino";
import * as buraco from "@mesa/buraco";
import * as bj from "@mesa/blackjack";
import * as xadrez from "@mesa/xadrez";
import * as futebol from "@mesa/futebol-de-botao";
import * as tijolada from "@mesa/tijolada";
import { GAMES } from "../src/games";

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

function ok<S>(r: { ok: true; state: S } | { ok: false; error: string }): S {
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

describe("truco", () => {
  const { outcome } = GAMES["truco-paulista"];

  /** Partida inteira entre IAs. */
  function finished(seed: number): truco.GameState {
    const rng = seeded(seed);
    let s = truco.newGame(rng, 0);
    for (let steps = 0; s.phase !== "gameOver"; steps++) {
      if (steps > 5000) throw new Error("partida travada");
      if (s.phase === "roundEnd" || s.phase === "handEnd") {
        s = ok(truco.applyAction(s, { type: "advance" }, rng));
        continue;
      }
      const a = ([0, 1, 2, 3] as truco.Seat[]).map((p) => truco.decide(truco.viewFor(s, p))).find(Boolean);
      if (!a) throw new Error("ninguém pode agir");
      s = ok(truco.applyAction(s, a, rng));
    }
    return s;
  }

  test("time vencedor ganha, o outro perde; placar visto do próprio time", () => {
    for (const seed of [1, 2, 3]) {
      const s = finished(seed);
      const w = s.winner!;
      for (const seat of [0, 1, 2, 3] as truco.Seat[]) {
        const team = truco.teamOf(seat);
        expect(outcome(s, seat)).toEqual({
          outcome: team === w ? "win" : "loss",
          data: { scores: [s.scores[team], s.scores[1 - team]], hands: s.handNo, players: 4 },
        });
      }
      expect(outcome(s, w).data.scores).toEqual([12, expect.any(Number)]);
    }
  });

  test("parceiros têm o mesmo resultado", () => {
    const s = finished(4);
    expect(outcome(s, 0)).toEqual(outcome(s, 2));
    expect(outcome(s, 1)).toEqual(outcome(s, 3));
    expect(outcome(s, 0).outcome).not.toBe(outcome(s, 1).outcome);
  });

  test("começa com 4 ou com 2 em times diferentes (1×1), sem IA", () => {
    const { canStart, newGame, actors } = GAMES["truco-paulista"];
    expect(canStart!([0, 1, 2, 3])).toBe(true);
    expect(canStart!([0, 3])).toBe(true);
    expect(canStart!([0, 2])).toBe(false);
    expect(canStart!([0, 1, 2])).toBe(false);
    const s = newGame(null, { seats: [1, 2], settings: null }) as truco.GameState;
    expect(s.players).toEqual([1, 2]);
    expect(actors(s).every((p: number) => p === 1 || p === 2)).toBe(true);
  });
});

describe("connect4", () => {
  const { outcome } = GAMES.connect4;

  function play(cols: number[]): c4.GameState {
    let s: c4.GameState = { ...c4.newGame(), turn: 0, starter: 0 };
    for (const col of cols) s = ok(c4.applyAction(s, { type: "drop", seat: s.turn, col }));
    return s;
  }

  test("vitória e derrota com peças de cada um", () => {
    const s = play([0, 0, 1, 1, 2, 2, 3]);
    expect(outcome(s, 0)).toEqual({ outcome: "win", data: { pieces: 4, moves: 7 } });
    expect(outcome(s, 1)).toEqual({ outcome: "loss", data: { pieces: 3, moves: 7 } });
  });

  test("tabuleiro cheio é empate para os dois", () => {
    const s = play([..."355044234114302533122645021043016026565661"].map(Number));
    expect(s.winner).toBeNull();
    expect(outcome(s, 0)).toEqual({ outcome: "draw", data: { pieces: 21, moves: 42 } });
    expect(outcome(s, 1)).toEqual({ outcome: "draw", data: { pieces: 21, moves: 42 } });
  });
});

describe("otrio", () => {
  const { outcome, actors } = GAMES.otrio;

  /** Cada lance é [casa, tamanho] de quem estiver na vez; o primeiro lugar começa. */
  function play(players: number[], moves: [number, otrio.Size][]): otrio.GameState {
    let s = otrio.newGame(() => 0, players);
    for (const [cell, size] of moves) s = ok(otrio.applyAction(s, { type: "place", seat: s.owner[s.order[s.turn]]!, cell, size }));
    return s;
  }

  test("vitória guarda a forma; os outros perdem", () => {
    const s = play([0, 1, 2], [[4, 0], [0, 0], [8, 0], [4, 1], [0, 2], [8, 2], [4, 2]]);
    expect(outcome(s, 0)).toEqual({ outcome: "win", data: { pieces: 3, how: "stack", colorPieces: 3, players: 3, moves: 7 } });
    expect(outcome(s, 1)).toEqual({ outcome: "loss", data: { pieces: 2, players: 3, moves: 7 } });
    expect(outcome(s, 2)).toEqual({ outcome: "loss", data: { pieces: 2, players: 3, moves: 7 } });
  });

  test("com 2 jogadores, as peças das duas cores contam", () => {
    const s = play([0, 1], [[0, 2], [8, 0], [3, 0], [6, 1], [1, 2], [8, 1], [4, 0], [7, 1], [6, 2], [2, 1], [5, 0]]);
    expect(outcome(s, 0)).toEqual({ outcome: "win", data: { pieces: 6, how: "line", colorPieces: 3, players: 2, moves: 11 } });
    expect(outcome(s, 1).outcome).toBe("loss");
  });

  test("empate para todos; a vez é do dono da cor", () => {
    const s = play([1, 3], [[4, 0]]);
    expect(actors(s)).toEqual([3]);
    const draw = { ...s, phase: "gameOver" as const };
    expect(outcome(draw, 1)).toEqual({ outcome: "draw", data: { pieces: 1, players: 2, moves: 1 } });
  });
});

describe("ludo", () => {
  const { outcome, actors, pause, animMs } = GAMES.ludo;
  const die = (n: number) => () => (n - 1) / 6 + 0.01;
  const seat = (s: ludo.GameState) => s.order[s.turn];
  const roll = (s: ludo.GameState, n: number) => ok(ludo.applyAction(s, { type: "roll", seat: seat(s) }, die(n)));
  const move = (s: ludo.GameState, piece: number) => ok(ludo.applyAction(s, { type: "move", seat: seat(s), piece }));

  test("vencedor em 1º; os outros perdem com a colocação, capturas e virada", () => {
    // vermelho perto de fechar, depois de estar com 0 enquanto o verde tinha 3
    let s = ludo.newGame(() => 0, [0, 1, 2]);
    s.pieces[0] = [ludo.HOME, ludo.HOME, ludo.HOME, 27];
    s.pieces[1] = [ludo.HOME, 30, ludo.BASE, ludo.BASE];
    s.pieces[2] = [ludo.HOME, ludo.HOME, 4, ludo.BASE];
    s.stats[0].trailed = true;
    s = roll(s, 3);
    s = move(s, 3); // captura o amarelo (casa 30)
    expect(s.pieces[2][2]).toBe(ludo.BASE);
    s.pieces[0][3] = 50;
    s = roll(s, 6);
    s = move(s, 3);
    expect(s.phase).toBe("gameOver");
    expect(outcome(s, 0)).toEqual({
      outcome: "win",
      placement: 1,
      data: { players: 3, home: 4, captures: 1, lost: 0, turns: 1, comeback: true },
    });
    expect(outcome(s, 2)).toEqual({
      outcome: "loss",
      placement: 2,
      data: { players: 3, home: 2, captures: 0, lost: 1, turns: 0, comeback: false },
    });
    expect(outcome(s, 1)).toMatchObject({ outcome: "loss", placement: 3, data: { home: 1 } });
  });

  test("vez, pausa sem lance e tempo das animações", () => {
    let s = ludo.newGame(() => 0, [0, 1]);
    expect(actors(s)).toEqual([0]);
    const rolled = roll(s, 3);
    expect(actors(rolled)).toEqual([]);
    expect(pause(rolled)).toBeGreaterThan(0);
    expect(animMs(s, rolled)).toBeGreaterThan(0);
    s = roll(s, 6);
    const moved = move(s, 0);
    expect(animMs(s, moved)).toBeGreaterThan(0);
  });
});

describe("domino", () => {
  const { outcome, animMs, canStart, withSeat } = GAMES.domino;

  test("mesa de 4 ou 1×1 em lados opostos", () => {
    expect(canStart!([0, 1, 2, 3])).toBe(true);
    expect(canStart!([1, 2])).toBe(true);
    expect(canStart!([0, 2])).toBe(false);
  });

  test("ação do cliente com o assento de quem mandou", () => {
    expect(withSeat({ type: "play", tile: [3, 5], side: "left" }, 2)).toEqual({ type: "play", seat: 2, tile: [3, 5], side: "left" });
    expect(withSeat({ type: "draw" }, 1)).toEqual({ type: "draw", seat: 1 });
  });

  test("vitória da dupla para os dois, com placar, batidas de quem jogou e a maior desvantagem", () => {
    const s = domino.newGame(seeded(2), [0, 1, 2, 3]);
    s.hands = [[[1, 2]], [[3, 3]], [[4, 4]], [[5, 5]]];
    s.opening = null;
    s.turn = 0;
    s.scores = [4, 5];
    s.maxDeficit = [4, 0];
    s.board = { first: { tile: [1, 6], inner: 2, outer: 1, seat: 1, n: 0 }, left: [], right: [] };
    // 1-2 nas pontas 2 | 1: lá-e-lô, 3 pontos
    let e = ok(domino.applyAction(s, { type: "play", seat: 0, tile: [1, 2], side: "left" }));
    e = ok(domino.applyAction(e, { type: "advance" }));
    expect(e.phase).toBe("gameOver");
    expect(outcome(e, 0)).toEqual({
      outcome: "win",
      data: { mode: "duplas", scores: [7, 5], hands: 1, wins: { simples: 0, carroca: 0, laelo: 1, cruzada: 0 }, closed: 0, deficit: 4 },
    });
    expect(outcome(e, 2).outcome).toBe("win");
    expect(outcome(e, 1)).toMatchObject({ outcome: "loss", data: { scores: [5, 7], mode: "duplas" } });
  });

  test("1×1 vai no modo; distribuição e peça jogada esperam a animação", () => {
    const s = domino.newGame(seeded(3), [0, 1]);
    expect(animMs(null, s)).toBeGreaterThan(1000);
    const a = domino.decide(domino.viewFor(s, s.turn))!;
    const n = ok(domino.applyAction(s, a));
    expect(animMs(s, n)).toBeGreaterThan(0);
    expect(outcome(n, 0).data.mode).toBe("1x1");
  });
});

describe("buraco", () => {
  const { outcome, animMs, canStart, withSeat, actors, pause, over } = GAMES.buraco;
  const card = (rank: buraco.Rank, suit: buraco.Suit, deck = 0): buraco.Card => ({ id: `${rank}${suit[0]}${deck}`, rank, suit });

  test("mesa de 4 ou 1×1 em lados opostos", () => {
    expect(canStart!([0, 1, 2, 3])).toBe(true);
    expect(canStart!([1, 2])).toBe(true);
    expect(canStart!([0, 2])).toBe(false);
  });

  test("ação do cliente com o assento de quem mandou, sem confiar no resto", () => {
    expect(withSeat({ type: "draw" }, 2)).toEqual({ type: "draw", seat: 2 });
    expect(withSeat({ type: "discard", card: "7h0" }, 1)).toEqual({ type: "discard", seat: 1, card: "7h0" });
    expect(withSeat({ type: "meld", cards: ["5h0", "6h0", 7, "7h0"], wildAt: 8 }, 3)).toEqual({ type: "meld", seat: 3, cards: ["5h0", "6h0", "7h0"], wildAt: 8 });
    expect(withSeat({ type: "add", meld: "m1", cards: ["8h0"], seat: 0 }, 1)).toEqual({ type: "add", seat: 1, meld: "m1", cards: ["8h0"] });
    expect(withSeat({ type: "take", cards: ["6s0", "7s0"], meld: null }, 0)).toEqual({ type: "take", seat: 0, cards: ["6s0", "7s0"], meld: null });
    expect(withSeat({ type: "take", cards: [], meld: "m2" }, 0)).toEqual({ type: "take", seat: 0, cards: [], meld: "m2" });
    // lixo vira descarte inválido (a engine recusa)
    expect(withSeat({ type: "qualquer" }, 0)).toEqual({ type: "discard", seat: 0, card: "" });
  });

  test("vitória da dupla para os dois, com canastras, batidas de quem bateu e a maior desvantagem", () => {
    const s = buraco.newGame(seeded(2), [0, 1, 2, 3]);
    const run = buraco.arrangements([], null, ["3", "4", "5", "6", "7", "8", "9"].map((r) => card(r as buraco.Rank, "hearts")))[0];
    s.melds = [{ id: "m1", team: 0, suit: run.suit, cards: run.cards }];
    s.hands = [[card("9", "diamonds")], [card("K", "clubs")], [card("4", "clubs")], [card("5", "clubs")]];
    s.mortoTaken = [true, true];
    s.step = "play";
    s.turn = 0;
    s.scores = [2900, 3100];
    s.maxDeficit = [200, 0];
    expect(actors(s)).toEqual([0]);
    const e = ok(buraco.applyAction(s, { type: "discard", seat: 0, card: "9d0" }));
    expect(pause(e)).toBeGreaterThan(3000);
    expect(over(e)).toBe(false);
    const g = ok(buraco.applyAction(e, { type: "advance" }));
    expect(over(g)).toBe(true);
    // 45 de cartas + 200 da limpa + 100 da batida − 5 que sobraram com o parceiro = 340; adversários ficam com −15 nas mãos
    expect(outcome(g, 0)).toEqual({
      outcome: "win",
      data: { mode: "duplas", scores: [3240, 3085], hands: 1, limpa: 1, suja: 0, real: 0, bestHand: 340, maxPile: 0, batidas: 1, deficit: 200 },
    });
    expect(outcome(g, 2)).toMatchObject({ outcome: "win", data: { batidas: 0, limpa: 1 } });
    expect(outcome(g, 1)).toMatchObject({ outcome: "loss", data: { scores: [3085, 3240], mode: "duplas", limpa: 0 } });
  });

  test("1×1 vai no modo; distribuição e lances esperam a animação", () => {
    const s = buraco.newGame(seeded(3), [0, 1]);
    expect(animMs(null, s)).toBeGreaterThan(1000);
    const a = buraco.decide(buraco.viewFor(s, s.turn))!;
    const n = ok(buraco.applyAction(s, a));
    expect(animMs(s, n)).toBeGreaterThan(0);
    expect(animMs(n, n)).toBe(0);
    expect(outcome(n, 0).data.mode).toBe("1x1");
  });
});

describe("blackjack", () => {
  const { outcome, withSeat, actors, pause, over, applyAction, animMs, clock } = GAMES.blackjack;

  /** Partida inteira entre IAs, sem relógio. */
  function finished(seed: number, players: number[]): bj.GameState {
    const rng = seeded(seed);
    let s = bj.newGame(rng, { players, settings: { rounds: 5, clock: false } });
    for (let guard = 0; !over(s) && guard < 1000; guard++) {
      const who = actors(s);
      const a = who.length ? bj.decide(bj.viewFor(s, who[0]), rng)! : ({ type: "advance" } as bj.Action);
      s = ok(bj.applyAction(s, a, rng));
    }
    return s;
  }

  test("ação do cliente com o assento de quem mandou, sem confiar no resto", () => {
    expect(withSeat({ type: "bet", amount: "50", seat: 3 }, 1)).toEqual({ type: "bet", seat: 1, amount: 50 });
    expect(withSeat({ type: "insurance", take: 1 }, 0)).toEqual({ type: "insurance", seat: 0, take: false });
    expect(withSeat({ type: "split" }, 2)).toEqual({ type: "split", seat: 2 });
    expect(withSeat({ type: "qualquer" }, 2)).toEqual({ type: "stand", seat: 2 });
  });

  test("acima de 1000 vence, abaixo perde, igual empata; colocação pelo saldo", () => {
    const s = finished(11, [0, 1, 2]);
    s.table[0]!.chips = 1500;
    s.table[1]!.chips = 900;
    s.table[2]!.chips = 1000;
    expect(outcome(s, 0)).toMatchObject({ outcome: "win", placement: 1, data: { final: 1500, profit: 500, rounds: 5, players: 3 } });
    expect(outcome(s, 1)).toMatchObject({ outcome: "loss", placement: 3, data: { final: 900, profit: -100 } });
    expect(outcome(s, 2)).toMatchObject({ outcome: "draw", placement: 2 });
    const d = outcome(s, 0).data;
    for (const k of ["peak", "low", "bestRound", "handsPlayed", "handsWon", "blackjacks", "doublesWon", "splits", "splitSweeps", "busts", "played"])
      expect(typeof d[k]).toBe("number");
  });

  test("hora do servidor nas ações e relógio da aposta", () => {
    const s = bj.newGame(seeded(5), { players: [0, 1], settings: { rounds: 5, clock: true } }, null, Date.now());
    expect(clock!(s)).toBeGreaterThan(bj.BET_MS - 1000);
    expect(pause(s)).toBeNull();
    const n = ok(applyAction(s, { type: "bet", seat: 0, amount: 50 }));
    expect(animMs(s, n)).toBeGreaterThan(0);
    expect(actors(n)).toEqual([1]);
    // advance antes da hora é recusado (o servidor confere de novo)
    expect(applyAction(n, { type: "advance" }).ok).toBe(false);
  });

  test("banca e acerto têm pausa", () => {
    const s = finished(3, [0]);
    expect(over(s)).toBe(true);
    let g = bj.newGame(seeded(9), { players: [0], settings: { rounds: 5, clock: false } });
    for (let guard = 0; guard < 200 && g.phase !== "settle"; guard++) {
      if (g.phase === "dealer") expect(pause(g)).toBeGreaterThan(0);
      const who = actors(g);
      const a = who.length ? bj.decide(bj.viewFor(g, who[0]))! : ({ type: "advance" } as bj.Action);
      g = ok(bj.applyAction(g, a));
    }
    expect(pause(g)).toBeGreaterThanOrEqual(3000);
  });
});

describe("futebol-de-botao", () => {
  const { outcome, withSeat, canStart, actors, realtime } = GAMES["futebol-de-botao"];

  /** Bola chutada para o gol de `team` atacar, com o último toque de `seat`. */
  function goal(s: futebol.GameState, team: futebol.Team, seat: number) {
    s.phase = "play";
    s.ball = { x: team === 0 ? 400 : -400, y: 0, vx: team === 0 ? 8 : -8, vy: 0 };
    s.lastTouch = seat;
    while (s.phase === "play" || s.phase === "kickoff") realtime!.step(s);
    while (s.phase === "goal") realtime!.step(s);
  }

  test("vitória e derrota com placar, gols de cada um, tamanho, tempo, virada e gol de ouro", () => {
    const s = futebol.newGame([0, 1, 3]);
    goal(s, 1, 1);
    goal(s, 1, 3);
    goal(s, 0, 0);
    s.timeLeft = 1;
    s.phase = "play";
    realtime!.step(s);
    // 1 × 2 no fim do tempo: azul vence
    expect(s.phase as string).toBe("over");
    expect(outcome(s, 3)).toEqual({
      outcome: "win",
      data: { gf: 2, ga: 1, goals: 1, size: 2, ms: Math.round(s.tick * futebol.TICK_MS), golden: false, deficit: 0 },
    });
    expect(outcome(s, 0)).toEqual({
      outcome: "loss",
      data: { gf: 1, ga: 2, goals: 1, size: 2, ms: Math.round(s.tick * futebol.TICK_MS), golden: false, deficit: 2 },
    });
  });

  test("gol de ouro e gol contra não conta para quem fez", () => {
    const s = futebol.newGame([0, 1]);
    s.timeLeft = 1;
    s.phase = "play";
    realtime!.step(s);
    expect(s.golden).toBe(true);
    goal(s, 1, 0); // contra
    expect(s.phase as string).toBe("over");
    expect(outcome(s, 1)).toMatchObject({ outcome: "win", data: { gf: 1, ga: 0, goals: 0, golden: true, size: 1 } });
    expect(outcome(s, 0)).toMatchObject({ outcome: "loss", data: { goals: 0, golden: true } });
  });

  test("entrada do cliente, mesa válida e quem age", () => {
    expect(withSeat({ dx: 1, dy: -1, kick: true }, 3)).toEqual({ type: "input", seat: 3, dx: 1, dy: -1, kick: true });
    expect(withSeat({ dx: "x", kick: "sim" }, 2)).toMatchObject({ seat: 2, kick: false });
    expect(canStart!([0, 2])).toBe(false);
    expect(canStart!([0, 3])).toBe(true);
    expect(actors(futebol.newGame([0, 1, 2]))).toEqual([0, 1, 2]);
  });
});

describe("jogo-da-velha", () => {
  const { outcome, settings, newGame } = GAMES["jogo-da-velha"];

  /** O lugar 0 começa (X); as casas são jogadas em sequência alternada. */
  function play(cells: number[], mode: velha.Mode = "classic"): velha.GameState {
    let s = { ...velha.newGame(() => 0, { mode, level: "hard" }), turn: 0 as velha.Seat, starter: 0 as velha.Seat };
    for (const cell of cells) s = ok(velha.applyAction(s, { type: "place", seat: s.turn, cell }));
    return s;
  }

  test("vitória com garfo; quem perde não leva o garfo", () => {
    const s = play([0, 4, 8, 2, 6, 3, 7]);
    expect(outcome(s, 0)).toEqual({ outcome: "win", data: { pieces: 4, starter: true, mode: "classic", level: "hard", fork: true } });
    expect(outcome(s, 1)).toEqual({ outcome: "loss", data: { pieces: 3, starter: false, mode: "classic", level: "hard" } });
  });

  test("vitória do O, sem garfo", () => {
    const s = play([0, 4, 1, 2, 8, 6]);
    expect(outcome(s, 1)).toEqual({ outcome: "win", data: { pieces: 3, starter: false, mode: "classic", level: "hard", fork: false } });
  });

  test("velha é empate para os dois", () => {
    const s = play([0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(outcome(s, 0).outcome).toBe("draw");
    expect(outcome(s, 1)).toEqual({ outcome: "draw", data: { pieces: 4, starter: false, mode: "classic", level: "hard" } });
  });

  test("opções da sala chegam à partida", () => {
    const opts = settings!.parse({ mode: "fading", level: "easy" }, settings!.initial);
    expect(newGame(null, { seats: [0, 1], settings: opts }).settings).toEqual({ mode: "fading", level: "easy" });
    expect(settings!.parse({ level: "nope" }, opts)).toEqual(opts);
  });
});

describe("damas", () => {
  const { outcome, settings, newGame, withSeat, animMs } = GAMES.damas;
  const sq = damas.squareAt;

  /** Lugar 0 de brancas com uma pedra que pega duas pretas e acaba a partida. */
  function finished(): damas.GameState {
    const board = Array(64).fill(0) as damas.Cell[];
    board[sq(5, 4)] = 1;
    board[sq(4, 3)] = -1;
    board[sq(2, 3)] = -1;
    const s: damas.GameState = { ...damas.newGame(() => 0, { level: "hard" }), white: 0, turn: 0, board };
    return ok(damas.applyAction(s, { type: "move", seat: 0, from: sq(5, 4), path: [sq(3, 2), sq(1, 4)] }));
  }

  test("vitória e derrota com os números da partida", () => {
    const s = finished();
    expect(outcome(s, 0)).toEqual({
      outcome: "win",
      data: { moves: 1, captured: 2, bestChain: 2, kings: 0, left: 1, lost: 11, behind: 0, white: true, level: "hard", end: "noMoves" },
    });
    expect(outcome(s, 1)).toEqual({
      outcome: "loss",
      data: { moves: 0, captured: 0, bestChain: 0, kings: 0, left: 0, lost: 12, behind: 1, white: false, level: "hard", end: "noMoves" },
    });
  });

  test("empate para os dois", () => {
    const s = { ...finished(), winner: null, end: "repeat" as const };
    expect(outcome(s, 0).outcome).toBe("draw");
    expect(outcome(s, 1).outcome).toBe("draw");
  });

  test("ação do cliente ganha o assento; animação pelo tamanho do caminho", () => {
    expect(withSeat({ from: "40", path: [33, "26"], seat: 1 }, 0)).toEqual({ type: "move", seat: 0, from: 40, path: [33, 26] });
    expect(withSeat(null, 1)).toEqual({ type: "move", seat: 1, from: NaN, path: [] });
    const s = finished();
    const before = { ...s, moves: [] };
    expect(animMs(before, s)).toBeGreaterThan(animMs(before, { ...s, moves: [{ ...s.moves[0], path: [1] }] }));
  });

  test("opções da sala chegam à partida", () => {
    const opts = settings!.parse({ level: "easy" }, settings!.initial);
    expect(newGame(null, { seats: [0, 1], settings: opts }).settings).toEqual({ level: "easy" });
    expect(settings!.parse({ level: "nope" }, opts)).toEqual(opts);
  });
});

describe("xadrez", () => {
  const { outcome, settings, newGame, withSeat, actors, clock, applyAction, viewFor } = GAMES.xadrez;
  const sq = xadrez.squareOf;
  const mv = (s: xadrez.GameState, from: string, to: string) => ok(xadrez.applyAction(s, { type: "move", seat: s.turn, from: sq(from), to: sq(to) }));

  /** Mate do pastor: o lugar 0 joga de brancas e vence em 4 lances. */
  function finished(): xadrez.GameState {
    let s: xadrez.GameState = { ...xadrez.newGame(() => 0, { level: "hard", clock: "none" }), white: 0, turn: 0 };
    for (const [a, b] of [["e2", "e4"], ["e7", "e5"], ["f1", "c4"], ["b8", "c6"], ["d1", "h5"], ["g8", "f6"], ["h5", "f7"]]) s = mv(s, a, b);
    return s;
  }

  test("vitória e derrota com os números da partida", () => {
    const s = finished();
    expect(outcome(s, 0)).toEqual({
      outcome: "win",
      data: { moves: 4, captured: 1, behind: 0, promotions: 0, lostQueen: false, white: true, level: "hard", clock: "none", end: "mate" },
    });
    expect(outcome(s, 1)).toEqual({
      outcome: "loss",
      data: { moves: 3, captured: 0, behind: 1, promotions: 0, lostQueen: false, white: false, level: "hard", clock: "none", end: "mate" },
    });
  });

  test("empate para os dois", () => {
    const s = { ...finished(), winner: null, end: "agreed" as const };
    expect(outcome(s, 0).outcome).toBe("draw");
    expect(outcome(s, 1).outcome).toBe("draw");
  });

  test("ação do cliente ganha o assento", () => {
    expect(withSeat({ type: "move", from: "52", to: 36, seat: 1 }, 0)).toEqual({ type: "move", seat: 0, from: 52, to: 36 });
    expect(withSeat({ type: "move", from: 12, to: 4, promo: 2 }, 1)).toEqual({ type: "move", seat: 1, from: 12, to: 4, promo: 2 });
    expect(withSeat({ type: "resign" }, 1)).toEqual({ type: "resign", seat: 1 });
    expect(withSeat({ type: "answerDraw", accept: "sim" }, 1)).toEqual({ type: "answerDraw", seat: 1, accept: false });
  });

  test("quem recebe a oferta de empate também age", () => {
    let s: xadrez.GameState = { ...xadrez.newGame(() => 0), white: 0, turn: 0 };
    s = mv(mv(s, "e2", "e4"), "e7", "e5");
    expect(actors(s)).toEqual([0]);
    s = ok(xadrez.applyAction(s, { type: "offerDraw", seat: 0 }));
    expect(actors(s)).toEqual([0, 1]);
  });

  test("relógio: tempo da vez e advance que confere o fim do tempo", () => {
    const s = newGame(null, { seats: [0, 1], settings: { level: "easy", clock: "3+2" } });
    expect(clock!(s)).toBeGreaterThan(179_000);
    expect(applyAction(s, { type: "advance" }).ok).toBe(false);
    const late = { ...s, clock: { ...s.clock!, since: Date.now() - 181_000 } };
    expect(clock!(late)).toBe(0);
    expect(viewFor(late, 1).timeLeft[s.turn]).toBe(0);
    const r = applyAction(late, { type: "advance" });
    expect(r.ok && r.state.end).toBe("time");
    expect(clock!(newGame(null, { seats: [0, 1], settings: {} }))).toBeNull();
  });

  test("opções da sala chegam à partida", () => {
    const opts = settings!.parse({ level: "easy", clock: "5+0" }, settings!.initial);
    expect(newGame(null, { seats: [0, 1], settings: opts }).settings).toEqual({ level: "easy", clock: "5+0" });
    expect(settings!.parse({ level: "nope", clock: "1+0" }, opts)).toEqual(opts);
  });
});

describe("stop", () => {
  const adapter = GAMES.stop;
  const SETTINGS: stop.Settings = { categories: ["nome", "animal", "fruta"], custom: [], rounds: 3, time: 60 };

  /** Primeira rodada com a letra B e as respostas dadas; `stopper` aperta STOP; as outras rodadas ficam em branco. */
  function finished(players: number[], answers: Record<number, string[]>, stopper: number): stop.GameState {
    const rng = seeded(1);
    let s = stop.newGame(rng, { players, settings: SETTINGS });
    s.letters = ["B"];
    s = ok(stop.applyAction(s, { type: "advance" }, rng));
    for (const [seat, list] of Object.entries(answers))
      list.forEach((text, cat) => (s = ok(stop.applyAction(s, { type: "write", seat: Number(seat), cat, text }, rng))));
    s = ok(stop.applyAction(s, { type: "stop", seat: stopper }, rng));
    while (s.phase !== "gameOver") s = ok(stop.applyAction(s, { type: "advance" }, rng));
    return s;
  }

  test("primeiro lugar sozinho vence; os outros perdem com a colocação", () => {
    const s = finished(
      [0, 1, 2],
      { 0: ["Bruno", "Baleia", "Banana"], 1: ["Bia", "Baleia", "Banana"], 2: ["Beto", "Burro", "Bacuri"] },
      0,
    );
    expect(s.scores).toEqual({ 0: 20, 1: 20, 2: 30 });
    expect(adapter.outcome(s, 2)).toEqual({
      outcome: "win",
      placement: 1,
      data: { score: 30, players: 3, unique: 3, stops: 0, perfectRounds: 1 },
    });
    expect(adapter.outcome(s, 0)).toEqual({
      outcome: "loss",
      placement: 2,
      data: { score: 20, players: 3, unique: 1, stops: 1, perfectRounds: 0 },
    });
    expect(adapter.outcome(s, 1)).toMatchObject({ outcome: "loss", placement: 2 });
  });

  test("dois empatados no topo: empate para os dois, ambos em 1º", () => {
    const s = finished([0, 1, 2], { 0: ["Bruno", "Baleia", "Banana"], 1: ["Bia", "Baleia", "Banana"], 2: ["Beto", "", ""] }, 1);
    expect(s.scores).toEqual({ 0: 20, 1: 20, 2: 10 });
    expect(adapter.outcome(s, 0)).toMatchObject({ outcome: "draw", placement: 1 });
    expect(adapter.outcome(s, 1)).toMatchObject({ outcome: "draw", placement: 1, data: { stops: 1 } });
    expect(adapter.outcome(s, 2)).toMatchObject({ outcome: "loss", placement: 3, data: { score: 10, unique: 1 } });
  });

  test("lugares fora de ordem e espaçados", () => {
    const s = finished([1, 4, 7], { 1: ["Bia", "", ""], 4: ["Bruno", "Burro", ""], 7: ["Beto", "Baleia", "Banana"] }, 7);
    expect(adapter.outcome(s, 7)).toMatchObject({ outcome: "win", placement: 1, data: { score: 30, perfectRounds: 1 } });
    expect(adapter.outcome(s, 4)).toMatchObject({ outcome: "loss", placement: 2, data: { score: 20 } });
    expect(adapter.outcome(s, 1)).toMatchObject({ outcome: "loss", placement: 3, data: { score: 10 } });
  });

  test("mínimo de 2 lugares, sem IA", () => {
    expect(adapter.minSeats).toBe(2);
    expect(adapter.seats).toBe(8);
    expect(adapter.bots).toBe(false);
  });
});

describe("batalha naval", () => {
  const { outcome } = GAMES["batalha-naval"];
  const FLEET: bn.Ship[] = bn.FLEET.map((_, i) => ({ col: 0, row: i, dir: "h" }));

  test("quem afunda a frota vence; tiros, acertos e navios perdidos de cada lado", () => {
    let s: bn.GameState = { ...bn.newGame(), starter: 0 };
    s = ok(bn.applyAction(s, { type: "place", seat: 0, ships: FLEET }));
    s = ok(bn.applyAction(s, { type: "place", seat: 1, ships: FLEET }));
    const shoot = (seat: bn.Seat, col: number, row: number) => (s = ok(bn.applyAction(s, { type: "shoot", seat, col, row })));
    shoot(0, 9, 9); // água
    shoot(1, 0, 0); // acerta e atira de novo
    shoot(1, 9, 9); // água
    bn.FLEET.forEach((ship, row) => {
      for (let col = 0; col < ship.size; col++) shoot(0, col, row);
    });
    expect(s.phase).toBe("gameOver");
    expect(outcome(s, 0)).toEqual({ outcome: "win", data: { shots: 18, hits: 17, shipsLost: 0 } });
    expect(outcome(s, 1)).toEqual({ outcome: "loss", data: { shots: 2, hits: 1, shipsLost: 5 } });
  });
});

describe("codenames", () => {
  const adapter = GAMES.codenames;
  // vermelho: mestre 0, agentes 1 e 2 · azul: mestre 6, agente 7
  const PLAYERS = [0, 1, 2, 6, 7];

  /** Partida com o vermelho começando. */
  function game(): cn.GameState {
    const settings = cn.DEFAULT_SETTINGS;
    const s = cn.newGame(seeded(1), { players: PLAYERS, settings });
    return s.starter === 0 ? s : cn.newGame(seeded(1), { players: PLAYERS, settings }, s);
  }

  const find = (s: cn.GameState, key: cn.Key) => s.cards.findIndex((c) => c.key === key && !c.revealed);
  const act = (s: cn.GameState, a: cn.Action) => ok(cn.applyAction(s, a));

  test("todas as palavras reveladas: time vence; papel e melhor dica de cada um", () => {
    let s = act(game(), { type: "clue", seat: 0, word: "dica", number: null });
    while (cn.remaining(s, 0) > 0) s = act(s, { type: "guess", seat: 1, index: find(s, 0) });
    expect(s.phase).toBe("gameOver");
    expect(adapter.outcome(s, 0)).toEqual({ outcome: "win", data: { role: "master", assassin: false, bestClue: 9 } });
    expect(adapter.outcome(s, 1)).toEqual({ outcome: "win", data: { role: "agent", assassin: false, bestClue: 0 } });
    expect(adapter.outcome(s, 6)).toEqual({ outcome: "loss", data: { role: "master", assassin: false, bestClue: 0 } });
    expect(adapter.outcome(s, 7)).toEqual({ outcome: "loss", data: { role: "agent", assassin: false, bestClue: 0 } });
  });

  test("assassino marca só o time que perdeu", () => {
    let s = act(game(), { type: "clue", seat: 0, word: "dica", number: 2 });
    s = act(s, { type: "guess", seat: 1, index: find(s, "assassin") });
    expect(s.winner).toBe(1);
    expect(adapter.outcome(s, 0)).toEqual({ outcome: "loss", data: { role: "master", assassin: true, bestClue: 0 } });
    expect(adapter.outcome(s, 2)).toMatchObject({ outcome: "loss", data: { assassin: true } });
    expect(adapter.outcome(s, 6)).toMatchObject({ outcome: "win", data: { assassin: false } });
  });

  test("melhor dica conta só palavras do próprio time", () => {
    let s = act(game(), { type: "clue", seat: 0, word: "dica", number: 3 });
    s = act(s, { type: "guess", seat: 1, index: find(s, 0) });
    s = act(s, { type: "guess", seat: 2, index: find(s, 0) });
    s = act(s, { type: "guess", seat: 1, index: find(s, "neutral") }); // a vez passa
    s = act(s, { type: "clue", seat: 6, word: "outra", number: 1 });
    s = act(s, { type: "guess", seat: 7, index: find(s, 1) });
    s = act(s, { type: "guess", seat: 7, index: find(s, "assassin") });
    expect(s.winner).toBe(0);
    expect(adapter.outcome(s, 0)).toEqual({ outcome: "win", data: { role: "master", assassin: false, bestClue: 2 } });
    expect(adapter.outcome(s, 6)).toEqual({ outcome: "loss", data: { role: "master", assassin: true, bestClue: 1 } });
  });

  test("começa com 4+ lugares e mestre e agente nos dois times", () => {
    expect(adapter.minSeats).toBe(4);
    expect(adapter.canStart!([0, 1, 6, 7])).toBe(true);
    expect(adapter.canStart!([1, 2, 6, 7])).toBe(false);
    expect(adapter.bots).toBe(false);
  });
});

describe("tijolada", () => {
  const { outcome, withSeat, newGame, realtime, abandon, applyAction, over } = GAMES.tijolada;

  test("quem acaba primeiro perde; tempo, linhas e pontos de cada um", () => {
    const s = newGame(null, { seats: [0, 1], settings: null }) as tijolada.VersusState;
    for (let i = 0; i < tijolada.COUNTDOWN_TICKS; i++) realtime!.step(s);
    // o lugar 0 derruba tudo no meio e enche o campo rápido; o 1 deixa cair devagar
    const g = s.games[0];
    while (!over(s)) {
      realtime!.step(s);
      if (s.tick % 20 === 0) applyAction(s, withSeat({ tick: g.tick, key: "drop" }, 0));
    }
    const lost = outcome(s, 0);
    const won = outcome(s, 1);
    expect(lost.outcome).toBe("loss");
    expect(won.outcome).toBe("win");
    expect(lost.data.ms).toBeGreaterThan(0);
    expect(won.data.ms).toBe(lost.data.ms);
    expect(lost.data.score).toBeGreaterThan(0);
    expect(typeof won.data.lines).toBe("number");
  });

  test("quem sai da sala perde na hora", () => {
    const s = newGame(null, { seats: [0, 1], settings: null }) as tijolada.VersusState;
    for (let i = 0; i < tijolada.COUNTDOWN_TICKS + 120; i++) realtime!.step(s);
    applyAction(s, abandon!(s, 1));
    expect(over(s)).toBe(true);
    expect(outcome(s, 0).outcome).toBe("win");
  });

  test("comando do navegador ganha o lugar de quem mandou", () => {
    expect(withSeat({ tick: 12, key: "cw", seat: 1 }, 0)).toEqual({ type: "input", seat: 0, tick: 12, key: "cw" });
  });
});
