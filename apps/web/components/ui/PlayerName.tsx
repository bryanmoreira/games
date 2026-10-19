"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";
import { authClient } from "@/lib/auth-client";

/**
 * Nome do jogador antes de entrar numa sala.
 * Sem login: campo de texto. Logado: nome e foto da conta, travados (só mudam no perfil).
 */
export function PlayerName({
  value,
  onChange,
  onBlur,
  onEnter,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  onEnter?: () => void;
  autoFocus?: boolean;
}) {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  // o nome da conta vale como nome digitado (habilita os botões da página)
  useEffect(() => {
    if (user && value !== user.name) onChange(user.name);
  }, [user, value, onChange]);

  if (isPending) return <div className="h-[52px] w-full" />;

  if (user) {
    return (
      <Link
        href="/perfil"
        title="Nome e foto mudam no perfil"
        className="group flex h-[52px] w-full items-center gap-3 rounded-xl bg-white/10 px-3 ring-1 ring-white/10 transition hover:bg-white/15"
      >
        <Framed frame={user.equippedFrame}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/20 font-display text-gold ring-2 ring-gold/50">
            <SeatFace seat={{ kind: "human", name: user.name, image: user.image ?? null }} />
          </span>
        </Framed>
        <span className="min-w-0 flex-1 truncate text-left text-lg">{user.name}</span>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white/40 transition group-hover:text-white/80" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </Link>
    );
  }

  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, 16))}
      onBlur={onBlur}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      placeholder="Seu nome"
      className="w-full rounded-xl bg-white/10 px-4 py-3 text-center text-lg outline-none ring-gold/60 placeholder:text-white/40 focus:ring-2"
    />
  );
}
