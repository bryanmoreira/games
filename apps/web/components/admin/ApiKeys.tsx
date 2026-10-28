"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Key = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null };

const icon = (d: React.ReactNode, className = "h-4 w-4") => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Sao_Paulo" });
const field = "rounded-xl bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-gold/60";
const btn = "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40";

/** Chaves da API do blog: criar (a chave aparece uma vez) e revogar. */
export function ApiKeys({ keys }: { keys: Key[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const r = await fetch("/api/admin/blog/keys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }).catch(() => null);
    const j = r?.ok ? ((await r.json()) as { key: string }) : null;
    setBusy(false);
    if (!j) return;
    setCreated(j.key);
    setCopied(false);
    setName("");
    router.refresh();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revogar esta chave? O que usa ela para de funcionar.")) return;
    setBusy(true);
    await fetch(`/api/admin/blog/keys/${id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Nome (ex.: automação)"
          aria-label="Nome da chave"
          className={`${field} min-w-0 flex-1`}
        />
        <button disabled={busy} onClick={create} className={`${btn} bg-gold text-[#2a1a04] hover:brightness-110`}>
          {icon(<path d="M12 5v14M5 12h14" />)}
          Nova chave
        </button>
      </div>

      {created && (
        <div className="flex flex-col gap-2 rounded-2xl bg-emerald-400/10 p-3 ring-1 ring-emerald-400/30">
          <span className="text-xs text-emerald-200">Copie agora: ela não aparece de novo.</span>
          <div className="flex gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-3 py-2 font-mono text-[13px] text-white" title={created}>
              {created}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(created).then(() => setCopied(true))}
              title="Copiar"
              aria-label="Copiar"
              className={`${btn} bg-white/10 text-white hover:bg-white/15`}
            >
              {copied ? icon(<path d="m5 12 5 5 9-9" />) : icon(<path d="M8 8h12v12H8zM4 16V4h12" />)}
            </button>
          </div>
        </div>
      )}

      {keys.length > 0 && (
        <ul className="flex flex-col divide-y divide-white/5 rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-white/40">{icon(<path d="M15 7a4 4 0 1 1-3.9 4.9L3 20v-3h3v-3h3l1.1-1.1A4 4 0 0 1 15 7ZM16 10h.01" />)}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-white/90">{k.name}</span>
                <span className="truncate text-xs text-white/40">
                  <code className="font-mono">{k.prefix}…</code> · criada {fmt.format(new Date(k.createdAt))} ·{" "}
                  {k.lastUsedAt ? `usada ${fmt.format(new Date(k.lastUsedAt))}` : "nunca usada"}
                </span>
              </div>
              <button
                disabled={busy}
                onClick={() => revoke(k.id)}
                title="Revogar"
                aria-label="Revogar"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/40 transition hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40"
              >
                {icon(<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
