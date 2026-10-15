/*
 * Xadrez — regras da FIDE
 * - Tabuleiro 8×8 com a casa clara no canto direito de cada jogador; as brancas começam. As cores alternam a
 *   cada partida (na primeira, sorteio).
 * - Rei 1 casa em qualquer direção; dama, torre e bispo deslizam (dama em todas, torre em linha, bispo na
 *   diagonal) sem pular peças; cavalo em "L" e pula; peão anda 1 para a frente (2 no primeiro lance) e
 *   captura na diagonal.
 * - Roque: rei e torre sem ter andado, casas entre eles vazias, rei fora de xeque e sem passar nem parar em
 *   casa atacada. En passant: logo depois de o peão adversário andar 2 casas ao lado do seu.
 * - Promoção: o peão que chega à última fileira vira dama, torre, bispo ou cavalo (quem joga escolhe).
 * - Ninguém pode deixar o próprio rei em xeque.
 * - Fim: xeque-mate (vence quem deu); rei afogado, só reis e peças que não dão mate, a mesma posição pela 3ª
 *   vez ou 50 lances de cada lado sem captura nem lance de peão (empate); desistência; empate combinado.
 * - Relógio (opção do host): sem relógio, 3+2, 5+0 ou 10+0 (minutos + segundos de acréscimo por lance).
 *   Quem fica sem tempo perde, a não ser que o adversário tenha só o rei (empate).
 * - "De novo" começa outra na mesma sala; o placar acumula.
 * - Opção do host: nível da IA (fácil, médio ou difícil).
 */

export const SIZE = 8;
export const SQUARES = 64;

/** Peças: positivo brancas, negativo pretas. */
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

/** Peças em que o peão pode virar. */
export const PROMOTIONS = [QUEEN, ROOK, BISHOP, KNIGHT] as const;

/** Lances (somando os dois lados) sem captura nem peão até o empate: 50 de cada lado. */
export const FIFTY_LIMIT = 100;
/** A mesma posição pela 3ª vez empata. */
export const REPEAT_LIMIT = 3;

export type Seat = 0 | 1;
export type Color = "white" | "black";
export type Level = "easy" | "medium" | "hard";
export type TimeControl = "none" | "3+2" | "5+0" | "10+0";

export const LEVELS: readonly Level[] = ["easy", "medium", "hard"];
export const CLOCKS: readonly TimeControl[] = ["none", "3+2", "5+0", "10+0"];

/** Minutos e segundos de acréscimo de cada relógio. */
export const CLOCK_TIME: Record<Exclude<TimeControl, "none">, { base: number; inc: number }> = {
  "3+2": { base: 3 * 60_000, inc: 2_000 },
  "5+0": { base: 5 * 60_000, inc: 0 },
  "10+0": { base: 10 * 60_000, inc: 0 },
};

export interface Settings {
  level: Level;
  clock: TimeControl;
}

export const DEFAULT_SETTINGS: Settings = { level: "medium", clock: "none" };

/**
 * Casas de 0 a 63, linha a linha a partir de cima na visão das brancas: 0 = a8, 7 = h8, 56 = a1, 63 = h1.
 * As brancas sobem (a linha diminui).
 */
export type Board = number[];

/** Roque ainda possível: 1 brancas pequeno, 2 brancas grande, 4 pretas pequeno, 8 pretas grande. */
export type Castling = number;

/** Lance na interface e no protocolo. `promo` só quando o peão chega à última fileira. */
export interface Move {
  from: number;
  to: number;
  promo?: number;
}

export interface MoveRecord {
  seat: Seat;
  from: number;
  to: number;
  /** Peça em que o peão virou (0 sem promoção). */
  promo: number;
  /** Peça capturada (valor absoluto; 0 sem captura). */
  captured: number;
  /** Casa da peça capturada (diferente de `to` no en passant). */
  capturedAt: number;
  /** Roque: casas de onde e para onde a torre foi. */
  rook: [number, number] | null;
  /** Notação em português (e4, Cf3, O-O, exd8=D#). */
  san: string;
  /** Xeque depois do lance. */
  check: boolean;
}

export type Phase = "playing" | "gameOver";

/** Como a partida acabou. */
export type EndReason = "mate" | "stalemate" | "material" | "repeat" | "fifty" | "resign" | "agreed" | "time";

/** Números de cada lugar na partida (para a tela de fim e o perfil). */
export interface SeatStats {
  /** Pontos de material capturados (peão 1, cavalo e bispo 3, torre 5, dama 9). */
  captured: number;
  /** Maior desvantagem de material em algum momento (para a Virada). */
  behind: number;
  promotions: number;
  /** Perdeu alguma dama. */
  lostQueen: boolean;
}

export interface Clock {
  base: number;
  inc: number;
  /** Tempo de cada lugar (ms) no começo da vez atual. */
  left: [number, number];
  /** Quando a vez atual começou (relógio do servidor). */
  since: number;
}

export interface GameState {
  settings: Settings;
  board: Board;
  castle: Castling;
  /** Casa em que dá para capturar en passant (-1 nenhuma). */
  ep: number;
  /** Lances seguidos sem captura nem lance de peão. */
  half: number;
  /** Quem joga de brancas (alterna no "De novo"). */
  white: Seat;
  turn: Seat;
  phase: Phase;
  moves: MoveRecord[];
  /** `null` com `phase: "gameOver"` = empate. */
  winner: Seat | null;
  end: EndReason | null;
  /** Quantas vezes cada posição apareceu desde o último lance sem volta. */
  positions: Record<string, number>;
  clock: Clock | null;
  /** Quem ofereceu empate e ainda espera resposta. */
  drawOffer: Seat | null;
  /** Número de lances da partida quando cada lugar ofereceu empate pela última vez (-1 nunca). */
  offeredAt: [number, number];
  stats: [SeatStats, SeatStats];
  /** Vitórias de cada lugar nesta sala e empates. */
  scores: [number, number];
  draws: number;
  gameNo: number;
}

export type Action =
  | { type: "move"; seat: Seat; from: number; to: number; promo?: number; at?: number }
  | { type: "resign"; seat: Seat; at?: number }
  | { type: "offerDraw"; seat: Seat; at?: number }
  | { type: "answerDraw"; seat: Seat; accept: boolean; at?: number }
  /** O servidor confere se acabou o tempo de quem está na vez. */
  | { type: "flag"; at: number };

/** Sem informação escondida: a visão é o estado + o que este jogador pode fazer. */
export interface PlayerView extends GameState {
  seat: Seat;
  color: Color;
  canPlay: boolean;
  /** Lances válidos (vazio fora da vez); a promoção aparece uma vez por peça. */
  legal: Move[];
  /** Quem está na vez está em xeque. */
  check: boolean;
  /** Tempo de cada lugar agora (ms), já descontando a vez em andamento. */
  timeLeft: [number, number] | null;
  canOfferDraw: boolean;
  mustAnswerDraw: boolean;
}
