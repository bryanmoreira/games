"use client";
import { audio, tone } from "@/lib/sound";
export function playPairSound() {
  const ac = audio();
  if (!ac) return;
  tone(ac, 659, ac.currentTime, .16, .07);
  tone(ac, 880, ac.currentTime + .09, .22, .06);
}
