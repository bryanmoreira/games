"use client";

import { audio, knock, tone } from "@/lib/sound";

/** Fichas na mesa: dois estalos agudos de plástico. */
export function playChipSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 2.4 + Math.random() * 0.3, 0.22);
  knock(ac, t + 0.05 + Math.random() * 0.02, 2.7 + Math.random() * 0.3, 0.16);
}

/** Blackjack: arpejo que sobe e brilha. */
export function playBlackjackSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(ac, f, t + i * 0.07, 0.35, 0.08));
}

/** Estourou: duas notas graves descendo. */
export function playBustSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 196, t, 0.25, 0.1, "square");
  tone(ac, 146.83, t + 0.14, 0.4, 0.1, "square");
}

/** Ganhou a mão: fichas voltando e uma nota alegre. */
export function playPayoutSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  for (let i = 0; i < 4; i++) knock(ac, t + i * 0.06, 2.3 + Math.random() * 0.5, 0.15);
  tone(ac, 880, t + 0.2, 0.3, 0.06);
}
