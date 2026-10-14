/*
 * Ludo — regras
 * - 2 a 4 jogadores, 4 peças cada. Cores no sentido horário: vermelho, verde, amarelo, azul.
 *   Com 3 ou 4, a cor é a do lugar; com 2, o segundo pega a cor oposta à do primeiro.
 * - Na vez, rola o dado e move uma peça. A ordem da rodada é o sentido horário das cores.
 * - Peça sai da base com 1 ou 6 e vai para a casa de saída da cor (sem andar mais).
 * - Circuito de 52 casas; cada peça anda 50 casas depois da saída, entra na reta final da cor
 *   (5 casas) e chega ao centro. Para chegar, o número tem de ser exato.
 * - Parar numa casa com peça de outra cor captura: ela volta à base. Na saída de cada cor e nas
 *   estrelas (8 casas depois de cada saída) não há captura. Peças juntas não bloqueiam.
 * - Joga de novo: ao tirar 6, ao capturar e ao levar uma peça à chegada. O 3º seis seguido na mesma
 *   vez perde a vez sem mover. Sem lance possível, a vez passa (com 6, rola de novo).
 * - Vence quem levar as 4 peças primeiro; a partida acaba ali. Colocação dos outros: peças na
 *   chegada e, no empate, o caminho andado.
 * - Partida única; "De novo" começa outra na mesma sala, o placar acumula e quem começa passa ao próximo.
 */

/** Lugar na mesa (0 a 3). */
export type Seat = number;
/** 0 vermelho, 1 verde, 2 amarelo, 3 azul (sentido horário). */
export type Color = number;

export const COLORS = 4;
export const PIECES = 4;
/** Casas do circuito. */
export const TRACK = 52;
/** Distância entre a saída de uma cor e a da próxima. */
export const ARM = 13;
/** Última casa do circuito de cada cor (progresso), antes da reta final. */
export const LAST_TRACK = 50;
/** Progresso da chegada: 51 a 55 é a reta final. */
export const HOME = 56;
/** Peça na base. */
export const BASE = -1;

export type Phase = "roll" | "move" | "pass" | "gameOver";

/** Por que a vez passou sem mover (fase "pass"). */
export type PassReason = "noMoves" | "threeSixes";

export interface Capture {
  color: Color;
  piece: number;
  /** Progresso da peça capturada (na cor dela). */
  from: number;
}

export interface MoveRecord {
  seat: Seat;
  color: Color;
  piece: number;
  from: number;
  to: number;
  die: number;
  captured: Capture[];
}

export interface SeatStats {
  /** Peças adversárias capturadas. */
  captures: number;
  /** Peças próprias capturadas. */
  lost: number;
  /** Vezes que a vez chegou a este lugar. */
  turns: number;
  /** Já esteve com 0 peças na chegada enquanto um adversário tinha 3. */
  trailed: boolean;
}

export interface GameState {
  /** Lugares que jogam esta partida (em ordem crescente). */
  players: Seat[];
  /** Cor de cada lugar (null = fora da partida). */
  colorOf: (Color | null)[];
  /** Lugares na ordem da rodada, a partir de quem começa. */
  order: Seat[];
  /** Índice em `order` de quem joga agora. */
  turn: number;
  /** Lugar que abriu esta partida (passa ao próximo no "De novo"). */
  starter: Seat;
  /** Progresso de cada peça por cor: -1 base, 0..50 circuito, 51..55 reta final, 56 chegada. */
  pieces: number[][];
  phase: Phase;
  /** Último número do dado (null antes do primeiro lance da vez). */
  die: number | null;
  /** Seis seguidos nesta vez. */
  sixes: number;
  /** Rolagens na partida (o cliente anima o dado quando muda). */
  rolls: number;
  passReason: PassReason | null;
  moves: MoveRecord[];
  winner: Seat | null;
  /** Por lugar (índice = lugar). */
  stats: SeatStats[];
  /** Vitórias de cada lugar nesta sala. */
  scores: number[];
  gameNo: number;
}

export type Action =
  | { type: "roll"; seat: Seat }
  | { type: "move"; seat: Seat; piece: number }
  | { type: "advance" };

export type ClientAction = { type: "roll" } | { type: "move"; piece: number };

/** Sem informação escondida: a visão é o estado + o que este jogador pode fazer. */
export interface PlayerView extends GameState {
  seat: Seat;
  /** Cor deste jogador (null se assiste). */
  myColor: Color | null;
  /** Lugar da vez. */
  current: Seat | null;
  canRoll: boolean;
  canMove: boolean;
  /** Peças que dá para mover com o dado atual (vazio fora da vez). */
  movable: number[];
}
