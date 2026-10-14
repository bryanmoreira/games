import { describe, expect, test } from "bun:test";
import {
  applyAction,
  decide,
  FADE_LIMIT,
  markOf,
  newGame,
  nextToFade,
  parseSettings,
  scoreMoves,
  threats,
  viewFor,
  type GameState,
  type Level,
  type Mode,
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

/** Partida com o lugar 0 começando, jogando as casas em sequência alternada. */
function play(cells: number[], mode: Mode = "classic"): GameState {
  let s = { ...newGame(() => 0, { mode, level: "medium" }), turn: 0 as Seat, starter: 0 as Seat };
  for (const cell of cells) {
    const r = applyAction(s, { type: "place", seat: s.turn, cell });
    if (!r.ok) throw new Error(`${cell}: ${r.error}`);
    s = r.state;
  }
  return s;
}

describe("regras", () => {
  test("quem começa é o X; a vez alterna", () => {
    const s = play([4]);
    expect(s.board[4]).toBe(0);
    expect(markOf(s, 0)).toBe("X");
    expect(markOf(s, 1)).toBe("O");
    expect(s.turn).toBe(1);
  });

  test("fora da vez, casa inválida e casa ocupada", () => {
    const s = play([4]);
    expect(applyAction(s, { type: "place", seat: 0, cell: 0 })).toEqual({ ok: false, error: "Não é sua vez" });
    expect(applyAction(s, { type: "place", seat: 1, cell: 4 })).toEqual({ ok: false, error: "Casa ocupada" });
    for (const cell of [-1, 9, 1.5, NaN]) expect(applyAction(s, { type: "place", seat: 1, cell }).ok).toBe(false);
  });

  test("não altera o estado original", () => {
    const s = play([]);
    applyAction(s, { type: "place", seat: 0, cell: 2 });
    expect(s.board[2]).toBeNull();
    expect(s.moves).toEqual([]);
  });

  test.each([
    ["linha", [0, 3, 1, 4, 2], [0, 1, 2]],
    ["coluna", [1, 0, 4, 3, 7], [1, 4, 7]],
    ["diagonal", [0, 1, 4, 2, 8], [0, 4, 8]],
    ["diagonal inversa", [2, 0, 4, 1, 6], [2, 4, 6]],
  ])("vitória na %s", (_, cells, line) => {
    const s = play(cells);
    expect(s.phase).toBe("gameOver");
    expect(s.winner).toBe(0);
    expect(s.winLine).toEqual(line);
    expect(s.scores).toEqual([1, 0]);
    expect(applyAction(s, { type: "place", seat: 1, cell: 8 })).toEqual({ ok: false, error: "Partida encerrada" });
  });

  test("O também vence", () => {
    const s = play([0, 4, 1, 2, 8, 6]);
    expect(s.winner).toBe(1);
    expect(s.winLine).toEqual([2, 4, 6]);
  });

  test("tabuleiro cheio sem linha é velha", () => {
    // X O X / X O O / O X X
    const s = play([0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(s.phase).toBe("gameOver");
    expect(s.winner).toBeNull();
    expect(s.draws).toBe(1);
  });

  test("vitória no último lance não é velha", () => {
    // o 9º lance fecha a coluna 2,5,8
    const s = play([2, 0, 3, 4, 7, 1, 5, 6, 8]);
    expect(s.winner).toBe(0);
    expect(s.draws).toBe(0);
  });

  test("garfo: duas ameaças antes do lance da vitória", () => {
    // X bloqueia em 6 e passa a ameaçar 3 e 7
    const s = play([0, 4, 8, 2, 6, 3, 7]);
    expect(s.winner).toBe(0);
    expect(s.fork).toBe(true);
    // O deixa passar uma ameaça só: sem garfo
    expect(play([0, 4, 1, 8, 2]).fork).toBe(false);
  });

  test("De novo: placar fica e quem começa alterna", () => {
    const a = play([0, 3, 1, 4, 2]);
    const b = newGame(() => 0.9, a.settings, a);
    expect(b.starter).toBe(1);
    expect(b.turn).toBe(1);
    expect(markOf(b, 1)).toBe("X");
    expect(b.scores).toEqual([1, 0]);
    expect(b.gameNo).toBe(2);
    expect(b.board.every((c) => c === null)).toBe(true);
  });

  test("opções do lobby: só aceita valores conhecidos", () => {
    expect(parseSettings({ mode: "fading", level: "hard" })).toEqual({ mode: "fading", level: "hard" });
    expect(parseSettings({ mode: "x", level: 3 }, { mode: "fading", level: "easy" })).toEqual({ mode: "fading", level: "easy" });
    expect(parseSettings(null)).toEqual({ mode: "classic", level: "medium" });
  });
});

describe("modo some", () => {
  test("a 4ª peça tira a mais antiga", () => {
    const s = play([0, 4, 1, 5, 6, 8], "fading");
    expect(nextToFade(s, 0)).toBe(0);
    expect(nextToFade(s, 1)).toBe(4);
    const t = applyAction(s, { type: "place", seat: 0, cell: 7 });
    if (!t.ok) throw new Error(t.error);
    expect(t.state.board[0]).toBeNull();
    expect(t.state.board[7]).toBe(0);
    expect(t.state.pieces[0]).toEqual([1, 6, 7]);
    expect(t.state.moves.at(-1)).toEqual({ cell: 7, seat: 0, removed: 0 });
  });

  test("com menos de 3 peças nada some", () => {
    const s = play([0, 4], "fading");
    expect(nextToFade(s, 0)).toBeNull();
    expect(nextToFade(play([0, 4, 1, 5, 6, 8]), 0)).toBeNull(); // clássico nunca some
  });

  test("a linha conta depois de a peça sumir", () => {
    // X: 0 1 6 → joga 2: some o 0, fica 1 6 2 (sem linha)
    const s = play([0, 4, 1, 5, 6, 8, 2], "fading");
    expect(s.phase).toBe("playing");
    expect(s.board[0]).toBeNull();
    // ameaça que depende da peça que vai sumir não conta
    expect(threats(play([0, 4, 1, 5, 6, 8], "fading"), 0)).not.toContain(2);
  });

  test("dá para jogar na casa que acabou de vagar", () => {
    const s = play([0, 4, 1, 5, 6, 8, 7], "fading");
    expect(s.board[4]).toBe(1);
    const t = applyAction(s, { type: "place", seat: 1, cell: 0 });
    expect(t.ok).toBe(true);
    if (t.ok) expect(t.state.board[4]).toBeNull();
  });

  test(`velha depois de ${FADE_LIMIT} lances`, () => {
    let s = { ...newGame(() => 0, { mode: "fading", level: "hard" }), turn: 0 as Seat, starter: 0 as Seat };
    const rng = seeded(7);
    while (s.phase === "playing") {
      const v = viewFor(s, s.turn);
      // joga sempre bloqueando, nunca fechando: ninguém vence
      const block = threats(s, (1 - s.turn) as Seat);
      const safe = v.playable.filter((c) => !threats(s, s.turn).includes(c));
      const cell = block.find((c) => safe.includes(c)) ?? safe[Math.floor(rng() * safe.length)] ?? v.playable[0];
      const r = applyAction(s, { type: "place", seat: s.turn, cell });
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    if (s.winner === null) {
      expect(s.moves.length).toBe(FADE_LIMIT);
      expect(s.draws).toBe(1);
    }
  });
});

describe("visão", () => {
  test("só quem está na vez tem casas jogáveis", () => {
    const s = play([4]);
    expect(viewFor(s, 1).playable).toEqual([0, 1, 2, 3, 5, 6, 7, 8]);
    expect(viewFor(s, 0)).toMatchObject({ canPlay: false, playable: [] });
    expect(viewFor(play([0, 3, 1, 4, 2]), 1).canPlay).toBe(false);
  });
});

describe("IA", () => {
  const view = (cells: number[], mode: Mode = "classic") => {
    const s = play(cells, mode);
    return viewFor(s, s.turn);
  };
  const cellOf = (v: ReturnType<typeof view>, level: Level, seed = 1) => decide(v, { level, rng: seeded(seed) })?.cell;

  test("fecha a linha (médio e impossível)", () => {
    const v = view([0, 3, 1, 4]); // X fecha em 2
    for (const level of ["medium", "hard"] as const) expect(cellOf(v, level)).toBe(2);
  });

  test("bloqueia a linha do adversário", () => {
    const v = view([0, 4, 1]); // O precisa bloquear 2
    for (const level of ["medium", "hard"] as const) for (const seed of [1, 2, 3]) expect(cellOf(v, level, seed)).toBe(2);
  });

  test("impossível evita o garfo", () => {
    // X nos cantos opostos, O no centro: O precisa jogar numa lateral
    const v = view([0, 4, 8]);
    for (const seed of [1, 2, 3, 4, 5]) expect([1, 3, 5, 7]).toContain(cellOf(v, "hard", seed)!);
  });

  test("impossível monta o garfo quando dá", () => {
    // X 0, O 1 (lateral ruim), X 4, O 8 (bloqueia): X joga 3 ou 6... qualquer lance que vence à força
    const v = view([0, 1, 4, 8]);
    const best = Math.max(...scoreMoves(v).map((m) => m.score));
    expect(best).toBeGreaterThan(0);
  });

  test("fora da vez não joga", () => {
    const s = play([4]);
    expect(decide(viewFor(s, 0))).toBeNull();
  });

  test("impossível no modo some responde rápido", () => {
    const t = performance.now();
    decide(view([], "fading"), { level: "hard", rng: seeded(1) });
    decide(view([4, 0, 8], "fading"), { level: "hard", rng: seeded(1) });
    expect(performance.now() - t).toBeLessThan(1500);
  });
});

describe("simulação", () => {
  type Pair = [Level, Level];
  function match(mode: Mode, levels: Pair, seed: number): GameState {
    const rng = seeded(seed);
    let s = newGame(rng, { mode, level: "medium" });
    let guard = 0;
    while (s.phase === "playing") {
      if (guard++ > 100) throw new Error("partida não termina");
      const a = decide(viewFor(s, s.turn), { level: levels[s.turn], rng });
      if (!a) throw new Error("IA sem lance");
      const r = applyAction(s, a);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    return s;
  }

  test("300 partidas clássicas entre IAs terminam com estado consistente", () => {
    const all: Level[] = ["easy", "medium", "hard"];
    for (let i = 0; i < 300; i++) {
      const s = match("classic", [all[i % 3], all[Math.floor(i / 3) % 3]], i + 1);
      expect(s.board.filter((c) => c !== null).length).toBe(s.moves.length);
      if (s.winner === null) expect(s.moves.length).toBe(9);
      else expect(s.winLine?.every((c) => s.board[c] === s.winner)).toBe(true);
    }
  });

  test("impossível nunca perde no clássico", () => {
    for (let i = 0; i < 150; i++) {
      const other: Level = (["easy", "medium", "hard"] as const)[i % 3];
      const s = match("classic", i % 2 ? ["hard", other] : [other, "hard"], 1000 + i);
      const hardSeat = i % 2 ? 0 : 1;
      expect(s.winner === null || s.winner === hardSeat).toBe(true);
    }
  });

  test("impossível contra impossível dá velha", () => {
    for (let i = 0; i < 20; i++) expect(match("classic", ["hard", "hard"], 2000 + i).winner).toBeNull();
  });

  test("100 partidas no modo some terminam (vitória ou velha no limite)", () => {
    const all: Level[] = ["easy", "medium", "hard"];
    for (let i = 0; i < 100; i++) {
      const s = match("fading", [all[i % 3], all[(i + 1) % 3]], 3000 + i);
      expect(s.board.filter((c) => c !== null).length).toBeLessThanOrEqual(6);
      if (s.winner === null) expect(s.moves.length).toBe(FADE_LIMIT);
    }
  });
});
