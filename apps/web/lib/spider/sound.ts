"use client";

import { audio, playCardSound } from "@/lib/sound";

/** Cartas saindo do monte: um "tap" por carta, em sequência. */
export function playDealSound(count = 10, gap = 0.06) {
  if (!audio()) return;
  for (let i = 0; i < count; i++) setTimeout(playCardSound, i * gap * 1000);
}

function tone(ac: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType = "triangle") {
  const o = ac.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  o.connect(g).connect(ac.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

/** Sequência completa: arpejo curto subindo. */
export function playCompleteSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + i * 0.07, 0.35, 0.18));
}

/** Vitória: acorde maior em duas batidas. */
export function playWinSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [392, 493.88, 587.33].forEach((f) => tone(ac, f, t, 0.25, 0.12, "sawtooth"));
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(ac, f, t + 0.22, 0.9, 0.1, "sawtooth"));
}
