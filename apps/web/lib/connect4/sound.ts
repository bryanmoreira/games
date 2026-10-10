"use client";

import { audio } from "@/lib/sound";

/** Peça batendo no fundo: "clack" de plástico; quanto mais fundo caiu, mais grave e mais forte. */
export function playDropSound(fall: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const k = Math.min(1, fall / 6);

  const len = Math.floor(ac.sampleRate * 0.05);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1700 - k * 500 + Math.random() * 200;
  band.Q.value = 2.5;
  const ng = ac.createGain();
  ng.gain.value = 0.35 + k * 0.3;
  noise.connect(band).connect(ng).connect(ac.destination);
  noise.start(t);

  const knock = ac.createOscillator();
  knock.type = "triangle";
  knock.frequency.setValueAtTime(420 - k * 160, t);
  knock.frequency.exponentialRampToValueAtTime(140, t + 0.07);
  const kg = ac.createGain();
  kg.gain.setValueAtTime(0.18 + k * 0.12, t);
  kg.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  knock.connect(kg).connect(ac.destination);
  knock.start(t);
  knock.stop(t + 0.1);
}
