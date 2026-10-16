import { MAX_PIP, type Board, type Side, type Tile } from "./types";

/** As 28 peças, de 0-0 a 6-6. */
export function makeSet(): Tile[] {
  const out: Tile[] = [];
  for (let a = 0; a <= MAX_PIP; a++) for (let b = a; b <= MAX_PIP; b++) out.push([a, b]);
  return out;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Peça em ordem crescente (aceita os números em qualquer ordem). */
export const tile = (a: number, b: number): Tile => (a <= b ? [a, b] : [b, a]);
export const sameTile = (x: Tile, y: Tile) => x[0] === y[0] && x[1] === y[1];
export const isDouble = (t: Tile) => t[0] === t[1];
export const pips = (t: Tile) => t[0] + t[1];
export const handPips = (hand: Tile[]) => hand.reduce((n, t) => n + pips(t), 0);
export const hasNumber = (t: Tile, n: number) => t[0] === n || t[1] === n;
/** Nome curto, ex.: "3-5". */
export const tileName = (t: Tile) => `${t[0]}-${t[1]}`;

/** Pontas [esquerda, direita], ou null com a mesa vazia. */
export function endsOf(b: Board): [number, number] | null {
  if (!b.first) return null;
  return [b.left.at(-1)?.outer ?? b.first.inner, b.right.at(-1)?.outer ?? b.first.outer];
}

/** Pontas onde a peça entra. Com a mesa vazia, qualquer peça entra (sem lado). */
export function sidesFor(b: Board, t: Tile): Side[] {
  const ends = endsOf(b);
  if (!ends) return ["right"];
  const out: Side[] = [];
  if (hasNumber(t, ends[0])) out.push("left");
  if (hasNumber(t, ends[1])) out.push("right");
  // pontas iguais: tanto faz o lado, fica um só
  if (out.length === 2 && ends[0] === ends[1]) return ["right"];
  return out;
}

/** Algum dos números da peça encaixa numa ponta. */
export const fits = (b: Board, t: Tile) => sidesFor(b, t).length > 0;

/** Total de peças na mesa. */
export const boardSize = (b: Board) => (b.first ? 1 + b.left.length + b.right.length : 0);

/** Peças da mesa da ponta esquerda à direita, com os números na ordem da esquerda para a direita. */
export function lineOf(b: Board): { tile: Tile; l: number; r: number; n: number }[] {
  if (!b.first) return [];
  return [
    ...[...b.left].reverse().map((p) => ({ tile: p.tile, l: p.outer, r: p.inner, n: p.n })),
    { tile: b.first.tile, l: b.first.inner, r: b.first.outer, n: b.first.n },
    ...b.right.map((p) => ({ tile: p.tile, l: p.inner, r: p.outer, n: p.n })),
  ];
}
