"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Soma o tempo só enquanto `running` (atualiza a tela a cada segundo). `now()` dá o total em ms. */
export function useClock(running: boolean) {
  const base = useRef(0);
  const since = useRef<number | null>(null);
  const [, setTick] = useState(0);
  const now = useCallback(() => base.current + (since.current === null ? 0 : Date.now() - since.current), []);
  const reset = useCallback((ms: number) => {
    base.current = ms;
    if (since.current !== null) since.current = Date.now();
    setTick((x) => x + 1);
  }, []);
  useEffect(() => {
    if (!running) return;
    since.current = Date.now();
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => {
      clearInterval(t);
      if (since.current !== null) base.current += Date.now() - since.current;
      since.current = null;
    };
  }, [running]);
  return useMemo(() => ({ now, reset }), [now, reset]);
}
