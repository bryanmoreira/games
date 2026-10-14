"use client";

import { audio, tone } from "@/lib/sound";

/** "Toc" de peça de madeira no tabuleiro: estalo curto e seco + corpo grave. */
function knock(ac: AudioContext, at: number, pitch: number, gain: number) {
  const len = Math.floor(ac.sampleRate * 0.05);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = (1400 + Math.random() * 300) * pitch;
  band.Q.value = 2.5;
  const ng = ac.createGain();
  ng.gain.value = gain;
  noise.connect(band).connect(ng).connect(ac.destination);
  noise.start(at);

  // a madeira ressoa um pouco
  const body = ac.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(420 * pitch, at);
  body.frequency.exponentialRampToValueAtTime(180 * pitch, at + 0.06);
  const bg = ac.createGain();
  bg.gain.setValueAtTime(gain * 0.6, at);
  bg.gain.exponentialRampToValueAtTime(0.001, at + 0.08);
  body.connect(bg).connect(ac.destination);
  body.start(at);
  body.stop(at + 0.1);
}

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

/** Empate: "plim-plom" neutro. */
export function playDrawSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 659.25, t, 0.3, 0.1);
  tone(ac, 493.88, t + 0.18, 0.5, 0.1);
}
