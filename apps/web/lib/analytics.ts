"use client";

import { useEffect, useRef } from "react";

// Eventos do Umami (o script carrega no layout). Sem o script (dev, bloqueador), não faz nada.
// Botões simples usam data-umami-event direto no HTML; isto é para o que acontece no código.

type EventData = Record<string, string | number | boolean>;
type Umami = { track: (name: string, data?: EventData) => void };

export function track(name: string, data?: EventData) {
  if (typeof window === "undefined") return;
  try {
    (window as unknown as { umami?: Umami }).umami?.track(name, data);
  } catch {}
}

// Partidas: os mesmos campos em todos os jogos. Conta uma vez por jogador (4 humanos no truco = 4 eventos):
// partidas de fato = soma de 1/humanos.

/** solo: jogo de uma pessoa só · ia: sala contra o computador · online: sala com outras pessoas */
export type GameMode = "solo" | "ia" | "online";
export type GameResult = "vitoria" | "derrota" | "empate" | "fim";

export interface GameInfo {
  modo: GameMode;
  humanos?: number;
  diario?: boolean;
  nivel?: string | number;
}

const fields = (jogo: string, i: GameInfo): EventData => ({
  jogo,
  modo: i.modo,
  humanos: i.humanos ?? 1,
  diario: !!i.diario,
  ...(i.nivel !== undefined ? { nivel: String(i.nivel) } : {}),
});

export const trackStart = (jogo: string, i: GameInfo) => track("partida-iniciada", fields(jogo, i));
export const trackEnd = (jogo: string, resultado: GameResult, i: GameInfo) => track("partida-terminada", { ...fields(jogo, i), resultado });

const STARTED_KEY = "mesa.started";

/** Partida já contada neste aparelho (retomar uma partida salva não conta de novo) */
function firstTime(id: string): boolean {
  try {
    const seen: string[] = JSON.parse(localStorage.getItem(STARTED_KEY) ?? "[]");
    if (seen.includes(id)) return false;
    localStorage.setItem(STARTED_KEY, JSON.stringify([...seen, id].slice(-100)));
  } catch {}
  return true;
}

/**
 * Jogos solo: `partida-iniciada` no primeiro lance de cada partida (a partida mudou desde que apareceu na tela).
 * `id` identifica a partida (semente, palavras, dia); null = ainda carregando.
 */
export function useSoloStart(jogo: string, id: string | null, game: unknown, info: Omit<GameInfo, "modo">) {
  const seen = useRef<{ id: string; game: unknown; done: boolean } | null>(null);
  const infoRef = useRef(info);
  infoRef.current = info;
  useEffect(() => {
    if (!id || !game) return;
    const s = seen.current;
    if (s?.id !== id) {
      seen.current = { id, game, done: false };
      return;
    }
    if (s.done || s.game === game) return;
    s.done = true;
    if (firstTime(`${jogo}:${id}`)) trackStart(jogo, { modo: "solo", ...infoRef.current });
  }, [jogo, id, game]);
}
