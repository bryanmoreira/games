"use client";

import { useEffect, useState } from "react";
import type { RoomInfo } from "@mesa/truco";

/** ms até o fim da fase, a partir do `timeLeft` de cada mensagem do servidor. */
export function useCountdown(room: RoomInfo): number | null {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // cada mensagem do servidor acerta o relógio
  useEffect(() => {
    setEndsAt(room.timeLeft !== null ? Date.now() + room.timeLeft : null);
    setNow(Date.now());
  }, [room]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  return endsAt === null ? null : Math.max(0, endsAt - now);
}
