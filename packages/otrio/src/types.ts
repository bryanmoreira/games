/*
 * Otrio — regras
 * - Tabuleiro 3×3; cada casa tem 3 encaixes: anel pequeno, médio e grande.
 * - 4 cores (vermelho, azul, verde, roxo), cada uma com 9 peças: 3 de cada tamanho.
 * - Na vez da sua cor, ponha uma peça num encaixe vazio do mesmo tamanho. Peça colocada não sai.
 * - Vence a cor que fizer uma trinca (sempre com uma cor só):
 *   - linha: 3 do mesmo tamanho em linha (horizontal, vertical ou diagonal);
 *   - escada: pequena → média → grande em linha (em qualquer sentido);
 *   - alvo: pequena + média + grande na mesma casa.
 * - Cor sem lance possível passa a vez; se nenhuma cor tem lance, empate.
 * - 2 a 4 jogadores, a cor de cada um é a do lugar:
 *   - 2 jogadores: cada um controla duas cores (a do lugar e uma das que sobraram) e joga na ordem
 *     A1, B1, A2, B2; vence com qualquer das duas cores, mas a trinca tem de ser de uma cor só;
 *   - 3 jogadores: a 4ª cor fica de fora.
 * - Partida única; "De novo" começa outra na mesma sala, o placar acumula e quem começa passa ao próximo.
 */

export const CELLS = 9;
export const SIZES = 3;
export const SLOTS = CELLS * SIZES;
export const COLORS = 4;
/** Peças de cada tamanho por cor. */
export const PER_SIZE = 3;

/** Lugar na mesa (0 a 3); a cor própria de cada lugar tem o mesmo número. */
export type Seat = number;
/** 0 vermelho, 1 azul, 2 verde, 3 roxo. */
export type Color = number;
/** 0 pequena, 1 média, 2 grande. */
export type Size = 0 | 1 | 2;

/** Encaixe do tabuleiro: casa (0 a 8, linha a linha) × tamanho. Índice = cell * 3 + size. */
export interface Slot {
  cell: number;
  size: Size;
}

export interface Move extends Slot {
  color: Color;
  seat: Seat;
}

/** Como a trinca foi feita. */
export type WinKind = "line" | "stair" | "stack";

export interface Triple {
  slots: [number, number, number];
  kind: WinKind;
}

export type Phase = "playing" | "gameOver";

export interface GameState {
  /** Cor em cada encaixe (índice = cell * 3 + size), ou null. */
  board: (Color | null)[];
  /** Lugares que jogam esta partida, em ordem. */
  players: Seat[];
  /** Dono de cada cor (null = cor fora da partida). */
  owner: (Seat | null)[];
  /** Ordem das cores na rodada. */
  order: Color[];
  /** Índice em `order` de quem joga agora. */
  turn: number;
  /** Lugar que abriu esta partida (passa ao próximo no "De novo"). */
  starter: Seat;
  /** Peças que sobram de cada cor: [pequenas, médias, grandes]. */
  stock: [number, number, number][];
  phase: Phase;
  moves: Move[];
  /** `null` com `phase: "gameOver"` = empate. */
  winner: Seat | null;
  winColor: Color | null;
  win: Triple | null;
  /** Vitórias de cada lugar nesta sala e empates. */
  scores: number[];
  draws: number;
  gameNo: number;
}

export type Action = { type: "place"; seat: Seat; cell: number; size: Size };

/** Sem informação escondida: a visão é o estado + o que este jogador pode fazer. */
export interface PlayerView extends GameState {
  seat: Seat;
  /** Cores deste jogador (uma, ou duas com 2 jogadores). */
  myColors: Color[];
  /** Cor da vez (de quem quer que seja). */
  color: Color | null;
  canPlay: boolean;
  /** Encaixes livres em que dá para jogar agora (índices), vazio fora da vez. */
  placeable: number[];
}
