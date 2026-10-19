"use client";

import { useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { refreshChips, useChips } from "@/lib/chips-client";
import { ChipIcon } from "@/components/chips/ChipIcon";

export const CHIPS_PATH = "/perfil/fichas";

/** Saldo de fichas (só logado). Leva para a página Fichas do perfil, com o histórico. */
export function ChipBalance({ className = "" }: { className?: string }) {
  const { data } = authClient.useSession();
  const state = useChips();
  const logged = !!data?.user;

  useEffect(() => {
    if (logged && !state) void refreshChips();
  }, [logged, state]);

  if (!logged || !state) return null;

  return (
    <Link
      href={CHIPS_PATH}
      aria-label={`${state.chips} fichas`}
      title="Fichas"
      className={`group flex h-10 items-center gap-2 rounded-full bg-black/30 pl-1 pr-4 ring-1 ring-gold/30 transition hover:bg-black/40 hover:ring-gold/60 ${className}`}
    >
      <ChipIcon className="h-8 w-8 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:rotate-[72deg]" />
      <span className="font-display text-base tabular-nums text-gold">{state.chips.toLocaleString("pt-BR")}</span>
    </Link>
  );
}
