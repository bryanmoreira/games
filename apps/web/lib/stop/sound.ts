"use client";

import { audio, tone } from "@/lib/sound";

/** Roleta da letra: clique seco a cada letra que passa. */
export function playTickSound() {
  const ac = audio();
  if (!ac) return;
  tone(ac, 1500 + Math.random() * 200, ac.currentTime, 0.03, 0.05, "square");
}

/** Letra sorteada: duas notas claras subindo. */
export function playLetterSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 783.99, t, 0.18, 0.12);
  tone(ac, 1174.66, t + 0.09, 0.45, 0.12);
}

/** STOP!: apito de juiz (seno agudo com trinado rápido). */
export function playStopSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.value = 2900;
  const lfo = ac.createOscillator();
  lfo.frequency.value = 32;
  const depth = ac.createGain();
  depth.gain.value = 120;
  lfo.connect(depth).connect(o.frequency);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
  g.gain.setValueAtTime(0.12, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.03, t + 0.16);
  g.gain.exponentialRampToValueAtTime(0.12, t + 0.2);
  g.gain.setValueAtTime(0.12, t + 0.5);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  o.connect(g).connect(ac.destination);
  o.start(t);
  lfo.start(t);
  o.stop(t + 0.62);
  lfo.stop(t + 0.62);
}

/** Tempo acabando: bip curto a cada segundo. */
export function playCountdownSound(last: boolean) {
  const ac = audio();
  if (!ac) return;
  tone(ac, last ? 1046.5 : 880, ac.currentTime, last ? 0.3 : 0.1, 0.08, "square");
}

/** Voto ✗ (grave) ou voto retirado (agudo). */
export function playVoteSound(against: boolean) {
  const ac = audio();
  if (!ac) return;
  tone(ac, against ? 220 : 440, ac.currentTime, 0.12, 0.14);
}

/** Pontos da rodada: arpejo subindo, como moedas. */
export function playPointsSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [659.25, 783.99, 987.77, 1318.51].forEach((f, i) => tone(ac, f, t + i * 0.07, 0.22, 0.08));
}
