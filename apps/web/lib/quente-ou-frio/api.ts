"use client";

import { ACHIEVEMENTS_EVENT } from "@/lib/stats/report";
import { QUENTE_API } from "./paths";
import type { PlayRequest, PlayResponse } from "./protocol";

/** Manda uma jogada. null = sem conexão ou pedido recusado (a partida no aparelho não bate com a do servidor). */
export async function sendPlay(req: PlayRequest): Promise<PlayResponse | null> {
  try {
    const r = await fetch(QUENTE_API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) });
    if (!r.ok) return null;
    const body = (await r.json()) as PlayResponse;
    if ("achievements" in body && body.achievements?.length) window.dispatchEvent(new CustomEvent(ACHIEVEMENTS_EVENT, { detail: body.achievements }));
    return body;
  } catch {
    return null;
  }
}
