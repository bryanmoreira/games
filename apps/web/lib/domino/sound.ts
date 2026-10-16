"use client";

import { audio, knock, tone } from "@/lib/sound";

/** Peça entrando na mesa: "tec" seco de pedra. */
export function playTileSound() {
  const ac = audio();
  if (!ac) return;
  knock(ac, ac.currentTime, 1.7, 0.45);
}

/** Batida: a última peça vai com força na mesa e, quanto mais vale, mais notas sobem. */
export function playBatidaSound(points: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 1.1, 0.8);
  knock(ac, t + 0.02, 0.7, 0.6);
  const notes = [523.25, 659.25, 783.99, 1046.5];
  for (let i = 0; i < Math.min(4, points); i++) tone(ac, notes[i], t + 0.18 + i * 0.09, 0.3, 0.09);
}

/** Jogo fechado: as pedras param, duas notas graves. */
export function playClosedSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 1, 0.5);
  tone(ac, 293.66, t + 0.12, 0.25, 0.08);
  tone(ac, 220, t + 0.3, 0.4, 0.08);
}

/** Alguém passou a vez: batidinha dupla na mesa, como quem bate com o dedo. */
export function playPassSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 0.6, 0.35);
  knock(ac, t + 0.14, 0.6, 0.3);
}

/** Peça comprada do monte: estalo leve. */
export function playDrawSound() {
  const ac = audio();
  if (!ac) return;
  knock(ac, ac.currentTime, 2.2, 0.2);
}

/** Pedras sendo misturadas no começo da mão. */
export function playShuffleSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  for (let i = 0; i < 12; i++) knock(ac, t + i * 0.06 + Math.random() * 0.03, 1.4 + Math.random() * 0.8, 0.12 + Math.random() * 0.1);
}
