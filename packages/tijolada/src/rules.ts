import { bag, kicks, SHAPES } from "./pieces";
import {
  COLS,
  HIDDEN,
  LINES_PER_LEVEL,
  LOCK_RESETS,
  LOCK_TICKS,
  MAX_LEVEL,
  ROWS,
  TICK_MS,
  VERSUS_LEVEL_TICKS,
  type Game,
  type Key,
  type Kind,
  type Mode,
  type Piece,
  type Rot,
} from "./types";

// Toda a conta é em inteiros: a mesma partida dá o mesmo resultado no navegador e no servidor.

/** Uma linha inteira de gravidade. */
const ONE = 65536;
/** Gravidade por nível (1/65536 de linha por passo): 1 linha por segundo no nível 1, ~20 por passo no 20. */
const GRAVITY = [
  1093, 1377, 1768, 2311, 3075, 4169, 5759, 8107, 11634, 17026, 25416, 38709, 60169, 95483, 154742, 256187, 433425, 749597, 1325716,
  2398490,
];
const LINE_POINTS = [0, 100, 300, 500, 800];
export const COMBO_POINTS = 50;

export const gravityOf = (level: number) => GRAVITY[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];

/** Blocos da peça no campo. */
export function cellsOf(p: Piece): [number, number][] {
  return SHAPES[p.kind][p.rot].map(([x, y]) => [p.x + x, p.y + y]);
}

export function fits(board: number[], p: Piece): boolean {
  for (const [x, y] of cellsOf(p)) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS || board[y * COLS + x] !== 0) return false;
  }
  return true;
}

/** Linha onde a peça para se cair de vez. */
export function dropY(board: number[], p: Piece): number {
  let y = p.y;
  while (fits(board, { ...p, y: y + 1 })) y++;
  return y;
}

export const spawnPiece = (kind: Kind): Piece => ({ kind, rot: 0, x: kind === 2 ? 4 : 3, y: kind === 1 ? HIDDEN - 1 : HIDDEN });

export function newGame(seed: number, mode: Mode): Game {
  const [a, r1] = bag(seed | 0);
  const [b, rng] = bag(r1);
  const g: Game = {
    mode,
    board: new Array(ROWS * COLS).fill(0),
    piece: null,
    hold: null,
    held: false,
    queue: [...a, ...b],
    rng,
    tick: 0,
    acc: 0,
    lock: 0,
    resets: 0,
    low: 0,
    level: 1,
    lines: 0,
    score: 0,
    combo: -1,
    maxCombo: 0,
    b2b: false,
    tetras: 0,
    pieces: 0,
    locks: 0,
    clear: null,
    over: false,
    overTick: null,
  };
  spawn(g, next(g));
  return g;
}

/** Tira a próxima da fila (e enche com mais um saco quando precisa). */
function next(g: Game): Kind {
  const k = g.queue.shift()!;
  if (g.queue.length < 7) {
    const [more, rng] = bag(g.rng);
    g.queue.push(...more);
    g.rng = rng;
  }
  return k;
}

function spawn(g: Game, kind: Kind) {
  const p = spawnPiece(kind);
  g.piece = p;
  g.acc = 0;
  g.lock = 0;
  g.resets = 0;
  g.low = p.y;
  // nasceu em cima de blocos: fim
  if (!fits(g.board, p)) end(g);
}

/** Acaba a partida agora (nasceu em cima de blocos, travou acima do campo ou o jogador saiu). */
export function end(g: Game) {
  g.over = true;
  g.overTick = g.tick;
}

const onGround = (g: Game) => !!g.piece && !fits(g.board, { ...g.piece, y: g.piece.y + 1 });

/** Mexeu no chão: a trava espera de novo (até LOCK_RESETS vezes por peça). */
function delayLock(g: Game) {
  if (onGround(g) && g.resets < LOCK_RESETS) {
    g.lock = 0;
    g.resets++;
  }
}

function moveDown(g: Game): boolean {
  const p = g.piece!;
  if (!fits(g.board, { ...p, y: p.y + 1 })) return false;
  p.y++;
  g.lock = 0;
  if (p.y > g.low) {
    g.low = p.y;
    g.resets = 0;
  }
  return true;
}

function lockPiece(g: Game) {
  const p = g.piece!;
  const cells = cellsOf(p);
  for (const [x, y] of cells) g.board[y * COLS + x] = p.kind;
  g.pieces++;
  g.locks++;
  g.held = false;
  // travou inteira acima do campo: fim
  if (cells.every(([, y]) => y < HIDDEN)) {
    g.piece = null;
    return end(g);
  }

  const rows: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    let full = true;
    for (let x = 0; x < COLS && full; x++) full = g.board[y * COLS + x] !== 0;
    if (full) rows.push(y);
  }
  const n = rows.length;
  if (n) {
    for (const y of rows) {
      g.board.splice(y * COLS, COLS);
      g.board.unshift(...new Array(COLS).fill(0));
    }
    const b2b = n === 4 && g.b2b;
    let points = LINE_POINTS[n] * g.level;
    if (b2b) points = (points * 3) / 2;
    g.combo++;
    if (g.combo > 0) points += COMBO_POINTS * g.combo * g.level;
    g.maxCombo = Math.max(g.maxCombo, g.combo);
    g.b2b = n === 4;
    if (n === 4) g.tetras++;
    g.score += points;
    g.lines += n;
    if (g.mode === "solo") g.level = Math.min(MAX_LEVEL, 1 + Math.floor(g.lines / LINES_PER_LEVEL));
    g.clear = { id: (g.clear?.id ?? 0) + 1, rows, points, b2b, combo: g.combo };
  } else g.combo = -1;

  spawn(g, next(g));
}

/** Um passo de tempo: gravidade e trava. Muda o jogo no lugar. */
export function step(g: Game): Game {
  if (g.over || !g.piece) return g;
  g.tick++;
  if (g.mode === "versus") g.level = Math.min(MAX_LEVEL, 1 + Math.floor(g.tick / VERSUS_LEVEL_TICKS));
  g.acc += gravityOf(g.level);
  while (g.acc >= ONE) {
    if (!moveDown(g)) {
      g.acc = 0;
      break;
    }
    g.acc -= ONE;
  }
  if (onGround(g)) {
    if (++g.lock >= LOCK_TICKS) lockPiece(g);
  } else g.lock = 0;
  return g;
}

/** Roda passos até `tick` (sem passar do fim). */
export function advanceTo(g: Game, tick: number): Game {
  while (g.tick < tick && !g.over) step(g);
  return g;
}

function shift(g: Game, dx: number): boolean {
  const p = g.piece!;
  if (!fits(g.board, { ...p, x: p.x + dx })) return false;
  p.x += dx;
  delayLock(g);
  return true;
}

function turn(g: Game, dir: 1 | -1): boolean {
  const p = g.piece!;
  const to = ((p.rot + dir + 4) % 4) as Rot;
  for (const [kx, ky] of kicks(p.kind, p.rot, to)) {
    const moved = { ...p, rot: to, x: p.x + kx, y: p.y + ky };
    if (fits(g.board, moved)) {
      Object.assign(p, moved);
      if (p.y > g.low) {
        g.low = p.y;
        g.resets = 0;
      }
      delayLock(g);
      return true;
    }
  }
  return false;
}

function hold(g: Game): boolean {
  if (g.held) return false;
  const cur = g.piece!.kind;
  const kind = g.hold ?? next(g);
  g.hold = cur;
  spawn(g, kind);
  g.held = true;
  return true;
}

/** Comando do jogador agora (no passo `g.tick`). Muda o jogo no lugar; devolve se mudou algo. */
export function input(g: Game, key: Key): boolean {
  if (g.over || !g.piece) return false;
  switch (key) {
    case "left":
      return shift(g, -1);
    case "right":
      return shift(g, 1);
    case "down":
      if (!moveDown(g)) return false;
      g.score += 1;
      g.acc = 0;
      return true;
    case "drop": {
      const y = dropY(g.board, g.piece);
      g.score += 2 * (y - g.piece.y);
      g.piece.y = y;
      lockPiece(g);
      return true;
    }
    case "cw":
      return turn(g, 1);
    case "ccw":
      return turn(g, -1);
    case "hold":
      return hold(g);
    default:
      return false;
  }
}

/** Tempo jogado em ms (até o fim, se acabou). */
export const playedMs = (g: Game) => Math.round((g.overTick ?? g.tick) * TICK_MS);
