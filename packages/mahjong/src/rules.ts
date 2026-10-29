import { freeSlots, getLayout, isFree, LAYOUT_IDS, mulberry32, type Layout } from "./board";
import { clearable, deal, reshuffle } from "./deal";
import { solve } from "./solver";
import { groupOf, matches, type Kind } from "./tiles";

// Regras do Mahjong (paciência, um jogador só):
// - 144 peças empilhadas num formato. Tira-se um par de peças iguais e livres por vez; vence quem limpa a mesa.
// - Livre: nenhuma peça por cima e pelo menos um dos lados (esquerdo ou direito) vazio.
// - Flores formam par com qualquer flor, e estações com qualquer estação.
// - O sorteio sempre tem solução. Desfazer é livre; dica e embaralhar custam PENALTY_MS no relógio.
// - Embaralhar troca de lugar as peças que sobraram, mantendo uma solução quando dá. Não tem derrota.

export const PENALTY_MS = 30_000;

export interface Puzzle {
  layout: string;
  seed: number;
  /** tipo da peça de cada casa do formato */
  kinds: Kind[];
  /** uma ordem de pares que limpa a mesa (do sorteio) */
  solution: Pair[];
}

export type Pair = [number, number];

export interface GameState extends Puzzle {
  /** casas tiradas, de duas em duas, na ordem */
  removed: number[];
  hints: number;
  shuffles: number;
  undos: number;
  /** ms jogados, já com as penalidades (o relógio fica na tela; a mesa grava aqui) */
  elapsed: number;
  won: boolean;
  /** último lance, para a tela tocar som e animar */
  last: Last | null;
  /** pares que ainda limpam a mesa a partir daqui, consertado a cada lance; null = não se sabe (a dica procura) */
  plan: Pair[] | null;
}

export type Last =
  | { id: number; type: "pair"; a: number; b: number }
  | { id: number; type: "undo"; a: number; b: number }
  | { id: number; type: "hint"; a: number; b: number }
  | { id: number; type: "shuffle" };

export type Action = { type: "pair"; a: number; b: number } | { type: "undo" } | { type: "hint" } | { type: "shuffle"; seed: number };

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

export function generate(layout: string, seed: number): Puzzle {
  return { layout, seed, ...deal(layout, seed) };
}

export function gameFrom(p: Puzzle): GameState {
  const solution = p.solution.map(([a, b]): Pair => [a, b]);
  return { layout: p.layout, seed: p.seed, kinds: p.kinds.slice(), solution, removed: [], hints: 0, shuffles: 0, undos: 0, elapsed: 0, won: false, last: null, plan: solution };
}

/** Partida nova. Sem formato, sorteia um. */
export function newGame(layout: string | null = null, seed = randomSeed()): GameState {
  const id = layout ?? LAYOUT_IDS[Math.floor(Math.random() * LAYOUT_IDS.length)];
  return gameFrom(generate(id, seed));
}

export function goneOf(s: GameState): boolean[] {
  const gone = s.kinds.map(() => false);
  for (const i of s.removed) gone[i] = true;
  return gone;
}

export const remaining = (s: GameState) => s.kinds.length - s.removed.length;

/** Pares de peças livres que dá para tirar agora. */
export function moves(s: GameState, l: Layout = getLayout(s.layout), gone = goneOf(s)): [number, number][] {
  const free = freeSlots(l, gone);
  const out: [number, number][] = [];
  for (let x = 0; x < free.length; x++) for (let y = x + 1; y < free.length; y++) if (matches(s.kinds[free[x]], s.kinds[free[y]])) out.push([free[x], free[y]]);
  return out;
}

/** Os pares de `plan`, nessa ordem, limpam a mesa a partir de `gone`? */
export function validPlan(l: Layout, kinds: readonly Kind[], gone: readonly boolean[], plan: readonly Pair[]): boolean {
  const g = gone.slice();
  if (plan.length * 2 !== g.filter((x) => !x).length) return false;
  for (const [a, b] of plan) {
    if (a === b || !isFree(l, g, a) || !isFree(l, g, b) || !matches(kinds[a], kinds[b])) return false;
    g[a] = g[b] = true;
  }
  return true;
}

/**
 * Plano depois de tirar (x, y). Se era um par do plano, só sai dele. Senão os parceiros de x e de y viram um par
 * (são iguais entre si), no lugar do primeiro ou do segundo par. Se nenhum dos dois serve, fica sem plano
 * (a dica procura outro na hora, para o lance não pesar).
 */
function replan(l: Layout, kinds: readonly Kind[], gone: readonly boolean[], plan: Pair[] | null, x: number, y: number): Pair[] | null {
  if (!plan) return null;
  const px = plan.findIndex((p) => p.includes(x));
  const py = plan.findIndex((p) => p.includes(y));
  if (px < 0 || py < 0) return null;
  if (px === py) return plan.filter((_, k) => k !== px);
  const pair: Pair = [plan[px].find((i) => i !== x)!, plan[py].find((i) => i !== y)!];
  const rest = plan.filter((_, k) => k !== px && k !== py);
  for (const at of [Math.min(px, py), Math.max(px, py) - 1]) {
    const cand = [...rest.slice(0, at), pair, ...rest.slice(at)];
    if (validPlan(l, kinds, gone, cand)) return cand;
  }
  return null;
}

/**
 * Par para a dica: o primeiro do plano, ou de uma solução achada pelo `solve`. Sem solução à vista, evita o par que deixa
 * a mesa impossível de limpar (ex.: as duas últimas empilhadas), prefere o que não deixa uma peça igual livre
 * sozinha (quando há 3 livres, tirar 2 erradas pode travar), depois o que solta mais peças e o mais alto.
 */
export function bestHint(s: GameState): [number, number] | null {
  const l = getLayout(s.layout);
  const gone = goneOf(s);
  const all = moves(s, l, gone);
  if (!all.length) return null;
  const path = s.plan ?? solve(l, s.kinds, gone);
  if (path?.length) return path[0];
  const rng = mulberry32(s.seed ^ s.removed.length);
  const safe = all.filter(([a, b]) => {
    const after = gone.slice();
    after[a] = after[b] = true;
    return clearable(l, after, rng, 10);
  });
  const ms = safe.length ? safe : all;
  const free = freeSlots(l, gone);
  const freeOf = (g: number) => free.filter((i) => groupOf(s.kinds[i]) === g).length;
  const left = (g: number) => s.kinds.filter((k, i) => !gone[i] && groupOf(k) === g).length;
  const score = ([a, b]: [number, number]) => {
    const g = groupOf(s.kinds[a]);
    const f = freeOf(g);
    // todas as que sobram desse tipo estão livres: tirar é sempre seguro
    let v = f === left(g) ? 100 : f === 3 ? -50 : 0;
    const after = gone.slice();
    after[a] = after[b] = true;
    v += (freeSlots(l, after).length - free.length) * 5;
    v += l.slots[a].z + l.slots[b].z;
    return v;
  };
  return ms.reduce((best, m) => (score(m) > score(best) ? m : best));
}

let lastId = 0;
const next = (s: GameState) => Math.max(lastId, s.last?.id ?? 0) + 1;

export function applyAction(s: GameState, a: Action): Result {
  if (s.won) return { ok: false, error: "A partida acabou" };
  const l = getLayout(s.layout);
  const gone = goneOf(s);
  switch (a.type) {
    case "pair": {
      if (a.a === a.b || !isFree(l, gone, a.a) || !isFree(l, gone, a.b)) return { ok: false, error: "Peça presa" };
      if (!matches(s.kinds[a.a], s.kinds[a.b])) return { ok: false, error: "Peças diferentes" };
      const removed = [...s.removed, a.a, a.b];
      gone[a.a] = gone[a.b] = true;
      const plan = replan(l, s.kinds, gone, s.plan, a.a, a.b);
      const id = (lastId = next(s));
      return { ok: true, state: { ...s, removed, plan, won: removed.length === s.kinds.length, last: { id, type: "pair", a: a.a, b: a.b } } };
    }
    case "undo": {
      if (!s.removed.length) return { ok: false, error: "Nada para desfazer" };
      const [x, y] = s.removed.slice(-2);
      // o par voltou livre como estava: tirá-lo de novo e seguir o plano limpa a mesa
      const plan: Pair[] | null = s.plan && [[x, y], ...s.plan];
      const id = (lastId = next(s));
      return { ok: true, state: { ...s, removed: s.removed.slice(0, -2), plan, undos: s.undos + 1, last: { id, type: "undo", a: x, b: y } } };
    }
    case "hint": {
      // sem plano, a dica procura um; o que achar fica para as próximas
      const plan = s.plan ?? solve(l, s.kinds, gone);
      const h = plan?.[0] ?? bestHint(s);
      if (!h) return { ok: false, error: "Sem par livre" };
      const id = (lastId = next(s));
      return { ok: true, state: { ...s, plan, hints: s.hints + 1, last: { id, type: "hint", a: h[0], b: h[1] } } };
    }
    case "shuffle": {
      if (s.removed.length === s.kinds.length) return { ok: false, error: "Mesa vazia" };
      const { kinds, solution } = reshuffle(l, s.kinds, gone, a.seed);
      const id = (lastId = next(s));
      return { ok: true, state: { ...s, kinds, plan: solution, shuffles: s.shuffles + 1, last: { id, type: "shuffle" } } };
    }
  }
}
