import type { GameId, MatchReport, PlayerReport, Seat } from "@truco/game";
import type { GameAdapter } from "./games";

/** O que o início e o fim da partida precisam saber de cada lugar da mesa. */
export interface SeatSlot {
  kind: "empty" | "human" | "bot";
  token?: string;
}

/** Quem começou a partida em cada lugar (para o resultado e para saber quem abandonou). */
export interface Match {
  id: string;
  mode: "ai" | "online";
  players: { seat: Seat; token: string; userId: string | null }[];
}

/** Humanos sentados no começo da partida; `userIdOf` devolve a conta do token (null se não está logado). */
export function matchPlayers(seats: SeatSlot[], userIdOf: (token: string) => string | null): Match["players"] {
  return seats.flatMap((s, i) => (s.kind === "human" && s.token ? [{ seat: i as Seat, token: s.token, userId: userIdOf(s.token) }] : []));
}

/** Partida começando: anota quem está em cada lugar. Uma pessoa só contra IA = "ai". */
export function newMatch(seats: SeatSlot[], userIdOf: (token: string) => string | null, id: string = crypto.randomUUID()): Match {
  const players = matchPlayers(seats, userIdOf);
  return { id, mode: players.length >= 2 ? "online" : "ai", players };
}

/** Partida terminou: resultado de cada logado. Quem saiu no meio (o lugar não é mais dele) leva derrota. */
export function matchReport(game: GameId, adapter: GameAdapter, state: unknown, m: Match, seats: SeatSlot[]): MatchReport {
  const players: PlayerReport[] = m.players.flatMap(({ seat, token, userId }) => {
    if (!userId) return [];
    const slot = seats[seat];
    const stayed = slot.kind === "human" && slot.token === token;
    return [stayed ? { userId, ...adapter.outcome(state, seat) } : { userId, outcome: "loss" as const, data: { abandoned: true } }];
  });
  return { game, mode: m.mode, matchId: m.id, players };
}

/** Lugares ocupados (humanos ou IA). */
export const occupiedSeats = (seats: SeatSlot[]) => seats.flatMap((s, i) => (s.kind === "empty" ? [] : [i]));

/** Mesa pronta: lugares suficientes (sem mínimo, mesa cheia) e uma formação que o jogo aceita. */
export function canStartSeats(adapter: GameAdapter, seats: SeatSlot[]) {
  const occupied = occupiedSeats(seats);
  return occupied.length >= (adapter.minSeats ?? adapter.seats) && (adapter.canStart?.(occupied) ?? true);
}
