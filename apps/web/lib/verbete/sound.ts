"use client";

import type { Mark } from "@truco/verbete";
import { audio, tone } from "@/lib/sound";

/** Letra digitada: "tec" curto de teclado. */
export function playKeySound() {
  const ac = audio();
  if (!ac) return;
  tone(ac, 620 + Math.random() * 80, ac.currentTime, 0.05, 0.05, "square");
}

/** Letra apagada: mais grave que a digitada. */
export function playEraseSound() {
  const ac = audio();
  if (!ac) return;
  tone(ac, 360, ac.currentTime, 0.05, 0.04, "square");
}

const FLIP: Record<Mark, number> = { right: 1046.5, place: 783.99, absent: 392 };

/** Casa virando: verde agudo, amarelo no meio, cinza grave. */
export function playFlipSound(mark: Mark) {
  const ac = audio();
  if (!ac) return;
  tone(ac, FLIP[mark], ac.currentTime, mark === "absent" ? 0.1 : 0.18, mark === "absent" ? 0.05 : 0.08, "sine");
}

/** Palavra fora da lista ou incompleta: duas notas ásperas. */
export function playInvalidSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 220, t, 0.1, 0.07, "square");
  tone(ac, 185, t + 0.09, 0.14, 0.07, "square");
}

/** Um quadro resolvido no Dueto/Quarteto: arpejo curto. */
export function playSolveSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [783.99, 987.77, 1174.66].forEach((f, i) => tone(ac, f, t + i * 0.07, 0.25, 0.1));
}
