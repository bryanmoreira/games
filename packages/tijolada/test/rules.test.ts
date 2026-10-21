import { describe, expect, test } from "bun:test";
import {
  advanceTo,
  applyVersus,
  bag,
  cellsOf,
  COLS,
  COUNTDOWN_TICKS,
  dropY,
  HIDDEN,
  input,
  LAG_TICKS,
  LOCK_TICKS,
  newGame,
  newVersus,
  pack,
  ROWS,
  SHAPES,
  step,
  stepVersus,
  unpack,
  versusOutcome,
  versusView,
  VERSUS_LEVEL_TICKS,
  type Game,
  type Key,
  type Kind,
} from "../src";
import { plan } from "./bot";

/** Campo com as linhas de baixo cheias, menos as colunas em `gaps`. */
function fillRows(g: Game, rows: number, gaps: number[]) {
  for (let y = ROWS - rows; y < ROWS; y++) for (let x = 0; x < COLS; x++) g.board[y * COLS + x] = gaps.includes(x) ? 0 : 8;
}

/** Troca a peça da vez (e a fila) por uma escolhida. */
function setPiece(g: Game, kind: Kind) {
  g.piece = { kind, rot: 0, x: kind === 2 ? 4 : 3, y: kind === 1 ? HIDDEN - 1 : HIDDEN };
}

describe("peças e sorteio", () => {
  test("cada peça tem 4 blocos em todos os giros", () => {
    for (const rots of Object.values(SHAPES)) for (const cells of rots) expect(cells.length).toBe(4);
  });

  test("saco de 7: cada peça uma vez", () => {
    let st = 123;
    for (let i = 0; i < 50; i++) {
      const [b, n] = bag(st);
      st = n;
      expect([...b].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
  });

  test("mesma semente, mesmas peças", () => {
    expect(newGame(42, "solo").queue).toEqual(newGame(42, "solo").queue);
    expect(newGame(42, "solo").queue).not.toEqual(newGame(43, "solo").queue);
  });

  test("a peça nasce visível e no meio", () => {
    const g = newGame(1, "solo");
    for (const [x, y] of cellsOf(g.piece!)) {
      expect(y).toBeGreaterThanOrEqual(HIDDEN);
      expect(x).toBeGreaterThanOrEqual(3);
      expect(x).toBeLessThanOrEqual(6);
    }
  });
});

describe("movimento", () => {
  test("parede segura a peça", () => {
    const g = newGame(1, "solo");
    setPiece(g, 3);
    for (let i = 0; i < 10; i++) input(g, "left");
    expect(Math.min(...cellsOf(g.piece!).map(([x]) => x))).toBe(0);
    expect(input(g, "left")).toBe(false);
  });

  test("gravidade: 1 linha por segundo no nível 1", () => {
    const g = newGame(1, "solo");
    const y = g.piece!.y;
    advanceTo(g, 60);
    expect(g.piece!.y).toBe(y + 1);
  });

  test("queda suave dá 1 ponto por linha; queda de vez, 2", () => {
    const g = newGame(1, "solo");
    setPiece(g, 2);
    input(g, "down");
    input(g, "down");
    expect(g.score).toBe(2);
    const dist = dropY(g.board, g.piece!) - g.piece!.y;
    input(g, "drop");
    expect(g.score).toBe(2 + 2 * dist);
    expect(g.pieces).toBe(1);
  });

  test("trava depois de meio segundo no chão; mexer adia", () => {
    const g = newGame(1, "solo");
    setPiece(g, 2);
    g.piece!.y = dropY(g.board, g.piece!);
    for (let i = 0; i < LOCK_TICKS - 5; i++) step(g);
    expect(g.pieces).toBe(0);
    input(g, "left");
    for (let i = 0; i < LOCK_TICKS - 5; i++) step(g);
    expect(g.pieces).toBe(0);
    for (let i = 0; i < 10; i++) step(g);
    expect(g.pieces).toBe(1);
  });

  test("girar encostado na parede chuta a peça para dentro", () => {
    const g = newGame(1, "solo");
    setPiece(g, 1);
    input(g, "cw"); // I em pé
    for (let i = 0; i < 10; i++) input(g, "right");
    expect(input(g, "cw")).toBe(true);
    for (const [x] of cellsOf(g.piece!)) expect(x).toBeLessThan(COLS);
  });

  test("O não sai do lugar ao girar", () => {
    const g = newGame(1, "solo");
    setPiece(g, 2);
    const before = cellsOf(g.piece!);
    input(g, "cw");
    expect(cellsOf(g.piece!).sort()).toEqual(before.sort());
  });

  test("guardar: uma vez por peça", () => {
    const g = newGame(1, "solo");
    const first = g.piece!.kind;
    const second = g.queue[0];
    expect(input(g, "hold")).toBe(true);
    expect(g.hold).toBe(first);
    expect(g.piece!.kind).toBe(second);
    expect(input(g, "hold")).toBe(false);
    input(g, "drop");
    expect(input(g, "hold")).toBe(true);
  });
});

describe("linhas e pontos", () => {
  test("4 linhas com o I em pé: 800 × nível", () => {
    const g = newGame(1, "solo");
    fillRows(g, 4, [9]);
    setPiece(g, 1);
    input(g, "cw");
    for (let i = 0; i < 10; i++) input(g, "right");
    const y = dropY(g.board, g.piece!);
    const dropPts = 2 * (y - g.piece!.y);
    input(g, "drop");
    expect(g.lines).toBe(4);
    expect(g.tetras).toBe(1);
    expect(g.score).toBe(dropPts + 800);
    expect(g.board.every((c) => c === 0)).toBe(true);
    expect(g.clear?.rows.length).toBe(4);
  });

  test("4 linhas seguidas valem 1,5× e combo soma", () => {
    const g = newGame(1, "solo");
    for (let round = 0; round < 2; round++) {
      fillRows(g, 4, [9]);
      setPiece(g, 1);
      input(g, "cw");
      for (let i = 0; i < 10; i++) input(g, "right");
      g.score = 0;
      input(g, "drop");
    }
    // segunda: 800 × 1,5 + combo 50 × 1 (mais a queda)
    expect(g.clear?.b2b).toBe(true);
    expect(g.clear?.points).toBe(1200 + 50);
    expect(g.score).toBeGreaterThanOrEqual(1250);
  });

  test("cada peça travada guarda o seu número; a limpeza desce os números junto", () => {
    const g = newGame(1, "solo");
    setPiece(g, 2);
    input(g, "drop");
    setPiece(g, 2);
    input(g, "drop");
    const ids = g.board.map((c, i) => (c ? g.ids[i] : -1)).filter((n) => n >= 0);
    expect(new Set(ids).size).toBe(2);
    expect(ids.filter((n) => n === ids[0]).length).toBe(4);
    // uma linha completa embaixo: o O de cima desce e leva o número
    const g2 = newGame(1, "solo");
    fillRows(g2, 1, [0, 1]);
    setPiece(g2, 2);
    for (let i = 0; i < 4; i++) input(g2, "left");
    input(g2, "drop");
    expect(g2.lines).toBe(1);
    const left = g2.board.map((c, i) => (c ? i : -1)).filter((i) => i >= 0);
    expect(left.length).toBe(2);
    expect(new Set(left.map((i) => g2.ids[i])).size).toBe(1);
    expect(left.every((i) => Math.floor(i / COLS) === ROWS - 1)).toBe(true);
  });

  test("linha que não completa não some", () => {
    const g = newGame(1, "solo");
    fillRows(g, 1, [0, 1, 2, 3, 4]);
    setPiece(g, 2);
    input(g, "drop");
    expect(g.lines).toBe(0);
    expect(g.combo).toBe(-1);
  });

  test("solo: nível sobe a cada 10 linhas", () => {
    const g = newGame(1, "solo");
    for (let i = 0; i < 3; i++) {
      fillRows(g, 4, [9]);
      setPiece(g, 1);
      input(g, "cw");
      for (let k = 0; k < 10; k++) input(g, "right");
      input(g, "drop");
    }
    expect(g.lines).toBe(12);
    expect(g.level).toBe(2);
  });

  test("1×1: nível sobe a cada 30 s", () => {
    const g = newGame(1, "versus");
    g.board.fill(0);
    // sem deixar a peça cair até o fim: só conta o tempo
    for (let t = 0; t < VERSUS_LEVEL_TICKS; t++) {
      step(g);
      if (g.over) break;
    }
    expect(g.level).toBe(2);
  });

  test("acaba quando a peça nasce em cima de blocos", () => {
    const g = newGame(1, "solo");
    for (let x = 3; x < 7; x++) {
      g.board[HIDDEN * COLS + x] = 8;
      g.board[(HIDDEN + 1) * COLS + x] = 8;
    }
    setPiece(g, 2);
    g.piece!.y = 0;
    input(g, "drop");
    expect(g.over).toBe(true);
    expect(g.overTick).toBe(g.tick);
  });
});

describe("partidas inteiras", () => {
  /** Joga com o bot até acabar ou chegar ao limite de peças. */
  function play(seed: number, mode: "solo" | "versus", maxPieces: number) {
    const g = newGame(seed, mode);
    const log: { tick: number; key: Key }[] = [];
    let keys: Key[] = [];
    while (!g.over && g.pieces < maxPieces) {
      if (!keys.length) keys = plan(g);
      const k = keys.shift()!;
      log.push({ tick: g.tick, key: k });
      input(g, k);
      // um passo entre os comandos, como quem joga de verdade
      step(g);
    }
    return { g, log };
  }

  test("o bot faz linhas e o campo nunca tem nada fora do lugar", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const { g } = play(seed, "solo", 200);
      expect(g.lines).toBeGreaterThan(30);
      expect(g.board.length).toBe(ROWS * COLS);
      expect(g.board.every((c) => c >= 0 && c <= 8)).toBe(true);
    }
  }, 60_000);

  test("refazer com os mesmos comandos dá o mesmo jogo", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { g, log } = play(seed, "versus", 150);
      const copy = newGame(seed, "versus");
      for (const { tick, key } of log) {
        advanceTo(copy, tick);
        input(copy, key);
      }
      advanceTo(copy, g.tick);
      expect(pack(copy)).toEqual(pack(g));
    }
  });

  test("simulação: 300 partidas solo sem travar", () => {
    let total = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const g = newGame(seed * 7919, "solo");
      let keys: Key[] = [];
      for (let n = 0; n < 20000 && !g.over && g.pieces < 60; n++) {
        if (!keys.length) keys = plan(g);
        input(g, keys.shift()!);
        step(g);
      }
      expect(g.pieces).toBeGreaterThan(0);
      total += g.lines;
    }
    expect(total).toBeGreaterThan(300 * 10);
  }, 120_000);

  test("sem ninguém jogando, a partida acaba sozinha", () => {
    const g = newGame(5, "versus");
    advanceTo(g, 60 * 60 * 10);
    expect(g.over).toBe(true);
  });
});

describe("1×1 no servidor", () => {
  const run = (s: ReturnType<typeof newVersus>, ticks: number) => {
    for (let i = 0; i < ticks; i++) stepVersus(s);
  };

  test("contagem antes de começar; comandos na contagem não valem", () => {
    const s = newVersus([0, 1], 9);
    expect(s.phase).toBe("countdown");
    applyVersus(s, { type: "input", seat: 0, tick: 0, key: "drop" });
    expect(s.games[0].pieces).toBe(0);
    run(s, COUNTDOWN_TICKS);
    expect(s.phase).toBe("playing");
  });

  test("os dois recebem as mesmas peças", () => {
    const s = newVersus([0, 1], 77);
    expect(s.games[0].queue).toEqual(s.games[1].queue);
    expect(s.games[0].piece).toEqual(s.games[1].piece);
  });

  test("o servidor refaz os comandos e chega ao mesmo campo do navegador", () => {
    const s = newVersus([0, 1], 3);
    run(s, COUNTDOWN_TICKS);
    const local = newGame(3, "versus");
    let keys: Key[] = [];
    for (let t = 0; t < 2000 && !local.over; t++) {
      if (t % 4 === 0) {
        if (!keys.length) keys = plan(local);
        const key = keys.shift()!;
        applyVersus(s, { type: "input", seat: 0, tick: local.tick, key });
        input(local, key);
      }
      step(local);
      stepVersus(s);
    }
    advanceTo(s.games[0], local.tick);
    expect(pack(s.games[0])).toEqual(pack(local));
    expect(s.rev[0]).toBe(0);
  });

  test("comando atrasado demais vale agora e marca correção", () => {
    const s = newVersus([0, 1], 3);
    run(s, COUNTDOWN_TICKS + LAG_TICKS + 30);
    applyVersus(s, { type: "input", seat: 0, tick: 5, key: "left" });
    expect(s.rev[0]).toBe(1);
  });

  test("quem acaba primeiro perde; quem fica parado acaba sozinho", () => {
    const s = newVersus([0, 1], 11);
    run(s, COUNTDOWN_TICKS);
    // o lugar 1 joga com o bot; o lugar 0 não faz nada
    const local = newGame(11, "versus");
    let keys: Key[] = [];
    for (let t = 0; t < 60 * 60 * 15 && s.phase !== "over"; t++) {
      if (t % 4 === 0 && !local.over) {
        if (!keys.length) keys = plan(local);
        const key = keys.shift()!;
        applyVersus(s, { type: "input", seat: 1, tick: local.tick, key });
        input(local, key);
      }
      step(local);
      stepVersus(s);
    }
    expect(s.phase).toBe("over");
    expect(s.winner).toBe(1);
    expect(versusOutcome(s, 1).outcome).toBe("win");
    expect(versusOutcome(s, 0).outcome).toBe("loss");
    expect(versusOutcome(s, 0).data.ms).toBeGreaterThan(0);
  });

  test("ninguém jogando: acabam no mesmo passo e dá empate", () => {
    const s = newVersus([0, 1], 4);
    run(s, COUNTDOWN_TICKS + 60 * 60 * 10);
    expect(s.phase).toBe("over");
    expect(s.winner).toBeNull();
    expect(versusOutcome(s, 0).outcome).toBe("draw");
  });

  test("quem sai da partida perde na hora", () => {
    const s = newVersus([0, 1], 4);
    run(s, COUNTDOWN_TICKS + 200);
    applyVersus(s, { type: "abandon", seat: 0 });
    run(s, 1);
    expect(s.phase).toBe("over");
    expect(s.winner).toBe(1);
  });

  test("visão: partida empacotada volta igual", () => {
    const s = newVersus([0, 1], 8);
    run(s, COUNTDOWN_TICKS + 100);
    const v = versusView(s, 0);
    expect(v.players.length).toBe(2);
    expect(unpack(JSON.parse(JSON.stringify(v.players[0].game)))).toEqual(s.games[0]);
  });

  test("lugar fora da partida e comando inválido dão erro", () => {
    const s = newVersus([0, 1], 8);
    expect(applyVersus(s, { type: "input", seat: 3, tick: 0, key: "left" }).ok).toBe(false);
    expect(applyVersus(s, { type: "input", seat: 0, tick: 0, key: "pular" as Key }).ok).toBe(false);
  });
});
