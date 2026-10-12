"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SOCIAL_PROVIDERS, type SocialProvider } from "@/components/auth/providers";
import { authClient } from "@/lib/auth-client";

const BACK = "/perfil/conta";

/** Provedores de login: conectar outro à conta ou desconectar (sempre sobra pelo menos um). */
export function LinkedAccounts({ linked }: { linked: { id: string; providerId: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<SocialProvider["id"] | null>(null);
  const [failed, setFailed] = useState(false);

  const connect = async (id: SocialProvider["id"]) => {
    if (busy) return;
    setBusy(id);
    setFailed(false);
    const { error } = await authClient.linkSocial({ provider: id, callbackURL: BACK, errorCallbackURL: BACK });
    // sucesso: o navegador já está indo para o provedor
    if (error) {
      setBusy(null);
      setFailed(true);
    }
  };

  const disconnect = async (id: SocialProvider["id"], accountId: string) => {
    if (busy) return;
    setBusy(id);
    setFailed(false);
    const { error } = await authClient.unlinkAccount({ accountId });
    setBusy(null);
    if (error) return setFailed(true);
    router.refresh();
  };

  const canUnlink = linked.length > 1;

  return (
    <div className="divide-y divide-white/10">
      {SOCIAL_PROVIDERS.map(({ id, label, Logo }) => {
        const account = linked.find((a) => a.providerId === id);
        const isLinked = !!account;
        return (
          <div key={id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
              <Logo className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm text-white/90">{label}</span>
              <span className={`text-xs ${isLinked ? "text-emerald-300/90" : "text-white/40"}`}>{isLinked ? "Conectado" : "Não conectado"}</span>
            </span>
            {isLinked ? (
              canUnlink && (
                <button
                  onClick={() => disconnect(id, account.id)}
                  disabled={busy !== null}
                  className="rounded-full px-3 py-1.5 text-xs text-white/50 ring-1 ring-white/15 transition hover:bg-red-500/10 hover:text-red-300 hover:ring-red-500/40 disabled:opacity-50"
                >
                  {busy === id ? "…" : "Desconectar"}
                </button>
              )
            ) : (
              <button
                onClick={() => connect(id)}
                disabled={busy !== null}
                className="flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-xs text-gold ring-1 ring-gold/40 transition hover:bg-gold/25 disabled:opacity-50"
              >
                {busy === id ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold/30 border-t-gold" aria-hidden="true" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                )}
                Conectar
              </button>
            )}
          </div>
        );
      })}
      {failed && <p className="px-4 py-2.5 text-xs text-red-300 sm:px-5">Não deu certo. Tente de novo.</p>}
    </div>
  );
}
