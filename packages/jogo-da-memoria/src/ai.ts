import type { Action, PlayerView } from "./types";

/** A IA só conhece cartas expostas e lembra as últimas quatro posições. */
export function decide(v: PlayerView, rng = Math.random): Action | null {
  if (!v.canPlay || !v.legal.length) return null;
  const known = v.memory.filter(m => v.legal.includes(m.index));
  let index: number | undefined;
  if (v.open.length) {
    const value = v.cards[v.open[0]];
    index = known.find(m => m.value === value)?.index;
  } else {
    index = known.find(m => known.some(n => n.index !== m.index && n.value === m.value))?.index;
  }
  if (index === undefined) {
    const unseen = v.legal.filter(i => !known.some(m => m.index === i));
    const choices = unseen.length ? unseen : v.legal;
    index = choices[Math.floor(rng() * choices.length)];
  }
  return { type: "flip", seat: v.seat, index };
}
