// Paciência Spider (regras clássicas, como no Windows)
// - 104 cartas (2 baralhos) com 1, 2 ou 4 naipes. 10 colunas: as 4 primeiras com 6 cartas, as outras com 5;
//   só a de cima fica virada. As 50 restantes formam o monte: 5 distribuições de 10 (uma por coluna).
// - Uma carta vai sobre outra um ponto acima, de qualquer naipe. Um grupo só se move junto se estiver
//   em ordem decrescente e for todo do mesmo naipe. Coluna vazia aceita qualquer carta ou grupo.
// - Ao ficar descoberta, a carta virada para baixo vira para cima.
// - K até A do mesmo naipe sai sozinho da mesa. Vence quem completar as 8 sequências.
// - Não dá para distribuir com coluna vazia.
// - Pontos: começa em 500, -1 por jogada (mover, distribuir, desfazer), +100 por sequência completa.
//   Desfazer é ilimitado; desfazer uma sequência completa devolve os 100 pontos.
import { cardOf, COLS, DECK_SIZE, mulberry32, shuffle } from "./deck";
import type { Action, Board, GameState, Result, SuitCount } from "./types";

export const START_SCORE = 500;
export const RUN_BONUS = 100;
const INITIAL = 54;

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

export function newGame(suits: SuitCount, seed = randomSeed()): GameState {
  const ids = shuffle(
    Array.from({ length: DECK_SIZE }, (_, i) => i),
    mulberry32(seed),
  );
  const cols: number[][] = Array.from({ length: COLS }, () => []);
  // distribui em rodadas, como na mesa: a carta i vai para a coluna i % 10
  for (let i = 0; i < INITIAL; i++) cols[i % COLS].push(ids[i]);
  return {
    suits,
    seed,
    cols,
    hidden: cols.map((c) => c.length - 1),
    stock: ids.slice(INITIAL),
    done: [],
    moves: 0,
    elapsed: 0,
    history: [],
    won: false,
    last: null,
  };
}

export function scoreOf(s: Pick<GameState, "moves" | "done">): number {
  return START_SCORE - s.moves + RUN_BONUS * s.done.length;
}

function isLink(s: GameState, below: number, above: number): boolean {
  const a = cardOf(below, s.suits);
  const b = cardOf(above, s.suits);
  return a.suit === b.suit && a.rank === b.rank + 1;
}

/** As cartas de `index` até o topo formam um grupo móvel (viradas, decrescentes, mesmo naipe)? */
export function isRun(s: GameState, col: number, index: number): boolean {
  const c = s.cols[col];
  if (!c || index < s.hidden[col] || index >= c.length) return false;
  for (let i = index; i < c.length - 1; i++) if (!isLink(s, c[i], c[i + 1])) return false;
  return true;
}

/** Primeiro índice do maior grupo móvel no topo da coluna (ou -1 se vazia). */
export function runStart(s: GameState, col: number): number {
  const c = s.cols[col];
  if (!c.length) return -1;
  let i = c.length - 1;
  while (i > s.hidden[col] && isLink(s, c[i - 1], c[i])) i--;
  return i;
}

/** A carta `id` pode ir para a coluna `to`? */
export function canDrop(s: GameState, id: number, to: number): boolean {
  const c = s.cols[to];
  if (!c.length) return true;
  return cardOf(c[c.length - 1], s.suits).rank === cardOf(id, s.suits).rank + 1;
}

export function canMove(s: GameState, from: number, index: number, to: number): boolean {
  if (s.won || from === to || !s.cols[from] || !s.cols[to]) return false;
  return isRun(s, from, index) && canDrop(s, s.cols[from][index], to);
}

export function canDeal(s: GameState): boolean {
  return !s.won && s.stock.length > 0 && s.cols.every((c) => c.length > 0);
}

function snapshot(s: Board): Board {
  return {
    cols: s.cols.map((c) => c.slice()),
    hidden: s.hidden.slice(),
    stock: s.stock.slice(),
    done: s.done.map((d) => d.slice()),
  };
}

/** Vira a carta de cima se ela estiver para baixo. */
function flip(s: GameState, col: number) {
  if (s.hidden[col] > 0 && s.hidden[col] >= s.cols[col].length) s.hidden[col] = s.cols[col].length - 1;
}

/** Tira K..A do mesmo naipe do topo da coluna, se houver. */
function collect(s: GameState, col: number): number {
  const c = s.cols[col];
  if (c.length < 13) return 0;
  const start = c.length - 13;
  if (cardOf(c[start], s.suits).rank !== 13 || !isRun(s, col, start)) return 0;
  s.done.push(c.splice(start));
  flip(s, col);
  return 1;
}

export function applyAction(state: GameState, action: Action): Result {
  if (action.type === "undo") {
    const prev = state.history[state.history.length - 1];
    if (!prev) return { ok: false, error: "Nada para desfazer" };
    return {
      ok: true,
      state: {
        ...state,
        ...snapshot(prev),
        history: state.history.slice(0, -1),
        moves: state.moves + 1,
        won: false,
        last: { id: (state.last?.id ?? 0) + 1, type: "undo", completed: 0 },
      },
    };
  }

  if (state.won) return { ok: false, error: "Partida encerrada" };
  const s: GameState = { ...state, ...snapshot(state), history: [...state.history, snapshot(state)] };
  let completed = 0;

  if (action.type === "move") {
    const { from, index, to } = action;
    if (!canMove(state, from, index, to)) return { ok: false, error: "Jogada inválida" };
    s.cols[to].push(...s.cols[from].splice(index));
    flip(s, from);
    completed = collect(s, to);
  } else {
    if (!s.stock.length) return { ok: false, error: "Monte vazio" };
    if (s.cols.some((c) => !c.length)) return { ok: false, error: "Preencha as colunas vazias" };
    for (let col = 0; col < COLS; col++) s.cols[col].push(s.stock.pop()!);
    for (let col = 0; col < COLS; col++) completed += collect(s, col);
  }

  s.moves++;
  s.won = s.done.length === 8;
  s.last = { id: (state.last?.id ?? 0) + 1, type: action.type, completed };
  return { ok: true, state: s };
}
