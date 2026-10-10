export type Difficulty = "easy" | "medium" | "hard" | "expert";

/** Unidade do tabuleiro: linha, coluna ou bloco 3×3, com o índice 0-8. */
export interface Unit {
  kind: "row" | "col" | "box";
  index: number;
}

/** O que o jogador pode mudar (e o desfazer restaura). Casas 0-80, linha a linha. */
export interface Cells {
  /** 0 = vazia */
  values: number[];
  /** anotações: bit d-1 ligado = d anotado */
  notes: number[];
}

/** Por que a dica escolheu aquela casa. */
export interface HintReason {
  /** "cell": único número possível na casa; "unit": único lugar do número na unidade; "wrong": número errado corrigido; "reveal": sem dedução simples */
  kind: "cell" | "unit" | "wrong" | "reveal";
  unit?: Unit;
  /** técnicas de eliminação usadas antes de chegar no único (ex.: par, linha apontada) */
  via: Technique[];
}

export type Technique =
  | "single"
  | "hidden"
  | "pointing"
  | "claiming"
  | "pair"
  | "hiddenPair"
  | "triple"
  | "hiddenTriple"
  | "xwing"
  | "ywing";

export interface LastAction {
  id: number;
  type: Action["type"];
  cell: number;
  value: number;
  /** número colocado não bate com a solução */
  wrong: boolean;
  /** linhas, colunas e blocos completados por esta jogada */
  completed: Unit[];
  reason?: HintReason;
}

export interface GameState extends Cells {
  difficulty: Difficulty;
  seed: number;
  /** pistas: 0 = casa para preencher */
  puzzle: number[];
  solution: number[];
  mistakes: number;
  hints: number;
  /** tempo jogado em ms (a interface soma enquanto a aba está aberta) */
  elapsed: number;
  history: Cells[];
  won: boolean;
  /** chegou a MAX_MISTAKES erros: a partida para até continuar */
  lost: boolean;
  last: LastAction | null;
}

export type Action =
  | { type: "set"; cell: number; value: number }
  | { type: "erase"; cell: number }
  | { type: "note"; cell: number; value: number }
  | { type: "hint" }
  | { type: "undo" }
  | { type: "revive" };

export type Result = { ok: true; state: GameState } | { ok: false; error: string };
