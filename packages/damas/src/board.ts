import { BLACK_MAN, SIZE, SQUARES, WHITE_MAN, type Cell, type Move } from "./types";

// Geometria e geração de lances. Trabalha num array de números (o mesmo do estado) para a IA usar sem cópia.

export const rowOf = (sq: number) => Math.floor(sq / SIZE);
export const colOf = (sq: number) => sq % SIZE;
export const squareAt = (row: number, col: number) => row * SIZE + col;
/** Casa escura (onde se joga): o canto de baixo à esquerda é escuro. */
export const isDark = (sq: number) => (rowOf(sq) + colOf(sq)) % 2 === 1;
export const DARK: readonly number[] = [...Array(SQUARES).keys()].filter(isDark);

/** Direções diagonais: 0 e 1 sobem (frente das brancas), 2 e 3 descem (frente das pretas). */
const DIRS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/** RAYS[casa][direção]: casas em linha reta naquela diagonal, da mais perto para a mais longe. */
export const RAYS: readonly (readonly (readonly number[])[])[] = [...Array(SQUARES).keys()].map((sq) =>
  DIRS.map(([dr, dc]) => {
    const ray: number[] = [];
    for (let r = rowOf(sq) + dr, c = colOf(sq) + dc; r >= 0 && r < SIZE && c >= 0 && c < SIZE; r += dr, c += dc) ray.push(squareAt(r, c));
    return ray;
  }),
);

/** Lado da peça: 1 brancas, -1 pretas, 0 vazia. */
export const sideOf = (p: number) => Math.sign(p);
export const isKing = (p: number) => p === 2 || p === -2;
/** Fileira em que a pedra vira dama. */
export const lastRow = (side: number) => (side > 0 ? 0 : SIZE - 1);

/** Tabuleiro inicial: pretas nas três fileiras de cima, brancas nas três de baixo. */
export function initialBoard(): Cell[] {
  return [...Array(SQUARES).keys()].map((sq) => (!isDark(sq) ? 0 : rowOf(sq) < 3 ? BLACK_MAN : rowOf(sq) > 4 ? WHITE_MAN : 0));
}

/** A peça em `from` tem alguma captura (só o primeiro pulo; rápido, sem copiar o tabuleiro). */
function canCapture(board: readonly number[], from: number): boolean {
  const piece = board[from];
  const side = sideOf(piece);
  for (const ray of RAYS[from]) {
    let i = 0;
    if (isKing(piece)) while (i < ray.length && board[ray[i]] === 0) i++;
    if (i + 1 < ray.length && sideOf(board[ray[i]]) === -side && board[ray[i + 1]] === 0) return true;
  }
  return false;
}

/** Todas as capturas que começam pela peça em `from`, até o fim de cada sequência. */
export function capturesFrom(board: readonly number[], from: number): Move[] {
  if (!canCapture(board, from)) return [];
  const piece = board[from];
  const side = sideOf(piece);
  const king = isKing(piece);
  const out: Move[] = [];
  const b = board.slice();
  // a peça sai da casa de origem: pode passar por ela de novo no meio da sequência
  b[from] = 0;
  const path: number[] = [];
  const caps: number[] = [];

  const dfs = (pos: number) => {
    let more = false;
    for (const ray of RAYS[pos]) {
      if (king) {
        let i = 0;
        while (i < ray.length && b[ray[i]] === 0) i++;
        if (i >= ray.length) continue;
        const victim = ray[i];
        if (sideOf(b[victim]) !== -side || caps.includes(victim)) continue;
        for (let j = i + 1; j < ray.length && b[ray[j]] === 0; j++) {
          more = true;
          path.push(ray[j]);
          caps.push(victim);
          dfs(ray[j]);
          path.pop();
          caps.pop();
        }
      } else {
        if (ray.length < 2) continue;
        const [victim, land] = ray;
        if (sideOf(b[victim]) !== -side || caps.includes(victim) || b[land] !== 0) continue;
        more = true;
        path.push(land);
        caps.push(victim);
        dfs(land);
        path.pop();
        caps.pop();
      }
    }
    if (!more && caps.length) out.push({ from, path: path.slice(), captured: caps.slice() });
  };

  dfs(from);
  return out;
}

/** Lances sem captura da peça em `from`. */
export function stepsFrom(board: readonly number[], from: number): Move[] {
  const piece = board[from];
  const side = sideOf(piece);
  const out: Move[] = [];
  RAYS[from].forEach((ray, dir) => {
    if (isKing(piece)) {
      for (const sq of ray) {
        if (board[sq] !== 0) break;
        out.push({ from, path: [sq], captured: [] });
      }
    } else if ((side > 0 ? dir < 2 : dir >= 2) && ray.length && board[ray[0]] === 0) {
      out.push({ from, path: [ray[0]], captured: [] });
    }
  });
  return out;
}

/** Lances válidos do lado (1 brancas, -1 pretas): com captura, só as de maior número de peças. */
export function legalMoves(board: readonly number[], side: number): Move[] {
  let caps: Move[] = [];
  let best = 0;
  for (const sq of DARK) {
    if (sideOf(board[sq]) !== side) continue;
    for (const m of capturesFrom(board, sq)) {
      if (m.captured.length > best) {
        best = m.captured.length;
        caps = [m];
      } else if (m.captured.length === best) caps.push(m);
    }
  }
  if (caps.length) return caps;
  const out: Move[] = [];
  for (const sq of DARK) if (sideOf(board[sq]) === side) out.push(...stepsFrom(board, sq));
  return out;
}

/** Tabuleiro depois do lance (capturadas saem, promoção no fim). Não confere se o lance é válido. */
export function boardAfter<T extends number>(board: readonly T[], m: Move): T[] {
  const b = board.slice();
  const piece = b[m.from];
  const to = m.path[m.path.length - 1];
  b[m.from] = 0 as T;
  for (const c of m.captured) b[c] = 0 as T;
  b[to] = (!isKing(piece) && rowOf(to) === lastRow(sideOf(piece)) ? piece * 2 : piece) as T;
  return b;
}

/** Peças de cada tipo de um lado. */
export function material(board: readonly number[], side: number): { men: number; kings: number } {
  let men = 0;
  let kings = 0;
  for (const p of board) {
    if (sideOf(p) !== side) continue;
    if (isKing(p)) kings++;
    else men++;
  }
  return { men, kings };
}

export const sameMove = (a: Pick<Move, "from" | "path">, b: Pick<Move, "from" | "path">) =>
  a.from === b.from && a.path.length === b.path.length && a.path.every((sq, i) => sq === b.path[i]);
