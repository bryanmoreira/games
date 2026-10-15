"use client";

import { audio, knock, tone } from "@/lib/sound";

/** Peça pousando na casa. */
export function playMoveSound() {
  const ac = audio();
  if (!ac) return;
  knock(ac, ac.currentTime, 0.9, 0.5);
}

/** Captura: a peça pousa e a capturada bate mais grave ao sair. */
export function playCaptureSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 0.9, 0.55);
  knock(ac, t + 0.07, 0.55, 0.45);
}

/** Roque: rei e torre, dois toques rápidos. */
export function playCastleSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 0.9, 0.45);
  knock(ac, t + 0.12, 1.1, 0.4);
}

/** Xeque: toque da peça + aviso agudo curto. */
export function playCheckSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  knock(ac, t, 0.9, 0.5);
  tone(ac, 1318.5, t + 0.05, 0.22, 0.07, "square");
}

/** Promoção: duas notas subindo. */
export function playPromoteSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 783.99, t, 0.25, 0.12);
  tone(ac, 1174.66, t + 0.12, 0.45, 0.12);
}

/** Oferta de empate chegando. */
export function playOfferSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 587.33, t, 0.25, 0.08, "sine");
  tone(ac, 739.99, t + 0.14, 0.35, 0.08, "sine");
}
