import { describe, expect, test } from "bun:test";
import {
  applyAction,
  bestMove,
  capturedBy,
  decide,
  FIFTY_LIMIT,
  fromFen,
  insufficient,
  KNIGHT,
  legalMoves,
  newGame,
  parseSettings,
  perft,
  positionKey,
  QUEEN,
  ROOK,
  squareOf,
  toFen,
  viewFor,
  type Action,
  type GameState,
  type Level,
  type Seat,
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

const sq = squareOf;

/** Estado a partir de um FEN; o lugar 0 joga de brancas. */
function stateOf(fen: string, settings = parseSettings({})): GameState {
  const s = newGame(() => 0, settings);
  const pos = fromFen(fen);
  const turn: Seat = pos.side > 0 ? 0 : 1;
  const st: GameState = { ...s, white: 0, turn, board: pos.board, castle: pos.castle, ep: pos.ep, half: pos.half };
  return { ...st, positions: { [positionKey(pos)]: 1 } };
}

const move = (seat: Seat, from: string, to: string, promo?: number): Action => ({ type: "move", seat, from: sq(from), to: sq(to), ...(promo ? { promo } : {}) });

function play(s: GameState, ...moves: [string, string, number?][]): GameState {
  for (const [from, to, promo] of moves) {
    const r = applyAction(s, move(s.turn, from, to, promo));
    if (!r.ok) throw new Error(`${from}-${to}: ${r.error}`);
    s = r.state;
  }
  return s;
}

const sans = (s: GameState) => s.moves.map((m) => m.san);

describe("geração de lances (perft)", () => {
  const cases: [string, number[]][] = [
    ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", [20, 400, 8902, 197281]],
    ["r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", [48, 2039, 97862]],
    ["8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", [14, 191, 2812, 43238]],
    ["r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", [6, 264, 9467]],
    ["rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", [44, 1486, 62379]],
  ];
  for (const [fen, counts] of cases)
    test(fen, () => {
      counts.forEach((n, i) => expect(perft(fromFen(fen), i + 1)).toBe(n));
    });

  test("FEN vai e volta", () => {
    const fen = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
    expect(toFen(fromFen(fen))).toBe(fen);
  });
});

describe("partida", () => {
  test("começa com as brancas, sorteio na primeira e cores trocadas no De novo", () => {
    const a = newGame(() => 0.9);
    expect(a.white).toBe(1);
    expect(a.turn).toBe(1);
    expect(viewFor(a, 1).legal).toHaveLength(20);
    expect(viewFor(a, 0).legal).toHaveLength(0);
    const b = newGame(() => 0, undefined, { ...a, scores: [2, 1], draws: 1 });
    expect(b.white).toBe(0);
    expect(b.scores).toEqual([2, 1]);
    expect(b.draws).toBe(1);
    expect(b.gameNo).toBe(2);
  });

  test("lance fora da vez ou inválido", () => {
    const s = newGame(() => 0);
    expect(applyAction(s, move(1, "e7", "e5")).ok).toBe(false);
    expect(applyAction(s, move(0, "e2", "e5")).ok).toBe(false);
    expect(applyAction(s, move(0, "e2", "e4", QUEEN)).ok).toBe(false);
  });

  test("mate do pastor com notação em português", () => {
    const s = play(newGame(() => 0), ["e2", "e4"], ["e7", "e5"], ["f1", "c4"], ["b8", "c6"], ["d1", "h5"], ["g8", "f6"], ["h5", "f7"]);
    expect(sans(s)).toEqual(["e4", "e5", "Bc4", "Cc6", "Dh5", "Cf6", "Dxf7#"]);
    expect(s.phase).toBe("gameOver");
    expect(s.end).toBe("mate");
    expect(s.winner).toBe(0);
    expect(s.scores).toEqual([1, 0]);
    expect(s.stats[0].captured).toBe(1);
    expect(viewFor(s, 1).check).toBe(true);
  });

  test("afogamento empata", () => {
    const s = play(stateOf("7k/8/6Q1/8/8/8/8/K7 w - - 0 1"), ["g6", "f7"]);
    expect(s.end).toBe("stalemate");
    expect(s.winner).toBeNull();
    expect(s.draws).toBe(1);
  });

  test("material insuficiente", () => {
    expect(insufficient(fromFen("8/8/4k3/8/8/3NK3/8/8 w - - 0 1").board)).toBe(true);
    expect(insufficient(fromFen("8/8/4k3/8/8/2BBK3/8/8 w - - 0 1").board)).toBe(false);
    expect(insufficient(fromFen("8/2b5/4k3/8/8/4K3/1B6/8 w - - 0 1").board)).toBe(true); // bispos na mesma cor
    expect(insufficient(fromFen("8/8/4k3/8/8/3NK3/7P/8 w - - 0 1").board)).toBe(false);
    // captura que deixa rei contra rei e cavalo
    const s = play(stateOf("8/8/4k3/8/8/3NK3/3r4/8 w - - 0 1"), ["e3", "d2"]);
    expect(s.end).toBe("material");
  });

  test("a mesma posição pela 3ª vez empata", () => {
    let s = newGame(() => 0);
    const back: [string, string][] = [
      ["g1", "f3"],
      ["g8", "f6"],
      ["f3", "g1"],
      ["f6", "g8"],
    ];
    s = play(s, ...back);
    expect(s.phase).toBe("playing");
    s = play(s, ...back);
    expect(s.end).toBe("repeat");
  });

  test("50 lances de cada lado sem captura nem peão", () => {
    const s0 = { ...stateOf("7k/8/8/8/8/8/8/R6K w - - 0 1"), half: FIFTY_LIMIT - 1 };
    const s = play(s0, ["a1", "a2"]);
    expect(s.end).toBe("fifty");
    // lance de peão zera a contagem
    const t = play({ ...stateOf("7k/8/8/8/8/8/P7/R6K w - - 0 1"), half: FIFTY_LIMIT - 1 }, ["a2", "a3"]);
    expect(t.phase).toBe("playing");
    expect(t.half).toBe(0);
  });

  test("roque: pequeno, grande, sem passar por casa atacada e perde o direito ao mexer a torre", () => {
    const s = stateOf("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    const legal = viewFor(s, 0).legal;
    expect(legal).toContainEqual({ from: sq("e1"), to: sq("g1") });
    expect(legal).toContainEqual({ from: sq("e1"), to: sq("c1") });
    const c = play(s, ["e1", "g1"]);
    expect(c.board[sq("f1")]).toBe(ROOK);
    expect(c.board[sq("h1")]).toBe(0);
    expect(c.moves[0].rook).toEqual([sq("h1"), sq("f1")]);
    expect(c.moves[0].san).toBe("O-O");
    const l = play(c, ["e8", "c8"]);
    expect(l.board[sq("d8")]).toBe(-ROOK);
    expect(l.moves[1].san).toBe("O-O-O");

    // torre preta atacando f1: sem roque pequeno
    const attacked = viewFor(stateOf("5r1k/8/8/8/8/8/8/R3K2R w KQ - 0 1"), 0).legal;
    expect(attacked).not.toContainEqual({ from: sq("e1"), to: sq("g1") });
    expect(attacked).toContainEqual({ from: sq("e1"), to: sq("c1") });
    // em xeque: nenhum roque
    const check = viewFor(stateOf("4r2k/8/8/8/8/8/8/R3K2R w KQ - 0 1"), 0).legal;
    expect(check.some((m) => m.from === sq("e1") && Math.abs(m.to - m.from) === 2)).toBe(false);
    // torre andou e voltou: perdeu o roque daquele lado
    const moved = play(s, ["h1", "h2"], ["a8", "a7"], ["h2", "h1"], ["a7", "a8"]);
    expect(moved.castle).toBe(2 | 4);
  });

  test("en passant só logo depois do avanço duplo", () => {
    let s = stateOf("4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1");
    s = play(s, ["d7", "d5"]);
    expect(viewFor(s, 0).legal).toContainEqual({ from: sq("e5"), to: sq("d6") });
    const ep = play(s, ["e5", "d6"]);
    expect(ep.board[sq("d5")]).toBe(0);
    expect(ep.moves.at(-1)!.capturedAt).toBe(sq("d5"));
    expect(ep.moves.at(-1)!.san).toBe("exd6");
    // um lance depois, não vale mais
    const late = play(s, ["e1", "e2"], ["e8", "e7"]);
    expect(viewFor(late, 0).legal).not.toContainEqual({ from: sq("e5"), to: sq("d6") });
  });

  test("promoção com escolha da peça", () => {
    const s = stateOf("8/P6k/8/8/8/8/8/K7 w - - 0 1");
    const promos = viewFor(s, 0).legal.filter((m) => m.from === sq("a7"));
    expect(promos.map((m) => m.promo).sort()).toEqual([KNIGHT, 3, ROOK, QUEEN].sort());
    expect(applyAction(s, move(0, "a7", "a8")).ok).toBe(false);
    const n = play(s, ["a7", "a8", KNIGHT]);
    expect(n.board[sq("a8")]).toBe(KNIGHT);
    expect(n.moves[0].san).toBe("a8=C");
    expect(n.stats[0].promotions).toBe(1);
  });

  test("notação desfaz a ambiguidade entre peças iguais", () => {
    const s = play(stateOf("7k/8/8/8/8/8/8/R3R2K w - - 0 1"), ["a1", "c1"]);
    expect(s.moves[0].san).toBe("Tac1");
    const t = play(stateOf("7k/8/8/R7/8/8/8/R6K w - - 0 1"), ["a5", "a3"]);
    expect(t.moves[0].san).toBe("T5a3");
  });

  test("não pode deixar o próprio rei em xeque (peça cravada)", () => {
    const s = stateOf("4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1");
    expect(viewFor(s, 0).legal.some((m) => m.from === sq("e2"))).toBe(false);
  });

  test("perder a dama e desvantagem de material ficam nos números", () => {
    const s = play(stateOf("3qk3/8/8/8/8/8/8/3QK3 w - - 0 1"), ["d1", "d8"]);
    expect(s.stats[1].lostQueen).toBe(true);
    expect(s.stats[0].lostQueen).toBe(false);
    expect(s.stats[1].behind).toBe(9);
    expect(capturedBy(s, 0)).toEqual([QUEEN]);
  });
});

describe("desistência e empate combinado", () => {
  test("desistir dá a vitória ao outro", () => {
    const r = applyAction(newGame(() => 0), { type: "resign", seat: 1 });
    expect(r.ok && r.state.winner).toBe(0);
    expect(r.ok && r.state.end).toBe("resign");
  });

  test("oferecer, recusar jogando e aceitar", () => {
    let s = play(newGame(() => 0), ["e2", "e4"], ["e7", "e5"]);
    expect(viewFor(s, 0).canOfferDraw).toBe(true);
    let r = applyAction(s, { type: "offerDraw", seat: 0 });
    expect(r.ok).toBe(true);
    s = (r as { state: GameState }).state;
    expect(viewFor(s, 1).mustAnswerDraw).toBe(true);
    expect(viewFor(s, 0).canOfferDraw).toBe(false);
    // o outro joga: oferta recusada
    s = play(s, ["g1", "f3"]);
    s = play(s, ["b8", "c6"]);
    expect(s.drawOffer).toBeNull();
    // mesmo lugar só oferece de novo depois de jogar
    expect(viewFor(s, 0).canOfferDraw).toBe(true);
    r = applyAction(s, { type: "offerDraw", seat: 1 });
    expect(r.ok).toBe(true);
    s = (r as { state: GameState }).state;
    expect(applyAction(s, { type: "answerDraw", seat: 1, accept: true }).ok).toBe(false);
    r = applyAction(s, { type: "answerDraw", seat: 0, accept: true });
    expect(r.ok && r.state.end).toBe("agreed");
    expect(r.ok && r.state.draws).toBe(1);
  });

  test("recusar mantém a partida", () => {
    let s = play(newGame(() => 0), ["e2", "e4"], ["e7", "e5"]);
    s = (applyAction(s, { type: "offerDraw", seat: 1 }) as { state: GameState }).state;
    const r = applyAction(s, { type: "answerDraw", seat: 0, accept: false });
    expect(r.ok && r.state.phase).toBe("playing");
    expect(r.ok && r.state.drawOffer).toBeNull();
    expect(r.ok && viewFor(r.state, 1).canOfferDraw).toBe(false);
  });
});

describe("relógio", () => {
  const settings = parseSettings({ clock: "3+2" });

  test("desconta o tempo de quem joga e soma o acréscimo", () => {
    const s = newGame(() => 0, settings, null, 1000);
    expect(s.clock!.left).toEqual([180_000, 180_000]);
    const r = applyAction(s, { ...move(0, "e2", "e4"), at: 11_000 });
    expect(r.ok && r.state.clock!.left).toEqual([172_000, 180_000]);
    expect(r.ok && viewFor(r.state, 0, 16_000).timeLeft).toEqual([172_000, 175_000]);
  });

  test("sem tempo perde; o servidor confere com flag", () => {
    const s = newGame(() => 0, settings, null, 0);
    expect(applyAction(s, { type: "flag", at: 100_000 }).ok).toBe(false);
    const r = applyAction(s, { type: "flag", at: 180_000 });
    expect(r.ok && r.state.end).toBe("time");
    expect(r.ok && r.state.winner).toBe(1);
    // lance depois do tempo acabado também perde pelo tempo
    const late = applyAction(s, { ...move(0, "e2", "e4"), at: 200_000 });
    expect(late.ok && late.state.end).toBe("time");
    expect(late.ok && late.state.moves).toHaveLength(0);
  });

  test("tempo acabado contra rei sozinho empata", () => {
    const s = { ...stateOf("7k/8/8/8/8/8/8/QK6 w - - 0 1", settings), clock: { base: 1000, inc: 0, left: [1000, 1000] as [number, number], since: 0 } };
    const r = applyAction(s, { type: "flag", at: 5000 });
    expect(r.ok && r.state.end).toBe("time");
    expect(r.ok && r.state.winner).toBeNull();
  });

  test("sem relógio, nada de tempo", () => {
    const s = newGame(() => 0);
    expect(s.clock).toBeNull();
    expect(viewFor(s, 0).timeLeft).toBeNull();
  });
});

describe("IA", () => {
  test("acha o mate em 1", () => {
    const pos = fromFen("6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1");
    const { move: m } = bestMove(pos);
    expect(legalMoves(pos).length).toBeGreaterThan(0);
    expect([m & 63, (m >> 6) & 63]).toEqual([sq("d1"), sq("d8")]);
  });

  test("não entrega a dama de graça", () => {
    for (const level of ["medium", "hard"] as Level[]) {
      // dama branca atacada por peão; tem que sair
      const s = stateOf("rnbqkbnr/ppp1pppp/8/3p4/4Q3/8/PPPP1PPP/RNB1KBNR w KQkq - 0 1");
      const a = decide(viewFor(s, 0), { level, rng: seeded(1), maxNodes: 40_000 });
      expect(a?.type === "move" && a.from).toBe(sq("e4"));
    }
  });

  test("responde a oferta de empate: aceita quando está perdendo", () => {
    let s = stateOf("3qk3/8/8/8/8/8/8/4K3 w - - 0 1");
    s = { ...s, moves: [{} as never, {} as never], drawOffer: 1 };
    const losing = decide(viewFor(s, 0), { level: "hard" });
    expect(losing).toEqual({ type: "answerDraw", seat: 0, accept: true });
    let w = stateOf("3QK3/8/8/8/8/8/8/4k3 w - - 0 1");
    w = { ...w, moves: [{} as never, {} as never], drawOffer: 1 };
    expect(decide(viewFor(w, 0), { level: "hard" })).toEqual({ type: "answerDraw", seat: 0, accept: false });
  });

  test("partidas só com IAs terminam sem lance inválido", () => {
    const rng = seeded(7);
    const ends: Record<string, number> = {};
    for (let g = 0; g < 60; g++) {
      let s = newGame(rng, { level: "easy", clock: "none" });
      let steps = 0;
      while (s.phase === "playing") {
        if (++steps > 1000) throw new Error("partida não terminou");
        const a = decide(viewFor(s, s.turn), { rng });
        if (!a) throw new Error("IA sem lance");
        const r = applyAction(s, a);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
      }
      ends[s.end!] = (ends[s.end!] ?? 0) + 1;
    }
    expect(Object.values(ends).reduce((a, b) => a + b, 0)).toBe(60);
    expect(ends.mate).toBeGreaterThan(0);
  }, 60_000);

  test("o difícil ganha do fácil", () => {
    const rng = seeded(3);
    let hardWins = 0;
    for (let g = 0; g < 4; g++) {
      let s = newGame(rng, { level: "easy", clock: "none" });
      const hard = s.white;
      while (s.phase === "playing" && s.moves.length < 300) {
        const level: Level = s.turn === hard ? "hard" : "easy";
        const r = applyAction(s, decide(viewFor(s, s.turn), { level, rng, maxNodes: 30_000 })!);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
      }
      if (s.winner === hard) hardWins++;
    }
    expect(hardWins).toBeGreaterThanOrEqual(3);
  }, 60_000);
});
