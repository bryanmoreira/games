/*
 * Damas — regras brasileiras
 * - Tabuleiro 8×8; joga-se nas 32 casas escuras, com uma casa escura no canto esquerdo de cada jogador.
 * - 12 pedras para cada um nas três primeiras fileiras. As brancas começam; as cores alternam a cada partida
 *   (na primeira, sorteio).
 * - A pedra anda uma casa na diagonal, para a frente. Captura pulando a peça adversária vizinha para a casa
 *   vazia logo atrás, para a frente e para trás.
 * - A pedra que termina o lance na última fileira vira dama. Se chegar lá no meio de uma captura e ainda puder
 *   capturar, continua como pedra e não é promovida.
 * - A dama anda quantas casas quiser na diagonal e captura à distância: pula uma peça adversária e pousa em
 *   qualquer casa vazia depois dela.
 * - Captura é obrigatória, inclusive em sequência. Lei da maioria: entre as capturas possíveis, é obrigatório
 *   fazer a que leva mais peças (pedra e dama valem o mesmo). Com o mesmo número, o jogador escolhe.
 * - As peças capturadas só saem do tabuleiro no fim do lance: não dá para pular a mesma peça duas vezes, e
 *   ela continua bloqueando a passagem.
 * - Perde quem fica sem peças ou sem lance.
 * - Empate: 20 lances seguidos de cada lado só com damas, sem captura nem pedra andando; a mesma posição pela
 *   3ª vez; ou 5 lances de cada lado nos finais de 2 damas contra 1, 2 damas e 1 pedra contra 1 dama,
 *   1 dama e 2 pedras contra 1 dama, 1 dama e 1 pedra contra 1 dama, ou 1 dama contra 1 dama.
 * - "De novo" começa outra na mesma sala; o placar acumula.
 * - Opção do host: nível da IA (fácil, médio ou difícil).
 */

export const SIZE = 8;
export const SQUARES = SIZE * SIZE;
export const PIECES = 12;

/** Lances seguidos (somando os dois lados) só de damas, sem captura, até o empate: 20 de cada lado. */
export const QUIET_LIMIT = 40;
/** Lances (somando os dois lados) nos finais pequenos até o empate: 5 de cada lado. */
export const ENDGAME_LIMIT = 10;
/** A mesma posição pela 3ª vez empata. */
export const REPEAT_LIMIT = 3;

export type Seat = 0 | 1;
export type Color = "white" | "black";
export type Level = "easy" | "medium" | "hard";

export const LEVELS: readonly Level[] = ["easy", "medium", "hard"];

export interface Settings {
  level: Level;
}

export const DEFAULT_SETTINGS: Settings = { level: "medium" };

/**
 * Casa do tabuleiro: 0 vazia; 1 pedra branca, 2 dama branca; -1 pedra preta, -2 dama preta.
 * As casas vão de 0 a 63, linha a linha a partir de cima (visão das brancas); as brancas sobem.
 */
export type Cell = 0 | 1 | 2 | -1 | -2;

export const EMPTY = 0;
export const WHITE_MAN = 1;
export const WHITE_KING = 2;
export const BLACK_MAN = -1;
export const BLACK_KING = -2;

/** Um lance possível: a peça em `from` passa pelas casas de `path` (a última é onde para). */
export interface Move {
  from: number;
  path: number[];
  /** Casas das peças capturadas, na ordem. */
  captured: number[];
}

export interface MoveRecord extends Move {
  seat: Seat;
  /** A peça virou dama neste lance. */
  promoted: boolean;
  /** Quantas das capturadas eram damas. */
  kingsTaken: number;
}

export type Phase = "playing" | "gameOver";

/** Como a partida acabou. */
export type EndReason = "noMoves" | "quiet" | "repeat" | "endgame";

/** Números de cada lugar na partida (para a tela de fim e o perfil). */
export interface SeatStats {
  /** Peças capturadas do adversário. */
  captured: number;
  /** Maior captura num lance só. */
  bestChain: number;
  /** Damas feitas. */
  kings: number;
  /** Maior desvantagem de peças em algum momento (para a Virada). */
  behind: number;
}

export interface GameState {
  settings: Settings;
  board: Cell[];
  /** Quem joga de brancas (alterna no "De novo"). */
  white: Seat;
  turn: Seat;
  phase: Phase;
  moves: MoveRecord[];
  /** `null` com `phase: "gameOver"` = empate. */
  winner: Seat | null;
  end: EndReason | null;
  /** Lances seguidos só de damas sem captura. */
  quiet: number;
  /** Lances seguidos num final pequeno (com o mesmo material). */
  endgame: number;
  /** Quantas vezes cada posição apareceu desde o último lance sem volta (pedra andando ou captura). */
  positions: Record<string, number>;
  stats: [SeatStats, SeatStats];
  /** Vitórias de cada lugar nesta sala e empates. */
  scores: [number, number];
  draws: number;
  gameNo: number;
}

export type Action = { type: "move"; seat: Seat; from: number; path: number[] };

/** Sem informação escondida: a visão é o estado + o que este jogador pode fazer. */
export interface PlayerView extends GameState {
  seat: Seat;
  color: Color;
  canPlay: boolean;
  /** Lances válidos (vazio fora da vez). Com captura, só as que levam mais peças. */
  legal: Move[];
}
