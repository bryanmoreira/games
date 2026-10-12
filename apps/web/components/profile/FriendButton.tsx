"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FriendAction, FriendStatus } from "@/lib/friends-rules";
import { loginHref } from "@/lib/login";

type P = { className?: string };

const svg = (paths: React.ReactNode, className = "h-3.5 w-3.5") => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths}
  </svg>
);

const person = (
  <>
    <circle cx="9" cy="8" r="4" />
    <path d="M2 21a7 7 0 0 1 14 0" />
  </>
);

export const UserPlusIcon = ({ className }: P) =>
  svg(
    <>
      {person}
      <path d="M19 8v6M16 11h6" />
    </>,
    className,
  );

export const UserCheckIcon = ({ className }: P) =>
  svg(
    <>
      {person}
      <path d="m16 11 2 2 4-4" />
    </>,
    className,
  );

export const UsersIcon = ({ className }: P) =>
  svg(
    <>
      {person}
      <path d="M16 3.5a4 4 0 0 1 0 9M22 21a7 7 0 0 0-4-6.3" />
    </>,
    className,
  );

export const XIcon = ({ className }: P) => svg(<path d="M18 6 6 18M6 6l12 12" />, className);

export const CheckSmallIcon = ({ className }: P) => svg(<path d="M20 6 9 17l-5-5" />, className);

const ClockIcon = ({ className }: P) =>
  svg(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
    className,
  );

/** Manda a ação para /api/friends. null = falhou. */
export async function sendFriendAction(username: string, action: FriendAction): Promise<FriendStatus | null> {
  try {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, action }),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { status: FriendStatus }).status;
  } catch {
    return null;
  }
}

const PILL = "flex h-9 items-center gap-2 rounded-full px-4 text-xs ring-1 transition disabled:opacity-50";
const GOLD = "bg-gold/15 text-gold ring-gold/40 hover:bg-gold/25";
const DANGER = "hover:bg-red-500/10 hover:text-red-300 hover:ring-red-500/40";

/** Botão de amizade no perfil público de outro jogador. */
export function FriendButton({ username, initial, loggedIn }: { username: string; initial: FriendStatus; loggedIn: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [busy, setBusy] = useState(false);
  // desfazer amizade pede um segundo clique
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(t);
  }, [confirm]);

  if (!loggedIn) {
    return (
      <Link href={loginHref(`/perfil/${username}`)} className={`${PILL} ${GOLD}`}>
        <UserPlusIcon />
        Adicionar
      </Link>
    );
  }

  const act = async (action: FriendAction) => {
    if (busy) return;
    setBusy(true);
    setConfirm(false);
    const next = await sendFriendAction(username, action);
    setBusy(false);
    if (next) {
      setStatus(next);
      router.refresh();
    }
  };

  if (status === "none") {
    return (
      <button onClick={() => act("add")} disabled={busy} className={`${PILL} ${GOLD}`}>
        <UserPlusIcon />
        Adicionar
      </button>
    );
  }

  if (status === "sent") {
    return (
      <button onClick={() => act("remove")} disabled={busy} title="Cancelar convite" className={`${PILL} bg-white/5 text-white/60 ring-white/10 ${DANGER}`}>
        <ClockIcon />
        Enviado
      </button>
    );
  }

  if (status === "received") {
    return (
      <>
        <button onClick={() => act("accept")} disabled={busy} className={`${PILL} bg-gold text-[#2a1a04] ring-gold hover:brightness-110`}>
          <UserCheckIcon />
          Aceitar
        </button>
        <button
          onClick={() => act("remove")}
          disabled={busy}
          aria-label="Recusar"
          title="Recusar"
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/50 ring-1 ring-white/10 transition disabled:opacity-50 ${DANGER}`}
        >
          <XIcon />
        </button>
      </>
    );
  }

  return confirm ? (
    <button onClick={() => act("remove")} disabled={busy} className={`${PILL} bg-red-500/15 text-red-300 ring-red-500/40 hover:bg-red-500/25`}>
      <XIcon />
      Desfazer?
    </button>
  ) : (
    <button
      onClick={() => setConfirm(true)}
      disabled={busy}
      title="Desfazer amizade"
      className={`${PILL} bg-emerald-500/10 text-emerald-300 ring-emerald-500/30 hover:bg-emerald-500/20`}
    >
      <UserCheckIcon />
      Amigos
    </button>
  );
}
