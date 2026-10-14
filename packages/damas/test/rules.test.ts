import { describe, expect, test } from "bun:test";
import {
  applyAction,
  bestMove,
  capturesFrom,
  decide,
  ENDGAME_LIMIT,
  initialBoard,
  isDark,
  isSmallEndgame,
  legalMoves,
  newGame,
  parseSettings,
  piecesOf,
  positionKey,
  QUIET_LIMIT,
  squareAt,
  viewFor,
  type Cell,
  type GameState,
  type Level,
  type Move,
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

/** Casa por linha e coluna (linha 0 em cima). */
const sq = squareAt;

/** Tabuleiro a partir de até 8 linhas: w/W brancas, b/B pretas, resto vazio. */
function boardOf(rows: string[]): Cell[] {
  const map: Record<string, Cell> = { w: 1, W: 2, b: -1, B: -2 };
  const b = [...rows, ...Array(8 - rows.length).fill("")].flatMap((r: string) =>
    r
      .padEnd(8, ".")
      .split("")
      .map((c) => map[c] ?? 0),
  );
  b.forEach((p, i) => {
    if (p && !isDark(i)) throw new Error(`peça em casa clara: ${Math.floor(i / 8)},${i % 8}`);
  });
  return b;
}

/** Estado com o tabuleiro dado; o lugar 0 joga de brancas. */
function stateOf(rows: string[], turn: Seat = 0): GameState {
  const s = newGame(() => 0, { level: "medium" });
  const board = boardOf(rows);
  return { ...s, white: 0, turn, board, positions: { [positionKey(board, turn === 0 ? 1 : -1)]: 1 } };
}

function ok(r: ReturnType<typeof applyAction>): GameState {
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

const move = (s: GameState, from: number, path: number[]) => ok(applyAction(s, { type: "move", seat: s.turn, from, path }));
const paths = (ms: Move[]) => ms.map((m) => [m.from, ...m.path].join(">")).sort();

describe("início", () => {
  test("12 pedras de cada lado nas casas escuras; brancas começam", () => {
    const b = initialBoard();
    expect(b.filter((p) => p === 1)).toHaveLength(12);
    expect(b.filter((p) => p === -1)).toHaveLength(12);
    // canto de baixo à esquerda é escuro e tem pedra branca
    expect(b[sq(7, 0)]).toBe(1);
    expect(b[sq(0, 0)]).toBe(0);
    const s = newGame(() => 0.9);
    expect(s.white).toBe(1);
    expect(s.turn).toBe(1);
    expect(legalMoves(s.board, 1)).toHaveLength(7);
  });

  test("De novo troca as cores e mantém o placar", () => {
    const a = { ...newGame(() => 0), scores: [2, 1] as [number, number], draws: 1 };
    const b = newGame(() => 0, { level: "hard" }, a);
    expect(b.white).toBe((1 - a.white) as Seat);
    expect(b.turn).toBe(b.white);
    expect(b.scores).toEqual([2, 1]);
    expect(b.draws).toBe(1);
    expect(b.gameNo).toBe(2);
    expect(b.settings.level).toBe("hard");
  });

  test("opções inválidas ficam como estavam", () => {
    expect(parseSettings({ level: "hard" })).toEqual({ level: "hard" });
    expect(parseSettings({ level: "x" }, { level: "easy" })).toEqual({ level: "easy" });
    expect(parseSettings(null)).toEqual({ level: "medium" });
  });
});

describe("lances simples", () => {
  test("pedra anda uma casa para a frente, nunca para trás", () => {
    const b = boardOf(["", "", "", "", "...w...."]);
    expect(legalMoves(b, 1).map((m) => m.path[0]).sort()).toEqual([sq(3, 2), sq(3, 4)].sort());
    const p = boardOf(["", "", "", "....b..."]);
    expect(legalMoves(p, -1).map((m) => m.path[0]).sort()).toEqual([sq(4, 3), sq(4, 5)].sort());
  });

  test("dama anda várias casas até bater em algo", () => {
    const b = boardOf(["", "", "", "", "", "", ".W......", "w......."]);
    // cima-direita: 6 casas; cima-esquerda: 1; baixo-direita: 1; baixo-esquerda: ocupada
    expect(legalMoves(b, 1).filter((m) => m.from === sq(6, 1))).toHaveLength(8);
  });

  test("fora da vez, lance inválido e partida encerrada", () => {
    const s = newGame(() => 0);
    const me = s.turn;
    const other = (1 - me) as Seat;
    expect(applyAction(s, { type: "move", seat: other, from: sq(2, 1), path: [sq(3, 0)] })).toEqual({ ok: false, error: "Não é sua vez" });
    expect(applyAction(s, { type: "move", seat: me, from: sq(5, 0), path: [sq(3, 2)] }).ok).toBe(false);
    expect(applyAction(s, { type: "move", seat: me, from: sq(5, 0), path: [] }).ok).toBe(false);
    expect(applyAction(s, { type: "move", seat: me, from: sq(5, 0), path: null as never }).ok).toBe(false);
    expect(applyAction(s, { type: "move", seat: me, from: sq(5, 0), path: [sq(4, 1)] }).ok).toBe(true);
    expect(applyAction({ ...s, phase: "gameOver" }, { type: "move", seat: me, from: sq(5, 0), path: [sq(4, 1)] }).ok).toBe(false);
  });

  test("não altera o estado original", () => {
    const s = newGame(() => 0);
    const before = JSON.stringify(s);
    move(s, sq(5, 0), [sq(4, 1)]);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("capturas", () => {
  test("captura é obrigatória", () => {
    const s = stateOf(["", "", "", "....b...", "...w....", "", "", "w......."]);
    expect(paths(viewFor(s, 0).legal)).toEqual([`${sq(4, 3)}>${sq(2, 5)}`]);
    expect(applyAction(s, { type: "move", seat: 0, from: sq(7, 0), path: [sq(6, 1)] }).ok).toBe(false);
  });

  test("pedra captura para trás", () => {
    const b = boardOf(["", "", "", "....w...", ".....b.."]);
    expect(paths(legalMoves(b, 1))).toEqual([`${sq(3, 4)}>${sq(5, 6)}`]);
  });

  test("captura em sequência leva as duas e tira as peças no fim", () => {
    const s = stateOf(["", "", "...b....", "", "...b....", "....w..."]);
    expect(paths(viewFor(s, 0).legal)).toEqual([`${sq(5, 4)}>${sq(3, 2)}>${sq(1, 4)}`]);
    const t = move(s, sq(5, 4), [sq(3, 2), sq(1, 4)]);
    expect(t.board[sq(4, 3)]).toBe(0);
    expect(t.board[sq(2, 3)]).toBe(0);
    expect(t.board[sq(1, 4)]).toBe(1);
    expect(t.moves[0].captured).toEqual([sq(4, 3), sq(2, 3)]);
    expect(t.stats[0].captured).toBe(2);
    expect(t.stats[0].bestChain).toBe(2);
  });

  test("lei da maioria: obriga a captura que leva mais peças", () => {
    // pela esquerda leva 1; pela direita leva 2
    const s = stateOf(["", "", ".....b..", "", "...b.b..", "....w..."]);
    expect(paths(viewFor(s, 0).legal)).toEqual([`${sq(5, 4)}>${sq(3, 6)}>${sq(1, 4)}`]);
    expect(applyAction(s, { type: "move", seat: 0, from: sq(5, 4), path: [sq(3, 2)] }).ok).toBe(false);
  });

  test("dama vale o mesmo que pedra na lei da maioria", () => {
    // pela esquerda leva uma dama; pela direita, duas pedras: obriga as duas pedras
    const s = stateOf(["", "", ".....b..", "", "...B.b..", "....w..."]);
    expect(paths(viewFor(s, 0).legal)).toEqual([`${sq(5, 4)}>${sq(3, 6)}>${sq(1, 4)}`]);
  });

  test("mesmo número de peças: o jogador escolhe", () => {
    const s = stateOf(["", "", "", "", "...b.b..", "....w..."]);
    expect(viewFor(s, 0).legal).toHaveLength(2);
  });

  test("dama captura à distância e pousa em qualquer casa depois", () => {
    const b = boardOf(["", "", "", "", "", "..b.....", "", "W......."]);
    expect(
      capturesFrom(b, sq(7, 0))
        .map((m) => m.path[0])
        .sort(),
    ).toEqual([sq(4, 3), sq(3, 4), sq(2, 5), sq(1, 6), sq(0, 7)].sort());
  });

  test("dama não pula duas peças juntas", () => {
    const b = boardOf(["", "", "", "", "...b....", "..b.....", "", "W......."]);
    expect(capturesFrom(b, sq(7, 0))).toEqual([]);
  });

  test("peça capturada não é pulada duas vezes e continua bloqueando", () => {
    // a dama pega (6,1) e não pode voltar por cima dela para pegar outra
    const b = boardOf(["", "", "", "", "", "", ".b......", "W......."]);
    expect(capturesFrom(b, sq(7, 0)).every((m) => m.captured.length === 1)).toBe(true);
    // caso com volta: nenhuma sequência repete peça
    const c = boardOf(["", "", "", "..b.b...", "", "..b...b.", "", "....W..."]);
    const caps = capturesFrom(c, sq(7, 4));
    expect(caps.length).toBeGreaterThan(0);
    for (const m of caps) expect(new Set(m.captured).size).toBe(m.captured.length);
  });

  test("pedra que passa pela última fileira no meio da captura continua pedra", () => {
    const s = stateOf(["", "..b.b...", ".w......", "", "", "", "", "b......."]);
    expect(paths(viewFor(s, 0).legal)).toEqual([`${sq(2, 1)}>${sq(0, 3)}>${sq(2, 5)}`]);
    const t = move(s, sq(2, 1), [sq(0, 3), sq(2, 5)]);
    expect(t.board[sq(2, 5)]).toBe(1);
    expect(t.moves[0].promoted).toBe(false);
  });

  test("pedra que termina na última fileira vira dama", () => {
    const s = stateOf(["", "..w.....", "", "", "", "", "", "b......."]);
    const t = move(s, sq(1, 2), [sq(0, 1)]);
    expect(t.board[sq(0, 1)]).toBe(2);
    expect(t.moves[0].promoted).toBe(true);
    expect(t.stats[0].kings).toBe(1);
  });
});

/** Lance sem captura que não entrega peça nem repete posição (para os testes de empate). */
function calmMove(s: GameState): Move {
  const side = s.turn === s.white ? 1 : -1;
  const m = viewFor(s, s.turn).legal.find((x) => {
    if (x.captured.length) return false;
    const r = applyAction(s, { type: "move", seat: s.turn, from: x.from, path: x.path });
    return r.ok && r.state.end !== "repeat" && !legalMoves(r.state.board, -side).some((y) => y.captured.length);
  });
  if (!m) throw new Error("sem lance calmo");
  return m;
}

describe("fim de partida", () => {
  test("quem fica sem peças perde", () => {
    const s = stateOf(["", "", "", "....b...", "...w...."]);
    const t = move(s, sq(4, 3), [sq(2, 5)]);
    expect(t.phase).toBe("gameOver");
    expect(t.winner).toBe(0);
    expect(t.end).toBe("noMoves");
    expect(t.scores).toEqual([1, 0]);
  });

  test("quem fica sem lance perde", () => {
    // a preta em (0,1) fica presa: as duas saídas ocupadas e sem captura
    const s = stateOf([".b......", "w.w.....", "...w....", "", "", "", "", "w......."]);
    const t = move(s, sq(7, 0), [sq(6, 1)]);
    expect(t.phase).toBe("gameOver");
    expect(t.winner).toBe(0);
    expect(t.end).toBe("noMoves");
  });

  test("final pequeno (1 dama contra 1) empata em 5 lances de cada lado", () => {
    // sem a posição inicial no histórico: as duas damas têm poucas casas seguras
    let s = { ...stateOf([".W......", "", "", "", "", "", "", "......B."]), positions: {} };
    for (let i = 0; i < 50 && s.phase === "playing"; i++) {
      const m = calmMove(s);
      s = move(s, m.from, m.path);
    }
    expect(s.end).toBe("endgame");
    expect(s.moves.length).toBe(ENDGAME_LIMIT);
    expect(s.winner).toBeNull();
    expect(s.draws).toBe(1);
  });

  test("damas sem captura fora de final pequeno empatam em 20 lances de cada", () => {
    let s = stateOf([".W.W.W..", "", "", "", "", "", "", "..B.B.B."]);
    expect(isSmallEndgame(s.board)).toBe(false);
    for (let i = 0; i < 100 && s.phase === "playing"; i++) {
      const m = calmMove(s);
      s = move(s, m.from, m.path);
    }
    expect(s.end).toBe("quiet");
    expect(s.moves.length).toBe(QUIET_LIMIT);
  });

  test("pedra andando zera a contagem das damas", () => {
    const s = { ...stateOf([".W......", "", "", "", "", "", ".......w", "......B."]), quiet: 30 };
    expect(move(s, sq(6, 7), [sq(5, 6)]).quiet).toBe(0);
    expect(move(s, sq(0, 1), [sq(1, 2)]).quiet).toBe(31);
  });

  test("a mesma posição pela 3ª vez empata", () => {
    let s = stateOf(["", "w...w...", ".w......", "", "", "", "", "W.....B."]);
    const [a, b, c, d] = [sq(7, 0), sq(6, 1), sq(7, 6), sq(6, 7)];
    const seq: [number, number][] = [
      [a, b],
      [c, d],
      [b, a],
      [d, c],
      [a, b],
      [c, d],
      [b, a],
      [d, c],
    ];
    for (const [from, to] of seq) s = move(s, from, [to]);
    expect(s.phase).toBe("gameOver");
    expect(s.end).toBe("repeat");
    expect(s.winner).toBeNull();
  });

  test("finais pequenos", () => {
    const k = (white: string) => isSmallEndgame(boardOf([white, "", "", "", "", "", "", "......B."]));
    expect(k(".W.W....")).toBe(true);
    expect(k(".W.W.w..")).toBe(true);
    expect(k(".W.w.w..")).toBe(true);
    expect(k(".W.w....")).toBe(true);
    expect(k(".W......")).toBe(true);
    expect(k(".W.W.W..")).toBe(false);
    expect(k(".W.w.w.w")).toBe(false);
    expect(k(".w.w....")).toBe(false);
    expect(isSmallEndgame(boardOf([".W.W....", "", "", "", "", "", "", "....b.B."]))).toBe(false);
  });

  test("maior desvantagem fica guardada (Virada)", () => {
    const s = stateOf(["", "", "", "....b...", "...w....", "", "", "b.b.b..."]);
    const t = move(s, sq(4, 3), [sq(2, 5)]);
    expect(piecesOf(t, 0)).toBe(1);
    expect(piecesOf(t, 1)).toBe(3);
    expect(t.stats[0].behind).toBe(2);
    expect(t.stats[1].behind).toBe(0);
    const u = stateOf(["", "", "", "....b...", "...w....", "", "", "b.b.b.b."]);
    expect(move(u, sq(4, 3), [sq(2, 5)]).stats[0].behind).toBe(3);
  });
});

describe("visão", () => {
  test("só quem está na vez tem lances", () => {
    const s = newGame(() => 0);
    expect(viewFor(s, s.turn).legal.length).toBe(7);
    expect(viewFor(s, (1 - s.turn) as Seat).legal).toEqual([]);
    expect(viewFor(s, s.white).color).toBe("white");
  });
});

describe("IA", () => {
  test("faz a captura obrigatória em todos os níveis", () => {
    const s = stateOf(["", "", "", "....b...", "...w....", "", "", "w......."]);
    for (const level of ["easy", "medium", "hard"] as Level[]) {
      const a = decide(viewFor(s, 0), { level, rng: seeded(1) })!;
      expect(a.from).toBe(sq(4, 3));
    }
  });

  test("difícil não entrega peça de graça", () => {
    // andar para (3,4) entrega a pedra para a preta em (2,5); (3,2) é seguro
    const s = stateOf(["", "", ".....b..", "", "...w...."]);
    expect(bestMove(s.board.slice(), 1).path[0]).toBe(sq(3, 2));
  });

  test("fora da vez não joga", () => {
    const s = newGame(() => 0);
    expect(decide(viewFor(s, (1 - s.turn) as Seat))).toBeNull();
  });

  test("difícil responde rápido na abertura", () => {
    const s = newGame(() => 0);
    const t0 = performance.now();
    decide(viewFor(s, s.turn), { level: "hard" });
    expect(performance.now() - t0).toBeLessThan(2500);
  });
});

describe("simulação", () => {
  function run(levels: [Level, Level], seed: number) {
    const rng = seeded(seed);
    let s = newGame(rng, { level: levels[0] });
    let steps = 0;
    while (s.phase === "playing") {
      const a = decide(viewFor(s, s.turn), { level: levels[s.turn], rng });
      if (!a) throw new Error("ninguém pode agir");
      s = ok(applyAction(s, a));
      if (++steps > 600) throw new Error("partida não terminou");
    }
    // estado coerente: vencedor quando o outro fica sem lance, empate com motivo
    expect(s.end).not.toBeNull();
    if (s.winner !== null) expect(s.end).toBe("noMoves");
    else expect(["quiet", "repeat", "endgame"]).toContain(s.end!);
    const caps = s.moves.reduce((n, m) => n + m.captured.length, 0);
    expect(24 - s.board.filter((p) => p !== 0).length).toBe(caps);
    expect(s.stats[0].captured + s.stats[1].captured).toBe(caps);
    return s;
  }

  test("300 partidas entre IAs fáceis terminam com estado consistente", () => {
    for (let i = 0; i < 300; i++) run(["easy", "easy"], i + 1);
  }, 60_000);

  test("médio ganha do fácil na maioria", () => {
    let wins = 0;
    let losses = 0;
    for (let i = 0; i < 40; i++) {
      const s = run(["medium", "easy"], 1000 + i);
      if (s.winner === 0) wins++;
      else if (s.winner === 1) losses++;
    }
    expect(wins).toBeGreaterThan(losses * 2);
  }, 60_000);
});
