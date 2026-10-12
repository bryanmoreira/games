"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { PRESENCE_EVERY_MS } from "@/lib/friends-rules";

/** Logado e com a aba visível: avisa o site a cada minuto (os amigos veem a bolinha de online). */
export function Presence() {
  const { data } = authClient.useSession();
  const userId = data?.user.id;

  useEffect(() => {
    if (!userId) return;
    const ping = () => {
      if (document.visibilityState === "visible") void fetch("/api/presence", { method: "POST" }).catch(() => {});
    };
    ping();
    const t = setInterval(ping, PRESENCE_EVERY_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [userId]);

  return null;
}
