import { describe, expect, test } from "bun:test";
import * as truco from "@truco/game";
import * as c4 from "@truco/connect4";
import * as stop from "@truco/stop";
import * as bn from "@truco/batalha-naval";
import * as cn from "@truco/codenames";
import * as otrio from "@truco/otrio";
import * as velha from "@truco/jogo-da-velha";
import * as damas from "@truco/damas";
import * as ludo from "@truco/ludo";
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
          data: { scores: [s.scores[team], s.scores[1 - team]], hands: s.handNo },
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
