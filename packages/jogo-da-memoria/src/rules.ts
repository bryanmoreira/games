/**
 * Jogo da Memória: 30 cartas, 15 pares, sem prévia e sem limite de tempo.
 * Solo ou dois jogadores. Revelar duas cartas conta uma tentativa.
 * Acertar guarda o par e mantém a vez; errar passa ao próximo jogador.
 * As duas cartas ficam expostas até `advance`, inclusive quando formam par.
 * Maior número de pares vence; com 15 pares e dois jogadores não há empate.
 * O relógio vem de fora, para manter a engine pura e determinística.
 */
import { CARDS, PAIRS, parseSettings, type Action, type GameState, type Settings } from "./types";

export function makeDeck(rng = Math.random): number[] {
  const deck = Array.from({ length: CARDS }, (_, i) => i % PAIRS);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
export function newGame(rng = Math.random, players = [0], settings?: Settings, prev?: GameState | null, at = 0): GameState {
  if (players.length < 1 || players.length > 2 || new Set(players).size !== players.length || players.some(p => !Number.isInteger(p) || p < 0 || p > 1)) throw new Error("Lugares inválidos");
  const starter = prev ? players[(players.indexOf(prev.starter) + 1) % players.length] : players[0];
  return {
    deck: makeDeck(rng), players: [...players], turn: starter, starter, phase: "playing", open: [],
    owners: Array(CARDS).fill(null),
    stats: Array.from({ length: 2 }, () => ({ pairs: 0, attempts: 0, mistakes: 0, streak: 0, bestStreak: 0 })),
    memory: [], history: [], settings: parseSettings(settings), winners: [], gameNo: (prev?.gameNo ?? 0) + 1,
    startedAt: at, finishedAt: null,
  };
}
export function applyAction(state: GameState, a: Action, at = 0): { ok: true; state: GameState } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!a || state.phase === "gameOver") return fail("Partida encerrada");
  if (a.type === "advance") {
    if (state.phase !== "reveal") return fail("Nada para resolver");
    const s = structuredClone(state);
    const [i, j] = s.open;
    const st = s.stats[s.turn];
    if (s.deck[i] === s.deck[j]) {
      s.owners[i] = s.owners[j] = s.turn;
      st.pairs++;
      st.streak++;
      st.bestStreak = Math.max(st.bestStreak, st.streak);
      s.memory = s.memory.filter(x => x !== i && x !== j);
    } else {
      st.mistakes++;
      st.streak = 0;
      s.turn = s.players[(s.players.indexOf(s.turn) + 1) % s.players.length];
    }
    s.open = [];
    s.phase = "playing";
    if (s.owners.every(x => x !== null)) {
      s.phase = "gameOver";
      const best = Math.max(...s.players.map(p => s.stats[p].pairs));
      s.winners = s.players.filter(p => s.stats[p].pairs === best);
      s.finishedAt = at;
    }
    return { ok: true, state: s };
  }
  if (a.type !== "flip" || a.seat !== state.turn || state.phase !== "playing") return fail("Espere sua vez");
  if (!Number.isInteger(a.index) || a.index < 0 || a.index >= CARDS || state.owners[a.index] !== null || state.open.includes(a.index)) return fail("Carta indisponível");
  const s = structuredClone(state);
  s.open.push(a.index);
  s.history.push(a.index);
  s.memory = [...s.memory.filter(x => x !== a.index), a.index];
  if (s.open.length === 2) {
    s.stats[s.turn].attempts++;
    s.phase = "reveal";
  }
  return { ok: true, state: s };
}

/** Reconstitui um solo salvo/recebido sem confiar em placar ou fase enviados pelo cliente. */
export function replay(deck: unknown, history: unknown): GameState | null {
  if (!Array.isArray(deck) || deck.length !== CARDS || deck.some(f => !Number.isInteger(f) || f < 0 || f >= PAIRS)) return null;
  if (Array.from({ length: PAIRS }, (_, f) => deck.filter(x => x === f).length).some(n => n !== 2)) return null;
  if (!Array.isArray(history) || history.length > 20_000) return null;
  let s = newGame();
  s.deck = [...deck];
  for (const index of history) {
    if (s.phase === "reveal") {
      const r = applyAction(s, { type: "advance" });
      if (!r.ok) return null;
      s = r.state;
    }
    const r = applyAction(s, { type: "flip", seat: 0, index });
    if (!r.ok) return null;
    s = r.state;
  }
  return s;
}
