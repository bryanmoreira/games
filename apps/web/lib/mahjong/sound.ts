"use client";

import { audio, knock, tone } from "@/lib/sound";

/** Peça marcada: toque leve de pedra. */
export function playSelectSound() {
  const ac = audio();
  if (!ac) return;
  knock(ac, ac.currentTime, 1.25, 0.18);
}

/** Par tirado: as duas pedras batendo e um brilho curto. */
export function playPairSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 1.1, 0.3);
  knock(ac, t + 0.07, 1.25, 0.28);
  tone(ac, 987.77, t + 0.1, 0.22, 0.06, "sine");
  tone(ac, 1318.51, t + 0.16, 0.3, 0.05, "sine");
}

/** Peças diferentes: nota grave e curta. */
export function playMissSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 220, t, 0.12, 0.06, "square");
  tone(ac, 175, t + 0.08, 0.16, 0.05, "square");
}

/** Peça presa: um toque seco e baixo. */
export function playBlockedSound() {
  const ac = audio();
  if (!ac) return;
  knock(ac, ac.currentTime, 0.6, 0.22);
}

/** Desfazer: duas pedras voltando, do agudo para o grave. */
export function playUndoSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 1.2, 0.22);
  knock(ac, t + 0.08, 0.95, 0.22);
}

/** Dica: brilho de duas notas. */
export function playHintSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 1046.5, t, 0.25, 0.08, "sine");
  tone(ac, 1567.98, t + 0.08, 0.35, 0.08, "sine");
}

/** Embaralhar: chuva de pedras. */
export function playShuffleTilesSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  for (let k = 0; k < 14; k++) knock(ac, t + k * 0.035 + Math.random() * 0.02, 0.8 + Math.random() * 0.6, 0.12 + Math.random() * 0.1);
}
