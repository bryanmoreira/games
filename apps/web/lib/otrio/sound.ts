"use client";

import { audio } from "@/lib/sound";

/** Anel encaixando na madeira: "toc" curto; a peça pequena soa mais aguda, a grande mais grave. */
export function playRingSound(size: number) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const k = size / 2;

  const len = Math.floor(ac.sampleRate * 0.04);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2400 - k * 1100 + Math.random() * 150;
  band.Q.value = 3;
  const ng = ac.createGain();
  ng.gain.value = 0.4;
  noise.connect(band).connect(ng).connect(ac.destination);
  noise.start(t);

  const knock = ac.createOscillator();
  knock.type = "sine";
  knock.frequency.setValueAtTime(880 - k * 420, t);
  knock.frequency.exponentialRampToValueAtTime(330 - k * 150, t + 0.08);
  const kg = ac.createGain();
  kg.gain.setValueAtTime(0.22, t);
  kg.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  knock.connect(kg).connect(ac.destination);
  knock.start(t);
  knock.stop(t + 0.13);
}
