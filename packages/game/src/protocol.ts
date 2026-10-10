import type { Action, PlayerView, Seat } from "./types";

/** Jogos atendidos pelo servidor de salas. */
export type GameId = "truco-paulista" | "connect4" | "stop";

export type ClientAction =
  | { type: "play"; index: number; hidden?: boolean }
  | { type: "truco" }
  | { type: "accept" }
  | { type: "raise" }
  | { type: "run" }
  | { type: "mao11"; play: boolean };

/** `A` é a ação do jogo da sala (sem `seat`: o servidor injeta o assento). */
export type ClientMsg<A = ClientAction> =
  | { t: "hello"; token: string; name: string }
  | { t: "create"; solo?: boolean; game?: GameId }
  | { t: "join"; code: string }
  | { t: "sit"; seat: number }
  | { t: "stand" }
  | { t: "addBot"; seat: number }
  | { t: "removeBot"; seat: number }
  | { t: "settings"; settings: unknown }
  | { t: "start" }
  | { t: "restart" }
  | { t: "leave" }
  | { t: "action"; action: A };

export interface SeatInfo {
  kind: "empty" | "human" | "bot";
  name: string;
  connected: boolean;
}

export interface RoomInfo {
  code: string;
  game: GameId;
  solo: boolean;
  started: boolean;
  isHost: boolean;
  mySeat: Seat | null;
  seats: SeatInfo[];
  waiting: string[];
  /** Mínimo de lugares ocupados para começar (sem mínimo = mesa cheia). */
  minSeats: number;
  /** O host pode pôr IA nos lugares vazios. */
  bots: boolean;
  /** Opções da partida escolhidas pelo host no lobby (jogos que têm opções). */
  settings: unknown;
  /** ms até o fim da fase atual, quando ela tem relógio. */
  timeLeft: number | null;
}

/** `V` é a visão do jogo da sala. */
export type ServerMsg<V = PlayerView> =
  | { t: "room"; room: RoomInfo; view: V | null }
  | { t: "created"; code: string }
  | { t: "left" }
  | { t: "error"; message: string };

export function withSeat(a: ClientAction, seat: Seat): Action {
  return { ...a, seat } as Action;
}
