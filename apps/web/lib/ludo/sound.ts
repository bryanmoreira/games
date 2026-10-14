"use client";

import { audio, tone } from "@/lib/sound";

/** Estalo curto filtrado (dado batendo, peão pousando). */
function click(ac: AudioContext, at: number, freq: number, gain: number, len = 0.035) {
  const n = Math.floor(ac.sampleRate * len);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = 2.2;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(band).connect(g).connect(ac.destination);
  src.start(at);
}

/** Dado rolando: batidas cada vez mais espaçadas e fracas. */
export function playDiceSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  let at = 0;
  for (let i = 0; i < 7; i++) {
    click(ac, t + at, 2600 + Math.random() * 1400, 0.5 - i * 0.05);
    at += 0.045 + i * 0.022 + Math.random() * 0.02;
  }
}

/** Peão pousando numa casa: "toc" de plástico, agudo e curto. */
export function playStepSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  click(ac, t, 1900 + Math.random() * 200, 0.32, 0.03);
  const body = ac.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(620, t);
  body.frequency.exponentialRampToValueAtTime(300, t + 0.05);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  body.connect(g).connect(ac.destination);
  body.start(t);
  body.stop(t + 0.08);
}

/** Captura: pancada e um "fiu" descendo, a peça voltando para a base. */
export function playCaptureSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  click(ac, t, 900, 0.6, 0.06);
  const o = ac.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(880, t + 0.04);
  o.frequency.exponentialRampToValueAtTime(160, t + 0.4);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.14, t + 0.06);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.45);
}

/** Peça saindo da base: duas notas subindo. */
export function playExitSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 523.25, t, 0.15, 0.09);
  tone(ac, 783.99, t + 0.08, 0.25, 0.09);
}

/** Peça na chegada: arpejo curto. */
export function playHomeSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + i * 0.08, 0.35, 0.1));
}

/** Vez perdida (3º seis ou sem lance): nota grave curta. */
export function playPassSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 220, t, 0.22, 0.08);
  tone(ac, 174.61, t + 0.12, 0.3, 0.08);
}
