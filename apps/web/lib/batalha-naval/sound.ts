"use client";

import { audio, tone } from "@/lib/sound";

/** Ruído branco com decaimento, para água e explosão. */
function noise(ac: AudioContext, dur: number, curve: number) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, curve);
  const src = ac.createBufferSource();
  src.buffer = buf;
  return src;
}

/** Assobio do tiro caindo. */
export function playWhistleSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(1500 + Math.random() * 200, t);
  o.frequency.exponentialRampToValueAtTime(520, t + 0.34);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 0.38);
}

/** Tiro na água: chuá filtrado e umas bolhas subindo. */
export function playSplashSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const n = noise(ac, 0.5, 2);
  const low = ac.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.setValueAtTime(1600, t);
  low.frequency.exponentialRampToValueAtTime(250, t + 0.45);
  const g = ac.createGain();
  g.gain.value = 0.45;
  n.connect(low).connect(g).connect(ac.destination);
  n.start(t);

  for (let i = 0; i < 3; i++) {
    const at = t + 0.12 + i * 0.07 + Math.random() * 0.05;
    const o = ac.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(500 + Math.random() * 300, at);
    o.frequency.exponentialRampToValueAtTime(1100 + Math.random() * 300, at + 0.06);
    const bg = ac.createGain();
    bg.gain.setValueAtTime(0.05, at);
    bg.gain.exponentialRampToValueAtTime(0.001, at + 0.07);
    o.connect(bg).connect(ac.destination);
    o.start(at);
    o.stop(at + 0.08);
  }
}

/** Acerto: explosão (ruído que escurece) com um baque grave. `big` = navio afundando. */
export function playBoomSound(big = false) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const dur = big ? 1.1 : 0.7;
  const n = noise(ac, dur, 2.5);
  const low = ac.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.setValueAtTime(2200, t);
  low.frequency.exponentialRampToValueAtTime(big ? 120 : 180, t + dur);
  const g = ac.createGain();
  g.gain.value = big ? 0.8 : 0.6;
  n.connect(low).connect(g).connect(ac.destination);
  n.start(t);

  const thump = ac.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(big ? 95 : 120, t);
  thump.frequency.exponentialRampToValueAtTime(38, t + 0.35);
  const tg = ac.createGain();
  tg.gain.setValueAtTime(big ? 0.6 : 0.45, t);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  thump.connect(tg).connect(ac.destination);
  thump.start(t);
  thump.stop(t + 0.42);
}

/** Navio afundou: explosão maior e uma buzina grave descendo. */
export function playSunkSound() {
  const ac = audio();
  if (!ac) return;
  playBoomSound(true);
  const t = ac.currentTime + 0.15;
  const o = ac.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(196, t);
  o.frequency.exponentialRampToValueAtTime(92, t + 0.9);
  const low = ac.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 700;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.07, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1);
  o.connect(low).connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + 1.05);
}

/** Frota confirmada: duas notas subindo. */
export function playReadySound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 523.25, t, 0.18, 0.08);
  tone(ac, 783.99, t + 0.1, 0.3, 0.08);
}

/** Navio girado ou encaixado no lugar: estalo curto. */
export function playClickSound() {
  const ac = audio();
  if (!ac) return;
  tone(ac, 880 + Math.random() * 120, ac.currentTime, 0.06, 0.05, "square");
}
