import { describe, expect, test } from "bun:test";
import {
  applyAction,
  decide,
  newGame,
  seatColors,
  slotOf,
  TRIPLES,
  viewFor,
  winningSlots,
  type GameState,
  type Seat,
  type Size,
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

/** Partida com `players` começando pelo primeiro; cada lance é [casa, tamanho] de quem estiver na vez. */
function play(moves: [number, Size][], players: Seat[] = [0, 1]): GameState {
  let s = newGame(() => 0, players);
  for (const [cell, size] of moves) {
    const r = applyAction(s, { type: "place", seat: s.owner[s.order[s.turn]]!, cell, size });
    if (!r.ok) throw new Error(`${cell}/${size}: ${r.error}`);
    s = r.state;
  }
  return s;
}

describe("montagem", () => {
  test("49 trincas: 24 linhas, 16 escadas, 9 alvos", () => {
    expect(TRIPLES.length).toBe(49);
    expect(TRIPLES.filter((t) => t.kind === "line").length).toBe(24);
    expect(TRIPLES.filter((t) => t.kind === "stair").length).toBe(16);
    expect(TRIPLES.filter((t) => t.kind === "stack").length).toBe(9);
  });

  test("2 jogadores: duas cores cada, ordem A1 B1 A2 B2", () => {
    expect(seatColors([0, 1], 0)).toEqual({ owner: [0, 1, 0, 1], order: [0, 1, 2, 3] });
    expect(seatColors([0, 1], 1)).toEqual({ owner: [0, 1, 0, 1], order: [1, 0, 3, 2] });
    expect(seatColors([1, 3], 3)).toEqual({ owner: [1, 1, 3, 3], order: [3, 1, 2, 0] });
  });

  test("3 jogadores: a 4ª cor fica de fora", () => {
    const s = newGame(() => 0, [0, 1, 3]);
    expect(s.owner).toEqual([0, 1, null, 3]);
    expect(s.order).toEqual([0, 1, 3]);
    expect(s.stock[2]).toEqual([0, 0, 0]);
    expect(s.stock[3]).toEqual([3, 3, 3]);
  });

  test("4 jogadores: uma cor cada, a partir de quem começa", () => {
    const s = newGame(() => 0.6, [0, 1, 2, 3]);
    expect(s.starter).toBe(2);
    expect(s.order).toEqual([2, 3, 0, 1]);
  });

  test("De novo: placar mantido e quem começa passa ao próximo", () => {
    const a = newGame(() => 0.9, [0, 2]);
    expect(a.starter).toBe(2);
    const b = newGame(() => 0, [0, 2], { ...a, scores: [1, 0, 3, 0], draws: 2 });
    expect(b.starter).toBe(0);
    expect(b.scores).toEqual([1, 0, 3, 0]);
    expect(b.draws).toBe(2);
    expect(b.gameNo).toBe(2);
    expect(newGame(() => 0, [0, 1, 2], b).starter).toBe(1);
  });

  test("menos de 2 jogadores não começa", () => {
    expect(() => newGame(() => 0, [1])).toThrow();
  });
});

describe("lances", () => {
  test("fora da vez, encaixe ocupado, fora do tabuleiro", () => {
    const s = play([[4, 1]]);
    expect(applyAction(s, { type: "place", seat: 0, cell: 0, size: 0 })).toEqual({ ok: false, error: "Não é sua vez" });
    expect(applyAction(s, { type: "place", seat: 1, cell: 4, size: 1 })).toEqual({ ok: false, error: "Encaixe ocupado" });
    expect(applyAction(s, { type: "place", seat: 1, cell: 9, size: 0 }).ok).toBe(false);
    expect(applyAction(s, { type: "place", seat: 1, cell: 0, size: 3 as Size }).ok).toBe(false);
    expect(applyAction(s, { type: "place", seat: 1, cell: 1.5, size: 0 }).ok).toBe(false);
  });

  test("peça encaixa e gasta o estoque; não altera o original", () => {
    const s0 = newGame(() => 0, [0, 1]);
    const r = applyAction(s0, { type: "place", seat: 0, cell: 4, size: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.board[slotOf(4, 2)]).toBe(0);
    expect(r.state.stock[0]).toEqual([3, 3, 2]);
    expect(r.state.turn).toBe(1);
    expect(s0.board[slotOf(4, 2)]).toBeNull();
  });

  test("acabou o tamanho: não joga mais dele", () => {
    // vermelho gasta as 3 grandes em casas sem trinca entre elas
    const s = play(
      [
        [0, 2], [4, 0], [8, 0], [6, 2],
        [5, 2], [1, 0], [3, 0], [2, 1],
        [7, 2],
      ],
      [0, 1],
    );
    expect(s.stock[0][2]).toBe(0);
    // volta ao vermelho depois de mais 3 cores
    const t = play(
      [
        [0, 2], [4, 0], [8, 0], [6, 2],
        [5, 2], [1, 0], [3, 0], [2, 1],
        [7, 2], [4, 1], [0, 0], [6, 0],
      ],
      [0, 1],
    );
    expect(t.order[t.turn]).toBe(0);
    expect(applyAction(t, { type: "place", seat: 0, cell: 1, size: 2 })).toEqual({ ok: false, error: "Acabaram as peças desse tamanho" });
  });
});

describe("vitórias", () => {
  // com 3 jogadores (0, 1, 2) as cores giram 0, 1, 2; os outros jogam longe
  const three: Seat[] = [0, 1, 2];

  test("linha: 3 do mesmo tamanho", () => {
    const s = play([[0, 1], [3, 0], [6, 0], [1, 1], [3, 2], [6, 2], [2, 1]], three);
    expect(s.phase).toBe("gameOver");
    expect(s.winner).toBe(0);
    expect(s.winColor).toBe(0);
    expect(s.win).toEqual({ kind: "line", slots: [slotOf(0, 1), slotOf(1, 1), slotOf(2, 1)] });
    expect(s.scores).toEqual([1, 0, 0, 0]);
  });

  test("escada: pequena → média → grande", () => {
    const s = play([[0, 0], [3, 0], [6, 0], [4, 1], [3, 2], [6, 2], [8, 2]], three);
    expect(s.winner).toBe(0);
    expect(s.win?.kind).toBe("stair");
  });

  test("escada ao contrário: grande → média → pequena", () => {
    const s = play([[2, 2], [1, 0], [0, 0], [4, 1], [1, 2], [0, 2], [6, 0]], three);
    expect(s.winner).toBe(0);
    expect(s.win?.kind).toBe("stair");
  });

  test("alvo: os três tamanhos na mesma casa", () => {
    const s = play([[4, 0], [0, 0], [8, 0], [4, 1], [0, 2], [8, 2], [4, 2]], three);
    expect(s.winner).toBe(0);
    expect(s.win).toEqual({ kind: "stack", slots: [slotOf(4, 0), slotOf(4, 1), slotOf(4, 2)] });
  });

  test("tamanhos misturados fora de ordem não vencem", () => {
    const s = play([[0, 1], [3, 0], [6, 0], [1, 0], [3, 2], [6, 2], [2, 2]], three);
    expect(s.phase).toBe("playing");
  });

  test("2 jogadores: duas cores do mesmo dono não somam", () => {
    // vermelho (0) e verde (2) são do lugar 0; 0 pequena em 0 e 1, verde pequena em 2
    const s = play([[0, 0], [3, 0], [2, 0], [6, 0], [1, 0]], [0, 1]);
    // vermelho fechou a linha de pequenas? não: a casa 2 é verde
    expect(s.phase).toBe("playing");
  });

  test("2 jogadores: vence com a segunda cor", () => {
    // ordem 0(vermelho) 1(azul) 2(verde, lugar 0) 3(roxo, lugar 1)
    const s = play(
      [
        [0, 2], [8, 0], [3, 0], [6, 1],
        [1, 2], [8, 1], [4, 0], [7, 1],
        [6, 2], [2, 1], [5, 0],
      ],
      [0, 1],
    );
    expect(s.winner).toBe(0);
    expect(s.winColor).toBe(2);
    expect(s.win?.kind).toBe("line");
  });

  test("ameaças só contam com peça do tamanho no estoque", () => {
    const s = play([[0, 1], [3, 0], [6, 0], [1, 1]], three);
    expect(winningSlots(s, 0)).toEqual([slotOf(2, 1)]);
    const empty = { ...s, stock: s.stock.map((x, i) => (i === 0 ? ([3, 0, 3] as [number, number, number]) : x)) };
    expect(winningSlots(empty, 0)).toEqual([]);
  });
});

describe("passe e empate", () => {
  test("cor sem lance passa a vez; ninguém com lance = empate", () => {
    // monta o tabuleiro quase cheio à mão: só sobra um encaixe pequeno; o vermelho não tem pequena
    const s = newGame(() => 0, [0, 1, 2]);
    s.board = s.board.map((_, i) => (i === slotOf(4, 0) ? null : 9));
    s.stock = [[0, 2, 2], [1, 0, 0], [0, 0, 0], [0, 0, 0]];
    s.turn = 2; // verde joga agora (sem nada) — força o avanço a partir do azul
    s.stock[2] = [0, 1, 0];
    s.board[slotOf(4, 1)] = null;
    const r = applyAction(s, { type: "place", seat: 2, cell: 4, size: 1 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // vermelho não tem pequena: pula para o azul
    expect(r.state.order[r.state.turn]).toBe(1);
    const r2 = applyAction(r.state, { type: "place", seat: 1, cell: 4, size: 0 });
    expect(r2.ok && r2.state.phase).toBe("gameOver");
    expect(r2.ok && r2.state.winner).toBeNull();
    expect(r2.ok && r2.state.draws).toBe(1);
  });
});

describe("visão", () => {
  test("cores próprias, cor da vez e encaixes livres", () => {
    const s = newGame(() => 0, [0, 1]);
    const v0 = viewFor(s, 0);
    expect(v0.myColors).toEqual([0, 2]);
    expect(v0.canPlay).toBe(true);
    expect(v0.placeable.length).toBe(27);
    const v1 = viewFor(s, 1);
    expect(v1.canPlay).toBe(false);
    expect(v1.placeable).toEqual([]);
    expect(viewFor(s, 3).myColors).toEqual([]);
  });
});

describe("IA", () => {
  test("fecha a trinca quando pode", () => {
    const s = play([[0, 1], [3, 0], [6, 0], [1, 1], [3, 2], [6, 2]], [0, 1, 2]);
    expect(decide(viewFor(s, 0), seeded(1))).toEqual({ type: "place", seat: 0, cell: 2, size: 1 });
  });

  test("bloqueia o próximo adversário", () => {
    // vermelho ameaça o alvo na casa 4 (falta a grande); azul tem de bloquear
    const s = play([[4, 0], [0, 0], [8, 0], [4, 1], [2, 0]], [0, 1, 2]);
    expect(s.order[s.turn]).toBe(2);
    const t = applyAction(s, { type: "place", seat: 2, cell: 6, size: 0 });
    if (!t.ok) throw new Error(t.error);
    expect(decide(viewFor(t.state, 0), seeded(1))).toEqual({ type: "place", seat: 0, cell: 4, size: 2 });
    const u = play([[4, 0], [0, 0], [8, 0], [4, 1]], [0, 1, 2]);
    expect(decide(viewFor(u, 1), seeded(2))).toEqual({ type: "place", seat: 1, cell: 4, size: 2 });
  });

  test("ganha da IA aleatória quase sempre", () => {
    let wins = 0;
    const N = 60;
    for (let g = 0; g < N; g++) {
      const rng = seeded(g + 7);
      let s = newGame(rng, [0, 1]);
      while (s.phase === "playing") {
        const seat = s.owner[s.order[s.turn]]!;
        const v = viewFor(s, seat);
        const a =
          seat === 0
            ? decide(v, rng)!
            : (() => {
                const x = v.placeable[Math.floor(rng() * v.placeable.length)];
                return { type: "place" as const, seat, cell: Math.floor(x / 3), size: (x % 3) as Size };
              })();
        const r = applyAction(s, a);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
      }
      if (s.winner === 0) wins++;
    }
    expect(wins / N).toBeGreaterThan(0.85);
  });
});

describe("simulação", () => {
  test("300 partidas só com IAs, de 2 a 4 jogadores, sempre terminam", () => {
    const tables: Seat[][] = [[0, 1], [0, 2], [1, 3], [0, 1, 2], [0, 1, 3], [0, 1, 2, 3]];
    const kinds = { line: 0, stair: 0, stack: 0, draw: 0 };
    for (let g = 0; g < 300; g++) {
      const rng = seeded(g);
      let s = newGame(rng, tables[g % tables.length]);
      let steps = 0;
      while (s.phase === "playing") {
        if (++steps > 40) throw new Error("travou");
        const color = s.order[s.turn];
        const seat = s.owner[color]!;
        const a = decide(viewFor(s, seat), rng);
        expect(a).not.toBeNull();
        const r = applyAction(s, a!);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
        // ninguém mais pode agir enquanto não é a vez
        for (const p of s.players) if (p !== s.owner[s.order[s.turn]] && s.phase === "playing") expect(viewFor(s, p).canPlay).toBe(false);
      }
      if (s.win) {
        kinds[s.win.kind]++;
        expect(s.win.slots.every((x) => s.board[x] === s.winColor)).toBe(true);
        expect(s.owner[s.winColor!]).toBe(s.winner);
      } else kinds.draw++;
    }
    // as três formas aparecem
    expect(kinds.line).toBeGreaterThan(0);
    expect(kinds.stair).toBeGreaterThan(0);
    expect(kinds.stack).toBeGreaterThan(0);
  });
});
