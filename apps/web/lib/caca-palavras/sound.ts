"use client";

import { audio, tone } from "@/lib/sound";

/** Cada letra nova na seleção: tique curto que sobe com o tamanho. */
export function playTickSound(n: number) {
  const ac = audio();
  if (!ac) return;
  tone(ac, 520 * Math.pow(2, Math.min(n, 14) / 12), ac.currentTime, 0.05, 0.05, "sine");
}

/** Palavra achada: arpejo curto subindo, mais longo para palavra maior. */
export function playFoundSound(len: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const notes = [659.25, 783.99, 987.77, 1174.66, 1318.51];
  notes.slice(0, Math.min(5, 2 + Math.floor(len / 3))).forEach((f, i) => tone(ac, f, t + i * 0.055, 0.28, 0.11));
}

/** Seleção que não é palavra: nota grave e curta. */
export function playMissSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 220, t, 0.12, 0.07, "square");
  tone(ac, 175, t + 0.08, 0.16, 0.06, "square");
}

/** Dica: brilho de duas notas. */
export function playHintSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 1046.5, t, 0.25, 0.08, "sine");
  tone(ac, 1567.98, t + 0.08, 0.35, 0.08, "sine");
}
