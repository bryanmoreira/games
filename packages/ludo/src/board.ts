import { ARM, BASE, HOME, LAST_TRACK, TRACK, type Color } from "./types";

/** Casa da grade 15×15: [linha, coluna]. Vermelho em cima à esquerda, depois verde, amarelo e azul no sentido horário. */
export type Cell = readonly [number, number];

/** Gira uma casa 90° no sentido horário em volta do centro. */
const cw = ([r, c]: Cell): Cell => [c, 14 - r];
const turnCw = (cells: Cell[], k: number) => cells.map((x) => Array.from({ length: k }).reduce<Cell>((p) => cw(p), x));

// trecho do circuito de uma cor: da saída do vermelho até antes da saída do verde (13 casas)
const ARM_CELLS: Cell[] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], [0, 8],
];

/** As 52 casas do circuito, a partir da saída do vermelho. */
export const TRACK_CELLS: Cell[] = [0, 1, 2, 3].flatMap((k) => turnCw(ARM_CELLS, k));

/** Reta final de cada cor (5 casas, de fora para o centro). */
export const HOME_CELLS: Cell[][] = [0, 1, 2, 3].map((k) =>
  turnCw(
    [
      [7, 1],
      [7, 2],
      [7, 3],
      [7, 4],
      [7, 5],
    ],
    k,
  ),
);

/** Casa do circuito (0 a 51) onde a cor sai da base. */
export const startOf = (color: Color) => color * ARM;

/** Casas do circuito sem captura: as saídas e as estrelas (8 depois de cada saída). */
export const SAFE = new Set([0, 1, 2, 3].flatMap((c) => [startOf(c), (startOf(c) + 8) % TRACK]));

/** Casa do circuito de uma peça, ou null fora dele (base, reta final, chegada). */
export function trackIndex(color: Color, progress: number): number | null {
  return progress >= 0 && progress <= LAST_TRACK ? (startOf(color) + progress) % TRACK : null;
}

/** Casa da grade em que a peça está (null na base e na chegada; quem desenha decide). */
export function cellOf(color: Color, progress: number): Cell | null {
  if (progress === BASE || progress === HOME) return null;
  const t = trackIndex(color, progress);
  return t !== null ? TRACK_CELLS[t] : HOME_CELLS[color][progress - LAST_TRACK - 1];
}
