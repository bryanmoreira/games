/*
 * Buraco Fechado — regras
 * - 108 cartas: dois baralhos com 4 coringas. Curingas: o coringa e o 2. Em duplas (4 jogadores, 0/2 contra
 *   1/3) ou 1×1. Cada um recebe 11 cartas; sobram 2 mortos de 11 e o monte; uma carta vai virada ao lixo.
 * - A vez: comprar do monte ou pegar o lixo; baixar jogos; descartar uma carta (isso passa a vez).
 * - Jogo = sequência de 3 ou mais cartas do mesmo naipe, com no máximo 1 curinga. O ás vale 1 (antes do 2)
 *   ou depois do rei. O 2 do próprio naipe, no lugar dele (entre o ás e o 3), é carta natural; em qualquer
 *   outro lugar é curinga. Cada dupla acrescenta só nos seus jogos.
 * - Canastra = jogo com 7 ou mais cartas. Limpa (sem curinga) vale 200, suja (com curinga) 100 e real (limpa,
 *   do ás ao rei, 13 cartas) 500. Canastra aceita mais cartas depois dos 7.
 * - Lixo: só se pega se a carta de cima entrar numa sequência na hora (num jogo da dupla, ou com 2 ou mais
 *   cartas da mão num jogo novo). Curinga no topo trava o lixo. Quem pega leva a pilha toda.
 * - Morto: quem fica sem cartas na mão pega o morto (se a dupla ainda não pegou) e segue jogando.
 * - Bater: ficar sem cartas depois de a dupla ter pego o morto, com pelo menos uma canastra. Sem canastra
 *   não dá para bater nem ficar só com uma carta. Bater vale 100.
 * - Se o monte acabar e quem está na vez não puder pegar o lixo, a mão acaba sem batida.
 * - Pontos da mão (cada dupla): cartas nos jogos + bônus das canastras + 100 de quem bateu − cartas que
 *   sobraram nas mãos − 100 se a dupla não pegou o morto. Valores: 3 a 7 = 5, 8 a K = 10, A = 15, 2 = 20,
 *   coringa = 50. Vence a primeira dupla a chegar a 3000 (a de mais pontos, se as duas passarem).
 */

/** Lugar na mesa (0 a 3). */
export type Seat = number;
/** Dupla: 0 (lugares 0 e 2) ou 1 (lugares 1 e 3). No 1×1, cada jogador é uma dupla. */
export type Team = 0 | 1;
export type Suit = "clubs" | "diamonds" | "hearts" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "JK";
export type Mode = "duplas" | "1x1";

/** Carta física: `id` é único entre as 108 (o baralho 0 ou 1 entra no id). Coringa: rank "JK" e naipe null. */
export interface Card {
  id: string;
  rank: Rank;
  suit: Suit | null;
}

export const SEATS = 4;
export const HAND = 11;
export const MORTO = 11;
export const TARGET = 3000;
export const CANASTRA_MIN = 7;
export const CANASTRA_BONUS = { limpa: 200, suja: 100, real: 500 } as const;
export const BATIDA_BONUS = 100;
export const MORTO_PENALTY = 100;
/** Maior posição numa sequência: 1 = ás baixo, 14 = ás alto. */
export const MAX_POS = 14;
/** Uma sequência tem no máximo 13 cartas (um ás só). */
export const MAX_RUN = 13;

export type CanastraKind = "limpa" | "suja" | "real";

/** Carta num jogo e a posição que ocupa (1 = ás, 2..13, 14 = ás depois do rei). */
export interface MeldCard {
  card: Card;
  as: number;
}

/** Jogo na mesa, cartas em ordem crescente de posição. */
export interface Meld {
  id: string;
  team: Team;
  suit: Suit;
  cards: MeldCard[];
}

export type Phase = "playing" | "handEnd" | "gameOver";
/** Dentro da vez: comprar (ou pegar o lixo) e depois baixar/descartar. */
export type Step = "draw" | "play";

/** O que aconteceu, em ordem (público): a tela usa para som e animação. */
export type Event =
  | { n: number; kind: "draw"; seat: Seat }
  | { n: number; kind: "take"; seat: Seat; count: number }
  | { n: number; kind: "meld"; seat: Seat; meld: string; cards: Card[] }
  | { n: number; kind: "add"; seat: Seat; meld: string; cards: Card[] }
  | { n: number; kind: "discard"; seat: Seat; card: Card }
  | { n: number; kind: "morto"; seat: Seat }
  | { n: number; kind: "batida"; seat: Seat };

export interface TeamScore {
  /** Pontos das cartas nos jogos. */
  table: number;
  canastras: Record<CanastraKind, number>;
  /** Bônus das canastras. */
  bonus: number;
  /** 100 de quem bateu. */
  batida: number;
  /** Cartas que sobraram nas mãos (negativo). */
  hand: number;
  /** −100 de quem não pegou o morto. */
  morto: number;
  total: number;
}

export interface HandResult {
  kind: "batida" | "monte";
  /** Quem bateu (null quando o monte acabou). */
  seat: Seat | null;
  team: Team | null;
  scores: [TeamScore, TeamScore];
}

export interface SeatStats {
  batidas: number;
  mortos: number;
  /** Maior lixo que este lugar pegou (cartas). */
  maxPile: number;
}

export interface TeamStats {
  limpa: number;
  suja: number;
  real: number;
  /** Melhor mão da dupla (pontos). */
  bestHand: number;
}

export interface GameState {
  mode: Mode;
  /** Lugares que jogam (2 ou 4), em ordem crescente. */
  players: Seat[];
  hands: Card[][];
  stock: Card[];
  /** Lixo: a última carta é a de cima. */
  pile: Card[];
  /** Mortos ainda na mesa. */
  mortos: Card[][];
  /** Dupla já pegou o morto nesta mão. */
  mortoTaken: [boolean, boolean];
  melds: Meld[];
  nextMeld: number;
  turn: Seat;
  step: Step;
  phase: Phase;
  handNo: number;
  /** Quem deu as cartas (a vez é de quem vem depois). */
  dealer: Seat;
  /** Últimos acontecimentos (os mais novos no fim) e quantos já houve na partida. */
  events: Event[];
  eventNo: number;
  scores: [number, number];
  /** Pontos para vencer (padrão 3000; os testes usam menos). */
  target: number;
  /** Maior desvantagem que cada dupla já teve na partida. */
  maxDeficit: [number, number];
  result: HandResult | null;
  winner: Team | null;
  stats: SeatStats[];
  teamStats: [TeamStats, TeamStats];
  gameNo: number;
}

export type Action =
  | { type: "draw"; seat: Seat }
  /** Pega o lixo: a carta de cima entra num jogo da dupla (`meld`) ou num jogo novo com `cards` da mão. */
  | { type: "take"; seat: Seat; cards: string[]; meld: string | null; wildAt?: number }
  | { type: "meld"; seat: Seat; cards: string[]; wildAt?: number }
  | { type: "add"; seat: Seat; meld: string; cards: string[]; wildAt?: number }
  | { type: "discard"; seat: Seat; card: string }
  | { type: "advance" };

/** Ação vinda do cliente (sem assento: o servidor põe). */
export type ClientAction =
  | { type: "draw" }
  | { type: "take"; cards: string[]; meld: string | null; wildAt?: number }
  | { type: "meld"; cards: string[]; wildAt?: number }
  | { type: "add"; meld: string; cards: string[]; wildAt?: number }
  | { type: "discard"; card: string };

/** Um jeito de pegar o lixo (a carta de cima mais `cards` da mão). */
export interface TakeOption {
  meld: string | null;
  cards: string[];
}

export interface PlayerView {
  mode: Mode;
  players: Seat[];
  seat: Seat;
  /** Minha dupla (null para quem assiste). */
  team: Team | null;
  /** Minha mão, em ordem de naipe e valor (vazia para quem assiste). */
  myHand: Card[];
  handCounts: number[];
  stockCount: number;
  pile: Card[];
  mortosLeft: number;
  mortoTaken: [boolean, boolean];
  melds: Meld[];
  turn: Seat;
  step: Step;
  phase: Phase;
  handNo: number;
  dealer: Seat;
  events: Event[];
  eventNo: number;
  scores: [number, number];
  target: number;
  /** Mãos de todos, abertas no fim da mão (null durante a mão). */
  revealed: Card[][] | null;
  result: HandResult | null;
  winner: Team | null;
  gameNo: number;
  /** É a minha vez de comprar. */
  canDraw: boolean;
  /** É a minha vez de comprar e posso pegar o lixo (formas em `takeOptions`). */
  canTake: boolean;
  takeOptions: TakeOption[];
  /** Estou na fase de baixar/descartar. */
  canPlay: boolean;
}
