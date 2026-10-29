/*
 * Sinuca — bola 8, regras da WPA
 * - 15 bolas numeradas e a branca. Lisas: 1 a 7; listradas: 9 a 15; a 8 é preta.
 * - 1×1 ou 2×2 (lugares pares contra ímpares). A vez gira pelos lugares (A1, B1, A2, B2), então os times
 *   alternam. Quem encaçapa uma bola sua continua; quem erra ou faz falta passa a vez.
 * - Quebra: a branca vai na cozinha (atrás da linha de cabeceira). Quebra válida = encaçapar alguma bola ou
 *   levar pelo menos 4 bolas numeradas à tabela. Quebra inválida é falta (o adversário aceita a mesa com bola na
 *   mão). Branca na caçapa na quebra: o adversário põe a branca na cozinha. A 8 encaçapada na quebra volta para
 *   a marca do pé e quem quebrou continua (se não fez falta).
 * - Mesa aberta depois da quebra: o primeiro a encaçapar uma bola numa tacada válida fica com o grupo dela
 *   (lisas ou listradas). Com a mesa aberta, bater primeiro na 8 é falta.
 * - Tacada válida: a branca toca primeiro numa bola do seu grupo (ou na 8, quando é a vez dela) e depois alguma
 *   bola cai ou alguma bola encosta numa tabela.
 * - Faltas: branca na caçapa, não tocar em nada, tocar primeiro na bola errada, nada cair nem bater na tabela
 *   depois do toque, estourar o tempo. Com bola na mão na cozinha, a primeira bola tocada tem que estar fora
 *   dela. Falta dá ao adversário bola na mão em qualquer lugar da mesa.
 * - A 8: só depois de encaçapar todas as do seu grupo, cantando a caçapa. Ganha quem encaçapa a 8 na caçapa
 *   cantada sem falta. Perde quem encaçapa a 8 antes da hora, em outra caçapa ou junto com uma falta.
 * - Tempo por tacada (opção do host): 45 s; estourar é falta.
 * - Nível da IA (opção do host): fácil, médio ou difícil.
 */

import type { BallPos, Shot } from "./physics";

export const MAX_PLAYERS = 4;
export const SHOT_MS = 45_000;
/** A branca é a bola 0 e a 8 é a preta. */
export const CUE = 0;
export const EIGHT = 8;

export type Team = 0 | 1;
export type Group = "solids" | "stripes";
export type Level = "easy" | "medium" | "hard";
export const LEVELS: readonly Level[] = ["easy", "medium", "hard"];

export interface Settings {
  level: Level;
  /** tempo por tacada */
  clock: boolean;
}

export const DEFAULT_SETTINGS: Settings = { level: "medium", clock: true };

export type Foul = "scratch" | "noHit" | "wrongBall" | "noRail" | "kitchen" | "badBreak" | "time";

/** Como a partida acabou. */
export type End = "eight" | "early" | "wrongPocket" | "scratchEight";

export interface SeatStats {
  shots: number;
  /** bolas do próprio grupo (e a 8 da vitória) encaçapadas */
  potted: number;
  /** mais bolas numa visita só */
  bestRun: number;
  /** mais bolas do próprio grupo numa tacada só */
  bestShot: number;
  fouls: number;
  /** encaçapou alguma na quebra */
  breakPot: boolean;
}

export interface LastShot {
  seat: number;
  shot: Shot;
  /** bolas antes da tacada (com a branca já no lugar escolhido) */
  before: BallPos[];
  call: number | null;
  pocketed: { n: number; pocket: number }[];
  foul: Foul | null;
  /** duração da animação, em ms */
  ms: number;
  brk: boolean;
}

export interface GameState {
  /** lugares na ordem da vez */
  players: number[];
  settings: Settings;
  balls: BallPos[];
  phase: "break" | "play" | "over";
  turn: number;
  /** bola na mão: na cozinha (quebra ou branca na caçapa na quebra), na mesa toda (falta) ou não */
  inHand: "kitchen" | "table" | null;
  /** grupo de cada time (índice = time), null com a mesa aberta */
  groups: [Group | null, Group | null];
  winner: Team | null;
  end: End | null;
  /** quem quebrou */
  breaker: number;
  shotNo: number;
  last: LastShot | null;
  /** bolas na visita atual de quem está na vez */
  run: number;
  /** tacadas de cada time depois da quebra */
  teamShots: [number, number];
  stats: SeatStats[];
  /** hora em que acaba o tempo de quem está na vez (com relógio) */
  deadline: number | null;
}

export type Action =
  | { type: "shot"; seat: number; shot: Shot; place?: { x: number; y: number }; call?: number; at: number }
  | { type: "timeout"; at: number };

/** Ação do cliente, sem lugar nem hora. */
export type ClientAction = { type: "shot"; shot: Shot; place?: { x: number; y: number }; call?: number };

export interface PlayerView extends Omit<GameState, "deadline"> {
  seat: number | null;
  team: Team | null;
  /** grupo do time de quem vê */
  mine: Group | null;
  myTurn: boolean;
  /** bolas que a branca pode tocar primeiro */
  targets: number[];
  /** a vez de quem joga é na 8 (precisa cantar a caçapa) */
  onEight: boolean;
  /** ms até acabar o tempo de quem está na vez */
  timeLeft: number | null;
}

export const teamOf = (seat: number): Team => (seat % 2) as Team;
export const groupOf = (n: number): Group | null => (n >= 1 && n <= 7 ? "solids" : n >= 9 && n <= 15 ? "stripes" : null);
export const otherGroup = (g: Group): Group => (g === "solids" ? "stripes" : "solids");
