import type { Action, PlayerView, Seat } from "./types";

export type ClientAction =
  | { type: "play"; index: number; hidden?: boolean }
  | { type: "truco" }
  | { type: "accept" }
  | { type: "raise" }
  | { type: "run" }
  | { type: "mao11"; play: boolean };

export type ClientMsg =
  | { t: "hello"; token: string; name: string }
  | { t: "create"; solo?: boolean }
  | { t: "join"; code: string }
  | { t: "sit"; seat: Seat }
  | { t: "stand" }
  | { t: "addBot"; seat: Seat }
  | { t: "removeBot"; seat: Seat }
  | { t: "start" }
  | { t: "restart" }
  | { t: "leave" }
  | { t: "action"; action: ClientAction };

export interface SeatInfo {
  kind: "empty" | "human" | "bot";
  name: string;
  connected: boolean;
}

export interface RoomInfo {
  code: string;
  solo: boolean;
  started: boolean;
  isHost: boolean;
  mySeat: Seat | null;
  seats: SeatInfo[];
  waiting: string[];
}

export type ServerMsg =
  | { t: "room"; room: RoomInfo; view: PlayerView | null }
  | { t: "created"; code: string }
  | { t: "left" }
  | { t: "error"; message: string };

export function withSeat(a: ClientAction, seat: Seat): Action {
  return { ...a, seat } as Action;
}
