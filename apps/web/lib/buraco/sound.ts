"use client";

import { audio, knock, tone } from "@/lib/sound";

/** Canastra fechada: acorde que sobe; a limpa e a real ganham mais notas. */
export function playCanastraSound(kind: "limpa" | "suja" | "real") {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const notes = kind === "suja" ? [392, 493.88, 587.33] : kind === "limpa" ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((f, i) => tone(ac, f, t + i * 0.08, 0.35, 0.09));
}

/** Morto pego: duas batidas graves na mesa. */
export function playMortoSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 0.8, 0.5);
  knock(ac, t + 0.16, 0.65, 0.5);
  tone(ac, 220, t + 0.05, 0.3, 0.07);
}

/** Batida: a última carta vai com força na mesa e uma fanfarra curta. */
export function playBatidaSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 0.9, 0.8);
  knock(ac, t + 0.02, 0.6, 0.6);
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + 0.18 + i * 0.09, 0.3, 0.09));
}
