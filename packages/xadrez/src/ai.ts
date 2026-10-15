import { inCheck, leftKingSafe, make, mFrom, mPromo, mTo, pseudoMoves, toMove, typeOf, unmake, type Pos } from "./board";
import { posOf, positionKey, sideOfSeat } from "./rules";
import { BISHOP, KING, PAWN, type Action, type Level, type Move, type PlayerView } from "./types";

// Negamax com poda alfa-beta e aprofundamento iterativo sobre o tabuleiro mexido no lugar (make/unmake).
// No fim da busca, as capturas continuam até a posição acalmar (quietude), para não parar no meio de uma troca.

export const MATE = 100_000;
const VALUE = [0, 100, 320, 330, 500, 900, 0];

// Tabelas de posição (visão das brancas, casa 0 = a8); as pretas usam a casa espelhada.
// prettier-ignore
const PST: number[][] = [
  [],
  [ 0,  0,  0,  0,  0,  0,  0,  0,
   50, 50, 50, 50, 50, 50, 50, 50,
   10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0],
  [-50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50],
  [-20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20],
  [ 0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0],
  [-20,-10,-10, -5, -5,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5,  5,  5,  5,  0,-10,
    -5,  0,  5,  5,  5,  5,  0, -5,
     0,  0,  5,  5,  5,  5,  0, -5,
   -10,  5,  5,  5,  5,  5,  0,-10,
   -10,  0,  5,  0,  0,  0,  0,-10,
   -20,-10,-10, -5, -5,-10,-10,-20],
  [-30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20],
];
// rei no final: vai para o centro
// prettier-ignore
const KING_END = [
  -50,-40,-30,-20,-20,-30,-40,-50,
  -30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,
  -30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50,
];

/** Nota da posição para as brancas (positivo = brancas melhor), em centésimos de peão. */
export function evaluate(b: readonly number[]): number {
  let score = 0;
  let heavy = 0;
  const bishops = [0, 0];
  let wk = -1;
  let bk = -1;
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq];
    if (p === 0) continue;
    const t = p < 0 ? -p : p;
    if (t === KING) {
      if (p > 0) wk = sq;
      else bk = sq;
      continue;
    }
    if (t !== PAWN) heavy += VALUE[t];
    if (t === BISHOP) bishops[p > 0 ? 0 : 1]++;
    score += p > 0 ? VALUE[t] + PST[t][sq] : -(VALUE[t] + PST[t][sq ^ 56]);
  }
  // final: pouco material além dos peões
  const end = heavy <= 2600;
  const kt = end ? KING_END : PST[KING];
  if (wk >= 0) score += kt[wk];
  if (bk >= 0) score -= kt[bk ^ 56];
  if (bishops[0] >= 2) score += 30;
  if (bishops[1] >= 2) score -= 30;
  return score;
}

interface Search {
  nodes: number;
  max: number;
  stop: boolean;
  killers: number[][];
}

/** Ordem dos lances: promoção, capturas (vítima valiosa por atacante barato), lances "assassinos", resto. */
function order(pos: Pos, moves: number[], ply: number, S: Search, first = -1): number[] {
  const b = pos.board;
  const k = S.killers[ply] ?? [];
  const scored = moves.map((m) => {
    let v = 0;
    if (m === first) v = 1_000_000;
    else {
      const victim = typeOf(b[mTo(m)]);
      if (victim) v = 10_000 + VALUE[victim] * 10 - VALUE[typeOf(b[mFrom(m)])] / 10;
      if (mPromo(m)) v += 20_000 + VALUE[mPromo(m)];
      if (!v && (m === k[0] || m === k[1])) v = 5_000;
    }
    return [v, m];
  });
  scored.sort((x, y) => y[0] - x[0]);
  return scored.map((x) => x[1]);
}

function quiesce(pos: Pos, alpha: number, beta: number, ply: number, S: Search): number {
  S.nodes++;
  const stand = pos.side * evaluate(pos.board);
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  if (ply > 40) return stand;
  for (const m of order(pos, pseudoMoves(pos, true), ply, S)) {
    const u = make(pos, m);
    if (!leftKingSafe(pos)) {
      unmake(pos, m, u);
      continue;
    }
    const v = -quiesce(pos, -beta, -alpha, ply + 1, S);
    unmake(pos, m, u);
    if (v >= beta) return v;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

function search(pos: Pos, depth: number, alpha: number, beta: number, ply: number, S: Search): number {
  if (++S.nodes > S.max) {
    S.stop = true;
    return 0;
  }
  if (pos.half >= 100) return 0;
  const check = inCheck(pos);
  if (check) depth++;
  if (depth <= 0) return quiesce(pos, alpha, beta, ply, S);

  let legal = 0;
  let best = -Infinity;
  for (const m of order(pos, pseudoMoves(pos), ply, S)) {
    const u = make(pos, m);
    if (!leftKingSafe(pos)) {
      unmake(pos, m, u);
      continue;
    }
    legal++;
    const v = -search(pos, depth - 1, -beta, -alpha, ply + 1, S);
    unmake(pos, m, u);
    if (S.stop) return 0;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) {
      if (!pos.board[mTo(m)] && !mPromo(m)) {
        const k = (S.killers[ply] ??= []);
        if (k[0] !== m) {
          k[1] = k[0];
          k[0] = m;
        }
      }
      break;
    }
  }
  if (!legal) return check ? -MATE + ply : 0;
  return best;
}

export interface SearchOptions {
  /** Nós no máximo (orçamento do aprofundamento). */
  maxNodes?: number;
  maxDepth?: number;
  /** Posições da partida: lance que repete a posição pela 3ª vez vale empate. */
  positions?: Record<string, number>;
}

/** Nota de cada lance da raiz (para quem joga), com repetição levada em conta. */
function rootScores(pos: Pos, moves: number[], depth: number, S: Search, positions: Record<string, number> | undefined, exact: boolean) {
  let alpha = -Infinity;
  const out: { m: number; v: number }[] = [];
  for (const m of moves) {
    const u = make(pos, m);
    let v = -search(pos, depth - 1, -Infinity, -alpha, 1, S);
    const seen = positions?.[positionKey(pos)] ?? 0;
    unmake(pos, m, u);
    if (S.stop) break;
    // posição repetida: pela 3ª vez é empate; pela 2ª, perde um pouco do brilho para quem está ganhando
    if (seen >= 2) v = 0;
    else if (seen === 1 && v > 0) v = Math.max(0, v - 30);
    out.push({ m, v });
    if (!exact && v > alpha) alpha = v;
  }
  return out;
}

const legalRoot = (pos: Pos) =>
  pseudoMoves(pos).filter((m) => {
    const u = make(pos, m);
    const ok = leftKingSafe(pos);
    unmake(pos, m, u);
    return ok;
  });

/** Nota de cada lance numa busca de profundidade fixa (maior = melhor para quem joga). */
export function scoreMoves(pos: Pos, depth: number, positions?: Record<string, number>): { move: number; score: number }[] {
  const S: Search = { nodes: 0, max: Infinity, stop: false, killers: [] };
  return rootScores(pos, order(pos, legalRoot(pos), 0, S), depth, S, positions, true).map(({ m, v }) => ({ move: m, score: v }));
}

/** Nós por lance no difícil (~0,3 s no servidor): aprofunda enquanto couber. */
export const HARD_NODES = 250_000;

/** Melhor lance aprofundando enquanto couber no orçamento; `score` é para quem joga. */
export function bestMove(pos: Pos, { maxNodes = HARD_NODES, maxDepth = 30, positions }: SearchOptions = {}): { move: number; score: number } {
  const S: Search = { nodes: 0, max: maxNodes, stop: false, killers: [] };
  let moves = order(pos, legalRoot(pos), 0, S);
  if (!moves.length) return { move: -1, score: inCheck(pos) ? -MATE : 0 };
  let best = { move: moves[0], score: 0 };
  if (moves.length === 1) return best;
  for (let depth = 1; depth <= maxDepth; depth++) {
    const scored = rootScores(pos, moves, depth, S, positions, false);
    // rodada interrompida: o primeiro lance é o melhor da anterior, então o que passou dele vale
    if (S.stop) {
      const top = scored.reduce((a, x) => (x.v > a.v ? x : a), { m: -1, v: -Infinity });
      if (top.m >= 0) best = { move: top.m, score: top.v };
      break;
    }
    scored.sort((a, b) => b.v - a.v);
    best = { move: scored[0].m, score: scored[0].v };
    if (Math.abs(best.score) > MATE / 2) break;
    moves = scored.map((x) => x.m);
  }
  return best;
}

/** Nota da posição para as brancas com uma busca curta (barra de vantagem). Mate = ±MATE. */
export function analyze(pos: Pos, maxNodes = 30_000): number {
  const { score } = bestMove(pos, { maxNodes });
  return pos.side * score;
}

/** Lance sugerido para a dica, no formato da interface. */
export function hint(view: PlayerView, maxNodes = 120_000): Move | null {
  if (!view.canPlay) return null;
  const { move } = bestMove(posOf(view), { maxNodes, positions: view.positions });
  return move < 0 ? null : toMove(move);
}

const pick = <T>(xs: T[], rng: () => number) => xs[Math.floor(rng() * xs.length)];

export interface AiOptions {
  /** Padrão: o nível das opções da sala. */
  level?: Level;
  rng?: () => number;
  /** Orçamento do difícil (os testes usam menos). */
  maxNodes?: number;
}

/** Profundidade do fácil e do médio, e quanto pior que o melhor ainda pode sair. */
const FIXED = { easy: { depth: 1, slack: 150 }, medium: { depth: 3, slack: 25 } } as const;

/** Lance (ou resposta ao empate) da IA, usando só a visão do bot. */
export function decide(view: PlayerView, { level = view.settings.level, rng = Math.random, maxNodes }: AiOptions = {}): Action | null {
  if (view.phase !== "playing") return null;
  const pos = posOf(view);
  if (view.mustAnswerDraw) {
    // aceita quando está pior, ou num final parado sem chance de ganhar
    const me = sideOfSeat(view, view.seat);
    const { score } = bestMove(pos, { maxNodes: 20_000 });
    const mine = pos.side === me ? score : -score;
    return { type: "answerDraw", seat: view.seat, accept: mine <= -150 || (Math.abs(mine) <= 30 && view.moves.length >= 60) };
  }
  if (!view.canPlay || !view.legal.length) return null;

  let move: number;
  if (level === "easy" && rng() < 0.15) move = pick(legalRoot(pos), rng);
  // começo da partida no difícil: um pouco de variedade entre os bons lances
  else if (level === "hard" && view.moves.length >= 6) move = bestMove(pos, { maxNodes, positions: view.positions }).move;
  else {
    const { depth, slack } = level === "hard" ? { depth: 3, slack: 15 } : FIXED[level];
    const scored = scoreMoves(pos, depth, view.positions);
    const best = Math.max(...scored.map((x) => x.score));
    move = pick(
      scored.filter((x) => x.score >= best - slack),
      rng,
    ).move;
  }
  const m = toMove(move);
  return { type: "move", seat: view.seat, from: m.from, to: m.to, ...(m.promo ? { promo: m.promo } : {}) };
}
