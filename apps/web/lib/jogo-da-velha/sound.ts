"use client";

import type { Mark } from "@mesa/jogo-da-velha";
import { audio, tone } from "@/lib/sound";

/** Um risco de giz: chiado áspero que sobe e desce de tom. */
function scratch(ac: AudioContext, at: number, dur: number) {
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = Math.sin((Math.PI * i) / len);
    // aspereza: o giz pula na lousa
    const grain = 0.6 + 0.4 * Math.sin(i / 37 + Math.random());
    data[i] = (Math.random() * 2 - 1) * env * grain;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(2600 + Math.random() * 400, at);
  band.frequency.linearRampToValueAtTime(3600, at + dur);
  band.Q.value = 1.4;
  const g = ac.createGain();
  g.gain.value = 0.32;
  noise.connect(band).connect(g).connect(ac.destination);
  noise.start(at);
}

/** X são dois riscos curtos; O, um risco mais longo. */
export function playMarkSound(mark: Mark) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  if (mark === "X") {
    scratch(ac, t, 0.11);
    scratch(ac, t + 0.16, 0.11);
  } else scratch(ac, t, 0.22);
}

/** Deu velha: "plim-plom" neutro, nem festa nem derrota. */
export function playDrawSound() {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, 659.25, t, 0.3, 0.1);
  tone(ac, 493.88, t + 0.18, 0.5, 0.1);
}
