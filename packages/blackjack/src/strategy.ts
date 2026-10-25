import { cardValue, handValue, isPair } from "./cards";
import type { Card, Rank } from "./types";

export type Move = "hit" | "stand" | "double" | "split";

/**
 * Estratégia básica para 6 baralhos, banca compra no 17 mole (H17), dobra depois de dividir e sem desistência.
 * Letras: H = pede, S = para, D = dobra (senão pede), Ds = dobra (senão para), P = divide.
 * Colunas: carta da banca 2, 3, 4, 5, 6, 7, 8, 9, 10, A.
 */
type Code = "H" | "S" | "D" | "Ds" | "P";

const row = (s: string) => s.split(" ") as Code[];

/** Total duro de 8 a 17 (abaixo pede, acima para). */
export const HARD: Record<number, Code[]> = {
  8: row("H H H H H H H H H H"),
  9: row("H D D D D H H H H H"),
  10: row("D D D D D D D D H H"),
  11: row("D D D D D D D D D D"),
  12: row("H H S S S H H H H H"),
  13: row("S S S S S H H H H H"),
  14: row("S S S S S H H H H H"),
  15: row("S S S S S H H H H H"),
  16: row("S S S S S H H H H H"),
  17: row("S S S S S S S S S S"),
};

/** Total mole (ás valendo 11) de 13 a 20. */
export const SOFT: Record<number, Code[]> = {
  13: row("H H H D D H H H H H"),
  14: row("H H H D D H H H H H"),
  15: row("H H D D D H H H H H"),
  16: row("H H D D D H H H H H"),
  17: row("H D D D D H H H H H"),
  18: row("Ds Ds Ds Ds Ds S S H H H"),
  19: row("S S S S Ds S S S S S"),
  20: row("S S S S S S S S S S"),
};

/** Pares pelo valor da carta (1 = ases). Os pares de 5 e de 10 seguem o total duro. */
export const PAIRS: Record<number, Code[]> = {
  1: row("P P P P P P P P P P"),
  2: row("P P P P P P H H H H"),
  3: row("P P P P P P H H H H"),
  4: row("H H H P P H H H H H"),
  6: row("P P P P P H H H H H"),
  7: row("P P P P P P H H H H"),
  8: row("P P P P P P P P P P"),
  9: row("P P P P P S P P S S"),
};

/** Coluna da carta da banca: 2..10 → 0..8, ás → 9. */
export const upColumn = (up: Rank) => {
  const v = cardValue(up);
  return v === 1 ? 9 : v - 2;
};

function lookup(cards: readonly Card[], up: Rank, canSplit: boolean): Code {
  const col = upColumn(up);
  if (canSplit && isPair(cards)) {
    const pr = PAIRS[cardValue(cards[0].rank)];
    if (pr && pr[col] === "P") return "P";
  }
  const { total, soft } = handValue(cards);
  if (soft && total >= 13) return SOFT[Math.min(total, 20)][col] ?? "S";
  if (total < 8) return "H";
  if (total > 17) return "S";
  return HARD[total][col];
}

/** Jogada da estratégia básica para a mão contra a carta da banca. */
export function advise(cards: readonly Card[], up: Rank, opts: { canDouble: boolean; canSplit: boolean }): Move {
  const code = lookup(cards, up, opts.canSplit);
  switch (code) {
    case "P":
      return "split";
    case "D":
      return opts.canDouble ? "double" : "hit";
    case "Ds":
      return opts.canDouble ? "double" : "stand";
    case "H":
      return "hit";
    default:
      return "stand";
  }
}
