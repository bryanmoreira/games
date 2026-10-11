"use client";

import { audio, playCardSound, tone } from "@/lib/sound";

/** Dica dada: duas notas abertas, como um rádio chamando. */
export function playClueSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 659.25, t, 0.16, 0.1);
  tone(ac, 987.77, t + 0.1, 0.4, 0.1);
}

/**
 * Palavra revelada: o "tap" da carta e um sinal do resultado.
 * Acerto do time sobe, civil fica neutro, palavra do adversário desce, assassino é um baque grave.
 */
export function playRevealSound(result: "hit" | "neutral" | "enemy" | "assassin") {
  const ac = audio();
  if (!ac) return;
  playCardSound();
  const t = ac.currentTime + 0.08;
  switch (result) {
    case "hit":
      tone(ac, 783.99, t, 0.15, 0.1);
      tone(ac, 1046.5, t + 0.08, 0.3, 0.1);
      break;
    case "neutral":
      tone(ac, 392, t, 0.25, 0.09);
      break;
    case "enemy":
      tone(ac, 466.16, t, 0.16, 0.1, "sawtooth");
      tone(ac, 349.23, t + 0.12, 0.35, 0.1, "sawtooth");
      break;
    case "assassin": {
      const o = ac.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.9);
      const f = ac.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 600;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1);
      o.connect(f).connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + 1.05);
      break;
    }
  }
}
