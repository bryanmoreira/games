import type { Action, PlayerView, Seat } from "./types";

/** Jogos atendidos pelo servidor de salas. */
export type GameId = "truco-paulista" | "connect4" | "stop" | "batalha-naval" | "codenames" | "otrio" | "jogo-da-velha" | "damas" | "ludo" | "domino" | "xadrez" | "futebol-de-botao" | "tijolada" | "buraco" | "blackjack" | "sinuca";

export type ClientAction =
  | { type: "play"; index: number; hidden?: boolean }
  | { type: "truco" }
  | { type: "accept" }
  | { type: "raise" }
  | { type: "run" }
  | { type: "mao11"; play: boolean };

/** `A` é a ação do jogo da sala (sem `seat`: o servidor injeta o assento). */
export type ClientMsg<A = ClientAction> =
  /** `ticket`: conta logada no site (assinado pelo site), para salvar resultados. */
  | { t: "hello"; token: string; name: string; ticket?: string }
  /** `bots`: no modo solo, quantas IAs sentam (padrão: a mesa cheia). `settings`: opções já na criação (o solo começa direto). */
  | { t: "create"; solo?: boolean; game?: GameId; bots?: number; settings?: unknown }
  | { t: "join"; code: string }
  | { t: "sit"; seat: number }
  | { t: "stand" }
  | { t: "addBot"; seat: number }
  | { t: "removeBot"; seat: number }
  | { t: "settings"; settings: unknown }
  | { t: "start" }
  | { t: "restart" }
  /** Host volta a sala para o lobby depois do fim (trocar lugares/opções). */
  | { t: "lobby" }
  | { t: "leave" }
  | { t: "action"; action: A };

export interface SeatInfo {
  kind: "empty" | "human" | "bot";
  name: string;
  connected: boolean;
  /** Foto da conta (só de quem está logado). */
  image?: string | null;
  /** @usuario da conta (só de quem está logado), para abrir o perfil. */
  username?: string | null;
  /** Moldura e baralho da loja (só de quem está logado; chaves de apps/web/lib/shop/catalog.ts). */
  frame?: string | null;
  deck?: string | null;
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
  /** Os lugares ocupados bastam para começar (mínimo e, em alguns jogos, a composição dos times). */
  canStart: boolean;
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
  /** Jogo em tempo real: só a visão nova, várias vezes por segundo. */
  | { t: "frame"; view: V }
  | { t: "created"; code: string }
  | { t: "left" }
  | { t: "error"; message: string };

export function withSeat(a: ClientAction, seat: Seat): Action {
  return { ...a, seat } as Action;
}

// ---------- resultados (servidor de salas → site) ----------

export type Outcome = "win" | "loss" | "draw";

/** Resultado de um jogador logado numa partida terminada. */
export interface PlayerReport {
  userId: string;
  outcome: Outcome;
  /** Colocação (1 = primeiro) em jogos com mais de dois lados. */
  placement?: number;
  data: Record<string, unknown>;
}

export interface MatchReport {
  game: GameId;
  /** "ai": só um humano na mesa (o resto é IA). */
  mode: "ai" | "online";
  matchId: string;
  players: PlayerReport[];
}
