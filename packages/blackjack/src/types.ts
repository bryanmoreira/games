/*
 * Blackjack (21) — regras
 * - Até 5 jogadores contra a banca (a banca não ocupa lugar). Sapato de 6 baralhos de 52 cartas, embaralhado
 *   de novo no começo da rodada quando sobram menos de 25% das cartas (cartão de corte).
 * - Valores: 2 a 10 pelo número, J/Q/K valem 10 e o ás vale 11 ou 1. Mão "mole" = tem ás valendo 11.
 * - Partida: todos começam com 1000 fichas da mesa e jogam 5, 10 ou 20 rodadas. Terminar acima de 1000 é
 *   vitória, abaixo é derrota, igual é empate. Quem fica sem fichas para a aposta mínima assiste até o fim.
 * - Aposta: de 10 a 500, em múltiplos de 5, antes de as cartas saírem.
 * - Cada jogador recebe 2 cartas abertas; a banca, uma aberta e uma fechada. Banca com ás à mostra oferece
 *   seguro (meia aposta, paga 2:1 se a banca tiver blackjack). Com ás ou figura/10 à mostra, a banca confere
 *   se tem blackjack antes de os jogadores jogarem; se tiver, a rodada acaba ali.
 * - Blackjack = ás + carta de 10 nas 2 primeiras cartas; paga 3:2 (arredondado para baixo). Vitória paga
 *   1:1; empate devolve a aposta. Blackjack do jogador contra blackjack da banca é empate.
 * - Na vez: PEDE (mais uma carta), PARA, DOBRA (só com 2 cartas: dobra a aposta e recebe exatamente 1 carta)
 *   e DIVIDE (par de mesmo valor, uma vez só: vira duas mãos com uma aposta igual cada). Pode dobrar depois de
 *   dividir, menos com ases: ases divididos recebem uma carta cada e param. 21 depois de dividir não é
 *   blackjack. Passou de 21, estourou e perde na hora. Chegou a 21, para sozinho.
 * - Banca: vira a carta fechada e compra até 17; no 17 mole também compra (H17). Banca estourou: quem não
 *   estourou ganha.
 * - Sem desistência (surrender).
 */

export type Seat = number;
export type Suit = "clubs" | "diamonds" | "hearts" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

/** Carta física: `id` é único no sapato (o baralho de 0 a 5 entra no id). */
export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export const SEATS = 5;
export const DECKS = 6;
/** Embaralha de novo quando sobram menos cartas que isso no começo da rodada. */
export const CUT = Math.round(DECKS * 52 * 0.25);
export const START_CHIPS = 1000;
export const MIN_BET = 10;
export const MAX_BET = 500;
export const BET_STEP = 5;
export const ROUND_OPTIONS = [5, 10, 20] as const;
export type Rounds = (typeof ROUND_OPTIONS)[number];

/** Relógio de cada decisão (só com `clock`): aposta, seguro e cada mão na vez. */
export const BET_MS = 20_000;
export const INSURANCE_MS = 10_000;
export const TURN_MS = 20_000;
/** Tempo da distribuição na tela (o relógio de quem joga primeiro só começa depois). */
export const DEAL_ANIM_MS = 2200;

export interface Settings {
  rounds: Rounds;
  /** Relógio nas decisões (salas online); o solo joga sem relógio. */
  clock: boolean;
}

export const DEFAULT_SETTINGS: Settings = { rounds: 10, clock: true };

export type Phase = "bet" | "insurance" | "play" | "dealer" | "settle" | "gameOver";

export type HandResult = "blackjack" | "win" | "push" | "loss" | "bust";

export interface Hand {
  cards: Card[];
  bet: number;
  doubled: boolean;
  /** Mão que saiu de uma divisão (21 aqui não é blackjack). */
  split: boolean;
  /** Já parou (parou, estourou, dobrou, 21 ou ás dividido). */
  done: boolean;
  result: HandResult | null;
  /** Fichas que voltaram para o jogador no acerto (aposta incluída). */
  paid: number;
}

export interface PlayerStats {
  /** Rodadas em que apostou. */
  rounds: number;
  handsWon: number;
  handsPlayed: number;
  blackjacks: number;
  doublesWon: number;
  splits: number;
  /** Divisões em que as duas mãos ganharam. */
  splitSweeps: number;
  busts: number;
  /** Maior e menor saldo durante a partida. */
  peak: number;
  low: number;
  /** Maior ganho líquido numa rodada. */
  bestRound: number;
}

export interface Player {
  seat: Seat;
  chips: number;
  /** Aposta desta rodada: null = ainda não apostou; 0 = fica de fora. */
  bet: number | null;
  lastBet: number;
  hands: Hand[];
  /** Seguro: null = não decidiu (ou não ofereceram); 0 = recusou. */
  insurance: number | null;
  /** Ganho líquido da última rodada (para o banner). */
  net: number | null;
  stats: PlayerStats;
}

/** O que aconteceu, em ordem (público): a tela usa para som e animação. */
export type Event =
  | { n: number; kind: "shuffle" }
  | { n: number; kind: "bet"; seat: Seat; amount: number }
  | { n: number; kind: "deal"; cards: number }
  | { n: number; kind: "hit"; seat: Seat; hand: number }
  | { n: number; kind: "double"; seat: Seat; hand: number }
  | { n: number; kind: "split"; seat: Seat }
  | { n: number; kind: "stand"; seat: Seat; hand: number }
  | { n: number; kind: "bust"; seat: Seat; hand: number }
  | { n: number; kind: "insurance"; seat: Seat; take: boolean }
  | { n: number; kind: "reveal"; blackjack: boolean }
  | { n: number; kind: "dealerHit" }
  | { n: number; kind: "settle" };

export interface GameState {
  settings: Settings;
  /** Lugares que jogam, em ordem de jogo. */
  players: Seat[];
  /** Por lugar (null para lugar vazio). */
  table: (Player | null)[];
  shoe: Card[];
  shuffleNo: number;
  dealer: Card[];
  /** Carta fechada da banca ainda virada. */
  hidden: boolean;
  phase: Phase;
  /** Rodada atual (1 a `settings.rounds`). */
  round: number;
  /** Quem está na vez (fase play). */
  turn: { seat: Seat; hand: number } | null;
  /** Fim do relógio da decisão atual (ms do servidor), ou null. */
  deadline: number | null;
  events: Event[];
  eventNo: number;
  gameNo: number;
}

/** `at`: hora do servidor quando a ação chegou (o adaptador põe; a engine não lê relógio). */
export type Action =
  | { type: "bet"; seat: Seat; amount: number; at?: number }
  | { type: "insurance"; seat: Seat; take: boolean; at?: number }
  | { type: "hit"; seat: Seat; at?: number }
  | { type: "stand"; seat: Seat; at?: number }
  | { type: "double"; seat: Seat; at?: number }
  | { type: "split"; seat: Seat; at?: number }
  | { type: "advance"; at?: number };

/** Ação vinda do cliente (sem assento: o servidor põe). */
export type ClientAction =
  | { type: "bet"; amount: number }
  | { type: "insurance"; take: boolean }
  | { type: "hit" }
  | { type: "stand" }
  | { type: "double" }
  | { type: "split" };

export interface PlayerView {
  seat: Seat;
  settings: Settings;
  players: Seat[];
  table: (Player | null)[];
  /** Cartas da banca: a fechada vem `null` até virar. */
  dealer: (Card | null)[];
  /** Total da banca do que está à mostra. */
  dealerTotal: number;
  phase: Phase;
  round: number;
  turn: { seat: Seat; hand: number } | null;
  shoeLeft: number;
  shoeSize: number;
  shuffleNo: number;
  events: Event[];
  eventNo: number;
  gameNo: number;
  /** ms até acabar o tempo da decisão atual (null = sem relógio). */
  timeLeft: number | null;
  /** O que eu posso fazer agora. */
  canBet: boolean;
  /** Limites da minha aposta. */
  minBet: number;
  maxBet: number;
  mustInsure: boolean;
  insuranceCost: number;
  canHit: boolean;
  canStand: boolean;
  canDouble: boolean;
  canSplit: boolean;
}

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** Evento ainda sem número (a engine numera). */
export type EventInput = DistOmit<Event, "n">;
