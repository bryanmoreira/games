"use client";

import { audio } from "@/lib/sound";

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
