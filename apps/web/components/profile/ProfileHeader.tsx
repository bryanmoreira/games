"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, PencilIcon } from "@/components/ui/icons";
import { authClient } from "@/lib/auth-client";
import { ChipAvatar } from "@/components/ui/ChipFrame";
import { refreshIdentity, setName as setGameName } from "@/lib/socket";

type User = { name: string; email: string; image: string | null; username: string | null };

export const MAX_NAME = 24;

/** Cabeçalho do perfil em cima da mesma mesa de feltro dos jogos (a borda de madeira é sombra, por isso a margem). */
export const PROFILE_TABLE = "felt m-3 flex items-center gap-5 rounded-[40px] px-6 py-6 sm:gap-8 sm:rounded-[96px] sm:px-14 sm:py-8";

export function Avatar({ user, className = "" }: { user: { name: string; image: string | null }; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/20 font-display text-gold ring-4 ring-gold/40 ${className}`}>
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        user.name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

/** Foto grande com o apelido (editável) ao lado. */
export function ProfileHeader({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const cancel = () => {
    setName(user.name);
    setEditing(false);
  };

  const save = async () => {
    const n = name.trim().slice(0, MAX_NAME);
    if (!n || n === user.name) return cancel();
    setSaving(true);
    const { error } = await authClient.updateUser({ name: n });
    setSaving(false);
    if (error) return;
    setGameName(n);
    void refreshIdentity();
    setEditing(false);
    router.refresh();
  };

  return (
    <header className={PROFILE_TABLE}>
      <ChipAvatar user={user} className="h-24 w-24 text-3xl sm:h-32 sm:w-32 sm:text-5xl" />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="flex max-w-sm items-center gap-2"
          >
            <input
              autoFocus
              value={name}
              maxLength={MAX_NAME}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && cancel()}
              aria-label="Apelido"
              className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-1.5 font-display text-xl text-white outline-none ring-2 ring-gold/60 focus:ring-gold sm:text-3xl"
            />
            <button
              type="submit"
              disabled={saving}
              aria-label="Salvar"
              title="Salvar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-[#2a1a04] transition hover:brightness-110 disabled:opacity-50 sm:h-12 sm:w-12"
            >
              <CheckIcon className="h-5 w-5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setEditing(true)}
            title="Editar apelido"
            className="group -ml-2 flex min-w-0 items-center gap-2 self-start rounded-xl px-2 py-1 text-left transition hover:bg-white/5"
          >
            <span className="truncate font-display text-2xl text-gold drop-shadow-[0_2px_0_#7a4e0c] sm:text-4xl">{user.name}</span>
            <PencilIcon className="h-4 w-4 shrink-0 text-white/40 transition group-hover:text-white/80" />
          </button>
        )}
        {user.username && (
          <Link
            href={`/perfil/${user.username}`}
            title="Ver perfil público"
            className="group flex items-center gap-1.5 self-start text-sm text-white/60 transition hover:text-gold"
          >
            @{user.username}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-60 transition group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </Link>
        )}
        <span className="truncate text-xs text-white/40">{user.email}</span>
      </div>
    </header>
  );
}
