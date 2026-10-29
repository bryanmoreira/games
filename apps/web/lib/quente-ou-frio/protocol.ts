import type { Move } from "@mesa/quente-ou-frio";
import type { UnlockedAchievement } from "@/lib/stats/report";

// Conversa entre a mesa e a API. O navegador manda todos os movimentos a cada pedido (a API não guarda partida):
// o servidor refaz tudo, então ninguém inventa posição, dica ou vitória.

/** Qual partida: a do dia ou a livre (o número sorteado no aparelho). */
export type GameRef = { day: string } | { id: number };

export interface PlayRequest {
  game: GameRef;
  moves: { word: string; hint?: boolean }[];
  /** já tinha desistido (para pedir as palavras mais próximas de novo) */
  gaveUp?: boolean;
  action: "guess" | "hint" | "giveup" | "end";
  /** o chute, como foi digitado */
  word?: string;
}

/** Fim da partida: a secreta (primeira da lista) e as mais próximas. */
export interface Reveal {
  closest: Move[];
  /** quantas palavras o jogo conhece (a posição mais longe) */
  total: number;
}

export type PlayResponse =
  | { move: Move; total: number; end?: Reveal; achievements?: UnlockedAchievement[] }
  | { end: Reveal; achievements?: UnlockedAchievement[] }
  | { error: "unknown" | "repeat" | "over" | "none"; word?: string };

const MAX_MOVES = 2000;

/** Corpo do pedido, conferido. null = inválido. */
export function parseRequest(body: unknown): PlayRequest | null {
  const b = body as Partial<PlayRequest> | null;
  if (!b || typeof b !== "object") return null;
  const g = b.game as Record<string, unknown> | undefined;
  const game = typeof g?.day === "string" ? { day: g.day } : Number.isSafeInteger(g?.id) && (g!.id as number) >= 0 ? { id: g!.id as number } : null;
  if (!game || !Array.isArray(b.moves) || b.moves.length > MAX_MOVES) return null;
  if (!b.moves.every((m) => m && typeof m.word === "string" && m.word.length <= 40)) return null;
  if (!["guess", "hint", "giveup", "end"].includes(b.action as string)) return null;
  if (b.action === "guess" && (typeof b.word !== "string" || b.word.length > 40)) return null;
  return { game, moves: b.moves.map((m) => ({ word: m.word, hint: m.hint === true })), gaveUp: b.gaveUp === true, action: b.action!, word: b.word };
}
