"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { getName, setName } from "@/lib/socket";

/** Logado, o nome guardado para as salas é sempre o da conta (o servidor também usa o da conta). */
export function AccountSync() {
  const { data } = authClient.useSession();
  const name = data?.user.name;
  useEffect(() => {
    if (name && getName() !== name) setName(name);
  }, [name]);
  return null;
}
