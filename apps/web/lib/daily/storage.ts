"use client";

import type { DailyGame } from "@/lib/daily/challenge";

// Cada desafio fica salvo no aparelho pelo dia: recarregar continua e dá para alternar entre dias.
const PREFIX: Record<DailyGame, string> = { sudoku: "sudoku.daily.", "paciencia-spider": "spider.daily.", verbete: "verbete.daily.", "caca-palavras": "cacapalavras.daily.", "quente-ou-frio": "quenteoufrio.daily." };

/** O que o calendário precisa de cada dia salvo. */
export interface LocalDaily {
  won: boolean;
  /** terminou sem vencer (desistiu, no Quente ou Frio) */
  lost: boolean;
  elapsed: number;
  /** já fez alguma jogada */
  started: boolean;
}

type Saved = { won?: unknown; lost?: unknown; elapsed?: unknown; history?: unknown[] };

export function loadDaily<T>(game: DailyGame, day: string, valid: (g: unknown) => g is T): T | null {
  try {
    const raw = localStorage.getItem(PREFIX[game] + day);
    if (!raw) return null;
    const g: unknown = JSON.parse(raw);
    return valid(g) ? g : null;
  } catch {
    return null;
  }
}

/** Sem `history` (Caça-Palavras), não tem desfazer para cortar quando falta espaço. */
export function saveDaily<T extends object>(game: DailyGame, day: string, state: T) {
  const key = PREFIX[game] + day;
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // sem espaço: tira o desfazer antigo dos outros dias e deste
    trimOthers(game, day);
    try {
      const history = (state as { history?: unknown[] }).history;
      localStorage.setItem(key, JSON.stringify(history ? { ...state, history: history.slice(-50) } : state));
    } catch {}
  }
}

function keysOf(game: DailyGame): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX[game])) out.push(k);
    }
  } catch {}
  return out;
}

/** Os outros dias guardam pouco desfazer (vencidos, nenhum): o espaço do aparelho é pouco. */
export function trimOthers(game: DailyGame, day: string) {
  for (const k of keysOf(game)) {
    if (k === PREFIX[game] + day) continue;
    try {
      const g = JSON.parse(localStorage.getItem(k) ?? "null") as Saved | null;
      if (!g || !Array.isArray(g.history)) continue;
      const keep = g.won ? 0 : 30;
      if (g.history.length > keep) localStorage.setItem(k, JSON.stringify({ ...g, history: keep ? g.history.slice(-keep) : [] }));
    } catch {}
  }
}

/** Dias jogados neste aparelho. */
export function localDailies(game: DailyGame): Record<string, LocalDaily> {
  const out: Record<string, LocalDaily> = {};
  for (const k of keysOf(game)) {
    try {
      const g = JSON.parse(localStorage.getItem(k) ?? "null") as (Saved & { moves?: unknown }) | null;
      if (!g) continue;
      const started = (Array.isArray(g.history) && g.history.length > 0) || (typeof g.moves === "number" && g.moves > 0) || Number(g.elapsed) > 0;
      out[k.slice(PREFIX[game].length)] = { won: g.won === true, lost: g.lost === true, elapsed: Number(g.elapsed) || 0, started };
    } catch {}
  }
  return out;
}
