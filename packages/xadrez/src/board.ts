import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK, SIZE, SQUARES, type Board, type Move } from "./types";

// Geometria e geração de lances num array de números, alterado no lugar com make/unmake para a IA não copiar
// o tabuleiro a cada nó. Lance interno = número: from | to << 6 | promo << 12 | flag << 15.

export const rowOf = (sq: number) => sq >> 3;
export const colOf = (sq: number) => sq & 7;
export const squareAt = (row: number, col: number) => row * SIZE + col;
/** Casa escura: a1 (canto de baixo à esquerda das brancas) é escura. */
export const isDark = (sq: number) => (rowOf(sq) + colOf(sq)) % 2 === 1;

const FILES = "abcdefgh";
/** Nome da casa (a1…h8). */
export const squareName = (sq: number) => FILES[colOf(sq)] + (SIZE - rowOf(sq));
export const squareOf = (name: string) => squareAt(SIZE - Number(name[1]), FILES.indexOf(name[0]));

export const sideOf = (p: number) => Math.sign(p);
export const typeOf = (p: number) => (p < 0 ? -p : p);

/** Posição que a IA e a geração de lances mexem no lugar. `kings[0]` é o rei branco, `kings[1]` o preto. */
export interface Pos {
  board: Board;
  side: number;
  castle: number;
  ep: number;
  half: number;
  kings: [number, number];
}

export const FLAG_DOUBLE = 1;
export const FLAG_EP = 2;
export const FLAG_CASTLE = 3;

export const encode = (from: number, to: number, promo = 0, flag = 0) => from | (to << 6) | (promo << 12) | (flag << 15);
export const mFrom = (m: number) => m & 63;
export const mTo = (m: number) => (m >> 6) & 63;
export const mPromo = (m: number) => (m >> 12) & 7;
export const mFlag = (m: number) => m >> 15;

const KNIGHT_D = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];
/** Direções: 0-3 em linha, 4-7 na diagonal. */
const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

const inside = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const ALL = [...Array(SQUARES).keys()];

export const KNIGHT_TO: readonly (readonly number[])[] = ALL.map((sq) =>
  KNIGHT_D.flatMap(([dr, dc]) => (inside(rowOf(sq) + dr, colOf(sq) + dc) ? [squareAt(rowOf(sq) + dr, colOf(sq) + dc)] : [])),
);
export const KING_TO: readonly (readonly number[])[] = ALL.map((sq) =>
  DIRS.flatMap(([dr, dc]) => (inside(rowOf(sq) + dr, colOf(sq) + dc) ? [squareAt(rowOf(sq) + dr, colOf(sq) + dc)] : [])),
);
/** RAYS[casa][direção]: casas em linha reta, da mais perto para a mais longe. */
export const RAYS: readonly (readonly (readonly number[])[])[] = ALL.map((sq) =>
  DIRS.map(([dr, dc]) => {
    const ray: number[] = [];
    for (let r = rowOf(sq) + dr, c = colOf(sq) + dc; inside(r, c); r += dr, c += dc) ray.push(squareAt(r, c));
    return ray;
  }),
);

/** Roque que continua possível depois de algo sair ou chegar nesta casa. */
const CASTLE_MASK: number[] = ALL.map(() => 15);
CASTLE_MASK[60] = 15 & ~3; // e1
CASTLE_MASK[63] = 15 & ~1; // h1
CASTLE_MASK[56] = 15 & ~2; // a1
CASTLE_MASK[4] = 15 & ~12; // e8
CASTLE_MASK[7] = 15 & ~4; // h8
CASTLE_MASK[0] = 15 & ~8; // a8

const BACK = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK];

export function initialBoard(): Board {
  const b: Board = Array(SQUARES).fill(0);
  for (let c = 0; c < SIZE; c++) {
    b[c] = -BACK[c];
    b[8 + c] = -PAWN;
    b[48 + c] = PAWN;
    b[56 + c] = BACK[c];
  }
  return b;
}

export const kingsOf = (board: readonly number[]): [number, number] => [board.indexOf(KING), board.indexOf(-KING)];

export const makePos = (board: readonly number[], side: number, castle: number, ep: number, half = 0): Pos => ({
  board: board.slice(),
  side,
  castle,
  ep,
  half,
  kings: kingsOf(board),
});

/** A casa `sq` é atacada pelo lado `by`? */
export function attacked(b: readonly number[], sq: number, by: number): boolean {
  for (const t of KNIGHT_TO[sq]) if (b[t] === by * KNIGHT) return true;
  for (const t of KING_TO[sq]) if (b[t] === by * KING) return true;
  // peão branco ataca para cima: ele está uma linha abaixo
  const r = rowOf(sq) + (by > 0 ? 1 : -1);
  if (r >= 0 && r < SIZE) {
    const c = colOf(sq);
    if (c > 0 && b[r * 8 + c - 1] === by * PAWN) return true;
    if (c < 7 && b[r * 8 + c + 1] === by * PAWN) return true;
  }
  const rays = RAYS[sq];
  for (let d = 0; d < 8; d++) {
    const slider = d < 4 ? ROOK : BISHOP;
    for (const t of rays[d]) {
      const p = b[t];
      if (p === 0) continue;
      if (p === by * slider || p === by * QUEEN) return true;
      break;
    }
  }
  return false;
}

export const inCheck = (pos: Pos, side = pos.side) => attacked(pos.board, pos.kings[side > 0 ? 0 : 1], -side);

function pushPawn(out: number[], from: number, to: number, last: boolean, flag = 0) {
  if (last) for (const p of [QUEEN, KNIGHT, ROOK, BISHOP]) out.push(encode(from, to, p));
  else out.push(encode(from, to, 0, flag));
}

/** Lances sem conferir se deixam o próprio rei em xeque. `captures`: só capturas e promoções (quietude). */
export function pseudoMoves(pos: Pos, captures = false): number[] {
  const { board: b, side } = pos;
  const out: number[] = [];
  const fwd = side > 0 ? -8 : 8;
  const startRow = side > 0 ? 6 : 1;
  const lastRow = side > 0 ? 0 : 7;
  for (let sq = 0; sq < SQUARES; sq++) {
    const p = b[sq];
    if (p === 0 || (p > 0) !== (side > 0)) continue;
    const t = p < 0 ? -p : p;
    if (t === PAWN) {
      const c = colOf(sq);
      const one = sq + fwd;
      const last = rowOf(one) === lastRow;
      if (b[one] === 0 && (!captures || last)) {
        pushPawn(out, sq, one, last);
        if (!captures && rowOf(sq) === startRow && b[one + fwd] === 0) out.push(encode(sq, one + fwd, 0, FLAG_DOUBLE));
      }
      for (const dc of [-1, 1]) {
        if (c + dc < 0 || c + dc > 7) continue;
        const to = one + dc;
        if (b[to] !== 0 && (b[to] > 0) !== (side > 0)) pushPawn(out, sq, to, last);
        else if (to === pos.ep) out.push(encode(sq, to, 0, FLAG_EP));
      }
    } else if (t === KNIGHT || t === KING) {
      for (const to of t === KNIGHT ? KNIGHT_TO[sq] : KING_TO[sq]) {
        const q = b[to];
        if (q === 0 ? !captures : (q > 0) !== (side > 0)) out.push(encode(sq, to));
      }
    } else {
      const from = t === BISHOP ? 4 : 0;
      const to = t === ROOK ? 4 : 8;
      const rays = RAYS[sq];
      for (let d = from; d < to; d++) {
        for (const x of rays[d]) {
          const q = b[x];
          if (q === 0) {
            if (!captures) out.push(encode(sq, x));
            continue;
          }
          if ((q > 0) !== (side > 0)) out.push(encode(sq, x));
          break;
        }
      }
    }
  }
  if (!captures) castles(pos, out);
  return out;
}

function castles(pos: Pos, out: number[]) {
  const { board: b, side, castle } = pos;
  const [king, short, long] = side > 0 ? [60, 1, 2] : [4, 4, 8];
  if (!(castle & (short | long)) || b[king] !== side * KING || attacked(b, king, -side)) return;
  if (castle & short && b[king + 1] === 0 && b[king + 2] === 0 && b[king + 3] === side * ROOK && !attacked(b, king + 1, -side) && !attacked(b, king + 2, -side))
    out.push(encode(king, king + 2, 0, FLAG_CASTLE));
  if (
    castle & long &&
    b[king - 1] === 0 &&
    b[king - 2] === 0 &&
    b[king - 3] === 0 &&
    b[king - 4] === side * ROOK &&
    !attacked(b, king - 1, -side) &&
    !attacked(b, king - 2, -side)
  )
    out.push(encode(king, king - 2, 0, FLAG_CASTLE));
}

export interface Undo {
  captured: number;
  castle: number;
  ep: number;
  half: number;
}

/** Faz o lance no lugar e devolve o que precisa para desfazer. */
export function make(pos: Pos, m: number): Undo {
  const b = pos.board;
  const from = mFrom(m);
  const to = mTo(m);
  const flag = mFlag(m);
  const promo = mPromo(m);
  const p = b[from];
  const side = pos.side;
  const undo: Undo = { captured: b[to], castle: pos.castle, ep: pos.ep, half: pos.half };
  b[to] = promo ? side * promo : p;
  b[from] = 0;
  if (flag === FLAG_EP) {
    const victim = to - (side > 0 ? -8 : 8);
    undo.captured = b[victim];
    b[victim] = 0;
  } else if (flag === FLAG_CASTLE) {
    const [rf, rt] = to > from ? [from + 3, from + 1] : [from - 4, from - 1];
    b[rt] = b[rf];
    b[rf] = 0;
  }
  if (p === side * KING) pos.kings[side > 0 ? 0 : 1] = to;
  pos.castle &= CASTLE_MASK[from] & CASTLE_MASK[to];
  pos.ep = flag === FLAG_DOUBLE ? (from + to) >> 1 : -1;
  pos.half = undo.captured || p === side * PAWN ? 0 : pos.half + 1;
  pos.side = -side;
  return undo;
}

export function unmake(pos: Pos, m: number, u: Undo) {
  const b = pos.board;
  const from = mFrom(m);
  const to = mTo(m);
  const flag = mFlag(m);
  const side = -pos.side;
  pos.side = side;
  const moved = mPromo(m) ? side * PAWN : b[to];
  b[from] = moved;
  if (flag === FLAG_EP) {
    b[to] = 0;
    b[to - (side > 0 ? -8 : 8)] = u.captured;
  } else {
    b[to] = u.captured;
    if (flag === FLAG_CASTLE) {
      const [rf, rt] = to > from ? [from + 3, from + 1] : [from - 4, from - 1];
      b[rf] = b[rt];
      b[rt] = 0;
    }
  }
  if (moved === side * KING) pos.kings[side > 0 ? 0 : 1] = from;
  pos.castle = u.castle;
  pos.ep = u.ep;
  pos.half = u.half;
}

/** O lance não deixa o próprio rei em xeque (já feito com make). */
export const leftKingSafe = (pos: Pos) => !inCheck(pos, -pos.side);

/** Lances válidos (internos). */
export function legalCodes(pos: Pos): number[] {
  const out: number[] = [];
  for (const m of pseudoMoves(pos)) {
    const u = make(pos, m);
    if (leftKingSafe(pos)) out.push(m);
    unmake(pos, m, u);
  }
  return out;
}

export const toMove = (m: number): Move => (mPromo(m) ? { from: mFrom(m), to: mTo(m), promo: mPromo(m) } : { from: mFrom(m), to: mTo(m) });

export const legalMoves = (pos: Pos): Move[] => legalCodes(pos).map(toMove);

/** Quantas posições há em `depth` lances (perft, para testar a geração de lances). */
export function perft(pos: Pos, depth: number): number {
  if (depth === 0) return 1;
  let n = 0;
  for (const m of pseudoMoves(pos)) {
    const u = make(pos, m);
    if (leftKingSafe(pos)) n += depth === 1 ? 1 : perft(pos, depth - 1);
    unmake(pos, m, u);
  }
  return n;
}

/** Só reis e peças que não conseguem dar mate: rei e um bispo ou cavalo, ou só bispos na mesma cor. */
export function insufficient(b: readonly number[]): boolean {
  let minors = 0;
  let knights = 0;
  const bishops = new Set<boolean>();
  for (let sq = 0; sq < SQUARES; sq++) {
    const t = typeOf(b[sq]);
    if (t === PAWN || t === ROOK || t === QUEEN) return false;
    if (t === KNIGHT) knights++, minors++;
    if (t === BISHOP) minors++, bishops.add(isDark(sq));
  }
  return minors <= 1 || (knights === 0 && bishops.size === 1);
}

/** O lado tem só o rei. */
export const loneKing = (b: readonly number[], side: number) => b.every((p) => p === 0 || sideOf(p) !== side || typeOf(p) === KING);

/** Valor de cada peça em pontos (peão 1). */
export const POINTS = [0, 1, 3, 3, 5, 9, 0];

/** Material do lado em pontos. */
export const materialOf = (b: readonly number[], side: number) => b.reduce((n, p) => n + (sideOf(p) === side ? POINTS[typeOf(p)] : 0), 0);

const PIECE_CHAR = ["", "p", "n", "b", "r", "q", "k"];

/** Posição em FEN (para testes e depuração). */
export function toFen(pos: Pos): string {
  const rows: string[] = [];
  for (let r = 0; r < 8; r++) {
    let row = "";
    let empty = 0;
    for (let c = 0; c < 8; c++) {
      const p = pos.board[r * 8 + c];
      if (!p) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      const ch = PIECE_CHAR[typeOf(p)];
      row += p > 0 ? ch.toUpperCase() : ch;
    }
    rows.push(row + (empty || ""));
  }
  const c = pos.castle;
  const castle = (c & 1 ? "K" : "") + (c & 2 ? "Q" : "") + (c & 4 ? "k" : "") + (c & 8 ? "q" : "") || "-";
  return `${rows.join("/")} ${pos.side > 0 ? "w" : "b"} ${castle} ${pos.ep < 0 ? "-" : squareName(pos.ep)} ${pos.half} 1`;
}

export function fromFen(fen: string): Pos {
  const [rows, side, castle, ep, half] = fen.trim().split(/\s+/);
  const board: Board = [];
  for (const ch of rows.replace(/\//g, "")) {
    if (/\d/.test(ch)) board.push(...Array(Number(ch)).fill(0));
    else {
      const t = PIECE_CHAR.indexOf(ch.toLowerCase());
      board.push(ch === ch.toUpperCase() ? t : -t);
    }
  }
  let c = 0;
  if (castle?.includes("K")) c |= 1;
  if (castle?.includes("Q")) c |= 2;
  if (castle?.includes("k")) c |= 4;
  if (castle?.includes("q")) c |= 8;
  return makePos(board, side === "b" ? -1 : 1, c, !ep || ep === "-" ? -1 : squareOf(ep), Number(half) || 0);
}

/** Letra da peça na notação em português: Rei, Dama, Torre, Bispo, Cavalo. */
export const SAN_LETTER = ["", "", "C", "B", "T", "D", "R"];

/** Notação do lance (antes de fazê-lo), com + ou # conferidos depois de fazer. */
export function san(pos: Pos, m: number, legal: readonly number[] = legalCodes(pos)): string {
  const b = pos.board;
  const from = mFrom(m);
  const to = mTo(m);
  const t = typeOf(b[from]);
  let s: string;
  if (mFlag(m) === FLAG_CASTLE) s = to > from ? "O-O" : "O-O-O";
  else {
    const capture = b[to] !== 0 || mFlag(m) === FLAG_EP;
    if (t === PAWN) s = (capture ? FILES[colOf(from)] + "x" : "") + squareName(to) + (mPromo(m) ? "=" + SAN_LETTER[mPromo(m)] : "");
    else {
      // outra peça igual que também vai para a mesma casa: diz a coluna, a linha ou as duas
      const rivals = legal.filter((x) => mTo(x) === to && mFrom(x) !== from && b[mFrom(x)] === b[from]).map(mFrom);
      let dis = "";
      if (rivals.length) {
        if (rivals.every((r) => colOf(r) !== colOf(from))) dis = FILES[colOf(from)];
        else if (rivals.every((r) => rowOf(r) !== rowOf(from))) dis = String(SIZE - rowOf(from));
        else dis = squareName(from);
      }
      s = SAN_LETTER[t] + dis + (capture ? "x" : "") + squareName(to);
    }
  }
  const u = make(pos, m);
  if (inCheck(pos)) s += legalCodes(pos).length ? "+" : "#";
  unmake(pos, m, u);
  return s;
}
