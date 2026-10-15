"use client";

import { audio, knock, tone } from "@/lib/sound";

/** Peça pousando numa casa. */
export function playStepSound() {
  const ac = audio();
  if (!ac) return;
  knock(ac, ac.currentTime, 1, 0.5);
}

/** Captura: a peça pousa e a capturada bate mais grave, como quem tira a peça do tabuleiro. */
export function playCaptureSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 1, 0.5);
  knock(ac, t + 0.07, 0.6, 0.45);
}

/** Virou dama: duas notas subindo. */
export function playKingSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 783.99, t, 0.25, 0.12);
  tone(ac, 1174.66, t + 0.12, 0.45, 0.12);
}
