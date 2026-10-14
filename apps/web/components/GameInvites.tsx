"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { INVITE_POLL_MS, type GameInviteEntry } from "@/lib/invites-rules";
import { GAME_ROOM_PATH } from "@/lib/rooms";
import { playInviteSound } from "@/lib/sound";
import { GAME_INFO } from "@/lib/stats/games";
import { Avatar } from "@/components/profile/ProfileHeader";
import { XIcon } from "@/components/profile/FriendButton";
import { SendIcon } from "@/components/ui/FriendInvite";

const dismiss = (id: string) => fetch(`/api/invites?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});

/** Logado: confere os convites dos amigos e mostra cada um no topo da tela, em qualquer página. */
export function GameInvites() {
  const { data } = authClient.useSession();
  const userId = data?.user.id;
  const router = useRouter();
  const pathname = usePathname();
  const [invites, setInvites] = useState<GameInviteEntry[]>([]);
  // some na hora ao clicar, antes do servidor confirmar
  const [gone, setGone] = useState<Set<string>>(new Set());
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!userId) {
      setInvites([]);
      seen.current = null;
      return;
    }
    let alive = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      const r = await fetch("/api/invites", { cache: "no-store" }).catch(() => null);
      if (!alive || !r?.ok) return;
      const list = ((await r.json()) as { invites: GameInviteEntry[] }).invites;
      if (!alive) return;
      // som só para convite novo (os que já existiam ao abrir a página entram calados)
      if (seen.current && list.some((i) => !seen.current!.has(i.id))) playInviteSound();
      seen.current = new Set(list.map((i) => i.id));
      setInvites(list);
    };
    void poll();
    const t = setInterval(poll, INVITE_POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [userId]);

  const hide = (id: string) => {
    setGone((g) => new Set(g).add(id));
    void dismiss(id);
  };

  // já estou na sala do convite (entrei pelo link, por exemplo): o convite some
  const isHere = (i: GameInviteEntry) => GAME_ROOM_PATH[i.game](i.code) === pathname;
  useEffect(() => {
    invites.filter(isHere).forEach((i) => void dismiss(i.id));
  }, [invites, pathname]);

  const shown = invites.filter((i) => !gone.has(i.id) && !isHere(i)).slice(0, 3);
  if (!shown.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4">
      {shown.map((i) => (
        <div
          key={i.id}
          role="alert"
          className="invite-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-[#0f1813]/95 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-gold/50 backdrop-blur"
        >
          <Avatar user={i.from} className="h-11 w-11 text-lg !ring-2" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-white/90">{i.from.name}</span>
            <span className="flex items-center gap-1.5 truncate font-display text-sm text-gold">
              <SendIcon className="h-3.5 w-3.5 shrink-0" />
              {GAME_INFO[i.game].name}
            </span>
          </div>
          <button
            onClick={() => hide(i.id)}
            aria-label="Dispensar"
            title="Dispensar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/50 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          >
            <XIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              hide(i.id);
              router.push(GAME_ROOM_PATH[i.game](i.code));
            }}
            className="h-9 shrink-0 rounded-full bg-gold px-4 font-display text-sm text-[#2a1a04] transition hover:brightness-110"
          >
            Entrar
          </button>
        </div>
      ))}
    </div>
  );
}
