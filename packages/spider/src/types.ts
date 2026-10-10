export type Suit = "spades" | "hearts" | "clubs" | "diamonds";
export type SuitCount = 1 | 2 | 4;

/** 1 = Ás, 11 = Valete, 12 = Dama, 13 = Rei */
export type Rank = number;

export interface Card {
  id: number;
  rank: Rank;
  suit: Suit;
}

/** Posição das cartas. As cartas são ids (0-103); `cardOf(id, suits)` diz valor e naipe. */
export interface Board {
  /** 10 colunas, da base para o topo */
  cols: number[][];
  /** quantas cartas viradas para baixo no começo de cada coluna */
  hidden: number[];
  /** monte: distribui do fim do array */
  stock: number[];
  /** sequências completas, cada uma de K a A */
  done: number[][];
}

export interface LastAction {
  id: number;
  type: "move" | "deal" | "undo";
  /** sequências completas por esta ação */
  completed: number;
}

export interface GameState extends Board {
  suits: SuitCount;
  seed: number;
  /** jogadas feitas, incluindo distribuições e desfazer (cada uma custa 1 ponto) */
  moves: number;
  history: Board[];
  won: boolean;
  last: LastAction | null;
}

export type Action =
  | { type: "move"; from: number; index: number; to: number }
  | { type: "deal" }
  | { type: "undo" };

export type Result = { ok: true; state: GameState } | { ok: false; error: string };
