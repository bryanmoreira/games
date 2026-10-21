"use client";

import { useSyncExternalStore } from "react";

const coarse = () => window.matchMedia("(pointer: coarse)").matches;
const subscribeCoarse = (l: () => void) => {
  const m = window.matchMedia("(pointer: coarse)");
  m.addEventListener("change", l);
  return () => m.removeEventListener("change", l);
};

/** Aparelho de toque (mostra os controles na tela). */
export function useTouchDevice() {
  return useSyncExternalStore(subscribeCoarse, coarse, () => false);
}
