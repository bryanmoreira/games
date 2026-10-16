/*
 * Dominó — regras (batida, o dominó de bar)
 * - 28 peças, de 0-0 a 6-6. Em duplas (4 jogadores, 0/2 contra 1/3) ou mano a mano (1×1).
 *   Cada um recebe 7 peças. Nas duplas não sobra nada; no 1×1 as 14 que sobram ficam no monte.
 * - A vez passa para o lado (lugar seguinte). Joga-se uma peça que encaixe numa das duas pontas;
 *   a carroça (peça dupla) entra atravessada, mas só abre as duas pontas de sempre.
 * - Sem peça que encaixe: nas duplas passa a vez; no 1×1 compra do monte uma por vez até poder
 *   jogar, e com o monte vazio passa.
 * - 1ª mão da partida: sai quem tem a carroça de sena (6-6), jogando-a. No 1×1, se ninguém tiver,
 *   sai a maior carroça das mãos; sem carroça, a peça mais pesada. Nas mãos seguintes sai, com a peça
 *   que quiser, quem bateu ou quem fechou o jogo na mão anterior.
 * - Bater (jogar a última peça) marca para a dupla:
 *     simples 1 · carroça 2 (a última é uma carroça) · lá-e-lô 3 (a última não é carroça e seus dois
 *     números são as duas pontas, então entraria dos dois lados) · cruzada 4 (a última é uma carroça
 *     e as duas pontas têm o número dela).
 * - Jogo fechado (ninguém consegue jogar e o monte acabou): somam-se os pontos das peças na mão de
 *   cada dupla; a que tiver menos marca 1. Empate: ninguém marca e a mão seguinte vale o dobro.
 * - Vence a dupla que chegar a 6 pontos.
 */

/** Lugar na mesa (0 a 3). */
export type Seat = number;
/** Dupla: 0 (lugares 0 e 2) ou 1 (lugares 1 e 3). No 1×1, cada jogador é uma dupla. */
export type Team = 0 | 1;
/** Peça com os dois números em ordem crescente: [menor, maior]. */
export type Tile = [number, number];
/** Ponta da mesa. */
export type Side = "left" | "right";

export type Mode = "duplas" | "1x1";

export type Phase = "playing" | "handEnd" | "gameOver";

/** Tipo de batida (o que vale a mão). */
export type Win = "simples" | "carroca" | "laelo" | "cruzada";

export const SEATS = 4;
export const HAND = 7;
export const MAX_PIP = 6;
/** Pontos para vencer a partida. */
export const TARGET = 6;
/** Pontos de cada batida. */
export const WIN_POINTS: Record<Win, number> = { simples: 1, carroca: 2, laelo: 3, cruzada: 4 };

/** Peça na mesa. `inner` encosta na peça anterior (ou é o lado esquerdo da primeira); `outer` fica na ponta. */
export interface Placed {
  tile: Tile;
  inner: number;
  outer: number;
  seat: Seat;
  /** Ordem em que entrou na mesa (0 = primeira). */
  n: number;
}

export interface Board {
  /** Primeira peça da mão (null antes da saída). Ponta esquerda dela = `inner`, direita = `outer`. */
  first: Placed | null;
  /** Peças para a esquerda e para a direita da primeira, de dentro para fora. */
  left: Placed[];
  right: Placed[];
}

/** O que aconteceu na mão, em ordem (público: todos veem). */
export type Event =
  | { kind: "play"; seat: Seat; tile: Tile; side: Side | null; n: number }
  /** Passou a vez sem peça que encaixe; `ends` = as pontas naquele momento. */
  | { kind: "pass"; seat: Seat; ends: [number, number] }
  | { kind: "draw"; seat: Seat };

export interface HandResult {
  kind: "batida" | "fechado";
  /** Quem bateu ou quem fechou (jogou a última peça). */
  seat: Seat;
  /** Dupla que marcou (null no empate do fechado). */
  team: Team | null;
  points: number;
  /** Tipo de batida (só na batida). */
  win: Win | null;
  /** Pontos das peças na mão de cada dupla (no fechado; na batida também, para mostrar). */
  pips: [number, number];
  /** Esta mão valia o dobro. */
  doubled: boolean;
}

export interface SeatStats {
  /** Batidas deste lugar por tipo. */
  wins: Record<Win, number>;
  /** Jogos fechados por este lugar. */
  closed: number;
}

export interface GameState {
  mode: Mode;
  /** Lugares que jogam (2 ou 4), em ordem crescente. */
  players: Seat[];
  /** Mão de cada lugar (vazia para quem não joga). */
  hands: Tile[][];
  /** Monte (só no 1×1). */
  stock: Tile[];
  board: Board;
  /** Lugar da vez. */
  turn: Seat;
  phase: Phase;
  /** Mão atual (1, 2, ...). */
  handNo: number;
  /** A primeira mão da partida obriga a sair com esta peça (null nas outras). */
  opening: Tile | null;
  /** Quem começou a mão. */
  starter: Seat;
  /** A mão atual vale o dobro (empate no fechado da anterior). */
  doubled: boolean;
  events: Event[];
  /** Pontos de cada dupla. */
  scores: [number, number];
  /** Maior desvantagem que cada dupla já teve na partida (para a "virada"). */
  maxDeficit: [number, number];
  result: HandResult | null;
  winner: Team | null;
  stats: SeatStats[];
  gameNo: number;
}

export type Action =
  | { type: "play"; seat: Seat; tile: Tile; side?: Side }
  | { type: "draw"; seat: Seat }
  | { type: "advance" };

export type ClientAction = { type: "play"; tile: Tile; side?: Side } | { type: "draw" };

/** Onde uma peça da mão pode entrar. */
export interface Option {
  tile: Tile;
  /** Pontas possíveis (as duas só quando o resultado muda). */
  sides: Side[];
}

export interface PlayerView {
  mode: Mode;
  players: Seat[];
  seat: Seat;
  /** Minha mão (vazia para quem assiste). */
  myHand: Tile[];
  /** Peças na mão de cada lugar. */
  handCounts: number[];
  /** Mãos de todos, abertas no fim da mão (null durante a mão). */
  revealed: Tile[][] | null;
  stockCount: number;
  board: Board;
  /** Pontas [esquerda, direita] (null antes da saída). */
  ends: [number, number] | null;
  turn: Seat;
  phase: Phase;
  handNo: number;
  opening: Tile | null;
  starter: Seat;
  doubled: boolean;
  events: Event[];
  scores: [number, number];
  result: HandResult | null;
  winner: Team | null;
  gameNo: number;
  /** É a minha vez e tenho peça que encaixa. */
  canPlay: boolean;
  /** É a minha vez, nada encaixa e há monte. */
  canDraw: boolean;
  /** Peças que posso jogar agora e onde. */
  options: Option[];
}
