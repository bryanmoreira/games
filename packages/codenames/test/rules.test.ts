import { describe, expect, test } from "bun:test";
import {
  agentSeats,
  applyAction,
  BOARD,
  canStart,
  clueError,
  DEFAULT_SETTINGS,
  DEFAULT_WORDS,
  masterSeats,
  newGame,
  normalize,
  parseSettings,
  parseWords,
  pickWords,
  remaining,
  roleOf,
  teamOf,
  viewFor,
  type Action,
  type GameState,
  type Key,
  type Seat,
  type Team,
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

// vermelho: mestre 0, agentes 1 e 2 · azul: mestre 6, agente 7
const PLAYERS: Seat[] = [0, 1, 2, 6, 7];

function apply(s: GameState, a: Action): GameState {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(`${a.type}: ${r.error}`);
  return r.state;
}

/** Partida com o vermelho começando. */
function game(seed = 1): GameState {
  let s = newGame(seeded(seed), { players: PLAYERS, settings: DEFAULT_SETTINGS });
  if (s.starter !== 0) s = newGame(seeded(seed), { players: PLAYERS, settings: DEFAULT_SETTINGS }, s);
  return s;
}

const find = (s: GameState, key: Key, skip = 0) => s.cards.map((c, i) => (c.key === key && !c.revealed ? i : -1)).filter((i) => i >= 0)[skip];

describe("lugares", () => {
  test("time e papel por lugar: 1 mestre e 5 agentes por time", () => {
    expect([0, 1, 5].map(teamOf)).toEqual([0, 0, 0]);
    expect([6, 11].map(teamOf)).toEqual([1, 1]);
    expect([0, 6].map(roleOf)).toEqual(["master", "master"]);
    expect([1, 5, 7, 11].map(roleOf)).toEqual(["agent", "agent", "agent", "agent"]);
    expect(masterSeats(1)).toEqual([6]);
    expect(agentSeats(0)).toEqual([1, 2, 3, 4, 5]);
    expect(agentSeats(1)).toEqual([7, 8, 9, 10, 11]);
  });

  test("precisa de mestre e agente nos dois times", () => {
    expect(canStart([0, 1, 6, 7])).toBe(true);
    expect(canStart([0, 5, 6, 11])).toBe(true);
    expect(canStart([0, 6, 7])).toBe(false); // vermelho sem agente
    expect(canStart([0, 1, 7, 8])).toBe(false); // azul sem mestre
    expect(canStart([0, 1, 2, 3])).toBe(false);
  });
});

describe("palavras", () => {
  test("quebra por linha, sem vazias nem repetidas", () => {
    expect(parseWords("Gato\n\n  cão \r\ngato\nÁgua\nagua\nPolvo   roxo")).toEqual(["Gato", "cão", "Água", "Polvo roxo"]);
  });

  test("lista pronta tem palavras suficientes e sem repetição", () => {
    expect(DEFAULT_WORDS.length).toBeGreaterThan(300);
    expect(new Set(DEFAULT_WORDS.map(normalize)).size).toBe(DEFAULT_WORDS.length);
  });

  test("lista curta é completada com a pronta", () => {
    const words = pickWords(["Gato", "Cachorro", "Xícara"], seeded(3));
    expect(words).toHaveLength(BOARD);
    expect(words).toContain("Gato");
    expect(words).toContain("Xícara");
    // "Cachorro" está nas duas listas: entra uma vez só
    expect(words.filter((w) => normalize(w) === "cachorro")).toHaveLength(1);
    expect(new Set(words.map(normalize)).size).toBe(BOARD);
  });

  test("lista longa sorteia só dela", () => {
    const custom = Array.from({ length: 40 }, (_, i) => `P${i}`);
    const words = pickWords(custom, seeded(4));
    expect(words).toHaveLength(BOARD);
    expect(words.every((w) => custom.includes(w))).toBe(true);
  });

  test("evita repetir as palavras da partida anterior quando dá", () => {
    const custom = Array.from({ length: 50 }, (_, i) => `P${i}`);
    const first = pickWords(custom, seeded(5));
    const second = pickWords(custom, seeded(6), first);
    expect(second.some((w) => first.includes(w))).toBe(false);
  });

  test("configuração inválida mantém a anterior", () => {
    const s = parseSettings({ words: "A\nB", time: 90 });
    expect(s).toEqual({ words: "A\nB", time: 90 });
    expect(parseSettings({ time: 45 }, s)).toEqual(s);
    expect(parseSettings({ words: 3 }, s).words).toBe("A\nB");
  });
});

describe("partida nova", () => {
  test("9 do time que começa, 8 do outro, 7 civis e 1 assassino", () => {
    const s = newGame(seeded(9), { players: PLAYERS, settings: DEFAULT_SETTINGS });
    const count = (k: Key) => s.cards.filter((c) => c.key === k).length;
    expect(count(s.starter)).toBe(9);
    expect(count(s.starter === 0 ? 1 : 0)).toBe(8);
    expect(count("neutral")).toBe(7);
    expect(count("assassin")).toBe(1);
    expect(s.turn).toBe(s.starter);
    expect(s.phase).toBe("clue");
  });

  test("De novo alterna quem começa e troca as palavras", () => {
    const a = newGame(seeded(10), { players: PLAYERS, settings: DEFAULT_SETTINGS });
    const b = newGame(seeded(11), { players: PLAYERS, settings: DEFAULT_SETTINGS }, a);
    expect(b.starter).not.toBe(a.starter);
    expect(b.gameNo).toBe(2);
    expect(b.cards.some((c) => a.cards.some((x) => x.word === c.word))).toBe(false);
  });
});

describe("visão", () => {
  test("mestre vê o mapa; agente só o que foi revelado", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 1 });
    const i = find(s, "neutral");
    s = apply(s, { type: "guess", seat: 1, index: i });
    const master = viewFor(s, 6);
    const agent = viewFor(s, 7);
    expect(master.cards.every((c) => c.key !== null)).toBe(true);
    expect(agent.cards.filter((c) => c.key !== null)).toHaveLength(1);
    expect(agent.cards[i].key).toBe("neutral");
  });

  test("no fim todos veem o mapa", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 1 });
    s = apply(s, { type: "guess", seat: 1, index: find(s, "assassin") });
    expect(viewFor(s, 1).cards.every((c) => c.key !== null)).toBe(true);
  });
});

describe("dica", () => {
  test("só o mestre do time da vez", () => {
    const s = game();
    expect(applyAction(s, { type: "clue", seat: 6, word: "x", number: 1 }).ok).toBe(false);
    expect(applyAction(s, { type: "clue", seat: 1, word: "x", number: 1 }).ok).toBe(false);
    expect(applyAction(s, { type: "clue", seat: 0, word: "x", number: 1 }).ok).toBe(true);
  });

  test("uma palavra, sem número e fora da mesa", () => {
    const s = game();
    expect(clueError(s, "")).not.toBeNull();
    expect(clueError(s, "duas palavras")).not.toBeNull();
    expect(clueError(s, "abc1")).not.toBeNull();
    expect(clueError(s, s.cards[0].word.toUpperCase())).not.toBeNull();
    expect(clueError(s, "guarda-chuva")).toBeNull();
    expect(applyAction(s, { type: "clue", seat: 0, word: "ok", number: 10 }).ok).toBe(false);
  });

  test("palavra já revelada pode virar dica", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 2 });
    const i = find(s, 0);
    s = apply(s, { type: "guess", seat: 1, index: i });
    expect(clueError(s, s.cards[i].word)).toBeNull();
  });
});

describe("toques", () => {
  test("N toques mais um com a dica N", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 1 });
    expect(s.guessesLeft).toBe(2);
    s = apply(s, { type: "guess", seat: 1, index: find(s, 0) });
    expect(s.turn).toBe(0);
    s = apply(s, { type: "guess", seat: 2, index: find(s, 0) });
    expect(s.turn).toBe(1);
    expect(s.phase).toBe("clue");
  });

  test("0 e ∞ não têm limite", () => {
    for (const number of [0, null]) {
      let s = game();
      s = apply(s, { type: "clue", seat: 0, word: "dica", number });
      expect(s.guessesLeft).toBeNull();
      for (let k = 0; k < 5; k++) s = apply(s, { type: "guess", seat: 1, index: find(s, 0) });
      expect(s.turn).toBe(0);
    }
  });

  test("civil ou adversário passa a vez", () => {
    for (const key of ["neutral", 1] as Key[]) {
      let s = game();
      s = apply(s, { type: "clue", seat: 0, word: "dica", number: 3 });
      s = apply(s, { type: "guess", seat: 1, index: find(s, key) });
      expect(s.turn).toBe(1);
      expect(s.phase).toBe("clue");
    }
  });

  test("assassino perde na hora", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 3 });
    s = apply(s, { type: "guess", seat: 1, index: find(s, "assassin") });
    expect(s.phase).toBe("gameOver");
    expect(s.winner).toBe(1);
    expect(s.reason).toBe("assassin");
  });

  test("revelar a última do adversário dá a vitória a ele", () => {
    let s = game();
    // só falta uma palavra azul
    s.cards.filter((c) => c.key === 1).slice(1).forEach((c) => (c.revealed = true));
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 1 });
    s = apply(s, { type: "guess", seat: 1, index: find(s, 1) });
    expect(s.winner).toBe(1);
    expect(s.reason).toBe("cards");
  });

  test("todas as suas reveladas vence", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: null });
    while (remaining(s, 0) > 0) s = apply(s, { type: "guess", seat: 1, index: find(s, 0) });
    expect(s.winner).toBe(0);
  });

  test("só agentes do time da vez tocam, e não em palavra revelada", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 2 });
    const i = find(s, 0);
    expect(applyAction(s, { type: "guess", seat: 0, index: i }).ok).toBe(false);
    expect(applyAction(s, { type: "guess", seat: 7, index: i }).ok).toBe(false);
    s = apply(s, { type: "guess", seat: 1, index: i });
    expect(applyAction(s, { type: "guess", seat: 2, index: i }).ok).toBe(false);
  });

  test("passar só depois do primeiro toque", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 2 });
    expect(applyAction(s, { type: "pass", seat: 1 }).ok).toBe(false);
    s = apply(s, { type: "guess", seat: 1, index: find(s, 0) });
    s = apply(s, { type: "pass", seat: 2 });
    expect(s.turn).toBe(1);
  });

  test("marcas: liga, desliga e somem ao revelar", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 2 });
    const i = find(s, 0);
    s = apply(s, { type: "mark", seat: 1, index: i });
    s = apply(s, { type: "mark", seat: 2, index: i });
    expect(s.marks).toEqual({ 1: [i], 2: [i] });
    s = apply(s, { type: "mark", seat: 2, index: i });
    expect(s.marks).toEqual({ 1: [i] });
    s = apply(s, { type: "guess", seat: 2, index: i });
    expect(s.marks).toEqual({});
    expect(applyAction(s, { type: "mark", seat: 7, index: 0 }).ok).toBe(false);
  });

  test("marcas: várias por agente, revela uma por vez", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 3 });
    const [a, b, c] = s.cards.flatMap((card, i) => (card.key === 0 ? [i] : [])).slice(0, 3);
    s = apply(s, { type: "mark", seat: 1, index: a });
    s = apply(s, { type: "mark", seat: 1, index: b });
    s = apply(s, { type: "mark", seat: 1, index: c });
    s = apply(s, { type: "mark", seat: 2, index: b });
    expect(s.marks).toEqual({ 1: [a, b, c], 2: [b] });
    s = apply(s, { type: "guess", seat: 1, index: b });
    expect(s.marks).toEqual({ 1: [a, c] });
    expect(s.cards[a].revealed).toBe(false);
    s = apply(s, { type: "mark", seat: 1, index: null });
    expect(s.marks).toEqual({});
  });

  test("espectador vê como agente e não age", () => {
    let s = game();
    s = apply(s, { type: "clue", seat: 0, word: "dica", number: 2 });
    const v = viewFor(s, null);
    expect(v.spectator).toBe(true);
    expect(v.cards.every((c) => c.key === null)).toBe(true);
    expect(v.canGuess || v.canClue || v.canPass).toBe(false);
    s = apply(s, { type: "guess", seat: 1, index: find(s, "assassin") });
    expect(viewFor(s, null).cards.every((c) => c.key !== null)).toBe(true);
  });
});

describe("tempo", () => {
  test("acabou o tempo na dica ou nos toques: a vez passa", () => {
    let s = game();
    s = apply(s, { type: "advance" });
    expect(s.turn).toBe(1);
    expect(s.timeout).toMatchObject({ team: 0, phase: "clue" });
    s = apply(s, { type: "clue", seat: 6, word: "dica", number: 1 });
    s = apply(s, { type: "advance" });
    expect(s.turn).toBe(0);
    expect(s.timeout).toMatchObject({ team: 1, phase: "guess" });
  });
});

describe("simulação", () => {
  test("300 partidas aleatórias terminam sem travar", () => {
    const rng = seeded(42);
    for (let g = 0; g < 300; g++) {
      let s = newGame(rng, { players: [0, 1, 2, 3, 6, 7, 8], settings: DEFAULT_SETTINGS });
      let steps = 0;
      while (s.phase !== "gameOver") {
        if (++steps > 500) throw new Error("travou");
        const team: Team = s.turn;
        let a: Action;
        if (rng() < 0.03) a = { type: "advance" };
        else if (s.phase === "clue") {
          const masters = s.players.filter((p) => teamOf(p) === team && roleOf(p) === "master");
          const r = rng();
          a = { type: "clue", seat: masters[0], word: `dica${g}x`.replace(/\d/g, "z"), number: r < 0.1 ? null : Math.floor(r * 4) };
        } else {
          const agents = s.players.filter((p) => teamOf(p) === team && roleOf(p) === "agent");
          const seat = agents[Math.floor(rng() * agents.length)];
          const hidden = s.cards.map((c, i) => (c.revealed ? -1 : i)).filter((i) => i >= 0);
          if (viewFor(s, seat).canPass && rng() < 0.2) a = { type: "pass", seat };
          else a = { type: "guess", seat, index: hidden[Math.floor(rng() * hidden.length)] };
        }
        s = apply(s, a);
        // nenhuma palavra muda de cor e as contas fecham
        expect(s.cards.filter((c) => c.key === "assassin")).toHaveLength(1);
      }
      expect(s.winner === 0 || s.winner === 1).toBe(true);
      if (s.reason === "cards") expect(remaining(s, s.winner!)).toBe(0);
      else expect(s.cards.find((c) => c.key === "assassin")!.revealed).toBe(true);
    }
  });
});
