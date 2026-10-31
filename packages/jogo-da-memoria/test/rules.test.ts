import { describe, expect, test } from "bun:test";
import { applyAction, decide, makeDeck, newGame, parseSettings, replay, viewFor, type Action, type GameState } from "../src";

function rng(seed: number) { return () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; }; }
function step(s: GameState, a: Action) { const r = applyAction(s, a, 5000); if (!r.ok) throw Error(r.error); return r.state; }
function arranged(players = [0]) { const s = newGame(rng(1), players); s.deck = Array.from({ length: 30 }, (_, i) => Math.floor(i / 2)); return s; }
function pair(s: GameState, i: number, j: number) { return step(step(step(s, { type: "flip", seat: s.turn, index: i }), { type: "flip", seat: s.turn, index: j }), { type: "advance" }); }

describe("Jogo da Memória", () => {
  test("sempre 30 cartas e dois exemplares de cada fruta; sorteio determinístico", () => {
    expect(makeDeck(rng(1))).toEqual(makeDeck(rng(1)));
    for (let seed = 0; seed < 30; seed++) {
      const deck = makeDeck(rng(seed));
      expect(deck).toHaveLength(30);
      for (let f = 0; f < 15; f++) expect(deck.filter(x => x === f)).toHaveLength(2);
    }
  });
  test("acerto mantém vez, erro passa, com pausa entre tentativas e estado imutável", () => {
    const original = arranged([0, 1]);
    let s = pair(original, 0, 1);
    expect(original.history).toHaveLength(0);
    expect(s.turn).toBe(0);
    expect(s.stats[0].pairs).toBe(1);
    s = step(step(s, { type: "flip", seat: 0, index: 2 }), { type: "flip", seat: 0, index: 4 });
    expect(s.phase).toBe("reveal");
    expect(applyAction(s, { type: "flip", seat: 0, index: 6 }).ok).toBe(false);
    s = step(s, { type: "advance" });
    expect(s.turn).toBe(1);
    expect(s.stats[0]).toEqual({ pairs: 1, attempts: 2, mistakes: 1, streak: 0, bestStreak: 1 });
    expect(s.open).toEqual([]);
  });
  test("recusa índices inválidos, carta repetida, carta encontrada, vez errada e advance indevido", () => {
    let s = arranged([0, 1]);
    expect(applyAction(s, { type: "advance" }).ok).toBe(false);
    for (const index of [-1, 30, NaN, 0.5, "1" as unknown as number]) expect(applyAction(s, { type: "flip", seat: 0, index }).ok).toBe(false);
    expect(applyAction(s, { type: "flip", seat: 1, index: 0 }).ok).toBe(false);
    s = step(s, { type: "flip", seat: 0, index: 0 });
    expect(applyAction(s, { type: "flip", seat: 0, index: 0 }).ok).toBe(false);
    s = step(step(s, { type: "flip", seat: 0, index: 1 }), { type: "advance" });
    expect(applyAction(s, { type: "flip", seat: 0, index: 0 }).ok).toBe(false);
  });
  test("visão esconde cartas nunca vistas e a IA sempre lembra só quatro posições", () => {
    let s = arranged();
    expect(viewFor(s, 0).cards.every(x => x === null)).toBe(true);
    expect("deck" in viewFor(s, 0)).toBe(false);
    expect("history" in viewFor(s, 0)).toBe(false);
    s = pair(s, 0, 2);
    expect(viewFor(s, 0).cards.every(x => x === null)).toBe(true);
    expect(viewFor(s, 0).memory).toEqual([{ index: 0, value: 0 }, { index: 2, value: 1 }]);
    s.memory = Array.from({ length: 20 }, (_, i) => i);
    expect(viewFor(s, 0).memory.map(m => m.index)).toEqual([16,17,18,19]);
    for (const level of ["easy", "medium", "hard", "invalid"]) expect(parseSettings({ level })).toEqual({ level: "easy" });
  });
  test("IA usa par lembrado e completa a primeira carta sem acessar o baralho", () => {
    let s = pair(arranged(), 0, 2);
    s = pair(s, 1, 4);
    expect(decide(viewFor(s, 0), rng(1))).toEqual({ type: "flip", seat: 0, index: 0 });
    s = step(s, { type: "flip", seat: 0, index: 0 });
    expect(decide(viewFor(s, 0), rng(1))).toEqual({ type: "flip", seat: 0, index: 1 });
    expect(decide(viewFor(s, -1))).toBeNull();
  });
  test("solo termina, conta sequência de 15 e replay confere jogadas", () => {
    let s = arranged();
    for (let i = 0; i < 30; i += 2) s = pair(s, i, i + 1);
    expect(s.phase).toBe("gameOver");
    expect(s.winners).toEqual([0]);
    expect(s.stats[0]).toEqual({ pairs: 15, attempts: 15, mistakes: 0, streak: 15, bestStreak: 15 });
    expect(s.finishedAt).toBe(5000);
    const restored = replay(s.deck, s.history)!;
    expect(step(restored, { type: "advance" }).stats).toEqual(s.stats);
    expect(replay(Array(30).fill(0), [])).toBeNull();
    expect(replay(s.deck, [0, 0])).toBeNull();
    expect(replay(s.deck, [...s.history, 0])).toBeNull();
    expect(applyAction(s, { type: "advance" }).ok).toBe(false);
  });
  test("vence quem fez mais pares e o primeiro jogador alterna na revanche", () => {
    let s = arranged([0, 1]);
    for (let i = 0; i < 30; i += 2) { s.turn = i < 16 ? 0 : 1; s = pair(s, i, i + 1); }
    expect(s.winners).toEqual([0]);
    expect(s.stats.map(p => p.pairs)).toEqual([8, 7]);
    expect(newGame(rng(3), s.players, s.settings, s).starter).toBe(1);
  });
  test("recusa mais de dois jogadores e lugares fora da mesa", () => {
    expect(() => newGame(rng(1), [0,1,2])).toThrow("Lugares inválidos");
    expect(() => newGame(rng(1), [0,2])).toThrow("Lugares inválidos");
    expect(() => newGame(rng(1), [0,0])).toThrow("Lugares inválidos");
  });
  test("300 partidas entre IAs fáceis, solo ou 1×1, terminam sem travar", () => {
    for (let seed = 0; seed < 300; seed++) {
      const random = rng(seed + 1);
      let s = newGame(random, Array.from({ length: 1 + seed % 2 }, (_, i) => i));
      for (let n = 0; s.phase !== "gameOver"; n++) {
        if (n > 8000) throw Error(`Travou: ${seed}`);
        s = step(s, s.phase === "reveal" ? { type: "advance" } : decide(viewFor(s, s.turn), random)!);
      }
      expect(s.stats.reduce((sum, st) => sum + st.pairs, 0)).toBe(15);
      expect(s.winners.length).toBeGreaterThan(0);
    }
  });
});
