"use client";

import { audio, tone } from "@/lib/sound";

/** Ruído curto filtrado. */
function noise(ac: AudioContext, at: number, freq: number, gain: number, len: number, q = 1.4, type: BiquadFilterType = "bandpass") {
  const n = Math.floor(ac.sampleRate * len);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(ac.destination);
  src.start(at);
}

/** Volume pela velocidade do choque (m/s). */
const vol = (speed: number, max: number) => Math.min(max, 0.04 + (speed / 4) * max);

/** Taco na branca: "toc" de couro e madeira. */
export function playCueSound(power: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const g = 0.15 + power * 0.45;
  noise(ac, t, 1800, g, 0.035, 2.2);
  tone(ac, 260, t, 0.07, g * 0.6, "sine");
}

/** Bola com bola: estalo seco e agudo de resina. */
export function playClackSound(speed: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const g = vol(speed, 0.7);
  noise(ac, t, 3600 + Math.random() * 500, g, 0.025, 3);
  tone(ac, 2400 + Math.random() * 200, t, 0.045, g * 0.35, "sine");
}

/** Bola na tabela: baque abafado. */
export function playCushionSound(speed: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const g = vol(speed, 0.5);
  noise(ac, t, 420, g, 0.06, 0.8, "lowpass");
  tone(ac, 120, t, 0.09, g * 0.5, "sine");
}

/** Bola caindo na caçapa: batida no fundo e a bola rolando no couro. */
export function playPocketSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  noise(ac, t, 700, 0.35, 0.05, 1.2);
  tone(ac, 180, t + 0.02, 0.14, 0.3, "sine");
  for (let k = 0; k < 4; k++) noise(ac, t + 0.1 + k * 0.06, 900 - k * 120, 0.12 - k * 0.025, 0.03, 2);
}

/** Falta: duas notas descendo. */
export function playFoulSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 330, t, 0.18, 0.12, "square");
  tone(ac, 247, t + 0.16, 0.25, 0.12, "square");
}
