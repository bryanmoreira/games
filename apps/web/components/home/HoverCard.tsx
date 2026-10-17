"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Card da home que "joga" ao passar o mouse. Animação em CSS: seletores `.hc:hover …` (globals.css).
// Animação com lances (tabuleiros): `useSequence` anda pelos quadros enquanto o mouse está em cima.

const Hovered = createContext(false);

export function HoverCard({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  return (
    <div
      className={`hc ${className}`}
      // só mouse: no toque o card já navega
      onPointerEnter={(e) => e.pointerType === "mouse" && setOn(true)}
      onPointerLeave={() => setOn(false)}
    >
      <Hovered.Provider value={on}>{children}</Hovered.Provider>
    </div>
  );
}

/**
 * Quadro atual de uma sequência de `n` quadros. Parado: o último (o desenho de sempre).
 * Com o mouse em cima: volta ao primeiro e anda um quadro a cada `ms` até o último (`ms` pode ser uma lista, um tempo por quadro).
 * `played`: já rodou alguma vez (antes disso as peças não animam, para não animar ao abrir a página).
 */
export function useSequence(n: number, ms: number | number[]): { step: number; played: boolean } {
  const on = useContext(Hovered);
  const [step, setStep] = useState(n - 1);
  const [played, setPlayed] = useState(false);
  useEffect(() => {
    if (!on || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStep(n - 1);
      return;
    }
    setStep(0);
    setPlayed(true);
    const timers: number[] = [];
    let at = 0;
    for (let i = 1; i < n; i++) {
      at += Array.isArray(ms) ? (ms[i - 1] ?? ms.at(-1)!) : ms;
      timers.push(window.setTimeout(() => setStep(i), at));
    }
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, n]);
  return { step, played };
}
