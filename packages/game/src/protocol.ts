import type { Action, PlayerView, Seat } from "./types";

/** Jogos atendidos pelo servidor de salas. */
export type GameId = "truco-paulista" | "connect4";

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
  | { t: "sit"; seat: Seat }
  | { t: "stand" }
  | { t: "addBot"; seat: Seat }
  | { t: "removeBot"; seat: Seat }
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
