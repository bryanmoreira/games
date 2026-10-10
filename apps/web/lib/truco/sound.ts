"use client";

// Sons sintetizados com Web Audio (sem arquivos externos)

let ctx: AudioContext | null = null;
let muted: boolean | null = null;

function audio(): AudioContext | null {
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

export function playTrucoSound(value = 3) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  // quanto maior a aposta, mais agudo
  const base = 196 * Math.pow(2, ([3, 6, 9, 12].indexOf(value) * 2) / 12);

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, t);
  master.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
  master.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(3200, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + 0.6);
  lp.connect(master).connect(ac.destination);

  // acorde maior com leve subida de pitch
  for (const ratio of [1, 1.26, 1.5, 2]) {
    const o = ac.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(base * ratio * 0.94, t);
    o.frequency.exponentialRampToValueAtTime(base * ratio, t + 0.08);
    o.detune.value = (Math.random() - 0.5) * 12;
    o.connect(lp);
    o.start(t);
    o.stop(t + 0.75);
  }
}
