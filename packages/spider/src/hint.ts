import { cardOf } from "./deck";
import { canDeal, canMove, runStart } from "./rules";
import type { Board, GameState, SuitCount } from "./types";

export interface Move {
  from: number;
  index: number;
  to: number;
}

export type Hint = { type: "move"; move: Move } | { type: "deal" };

/** Todas as jogadas permitidas, com cada tamanho de grupo do topo de cada coluna. */
export function legalMoves(s: GameState): Move[] {
  const out: Move[] = [];
  s.cols.forEach((c, from) => {
    const start = runStart(s, from);
    if (start < 0) return;
    for (let index = c.length - 1; index >= start; index--)
      for (let to = 0; to < s.cols.length; to++) if (canMove(s, from, index, to)) out.push({ from, index, to });
  });
  return out;
}

/** Destinos possíveis para o grupo que começa em `index`. */
export function targetsFor(s: GameState, from: number, index: number): number[] {
  return s.cols.map((_, to) => to).filter((to) => canMove(s, from, index, to));
}

/**
 * Progresso de uma posição: sequências completas > cartas reveladas > encaixes do mesmo naipe
 * > encaixes de outro naipe > colunas vazias.
 */
export function progress(b: Pick<Board, "cols" | "hidden" | "done">, suits: SuitCount): number {
  let p = b.done.length * 100000;
  b.cols.forEach((c, i) => {
    p -= b.hidden[i] * 1000;
    if (!c.length) p += 1;
    for (let k = Math.max(b.hidden[i], 1); k < c.length; k++) {
      const below = cardOf(c[k - 1], suits);
      const card = cardOf(c[k], suits);
      if (below.rank === card.rank + 1) p += below.suit === card.suit ? 30 : 10;
    }
  });
  return p;
}

/** Posição depois da jogada (sem checar sequência completa; ela é tratada à parte). */
function after(s: GameState, m: Move): Pick<Board, "cols" | "hidden" | "done"> {
  const cols = s.cols.map((c) => c.slice());
  cols[m.to].push(...cols[m.from].splice(m.index));
  const hidden = s.hidden.slice();
  if (hidden[m.from] > 0 && hidden[m.from] >= cols[m.from].length) hidden[m.from] = cols[m.from].length - 1;
  return { cols, hidden, done: s.done };
}

/** A jogada fecha K..A? */
function completes(s: GameState, m: Move): boolean {
  const col = s.cols[m.to];
  if (col.length + s.cols[m.from].length - m.index < 13) return false;
  const moved = s.cols[m.from].slice(m.index);
  const run = [...col.slice(-(13 - moved.length)), ...moved].map((id) => cardOf(id, s.suits));
  return run.length === 13 && run.every((c, i) => c.rank === 13 - i && c.suit === run[0].suit);
}

/**
 * Melhor progresso desde a última distribuição. Uma dica precisa superá-lo: assim ela nunca
 * desfaz o que uma jogada anterior fez (ir e voltar) e a sequência de dicas sempre termina.
 */
function bestSoFar(s: GameState): number {
  let best = progress(s, s.suits);
  for (let i = s.history.length - 1; i >= 0 && s.history[i].stock.length === s.stock.length; i--)
    best = Math.max(best, progress(s.history[i], s.suits));
  return best;
}

/** Jogadas que fazem progresso, da melhor para a pior. */
export function hints(s: GameState): Move[] {
  const best = bestSoFar(s);
  const now = progress(s, s.suits);
  return legalMoves(s)
    .map((m) => {
      if (completes(s, m)) return { m, score: Infinity };
      const p = progress(after(s, m), s.suits);
      if (p <= best) return null;
      // desempate: mais cartas movidas e colunas com menos cartas viradas primeiro
      return { m, score: (p - now) * 100 + (s.cols[m.from].length - m.index) - s.hidden[m.from] };
    })
    .filter((x): x is { m: Move; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

/**
 * Melhor sugestão: uma jogada que faz progresso, senão distribuir; se o monte está bloqueado por
 * coluna vazia, uma carta para preenchê-la. Null = nenhuma jogada que ajude.
 */
export function bestHint(s: GameState): Hint | null {
  if (s.won) return null;
  const h = hints(s);
  if (h.length) return { type: "move", move: h[0] };
  if (canDeal(s)) return { type: "deal" };
  if (!s.stock.length) return null;
  // preenche sem esvaziar outra coluna, perdendo o mínimo de progresso
  const fill = legalMoves(s)
    .filter((m) => !s.cols[m.to].length && m.index > 0)
    .map((m) => ({ m, p: progress(after(s, m), s.suits) }))
    .sort((a, b) => b.p - a.p)[0];
  return fill ? { type: "move", move: fill.m } : null;
}
