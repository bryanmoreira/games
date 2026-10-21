"use client";

import { audio, knock, tone } from "@/lib/sound";

/** Peça andando para o lado ou girando: tique bem curto. */
export function playMoveSound(turn = false) {
  const ac = audio();
  if (!ac) return;
  tone(ac, turn ? 660 : 440, ac.currentTime, 0.04, 0.035, "square");
}

/** Peça travando: batida seca de tijolo (mais forte na queda de vez). */
export function playLockSound(hard: boolean) {
  const ac = audio();
  if (!ac) return;
  knock(ac, ac.currentTime, hard ? 0.7 : 0.9, hard ? 0.5 : 0.3);
}

/** Linhas sumindo: arpejo que sobe mais quanto mais linhas; 4 de uma vez ganha o acorde inteiro. */
export function playClearSound(lines: number, b2b: boolean) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5].slice(0, lines);
  notes.forEach((f, i) => tone(ac, f * (b2b ? 1.122 : 1), t + i * 0.06, 0.25, 0.08, "triangle"));
  if (lines === 4) [1046.5, 1318.5, 1568].forEach((f) => tone(ac, f, t + 0.26, 0.6, 0.06, "sawtooth"));
}

/** Guardar a peça: "vup" subindo. */
export function playHoldSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 330, t, 0.08, 0.05, "sine");
  tone(ac, 494, t + 0.05, 0.1, 0.05, "sine");
}

/** Nível novo: três notas rápidas. */
export function playLevelSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [784, 988, 1175].forEach((f, i) => tone(ac, f, t + i * 0.08, 0.18, 0.07, "square"));
}
