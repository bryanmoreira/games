"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { refreshChips } from "@/lib/chips-client";
import { captureRef, clearRef, pendingRef, setMe } from "@/lib/referral";
import { getName, setName } from "@/lib/socket";

/**
 * Logado, o nome guardado para as salas é sempre o da conta (o servidor também usa o da conta).
 * Também cuida da indicação: guarda o ?ref= de quem chegou por um link e, depois do login, cobra as fichas.
 */
export function AccountSync() {
  const { data, isPending } = authClient.useSession();
  const name = data?.user.name;
  const username = (data?.user as { username?: string | null } | undefined)?.username ?? null;

  useEffect(() => captureRef(), []);

  useEffect(() => {
    if (name && getName() !== name) setName(name);
  }, [name]);

  useEffect(() => {
    if (isPending) return;
    setMe(username);
    const ref = data ? pendingRef() : null;
    if (!ref) return;
    if (ref === username) return clearRef();
    fetch("/api/chips/indicacao", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref }) })
      .then((r) => {
        // pagou ou não vale mais (conta antiga, já indicada, limite): não tenta de novo
        if (r.status !== 401 && r.status < 500) clearRef();
        if (r.ok) void refreshChips();
      })
      .catch(() => {});
  }, [data, isPending, username]);

  return null;
}
