import { COLS, ROWS, type Action, type PlayerView } from "./types";

// Busca negamax com poda alfa-beta num tabuleiro plano (índice = col * ROWS + row).
// Valores das casas: 0 vazia, 1 quem está decidindo, 2 o adversário.

const SIZE = COLS * ROWS;
const ORDER = [3, 2, 4, 1, 5, 0, 6]; // centro primeiro: melhora a poda e o jogo
const WIN = 1_000_000;

/** Todas as janelas de 4 casas em linha (69 no 7×6). */
const WINDOWS: number[][] = [];
for (let c = 0; c < COLS; c++) {
  for (let r = 0; r < ROWS; r++) {
    for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const ec = c + dc * 3;
      const er = r + dr * 3;
      if (ec < 0 || ec >= COLS || er < 0 || er >= ROWS) continue;
      WINDOWS.push([0, 1, 2, 3].map((k) => (c + dc * k) * ROWS + (r + dr * k)));
    }
  }
}
/** Janelas que passam por cada casa, para checar vitória só em volta do último lance. */
const CELL_WINDOWS: number[][][] = Array.from({ length: SIZE }, () => []);
for (const w of WINDOWS) for (const i of w) CELL_WINDOWS[i].push(w);

class Board {
  cells = new Int8Array(SIZE);
  heights = new Int8Array(COLS);

  canPlay(col: number) {
    return this.heights[col] < ROWS;
  }
  play(col: number, p: number): number {
    const i = col * ROWS + this.heights[col]++;
    this.cells[i] = p;
    return i;
  }
  undo(col: number) {
    this.cells[col * ROWS + --this.heights[col]] = 0;
  }
  wins(i: number, p: number) {
    return CELL_WINDOWS[i].some((w) => w.every((j) => this.cells[j] === p));
  }
  full() {
    return this.heights.every((h) => h === ROWS);
  }
}

/** Heurística do ponto de vista de `p`: janelas abertas e controle da coluna central. */
function evaluate(b: Board, p: number): number {
  const o = 3 - p;
  let score = 0;
  for (const w of WINDOWS) {
    let mine = 0;
    let theirs = 0;
    for (const i of w) {
      if (b.cells[i] === p) mine++;
      else if (b.cells[i] === o) theirs++;
    }
    if (mine && theirs) continue;
    if (mine === 3) score += 50;
    else if (mine === 2) score += 8;
    else if (mine === 1) score += 1;
    else if (theirs === 3) score -= 60;
    else if (theirs === 2) score -= 8;
    else if (theirs === 1) score -= 1;
  }
  for (let r = 0; r < ROWS; r++) {
    const v = b.cells[3 * ROWS + r];
    if (v === p) score += 4;
    else if (v === o) score -= 4;
  }
  return score;
}

function negamax(b: Board, depth: number, alpha: number, beta: number, p: number): number {
  // vitória imediata primeiro (quanto mais cedo, melhor)
  for (const c of ORDER) {
    if (!b.canPlay(c)) continue;
    const i = b.play(c, p);
    const won = b.wins(i, p);
    b.undo(c);
    if (won) return WIN + depth;
  }
  if (b.full()) return 0;
  if (depth === 0) return evaluate(b, p);

  let best = -Infinity;
  for (const c of ORDER) {
    if (!b.canPlay(c)) continue;
    b.play(c, p);
    const v = -negamax(b, depth - 1, -beta, -alpha, 3 - p);
    b.undo(c);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

export interface AiOptions {
  /** Profundidade da busca em lances (padrão 7). */
  depth?: number;
  rng?: () => number;
}

/** Nota de cada coluna jogável para quem está na vez (maior = melhor). */
export function scoreMoves(view: PlayerView, depth = 7): { col: number; score: number }[] {
  const b = new Board();
  for (let c = 0; c < COLS; c++) for (const s of view.cols[c]) b.play(c, s === view.seat ? 1 : 2);
  const out: { col: number; score: number }[] = [];
  for (const c of ORDER) {
    if (!b.canPlay(c)) continue;
    const i = b.play(c, 1);
    const score = b.wins(i, 1) ? WIN + depth : -negamax(b, depth - 1, -Infinity, Infinity, 2);
    b.undo(c);
    out.push({ col: c, score });
  }
  return out;
}

/** Lance da IA, usando só a visão do bot. Empates de nota são sorteados. */
export function decide(view: PlayerView, { depth = 7, rng = Math.random }: AiOptions = {}): Action | null {
  if (!view.canPlay) return null;
  const scored = scoreMoves(view, depth);
  if (scored.length === 0) return null;
  const best = Math.max(...scored.map((m) => m.score));
  const top = scored.filter((m) => m.score === best);
  return { type: "drop", seat: view.seat, col: top[Math.floor(rng() * top.length)].col };
}
