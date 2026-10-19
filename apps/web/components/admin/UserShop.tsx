"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipIcon, GiftIcon } from "@/components/chips/ChipIcon";
import { ItemArt, ItemList } from "@/components/shop/ItemList";
import { ITEMS, TIERS } from "@/lib/shop/catalog";
import type { OwnedItem, ShopError } from "@/lib/shop/shop";

type Row = Omit<OwnedItem, "acquiredAt" | "removedAt"> & { acquiredAt: string; removedAt: string | null };

const ERRORS: Record<ShopError, string> = {
  unknown: "Não deu certo.",
  owned: "Já tem esse item.",
  poor: "Sem fichas.",
  not_owned: "Não tem esse item.",
  no_user: "Usuário não existe.",
  negative: "Saldo ficaria negativo.",
};

const icon = (d: React.ReactNode, className = "h-4 w-4") => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

/** Admin: dar/tirar fichas e itens de um jogador. A página do usuário recarrega com o histórico novo. */
export function UserShop({ userId, chips, items }: { userId: string; chips: number; items: Row[] }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [give, setGive] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (body: unknown) => {
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/admin/users/${userId}/shop`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const j = r ? ((await r.json().catch(() => null)) as { ok: boolean; error?: ShopError } | null) : null;
    setBusy(false);
    if (!j?.ok) return setError(ERRORS[j?.error ?? "unknown"]);
    router.refresh();
    return true;
  };

  const n = Math.floor(Number(amount));
  const chipsOk = Number.isFinite(n) && n > 0;
  const sendChips = async (sign: 1 | -1) => {
    if (!chipsOk) return;
    if (await call({ action: "chips", delta: sign * n, note })) {
      setAmount("");
      setNote("");
    }
  };

  const active = new Set(items.filter((i) => !i.removedAt).map((i) => i.itemId));
  const available = ITEMS.filter((i) => !active.has(i.id));
  const field = "rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-gold/60";
  const btn = "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <ChipIcon className="h-8 w-8" />
          <span className="font-display text-2xl tabular-nums text-gold">{chips.toLocaleString("pt-BR")}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Fichas"
            aria-label="Fichas"
            className={`${field} w-28 tabular-nums`}
          />
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="Motivo" aria-label="Motivo" className={`${field} min-w-0 flex-1`} />
          <button disabled={busy || !chipsOk} onClick={() => sendChips(1)} title="Dar fichas" className={`${btn} bg-gold text-[#2a1a04] hover:brightness-110`}>
            {icon(<path d="M12 5v14M5 12h14" />)}
            Dar
          </button>
          <button disabled={busy || !chipsOk} onClick={() => sendChips(-1)} title="Tirar fichas" className={`${btn} bg-red-500/15 text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/25`}>
            {icon(<path d="M5 12h14" />)}
            Tirar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
        {give && <ItemArt itemId={give} className="h-10 w-10 shrink-0" />}
        <select value={give} onChange={(e) => setGive(e.target.value)} aria-label="Item" className={`${field} min-w-0 flex-1`}>
          <option value="">Item…</option>
          {(["frame", "deck"] as const).map((type) => (
            <optgroup key={type} label={type === "frame" ? "Molduras" : "Baralhos"}>
              {available
                .filter((i) => i.type === type)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} · {TIERS[i.tier].label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <button
          disabled={busy || !give}
          onClick={async () => (await call({ action: "grant", itemId: give })) && setGive("")}
          title="Dar item"
          className={`${btn} bg-gold text-[#2a1a04] hover:brightness-110`}
        >
          <GiftIcon className="h-4 w-4" />
          Dar
        </button>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <ItemList
        items={items}
        empty={<p className="rounded-2xl bg-white/[0.03] px-4 py-6 text-center text-sm text-white/40 ring-1 ring-white/10">Nenhum item.</p>}
        action={(o) =>
          o.removedAt ? null : (
            <button
              disabled={busy}
              onClick={() => confirm("Tirar este item do jogador?") && call({ action: "revoke", itemId: o.itemId })}
              title="Tirar item"
              aria-label="Tirar item"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40"
            >
              {icon(<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />)}
            </button>
          )
        }
      />
    </div>
  );
}
