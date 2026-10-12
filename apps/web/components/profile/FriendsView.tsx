"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/profile/ProfileHeader";
import { CheckSmallIcon, sendFriendAction, UserPlusIcon, UsersIcon, XIcon } from "@/components/profile/FriendButton";
import type { FriendAction, FriendUser } from "@/lib/friends-rules";
import { normalizeUsername, USERNAME_MAX } from "@/lib/username";

const CARD = "rounded-2xl bg-white/5 ring-1 ring-white/10";
const ROUND = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 transition disabled:opacity-50";
const MUTED = "bg-white/5 text-white/50 ring-white/10 hover:bg-red-500/10 hover:text-red-300 hover:ring-red-500/40";

type Lists = { friends: FriendUser[]; received: FriendUser[]; sent: FriendUser[] };

/** Amigos, convites recebidos (aceitar/recusar) e enviados (cancelar), mais o campo de convidar pelo @. */
export function FriendsView({ friends, received, sent }: Lists) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  // desfazer amizade pede um segundo clique
  const [confirm, setConfirm] = useState<string | null>(null);

  const act = async (u: FriendUser, action: FriendAction) => {
    if (busy || !u.username) return;
    setBusy(u.id);
    setConfirm(null);
    await sendFriendAction(u.username, action);
    setBusy(null);
    router.refresh();
  };

  const row = (u: FriendUser, actions: React.ReactNode) => (
    <li key={u.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <Link href={`/perfil/${u.username}`} className="group flex min-w-0 flex-1 items-center gap-3">
        <Avatar user={u} className="h-10 w-10 text-base !ring-2" />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm text-white/90 transition group-hover:text-gold">{u.name}</span>
          <span className="truncate text-xs text-white/45">@{u.username}</span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </li>
  );

  const heading = (label: string, count: number) => (
    <h2 className="flex items-center gap-2 px-4 pb-1 pt-4 text-sm text-white/50 sm:px-5">
      {label}
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] tabular-nums text-white/60">{count}</span>
    </h2>
  );

  return (
    <div className="flex flex-col gap-4">
      <AddFriend />

      {received.length > 0 && (
        <section className={`${CARD} !ring-gold/40`}>
          {heading("Convites", received.length)}
          <ul className="divide-y divide-white/10">
            {received.map((u) =>
              row(
                u,
                <>
                  <button onClick={() => act(u, "remove")} disabled={busy === u.id} aria-label="Recusar" title="Recusar" className={`${ROUND} ${MUTED}`}>
                    <XIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => act(u, "accept")}
                    disabled={busy === u.id}
                    aria-label="Aceitar"
                    title="Aceitar"
                    className={`${ROUND} bg-gold text-[#2a1a04] ring-gold hover:brightness-110`}
                  >
                    <CheckSmallIcon className="h-4 w-4" />
                  </button>
                </>,
              ),
            )}
          </ul>
        </section>
      )}

      <section className={CARD}>
        {heading("Amigos", friends.length)}
        {friends.length ? (
          <ul className="divide-y divide-white/10">
            {friends.map((u) =>
              row(
                u,
                confirm === u.id ? (
                  <button
                    onClick={() => act(u, "remove")}
                    disabled={busy === u.id}
                    className="h-9 rounded-full bg-red-500/15 px-3 text-xs text-red-300 ring-1 ring-red-500/40 transition hover:bg-red-500/25 disabled:opacity-50"
                  >
                    Desfazer?
                  </button>
                ) : (
                  <button onClick={() => setConfirm(u.id)} aria-label="Desfazer amizade" title="Desfazer amizade" className={`${ROUND} ${MUTED}`}>
                    <XIcon className="h-4 w-4" />
                  </button>
                ),
              ),
            )}
          </ul>
        ) : (
          <div className="flex justify-center px-4 pb-8 pt-5 text-white/20">
            <UsersIcon className="h-12 w-12" />
          </div>
        )}
      </section>

      {sent.length > 0 && (
        <section className={CARD}>
          {heading("Enviados", sent.length)}
          <ul className="divide-y divide-white/10">
            {sent.map((u) =>
              row(
                u,
                <button onClick={() => act(u, "remove")} disabled={busy === u.id} aria-label="Cancelar convite" title="Cancelar convite" className={`${ROUND} ${MUTED}`}>
                  <XIcon className="h-4 w-4" />
                </button>,
              ),
            )}
          </ul>
        </section>
      )}
    </div>
  );
}

type AddState = "idle" | "busy" | "sent" | "friends" | "not_found";

/** Convidar pelo @ do jogador. */
function AddFriend() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [state, setState] = useState<AddState>("idle");

  const submit = async () => {
    const u = normalizeUsername(value.replace(/^@/, ""));
    if (!u || state === "busy") return;
    setState("busy");
    const status = await sendFriendAction(u, "add");
    if (!status || status === "none") return setState("not_found");
    setState(status === "friends" ? "friends" : "sent");
    setValue("");
    router.refresh();
  };

  const hint = state === "not_found" ? "Jogador não encontrado" : state === "sent" ? "Convite enviado" : state === "friends" ? "Vocês agora são amigos" : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={`${CARD} flex flex-col gap-1.5 p-4 sm:p-5`}
    >
      <div className="flex gap-2">
        <label
          className={`flex min-w-0 flex-1 items-center rounded-xl bg-black/25 ring-1 transition focus-within:ring-2 ${state === "not_found" ? "ring-red-500/60" : "ring-white/15 focus-within:ring-gold/70"}`}
        >
          <span className="pl-3 text-white/40">@</span>
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/[\s@]/g, "").toLowerCase());
              if (state !== "busy") setState("idle");
            }}
            maxLength={USERNAME_MAX}
            placeholder="usuario"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Nome de usuário do amigo"
            className="min-w-0 flex-1 bg-transparent py-2.5 pl-0.5 pr-3 text-sm text-white outline-none placeholder:text-white/25"
          />
        </label>
        <button
          type="submit"
          disabled={!value || state === "busy"}
          aria-label="Convidar"
          title="Convidar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-[#2a1a04] transition hover:brightness-110 disabled:opacity-40"
        >
          {state === "busy" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2a1a04]/30 border-t-[#2a1a04]" aria-hidden="true" />
          ) : (
            <UserPlusIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      {hint && <p className={`text-xs ${state === "not_found" ? "text-red-300" : "text-emerald-300/90"}`}>{hint}</p>}
    </form>
  );
}
