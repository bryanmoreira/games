import { hintRank, status, type GameState, type Move } from "./game";
import type { Model } from "./model";
import { SECRETS } from "./secrets";

// Jogadas que precisam do vocabulário: só no servidor.

export type GuessError = "unknown" | "repeat" | "over";

/** Chute: a palavra-base e a posição dela. Repetido ou fora do vocabulário não entra. */
export function guess(model: Model, secret: number, s: GameState, input: string): { ok: true; state: GameState; move: Move } | { ok: false; error: GuessError; word?: string } {
  if (status(s) !== "playing") return { ok: false, error: "over" };
  const i = model.find(input);
  if (i === null) return { ok: false, error: "unknown" };
  const word = model.words[i];
  if (s.moves.some((m) => m.word === word)) return { ok: false, error: "repeat", word };
  const move = { word, rank: model.ranking(secret).rank[i] };
  return { ok: true, state: { ...s, moves: [...s.moves, move] }, move };
}

/** Dica: a palavra na posição de `hintRank`. */
export function hint(model: Model, secret: number, s: GameState): { ok: true; state: GameState; move: Move } | { ok: false } {
  if (status(s) !== "playing") return { ok: false };
  const r = hintRank(s, model.size);
  if (r === null) return { ok: false };
  const move = { word: model.words[model.ranking(secret).order[r - 1]], rank: r, hint: true };
  return { ok: true, state: { ...s, moves: [...s.moves, move] }, move };
}

/**
 * Refaz uma partida pelos movimentos mandados pelo navegador (as posições são recalculadas aqui).
 * null = palavra que não é palavra-base, repetida, dica diferente da que o jogo daria ou movimento depois do fim.
 */
export function replay(model: Model, secret: number, moves: readonly { word: string; hint?: boolean }[], gaveUp = false): GameState | null {
  let s: GameState = { moves: [] };
  for (const m of moves) {
    if (m.hint) {
      const r = hint(model, secret, s);
      if (!r.ok || r.move.word !== m.word) return null;
      s = r.state;
    } else {
      if (model.indexOf(m.word) === null) return null;
      const r = guess(model, secret, s, m.word);
      if (!r.ok) return null;
      s = r.state;
    }
  }
  if (gaveUp) {
    if (status(s) !== "playing") return null;
    s = { ...s, gaveUp: true };
  }
  return s;
}

/** As palavras mais próximas da secreta (a secreta primeiro). */
export function closest(model: Model, secret: number, n: number): Move[] {
  const { order } = model.ranking(secret);
  return Array.from(order.slice(0, n), (i, r) => ({ word: model.words[i], rank: r + 1 }));
}

// ---------- sorteio ----------

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Palavra secreta do modo livre: o navegador só guarda o número da partida, não a palavra. */
export const freeSecret = (id: number) => SECRETS[Math.floor(mulberry32(id ^ 0x51ce7)() * SECRETS.length)];

// ---------- palavra do dia ----------
// Sem sorteio: uma sequência fixa e embaralhada das secretas, lida em ordem, uma por dia. Cada ciclo é outro
// embaralhamento, e as palavras do fim de um ciclo não estão no começo do próximo (pelo menos `MIN_GAP_DAYS` entre duas
// vezes da mesma palavra). Mudar a lista muda a sequência; os dias já gerados ficam no banco.

export const MIN_GAP_DAYS = 60;
const DAILY_SEED = 0x9a3f1d;
const cycles: number[][] = [];

function cycle(c: number): number[] {
  while (cycles.length <= c) {
    const k = cycles.length;
    const rng = mulberry32(DAILY_SEED + k);
    const p = SECRETS.map((_, i) => i);
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    if (k > 0) {
      const recent = new Set(cycles[k - 1].slice(-MIN_GAP_DAYS));
      for (let i = 0; i < MIN_GAP_DAYS; i++) {
        if (!recent.has(p[i])) continue;
        let j: number;
        do j = MIN_GAP_DAYS + Math.floor(rng() * (p.length - MIN_GAP_DAYS));
        while (recent.has(p[j]));
        [p[i], p[j]] = [p[j], p[i]];
      }
    }
    cycles.push(p);
  }
  return cycles[c];
}

/** Palavra secreta do dia `day` (0 = primeiro dia). */
export function dailySecret(day: number): string {
  const n = SECRETS.length;
  return SECRETS[cycle(Math.floor(day / n))[day % n]];
}
