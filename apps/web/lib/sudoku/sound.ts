"use client";

import { audio, tone } from "@/lib/sound";

/** Número colocado: "toc" curto de lápis. */
export function playPlaceSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 880 + Math.random() * 60, t, 0.09, 0.12, "sine");
  tone(ac, 1760, t, 0.04, 0.04, "sine");
}

/** Anotação: mais baixo e mais curto que o número. */
export function playNoteSound() {
  const ac = audio();
  if (!ac) return;
  tone(ac, 1320, ac.currentTime, 0.05, 0.05, "sine");
}

/** Erro: duas notas graves e ásperas descendo. */
export function playErrorSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 196, t, 0.14, 0.09, "square");
  tone(ac, 147, t + 0.12, 0.22, 0.09, "square");
}

/** Linha, coluna ou bloco completo: arpejo subindo, um degrau a mais por unidade. */
export function playUnitSound(count = 1) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const notes = [659.25, 783.99, 987.77, 1174.66, 1318.51];
  notes.slice(0, 2 + Math.min(3, count)).forEach((f, i) => tone(ac, f, t + i * 0.06, 0.3, 0.12));
}

/** Dica: brilho de duas notas. */
export function playHintSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 1046.5, t, 0.25, 0.08, "sine");
  tone(ac, 1567.98, t + 0.08, 0.35, 0.08, "sine");
}

/** Vitória: acorde maior em duas batidas. */
export function playWinSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [440, 554.37, 659.25].forEach((f) => tone(ac, f, t, 0.25, 0.1, "sawtooth"));
  [587.33, 739.99, 880, 1174.66].forEach((f) => tone(ac, f, t + 0.22, 0.9, 0.09, "sawtooth"));
}

/** Fim de jogo: três notas descendo. */
export function playLoseSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [392, 329.63, 261.63].forEach((f, i) => tone(ac, f, t + i * 0.16, 0.35, 0.1, "triangle"));
}
