/*
 * Jogo da Velha — regras
 * - Tabuleiro 3×3, 2 jogadores. Quem começa a partida joga de X; o outro, de O.
 * - Um lance por vez, numa casa vazia. Vence quem fizer 3 em linha (horizontal, vertical ou diagonal).
 * - Clássico: tabuleiro cheio sem 3 em linha = velha (empate).
 * - Some: cada um tem no máximo 3 peças no tabuleiro; ao pôr a 4ª, a mais antiga dele some antes de
 *   checar a linha. Sem vencedor em 30 lances = velha.
 * - Partida única; "De novo" começa outra na mesma sala, o placar acumula e quem começa (o X) alterna.
 * - Opções do host: modo (clássico ou some) e nível da IA (fácil, médio ou impossível).
 */

export const CELLS = 9;
/** Peças de cada um no tabuleiro no modo "some". */
export const MAX_PIECES = 3;
/** Lances no modo "some" até virar velha. */
export const FADE_LIMIT = 30;

export type Seat = 0 | 1;
export type Mark = "X" | "O";
export type Mode = "classic" | "fading";
export type Level = "easy" | "medium" | "hard";

export const MODES: readonly Mode[] = ["classic", "fading"];
export const LEVELS: readonly Level[] = ["easy", "medium", "hard"];

export interface Settings {
  mode: Mode;
  level: Level;
}

export const DEFAULT_SETTINGS: Settings = { mode: "classic", level: "medium" };

export interface Move {
  cell: number;
  seat: Seat;
  /** Casa que sumiu neste lance (modo "some"). */
  removed?: number;
}

export type Phase = "playing" | "gameOver";

export interface GameState {
  settings: Settings;
  /** Casas 0–8, linha a linha a partir de cima; dono ou vazia. */
  board: (Seat | null)[];
  /** Casas de cada lugar na ordem em que foram postas (a primeira é a próxima a sumir). */
  pieces: [number[], number[]];
  turn: Seat;
  /** Quem abriu esta partida e joga de X (alterna no "De novo"). */
  starter: Seat;
  phase: Phase;
  moves: Move[];
  /** `null` com `phase: "gameOver"` = velha. */
  winner: Seat | null;
  winLine: number[] | null;
  /** O último lance de cada lugar deixou duas ou mais casas que fecham a linha (garfo). */
  double: [boolean, boolean];
  /** O vencedor fechou a linha depois de um garfo. */
  fork: boolean;
  /** Vitórias de cada lugar nesta sala e velhas. */
  scores: [number, number];
  draws: number;
  gameNo: number;
}

export type Action = { type: "place"; seat: Seat; cell: number };

/** Sem informação escondida: a visão é o estado + o que este jogador pode fazer. */
export interface PlayerView extends GameState {
  seat: Seat;
  canPlay: boolean;
  /** Casas livres (vazio fora da vez). */
  playable: number[];
}
