"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RoomInfo } from "@mesa/truco";
import { authClient } from "@/lib/auth-client";
import type { FriendEntry } from "@/lib/friends-rules";
import { Avatar } from "@/components/profile/ProfileHeader";
import { CheckSmallIcon, UserPlusIcon, UsersIcon } from "@/components/profile/FriendButton";
import { Icon, XIcon } from "@/components/ui/buttons";

export function SendIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </Icon>
  );
}

type Sent = "busy" | "sent" | "error";

/** Logado: chama amigos para a sala (eles veem o convite em qualquer página do site). */
export function FriendInvite({ room }: { room: RoomInfo }) {
  const { data } = authClient.useSession();
  const [open, setOpen] = useState(false);
  if (!data) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        data-umami-event="convite-amigo"
        data-umami-event-jogo={room.game}
        className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-display text-white shadow-[0_4px_0_rgba(0,0,0,0.35)] transition hover:bg-white/15 active:translate-y-1 active:shadow-none"
      >
        <UsersIcon className="h-5 w-5" />
        Amigos
      </button>
      {open && <FriendPicker room={room} onClose={() => setOpen(false)} />}
    </>
  );
}

function FriendPicker({ room, onClose }: { room: RoomInfo; onClose: () => void }) {
  const [friends, setFriends] = useState<FriendEntry[] | null>(null);
  const [sent, setSent] = useState<Record<string, Sent>>({});

  useEffect(() => {
    fetch("/api/friends", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { friends: [] }))
      .then((d: { friends: FriendEntry[] }) => setFriends(d.friends))
      .catch(() => setFriends([]));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // amigo que já sentou nesta sala não precisa de convite
  const seated = new Set(room.seats.map((s) => s.username).filter(Boolean));

  const invite = async (u: FriendEntry) => {
    if (!u.username || sent[u.id] === "busy") return;
    setSent((s) => ({ ...s, [u.id]: "busy" }));
    const ok = await fetch("/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: u.username, game: room.game, code: room.code }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    setSent((s) => ({ ...s, [u.id]: ok ? "sent" : "error" }));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Convidar amigos"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-[#0f1813] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 py-3 pl-5 pr-3">
          <span className="flex items-center gap-2 font-display text-lg text-gold">
            <UsersIcon className="h-5 w-5" />
            Amigos
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          >
            <XIcon />
          </button>
        </header>

        {friends === null ? (
          <div className="flex justify-center py-10">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" aria-hidden="true" />
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-5 pb-6 pt-8 text-white/20">
            <UsersIcon className="h-12 w-12" />
            <Link
              href="/perfil/amigos"
              target="_blank"
              className="flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 font-display text-sm text-[#2a1a04] transition hover:brightness-110"
            >
              <UserPlusIcon className="h-4 w-4" />
              Adicionar
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/10 overflow-y-auto">
            {friends.map((u) => {
              const state = seated.has(u.username) ? "seated" : sent[u.id];
              return (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="relative shrink-0">
                    <Avatar user={u} className="h-10 w-10 text-base !ring-2" />
                    {u.online && (
                      <span
                        role="img"
                        aria-label="Online"
                        title="Online"
                        className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 ring-[3px] ring-[#0f1813]"
                      />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-white/90">{u.name}</span>
                    <span className="truncate text-xs text-white/45">@{u.username}</span>
                  </span>
                  {state === "seated" || state === "sent" ? (
                    <span
                      role="img"
                      aria-label={state === "seated" ? "Na sala" : "Convite enviado"}
                      title={state === "seated" ? "Na sala" : "Convite enviado"}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/40"
                    >
                      <CheckSmallIcon className="h-4 w-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => invite(u)}
                      disabled={state === "busy"}
                      aria-label="Convidar"
                      title={state === "error" ? "Tentar de novo" : "Convidar"}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:brightness-110 disabled:opacity-50 ${
                        state === "error" ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/50" : "bg-gold text-[#2a1a04]"
                      }`}
                    >
                      {state === "busy" ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2a1a04]/30 border-t-[#2a1a04]" aria-hidden="true" />
                      ) : (
                        <SendIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
