"use client";

import { useEffect } from "react";

// Sons sintetizados com Web Audio (sem arquivos externos)

let ctx: AudioContext | null = null;
let muted: boolean | null = null;

export function audio(): AudioContext | null {
  if (typeof window === "undefined" || isMuted()) return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  if (muted === null) {
    try {
      muted = localStorage.getItem("truco.muted") === "1";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem("truco.muted", value ? "1" : "0");
  } catch {}
}

/** Navegadores só liberam áudio após um gesto do usuário. */
export function unlockAudio() {
  audio();
}

/** Libera o áudio no primeiro toque/clique da página. */
export function useAudioUnlock() {
  useEffect(() => {
    window.addEventListener("pointerdown", unlockAudio);
    return () => window.removeEventListener("pointerdown", unlockAudio);
  }, []);
}

/** Nota curta com ataque rápido e decaimento exponencial. */
export function tone(ac: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType = "triangle") {
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

export function playCardSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;

  // "tap" de papel: ruído curto filtrado
  const len = Math.floor(ac.sampleRate * 0.09);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  noise.playbackRate.value = 0.9 + Math.random() * 0.2;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2200 + Math.random() * 600;
  band.Q.value = 0.8;
  const ng = ac.createGain();
  ng.gain.value = 0.55;
  noise.connect(band).connect(ng).connect(ac.destination);
  noise.start(t);

  // impacto grave na mesa
  const thud = ac.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(160, t);
  thud.frequency.exponentialRampToValueAtTime(60, t + 0.08);
  const tg = ac.createGain();
  tg.gain.setValueAtTime(0.35, t);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  thud.connect(tg).connect(ac.destination);
  thud.start(t);
  thud.stop(t + 0.12);
}

/** Vitória: acorde maior em duas batidas. */
export function playWinSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [440, 554.37, 659.25].forEach((f) => tone(ac, f, t, 0.25, 0.1, "sawtooth"));
  [587.33, 739.99, 880, 1174.66].forEach((f) => tone(ac, f, t + 0.22, 0.9, 0.09, "sawtooth"));
}

/** Fim de jogo: três notas descendo. */
export function playLoseSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [392, 329.63, 261.63].forEach((f, i) => tone(ac, f, t + i * 0.16, 0.35, 0.1, "triangle"));
}

/** Tempo acabando: bip curto a cada segundo. */
export function playCountdownSound(last: boolean) {
  const ac = audio();
  if (!ac) return;
  tone(ac, last ? 1046.5 : 880, ac.currentTime, last ? 0.3 : 0.1, 0.08, "square");
}
