"use client";

import { audio, playCardSound, tone } from "@/lib/sound";

/** Cartas saindo do monte: um "tap" por carta, em sequência. */
export function playDealSound(count = 10, gap = 0.06) {
  if (!audio()) return;
  for (let i = 0; i < count; i++) setTimeout(playCardSound, i * gap * 1000);
}

/** Sequência completa: arpejo curto subindo. */
export function playCompleteSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + i * 0.07, 0.35, 0.18));
}

/** Vitória: acorde maior em duas batidas. */
export function playWinSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [392, 493.88, 587.33].forEach((f) => tone(ac, f, t, 0.25, 0.12, "sawtooth"));
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(ac, f, t + 0.22, 0.9, 0.1, "sawtooth"));
}
