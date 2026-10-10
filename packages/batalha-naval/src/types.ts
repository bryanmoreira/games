/*
 * Batalha Naval — regras
 * - 2 jogadores, cada um com um mar de 10×10 casas.
 * - Frota clássica, 5 navios retos: porta-aviões (5), encouraçado (4), cruzador (3), submarino (3) e destróier (2).
 * - Posicionamento: os dois montam a frota ao mesmo tempo, na horizontal ou na vertical, dentro do mar.
 *   Os navios podem encostar uns nos outros (inclusive na diagonal), só não podem se sobrepor.
 * - Batalha: um tiro por vez numa casa do mar inimigo ainda não atingida.
 *   Água = passa a vez. Acertou = atira de novo. Quando todas as casas de um navio são atingidas, ele afunda
 *   e aparece inteiro para quem atirou.
 * - Vence quem afundar a frota inteira do adversário.
 * - Partida única; "De novo" começa outra na mesma sala, o placar acumula e quem começa alterna.
 */

export const SIZE = 10;

export interface ShipKind {
  id: string;
  name: string;
  size: number;
}

/** A frota, do maior para o menor; a posição na lista é o índice do navio. */
export const FLEET: readonly ShipKind[] = [
  { id: "carrier", name: "Porta-aviões", size: 5 },
  { id: "battleship", name: "Encouraçado", size: 4 },
  { id: "cruiser", name: "Cruzador", size: 3 },
  { id: "submarine", name: "Submarino", size: 3 },
  { id: "destroyer", name: "Destróier", size: 2 },
];

export type Seat = 0 | 1;
export type Dir = "h" | "v";

/** Casa do mar: coluna (0 = esquerda) e linha (0 = em cima). */
export interface Cell {
  col: number;
  row: number;
}

/** Navio posicionado: casa da ponta (esquerda ou de cima) e direção. O tamanho vem de `FLEET`. */
export interface Ship extends Cell {
  dir: Dir;
}

export interface Shot extends Cell {
  /** Quem atirou (o alvo é o mar do outro). */
  seat: Seat;
  hit: boolean;
  /** Índice do navio que este tiro afundou. */
  sunk: number | null;
}

export type Phase = "placing" | "battle" | "gameOver";

export interface GameState {
  phase: Phase;
  /** Frota de cada lugar (null enquanto não confirmou). */
  fleets: [Ship[] | null, Ship[] | null];
  turn: Seat;
  /** Quem dá o primeiro tiro desta partida (alterna no "De novo"). */
  starter: Seat;
  shots: Shot[];
  winner: Seat | null;
  /** Vitórias de cada lugar nesta sala. */
  scores: [number, number];
  gameNo: number;
}

export type Action = { type: "place"; seat: Seat; ships: Ship[] } | { type: "shoot"; seat: Seat; col: number; row: number };

/** Ação vinda do cliente (o servidor põe o assento). */
export type ClientAction = { type: "place"; ships: Ship[] } | { type: "shoot"; col: number; row: number };

/** Navio inimigo conhecido: afundado, ou revelado no fim da partida. */
export interface KnownShip {
  index: number;
  ship: Ship;
  sunk: boolean;
}

export interface PlayerView {
  seat: Seat;
  phase: Phase;
  turn: Seat;
  starter: Seat;
  winner: Seat | null;
  scores: [number, number];
  gameNo: number;
  /** Quem já confirmou a frota. */
  ready: [boolean, boolean];
  myFleet: Ship[] | null;
  /** Todos os tiros (os dois lados veem onde caiu cada um). */
  shots: Shot[];
  /** Navios do adversário que você já pode ver. */
  enemyShips: KnownShip[];
  canPlace: boolean;
  canShoot: boolean;
}
