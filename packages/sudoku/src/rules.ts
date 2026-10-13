// Sudoku clássico 9×9
// - Preencha a grade para que cada linha, coluna e bloco 3×3 tenha os números de 1 a 9, sem repetir.
// - As pistas vêm fixas. Todo puzzle tem uma única solução, que dá para achar só com lógica.
// - Níveis pela técnica mais difícil exigida: Fácil e Médio só com únicos (o Médio com menos pistas),
//   Difícil com pares e linhas apontadas, Expert com triplas, X-Wing e Y-Wing.
// - Número errado (diferente da solução) fica vermelho e conta 1 erro. Com 3 erros a partida para:
//   dá para continuar (os erros zeram) ou começar outra. Número certo fica fixo.
// - Anotações: candidatos pequenos na casa vazia. Ao colocar um número certo, ele sai das anotações
//   da linha, da coluna e do bloco.
// - Dica: corrige um número errado ou coloca a próxima casa que dá para deduzir, com o motivo.
// - Desfazer volta números e anotações, mas não devolve erros nem dicas.
import { bit, CELL_UNITS, PEERS, SIZE, unitAt, UNITS } from "./board";
import { generate, type Puzzle } from "./generate";
import { bestHint } from "./hint";
import type { Action, Cells, Difficulty, GameState, HintReason, Result, Unit } from "./types";

export const MAX_MISTAKES = 3;
const MAX_HISTORY = 300;

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

export function newGame(difficulty: Difficulty, seed = randomSeed()): GameState {
  return gameFrom(difficulty, seed, generate(difficulty, seed));
}

/** Partida do zero com um puzzle já gerado (ex.: o desafio do dia, guardado no banco). */
export function gameFrom(difficulty: Difficulty, seed: number, { puzzle, solution }: Puzzle): GameState {
  return {
    difficulty,
    seed,
    puzzle: puzzle.slice(),
    solution: solution.slice(),
    values: puzzle.slice(),
    notes: new Array(SIZE).fill(0),
    mistakes: 0,
    hints: 0,
    elapsed: 0,
    history: [],
    won: false,
    lost: false,
    last: null,
  };
}

export const isGiven = (s: GameState, i: number) => s.puzzle[i] !== 0;
export const isWrong = (s: GameState, i: number) => s.values[i] !== 0 && s.values[i] !== s.solution[i];
/** Pista ou número certo: não muda mais. */
export const isLocked = (s: GameState, i: number) => s.values[i] !== 0 && s.values[i] === s.solution[i];

/** Quantos `d` certos ainda faltam colocar. */
export function remaining(s: GameState, d: number): number {
  let n = 9;
  for (let i = 0; i < SIZE; i++) if (s.values[i] === d && s.solution[i] === d) n--;
  return n;
}

/** Quantas casas ainda faltam (vazias ou erradas). */
export function emptyCount(s: GameState): number {
  return s.values.filter((v, i) => v !== s.solution[i]).length;
}

function snapshot(s: Cells): Cells {
  return { values: s.values.slice(), notes: s.notes.slice() };
}

/** Unidades da casa que ficaram completas e certas. */
function completedBy(s: GameState, cell: number): Unit[] {
  return CELL_UNITS[cell].filter((u) => UNITS[u].every((i) => s.values[i] === s.solution[i])).map(unitAt);
}

/** Coloca o número certo: limpa a anotação da casa e o número das anotações vizinhas. */
function placeCorrect(s: GameState, cell: number, value: number) {
  s.values[cell] = value;
  s.notes[cell] = 0;
  for (const p of PEERS[cell]) s.notes[p] &= ~bit(value);
}

export function applyAction(state: GameState, action: Action): Result {
  const nextId = (state.last?.id ?? 0) + 1;

  if (action.type === "revive") {
    if (!state.lost) return { ok: false, error: "A partida não acabou" };
    return { ok: true, state: { ...state, mistakes: 0, lost: false } };
  }
  if (state.won || state.lost) return { ok: false, error: "Partida encerrada" };

  if (action.type === "undo") {
    const prev = state.history[state.history.length - 1];
    if (!prev) return { ok: false, error: "Nada para desfazer" };
    return {
      ok: true,
      state: {
        ...state,
        ...snapshot(prev),
        history: state.history.slice(0, -1),
        last: { id: nextId, type: "undo", cell: -1, value: 0, wrong: false, completed: [] },
      },
    };
  }

  const cell = action.type === "hint" ? -1 : action.cell;
  if (action.type !== "hint" && !(cell >= 0 && cell < SIZE)) return { ok: false, error: "Casa inválida" };
  if (action.type !== "hint" && isLocked(state, cell)) return { ok: false, error: "Casa fixa" };

  const s: GameState = { ...state, ...snapshot(state), history: [...state.history, snapshot(state)].slice(-MAX_HISTORY) };
  let last = { id: nextId, type: action.type, cell, value: 0, wrong: false, completed: [] as Unit[], reason: undefined as HintReason | undefined };

  if (action.type === "set") {
    const { value } = action;
    if (!(value >= 1 && value <= 9)) return { ok: false, error: "Número inválido" };
    if (state.values[cell] === value) return { ok: false, error: "Nada mudou" };
    const wrong = value !== s.solution[cell];
    if (wrong) {
      s.values[cell] = value;
      s.notes[cell] = 0;
      s.mistakes++;
      s.lost = s.mistakes >= MAX_MISTAKES;
    } else placeCorrect(s, cell, value);
    last = { ...last, value, wrong, completed: wrong ? [] : completedBy(s, cell) };
  } else if (action.type === "erase") {
    if (!state.values[cell] && !state.notes[cell]) return { ok: false, error: "Casa vazia" };
    s.values[cell] = 0;
    s.notes[cell] = 0;
  } else if (action.type === "note") {
    const { value } = action;
    if (!(value >= 1 && value <= 9)) return { ok: false, error: "Número inválido" };
    if (state.values[cell]) return { ok: false, error: "Casa preenchida" };
    s.notes[cell] ^= bit(value);
    last = { ...last, value };
  } else {
    const h = bestHint(state);
    if (!h) return { ok: false, error: "Nada para dica" };
    placeCorrect(s, h.cell, h.value);
    s.hints++;
    last = { ...last, cell: h.cell, value: h.value, completed: completedBy(s, h.cell), reason: h.reason };
  }

  s.won = s.values.every((v, i) => v === s.solution[i]);
  s.last = last;
  return { ok: true, state: s };
}
