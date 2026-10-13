"use client";

import { useState } from "react";
import { SOCIAL_PROVIDERS, type SocialProvider } from "@/components/auth/providers";
import { authClient } from "@/lib/auth-client";

const WORD = "deletar";
// volta do login com o painel já aberto
const BACK = "/perfil/conta?excluir=1";

type Status = "idle" | "deleting" | "stale" | "error";

/** Excluir a conta: pede para digitar "deletar"; com a sessão velha, pede para entrar de novo antes. */
export function DeleteAccount({ providers, startOpen }: { providers: string[]; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const ok = value.trim().toLowerCase() === WORD;

  const remove = async () => {
    if (!ok || status === "deleting") return;
    setStatus("deleting");
    const { error } = await authClient.deleteUser({});
    if (!error) return window.location.assign("/");
    setStatus(error.code === "SESSION_EXPIRED" ? "stale" : "error");
  };

  const reauth = (id: SocialProvider["id"]) => authClient.signIn.social({ provider: id, callbackURL: BACK, errorCallbackURL: BACK });

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 px-4 py-3.5 text-left text-sm text-red-300/90 transition hover:bg-red-500/5 sm:px-5"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10">
          <TrashIcon />
        </span>
        Excluir conta
      </button>
    );

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-300">
          <TrashIcon />
        </span>
        <p className="text-xs leading-relaxed text-white/60">
          Apaga perfil, partidas, conquistas e amigos. <span className="text-red-300">Não dá para desfazer.</span>
        </p>
      </div>

      {status === "stale" ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/60">Por segurança, entre de novo para confirmar.</p>
          {SOCIAL_PROVIDERS.filter((p) => providers.includes(p.id)).map(({ id, label, Logo }) => (
            <button
              key={id}
              onClick={() => reauth(id)}
              className="flex h-10 items-center justify-center gap-2.5 rounded-xl bg-white text-sm font-medium text-neutral-800 transition hover:bg-white/90"
            >
              <Logo className="h-4 w-4" />
              Entrar com {label}
            </button>
          ))}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            remove();
          }}
          className="flex flex-col gap-2"
        >
          <label className="text-xs text-white/50" htmlFor="delete-confirm">
            Digite <span className="font-semibold text-white/80">{WORD}</span> para confirmar
          </label>
          <div className="flex gap-2">
            <input
              id="delete-confirm"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={WORD}
              className="min-w-0 flex-1 rounded-xl bg-black/25 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/15 placeholder:text-white/20 focus:ring-2 focus:ring-red-500/60"
            />
            <button
              type="submit"
              disabled={!ok || status === "deleting"}
              className="flex min-w-24 items-center justify-center rounded-xl bg-red-500 px-4 text-sm font-semibold text-white shadow-[0_3px_0_#991b1b] transition active:translate-y-0.5 active:shadow-none disabled:bg-red-500/25 disabled:text-white/40 disabled:shadow-none"
            >
              {status === "deleting" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" /> : "Excluir"}
            </button>
          </div>
          {status === "error" && <p className="text-xs text-red-300">Não deu certo. Tente de novo.</p>}
        </form>
      )}

      <button
        onClick={() => {
          setOpen(false);
          setValue("");
          setStatus("idle");
        }}
        className="self-start text-xs text-white/45 underline-offset-4 hover:text-white/80 hover:underline"
      >
        Cancelar
      </button>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}
