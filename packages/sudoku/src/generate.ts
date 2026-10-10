import { mulberry32, shuffle, SIZE } from "./board";
import { randomSolution, solveLogic } from "./solver";
import type { Difficulty } from "./types";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

interface Level {
  /** técnica mais difícil permitida */
  maxTier: number;
  /** a técnica mais difícil precisa aparecer pelo menos uma vez */
  minTier: number;
  /** para de tirar pistas ao chegar aqui */
  minGivens: number;
}

export const LEVELS: Record<Difficulty, Level> = {
  easy: { maxTier: 1, minTier: 1, minGivens: 38 },
  medium: { maxTier: 1, minTier: 1, minGivens: 30 },
  hard: { maxTier: 2, minTier: 2, minGivens: 26 },
  expert: { maxTier: 3, minTier: 3, minGivens: 22 },
};

export interface Puzzle {
  puzzle: number[];
  solution: number[];
}

/**
 * Tira pistas em pares simétricos (giro de 180°) enquanto o puzzle continuar
 * resolvível só com as técnicas do nível. Resolver por lógica garante solução única.
 */
function carve(solution: number[], level: Level, rng: () => number): number[] {
  const puzzle = solution.slice();
  let givens = SIZE;
  const order = shuffle(
    Array.from({ length: 41 }, (_, i) => i),
    rng,
  );
  for (const i of order) {
    const j = SIZE - 1 - i;
    const n = i === j ? 1 : 2;
    if (givens - n < level.minGivens) continue;
    puzzle[i] = puzzle[j] = 0;
    if (solveLogic(puzzle, level.maxTier).solved) givens -= n;
    else {
      puzzle[i] = solution[i];
      puzzle[j] = solution[j];
    }
  }
  return puzzle;
}

/** Gera um puzzle do nível pedido. O mesmo `seed` gera sempre o mesmo puzzle. */
export function generate(difficulty: Difficulty, seed: number, maxTries = 200): Puzzle {
  const rng = mulberry32(seed);
  const level = LEVELS[difficulty];
  let fallback: Puzzle | null = null;
  for (let t = 0; t < maxTries; t++) {
    const solution = randomSolution(rng);
    const puzzle = carve(solution, level, rng);
    if (solveLogic(puzzle, level.maxTier).tier >= level.minTier) return { puzzle, solution };
    fallback ??= { puzzle, solution };
  }
  return fallback!;
}
