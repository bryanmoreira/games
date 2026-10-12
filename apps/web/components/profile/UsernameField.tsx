"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/ui/icons";
import { authClient } from "@/lib/auth-client";
import { normalizeUsername, USERNAME_HINT, USERNAME_MAX, usernameProblem } from "@/lib/username";

type Status = "idle" | "checking" | "free" | "taken" | "saving" | "saved" | "error";

/** Campo do @username com checagem de disponibilidade enquanto digita. */
export function UsernameField({ current }: { current: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [status, setStatus] = useState<Status>("idle");

  const u = normalizeUsername(value);
  const problem = u && u !== current ? usernameProblem(u) : null;
  const changed = u !== (current ?? "");

  useEffect(() => {
    if (!changed || problem || !u) return setStatus("idle");
    setStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await authClient.isUsernameAvailable({ username: u });
      setStatus(data?.available ? "free" : "taken");
    }, 400);
    return () => clearTimeout(t);
  }, [u, changed, problem]);

  const save = async () => {
    if (status !== "free") return;
    setStatus("saving");
    const { error } = await authClient.updateUser({ username: u });
    if (error) return setStatus(error.code === "USERNAME_IS_ALREADY_TAKEN" ? "taken" : "error");
    setStatus("saved");
    router.refresh();
  };

  const hint = problem
    ? USERNAME_HINT[problem]
    : status === "taken"
      ? "Já está em uso"
      : status === "free"
        ? "Disponível"
        : status === "saved"
          ? "Salvo"
          : status === "error"
            ? "Não deu para salvar"
            : null;
  const bad = problem || status === "taken" || status === "error";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex gap-2">
        <label className={`flex min-w-0 flex-1 items-center rounded-xl bg-black/25 ring-1 transition focus-within:ring-2 ${bad ? "ring-red-500/60" : "ring-white/15 focus-within:ring-gold/70"}`}>
          <span className="pl-3 text-white/40">@</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\s/g, "").toLowerCase())}
            maxLength={USERNAME_MAX}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Nome de usuário"
            className="min-w-0 flex-1 bg-transparent py-2.5 pl-0.5 pr-3 text-sm text-white outline-none"
          />
          {status === "checking" && <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" aria-hidden="true" />}
        </label>
        <button
          type="submit"
          disabled={status !== "free"}
          aria-label="Salvar"
          title="Salvar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-[#2a1a04] transition hover:brightness-110 disabled:bg-white/10 disabled:text-white/30"
        >
          <CheckIcon className="h-5 w-5" />
        </button>
      </div>
      <span aria-live="polite" className={`h-4 pl-1 text-xs ${bad ? "text-red-300" : "text-emerald-300/90"}`}>
        {hint}
      </span>
    </form>
  );
}
