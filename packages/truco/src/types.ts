export type Suit = "diamonds" | "spades" | "hearts" | "clubs";
export type Rank = "4" | "5" | "6" | "7" | "Q" | "J" | "K" | "A" | "2" | "3";

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export type Seat = 0 | 1 | 2 | 3;
export type Team = 0 | 1;
export type HandMode = "normal" | "mao11" | "ferro";
export type Phase = "mao11" | "playing" | "roundEnd" | "handEnd" | "gameOver";

export interface Play {
  seat: Seat;
  card: Card | null; // null = carta coberta vista por outro jogador
  hidden: boolean;
}

export interface Round {
  leader: Seat;
  plays: Play[];
  winner: Team | "tie" | null;
  winningSeat: Seat | null;
}

export interface Bet {
  from: Seat;
  team: Team;
  value: number;
}

export interface HandResult {
  winner: Team | null;
  points: number;
  reason: "rounds" | "run" | "mao11run" | "tie";
}

export type ShoutKind = "truco" | "accept" | "run" | "mao11play" | "mao11run";

export interface Shout {
  id: number;
  seat: Seat;
  kind: ShoutKind;
  value?: number;
}

export interface HandState {
  dealer: Seat;
  vira: Card;
  manilha: Rank;
  hands: Card[][];
  rounds: Round[];
  turn: Seat;
  value: number;
  bet: Bet | null;
  lastRaiseTeam: Team | null;
  mode: HandMode;
  mao11Team: Team | null;
  result: HandResult | null;
}

export interface GameState {
  /** Lugares na partida: os 4 (duplas) ou 2 em times diferentes (1×1). */
  players: Seat[];
  scores: [number, number];
  phase: Phase;
  winner: Team | null;
  handNo: number;
  hand: HandState;
  shout: Shout | null;
}

export type Action =
  | { type: "play"; seat: Seat; index: number; hidden?: boolean }
  | { type: "truco"; seat: Seat }
  | { type: "accept"; seat: Seat }
  | { type: "raise"; seat: Seat }
  | { type: "run"; seat: Seat }
  | { type: "mao11"; seat: Seat; play: boolean }
  | { type: "advance" };

export interface PlayerView {
  seat: Seat;
  players: Seat[];
  scores: [number, number];
  phase: Phase;
  winner: Team | null;
  handNo: number;
  dealer: Seat;
  vira: Card;
  manilha: Rank;
  myHand: (Card | null)[];
  partnerHand: Card[] | null;
  handCounts: number[];
  rounds: Round[];
  turn: Seat;
  value: number;
  bet: Bet | null;
  lastRaiseTeam: Team | null;
  mode: HandMode;
  mao11Team: Team | null;
  result: HandResult | null;
  shout: Shout | null;
  canPlay: boolean;
  canHide: boolean;
  canTruco: boolean;
  mustRespond: boolean;
  canRaise: boolean;
  mustDecideMao11: boolean;
  nextBet: number | null;
}
