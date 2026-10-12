"use client";

import { useState } from "react";
import { SOCIAL_PROVIDERS, type SocialProvider } from "@/components/auth/providers";
import { authClient } from "@/lib/auth-client";
import { loginHref } from "@/lib/login";

/** Botões dos provedores. Um formulário de e-mail e senha entra aqui, acima dos botões. */
export function LoginOptions({ next }: { next: string }) {
  const [pending, setPending] = useState<SocialProvider["id"] | null>(null);

  const signIn = async (id: SocialProvider["id"]) => {
    if (pending) return;
    setPending(id);
    const { error } = await authClient.signIn.social({
      provider: id,
      callbackURL: next,
      errorCallbackURL: loginHref(next),
    });
    // sucesso: o navegador já está indo para o provedor
    if (error) setPending(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {SOCIAL_PROVIDERS.map(({ id, label, Logo }) => (
        <button
          key={id}
          onClick={() => signIn(id)}
          disabled={pending !== null}
          className="flex h-12 items-center justify-center gap-3 rounded-xl bg-white font-medium text-neutral-800 shadow transition hover:bg-white/90 disabled:opacity-60"
        >
          {pending === id ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" aria-hidden="true" />
          ) : (
            <Logo className="h-5 w-5" />
          )}
          Continuar com {label}
        </button>
      ))}
    </div>
  );
}
