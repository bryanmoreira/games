import type { GameId } from "@mesa/truco";
import { getGame } from "@/lib/seo";

// Prévia do link de uma sala (imagem e título que o WhatsApp mostra): o servidor de jogos responde GET /sala/<código>.

export interface RoomPreview {
  game: GameId;
  host: string;
  humans: number;
  seats: number;
  started: boolean;
}

/** Slug do jogo em lib/seo.ts a partir do id do servidor (só o Connect 4 difere) */
export const seoSlug = (game: GameId) => (game === "connect4" ? "connect-4" : game);

/** Endereço HTTP do servidor de jogos, a partir do WS_URL do ambiente (lido no runtime) */
function serverUrl(): string {
  const ws = process.env.WS_URL || process.env[["NEXT_PUBLIC", "WS_URL"].join("_")] || "ws://localhost:3001";
  return ws.replace(/^ws/, "http").replace(/\/$/, "");
}

export async function fetchRoomPreview(code: string): Promise<RoomPreview | null> {
  if (!/^[A-Za-z]{4}$/.test(code)) return null;
  try {
    const r = await fetch(`${serverUrl()}/sala/${code.toUpperCase()}`, { cache: "no-store", signal: AbortSignal.timeout(1500) });
    return r.ok ? ((await r.json()) as RoomPreview) : null;
  } catch {
    return null;
  }
}

/** "Bryan te chamou para jogar Truco Paulista" (sem sala viva: só o convite do jogo) */
export function inviteTitle(slug: string, p: RoomPreview | null): string {
  const name = getGame(slug).name;
  return p?.host ? `${p.host} te chamou para jogar ${name}` : `Convite para jogar ${name}`;
}

export const inviteDescription = (slug: string, code: string, p: RoomPreview | null) =>
  `Sala ${code.toUpperCase()}${p ? ` · ${p.humans} de ${p.seats} na mesa` : ""}. Toque para entrar e jogar ${getGame(slug).name} online, grátis e sem cadastro.`;
