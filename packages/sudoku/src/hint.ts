import { popcount, SIZE } from "./board";
import { candidates, nextStep } from "./solver";
import type { GameState, HintReason, Technique } from "./types";

export interface Hint {
  cell: number;
  value: number;
  reason: HintReason;
}

/**
 * Próxima casa que dá para deduzir no tabuleiro atual. Ignora as anotações do jogador
 * (podem estar erradas). Número errado na mesa vem primeiro.
 */
export function bestHint(s: Pick<GameState, "values" | "solution">): Hint | null {
  const wrong = s.values.findIndex((v, i) => v && v !== s.solution[i]);
  if (wrong >= 0) return { cell: wrong, value: s.solution[wrong], reason: { kind: "wrong", via: [] } };

  const values = s.values.slice();
  if (values.every(Boolean)) return null;
  const cand = candidates(values);
  const via: Technique[] = [];
  for (;;) {
    const step = nextStep(cand);
    if (!step) break;
    if (step.type === "place") {
      const reason: HintReason = step.technique === "single" ? { kind: "cell", via } : { kind: "unit", unit: step.unit, via };
      return { cell: step.cell, value: step.value, reason };
    }
    if (!via.includes(step.technique)) via.push(step.technique);
    for (const [i, m] of step.removals) cand[i] &= ~m;
  }

  // sem dedução simples: revela a casa com menos opções
  let best = -1;
  for (let i = 0; i < SIZE; i++) if (!values[i] && (best < 0 || popcount(cand[i]) < popcount(cand[best]))) best = i;
  return { cell: best, value: s.solution[best], reason: { kind: "reveal", via: [] } };
}
