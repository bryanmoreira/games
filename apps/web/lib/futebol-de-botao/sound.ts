"use client";

import { audio, tone } from "@/lib/sound";

/** Ruído curto filtrado (batida na bola, trave). */
function noise(ac: AudioContext, at: number, freq: number, gain: number, len: number, q = 1.4) {
  const n = Math.floor(ac.sampleRate * len);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(band).connect(g).connect(ac.destination);
  src.start(at);
}

/** Chute: "tum" grave com o estalo do couro. */
export function playKickSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 150, t, 0.12, 0.35, "sine");
  noise(ac, t, 900, 0.5, 0.06);
}

/** Bola na trave: "plém" metálico. */
export function playPostSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 1180, t, 0.45, 0.12, "triangle");
  tone(ac, 1770, t, 0.3, 0.06, "sine");
  noise(ac, t, 2500, 0.25, 0.04, 3);
}

/** Apito: nota aguda com trinado. */
export function playWhistleSound(long = false) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const dur = long ? 0.7 : 0.3;
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.value = 2700;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 28;
  const depth = ac.createGain();
  depth.gain.value = 90;
  lfo.connect(depth).connect(o.frequency);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
  g.gain.setValueAtTime(0.09, t + dur - 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ac.destination);
  o.start(t);
  lfo.start(t);
  o.stop(t + dur + 0.02);
  lfo.stop(t + dur + 0.02);
}

/** Gol: rede balançando e fanfarra subindo (mais triste quando é contra o seu time). */
export function playGoalSound(ours: boolean) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  noise(ac, t, 500, 0.35, 0.35, 0.7);
  const notes = ours ? [523, 659, 784, 1047] : [392, 349, 311];
  notes.forEach((f, i) => tone(ac, f, t + 0.12 + i * 0.11, 0.35, 0.16, ours ? "triangle" : "sine"));
}
