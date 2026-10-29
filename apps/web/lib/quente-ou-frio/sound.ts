"use client";

import type { Heat } from "@mesa/quente-ou-frio";
import { audio, tone } from "@/lib/sound";

/** Chute: quente sobe em três notas, morno uma nota no meio, frio uma nota grave e curta. */
export function playGuessSound(heat: Heat) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  if (heat === "hot") {
    [659.25, 830.61, 987.77].forEach((f, i) => tone(ac, f, t + i * 0.06, 0.16, 0.07, "sine"));
  } else if (heat === "warm") {
    tone(ac, 523.25, t, 0.16, 0.07, "sine");
  } else {
    tone(ac, 220, t, 0.14, 0.06, "triangle");
  }
}

/** Dica: brilho descendo. */
export function playHintSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [1318.5, 1046.5, 1318.5].forEach((f, i) => tone(ac, f, t + i * 0.07, 0.12, 0.05, "sine"));
}

/** Palavra que o jogo não conhece ou já chutada: duas notas ásperas. */
export function playInvalidSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 220, t, 0.1, 0.07, "square");
  tone(ac, 185, t + 0.09, 0.14, 0.07, "square");
}
