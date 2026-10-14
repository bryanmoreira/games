import { boardAfter, isKing, legalMoves, rowOf, colOf, sideOf } from "./board";
import { sideOfSeat } from "./rules";
import type { Action, Level, Move, PlayerView } from "./types";

// Negamax com poda alfa-beta sobre o tabuleiro de números. Capturas pendentes no fim da busca são
// seguidas até acabar (busca de quietude), para a IA não parar no meio de uma troca.

const WIN = 100_000;
const MAN = 100;
const KING = 320;
/** Quietude: no máximo esta profundidade extra seguindo capturas. */
const QUIESCE = 8;

interface Budget {
  nodes: number;
  max: number;
}

/** Nota da posição para as brancas (positivo = brancas melhor). */
export function evaluate(board: readonly number[]): number {
  let score = 0;
  let white = 0;
  let black = 0;
  for (let sq = 0; sq < board.length; sq++) {
    const p = board[sq];
    if (p === 0) continue;
    const side = sideOf(p);
    if (side > 0) white++;
    else black++;
    let v: number;
    if (isKing(p)) {
      // dama na diagonal grande controla mais casas
      v = KING + (rowOf(sq) + colOf(sq) === 7 ? 12 : 0);
    } else {
      const row = rowOf(sq);
      const advanced = side > 0 ? 7 - row : row;
      const col = colOf(sq);
      v = MAN + advanced * advanced * 1.5;
      if (row >= 3 && row <= 4 && col >= 2 && col <= 5) v += 6;
      // pedras na fileira de trás seguram a promoção do adversário
      if (advanced === 0) v += 10;
      if (col === 0 || col === 7) v -= 4;
    }
    score += side * v;
  }
  // com vantagem, trocar peças é bom: a diferença pesa mais com menos peças no tabuleiro
  const total = white + black;
  if (total) score += ((white - black) * 200) / total;
  return score;
}

function negamax(board: number[], side: number, depth: number, alpha: number, beta: number, ply: number, budget: Budget): number {
  // rodada que estourou muito o orçamento é descartada em scoreMoves: sai rápido
  if (++budget.nodes > budget.max * 2) return 0;
  const moves = legalMoves(board, side);
  if (!moves.length) return -WIN + ply;
  const capture = moves[0].captured.length > 0;
  if (depth <= 0 && (!capture || depth <= -QUIESCE || budget.nodes > budget.max)) return side * evaluate(board);

  let best = -Infinity;
  for (const m of moves) {
    const v = -negamax(boardAfter(board, m), -side, depth - 1, -beta, -alpha, ply + 1, budget);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

/** Profundidade do fácil e do médio. */
const DEPTH = { easy: 2, medium: 4 } as const;
/** Nós por lance no difícil: aprofunda enquanto couber. */
const HARD_NODES = 60_000;

/** Nota de cada lance para quem está na vez (maior = melhor), com busca de profundidade fixa. */
export function scoreMoves(board: number[], side: number, depth: number): { move: Move; score: number }[] {
  const budget: Budget = { nodes: 0, max: Infinity };
  return legalMoves(board, side).map((move) => ({ move, score: -negamax(boardAfter(board, move), -side, depth - 1, -Infinity, Infinity, 1, budget) }));
}

/** Melhor lance aprofundando enquanto couber no orçamento de nós (cada rodada começa pelo melhor da anterior). */
export function bestMove(board: number[], side: number, maxNodes = HARD_NODES, maxDepth = 12): Move {
  let moves = legalMoves(board, side);
  let best = moves[0];
  if (moves.length === 1) return best;
  const budget: Budget = { nodes: 0, max: maxNodes };
  for (let depth = 2; depth <= maxDepth; depth++) {
    let alpha = -Infinity;
    let top = moves[0];
    const scores = new Map<Move, number>();
    for (const m of moves) {
      const v = -negamax(boardAfter(board, m), -side, depth - 1, -Infinity, -alpha, 1, budget);
      scores.set(m, v);
      if (v > alpha) {
        alpha = v;
        top = m;
      }
    }
    // a primeira rodada (rasa) sempre vale; as outras só se couberem no orçamento
    if (depth > 2 && budget.nodes > budget.max) break;
    best = top;
    if (Math.abs(alpha) > WIN / 2 || budget.nodes > budget.max) break;
    moves = [top, ...moves.filter((m) => m !== top).sort((a, b) => scores.get(b)! - scores.get(a)!)];
  }
  return best;
}

const pick = <T>(xs: T[], rng: () => number) => xs[Math.floor(rng() * xs.length)];

export interface AiOptions {
  /** Padrão: o nível das opções da sala. */
  level?: Level;
  rng?: () => number;
}

/** Lance da IA, usando só a visão do bot. */
export function decide(view: PlayerView, { level = view.settings.level, rng = Math.random }: AiOptions = {}): Action | null {
  if (!view.canPlay || !view.legal.length) return null;
  const side = sideOfSeat(view, view.seat);
  let move: Move;
  if (level === "easy" && rng() < 0.3) move = pick(view.legal, rng);
  else if (level === "hard") move = bestMove(view.board.slice(), side);
  else {
    const scored = scoreMoves(view.board.slice(), side, DEPTH[level]);
    const best = Math.max(...scored.map((x) => x.score));
    // fácil e médio escolhem entre os lances quase tão bons quanto o melhor
    move = pick(
      scored.filter((x) => x.score >= best - (level === "medium" ? 15 : 60)),
      rng,
    ).move;
  }
  return { type: "move", seat: view.seat, from: move.from, path: move.path.slice() };
}
