"use client";

import { authClient } from "@/lib/auth-client";
import { refreshChips } from "@/lib/chips-client";
import type { ItemType } from "@/lib/shop/catalog";
import type { Equipped, OwnedItem, ShopError } from "@/lib/shop/shop";
import { refreshIdentity } from "@/lib/socket";

/** Como a loja chega no navegador (datas viram texto no JSON). */
export interface ShopStateJson {
  chips: number;
  equipped: Equipped;
  items: (Omit<OwnedItem, "acquiredAt" | "removedAt"> & { acquiredAt: string; removedAt: string | null })[];
}

export type ShopReply = { ok: true; state: ShopStateJson } | { ok: false; error: ShopError; state: ShopStateJson | null };

/**
 * Moldura e baralho moram na sessão (cabeçalho, perfil) e no ticket do servidor de jogos (mesas):
 * depois de trocar, pede a sessão de novo sem o cache do cookie e manda o ticket novo para a sala.
 */
async function afterChange() {
  await authClient.getSession({ query: { disableCookieCache: true } }).catch(() => null);
  authClient.$store.notify("$sessionSignal");
  void refreshChips();
  void refreshIdentity();
}

async function post(body: unknown): Promise<ShopReply> {
  const r = await fetch("/api/shop", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const j = r ? ((await r.json().catch(() => null)) as ShopReply | null) : null;
  if (!j) return { ok: false, error: "unknown", state: null };
  if (j.ok) await afterChange();
  return j;
}

export const buy = (itemId: string, price: number) => post({ action: "buy", itemId, price });
export const equip = (type: ItemType, key: string | null) => post({ action: "equip", type, key });
