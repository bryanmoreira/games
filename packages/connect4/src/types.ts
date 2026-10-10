/*
 * Connect 4 — regras
 * - Tabuleiro de 7 colunas × 6 linhas, em pé: a peça cai até a casa livre mais baixa da coluna.
 * - 2 jogadores, um lance por vez; coluna cheia não aceita peça.
 * - Vence quem fizer 4 peças seguidas na horizontal, vertical ou diagonal.
 * - Tabuleiro cheio sem 4 em linha = empate.
 * - Partida única; "De novo" começa outra na mesma sala, o placar acumula e quem começa alterna.
 */

export const COLS = 7;
export const ROWS = 6;

export type Seat = 0 | 1;

/** Casa do tabuleiro: coluna (0 = esquerda) e linha (0 = embaixo). */
export interface Cell {
  col: number;
  row: number;
}

export interface Move extends Cell {
  seat: Seat;
}

export type Phase = "playing" | "gameOver";

export interface GameState {
  /** Uma pilha por coluna, de baixo para cima. */
  cols: Seat[][];
  turn: Seat;
  /** Quem abriu esta partida (alterna no "De novo"). */
  starter: Seat;
  phase: Phase;
  moves: Move[];
  /** `null` com `phase: "gameOver"` = empate. */
  winner: Seat | null;
  winLine: Cell[] | null;
  /** Vitórias de cada lugar nesta sala e empates. */
  scores: [number, number];
  draws: number;
  gameNo: number;
}

export type Action = { type: "drop"; seat: Seat; col: number };

/** Sem informação escondida: a visão é o estado + o que este jogador pode fazer. */
export interface PlayerView extends GameState {
  seat: Seat;
  canPlay: boolean;
  /** Colunas que ainda aceitam peça (vazio fora da vez). */
  playable: number[];
}
