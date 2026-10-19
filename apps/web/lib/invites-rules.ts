/** Regras do convite para jogar, sem banco (testadas em test/invites.test.ts). O banco fica em app/api/invites. */
import type { GameId } from "@truco/game";
import { isOnlineGame } from "@/lib/stats/games";

/** Depois disso a sala provavelmente já começou ou fechou. */
export const INVITE_TTL_MS = 10 * 60_000;
/** O convidado confere a cada poucos segundos enquanto a aba está visível. */
export const INVITE_POLL_MS = 5_000;

// mesmas letras do gerador de código das salas (apps/server/src/rooms.ts)
const CODE = /^[A-HJ-NP-Z]{4}$/;

/** Convite que o navegador do convidado recebe. */
export interface GameInviteEntry {
  id: string;
  game: GameId;
  code: string;
  from: { name: string; image: string | null; username: string | null; equippedFrame?: string | null };
}

/** Corpo do POST: `{ username, game, code }`. Inválido: null. */
export function parseInvite(body: unknown): { username: string; game: GameId; code: string } | null {
  if (!body || typeof body !== "object") return null;
  const { username, game, code } = body as Record<string, unknown>;
  if (typeof username !== "string" || !username || typeof game !== "string" || typeof code !== "string") return null;
  if (!isOnlineGame(game)) return null;
  const c = code.toUpperCase();
  return CODE.test(c) ? { username, game, code: c } : null;
}

export const inviteCutoff = (now = new Date()) => new Date(now.getTime() - INVITE_TTL_MS);
