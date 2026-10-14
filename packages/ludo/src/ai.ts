import { SAFE, trackIndex } from "./board";
import { capturesAt, target } from "./rules";
import { BASE, HOME, LAST_TRACK, TRACK, type Action, type Color, type GameState, type PlayerView } from "./types";

/** Quantas peças de outras cores alcançam a casa do circuito `t` com um dado (1 a 6). */
export function threatsTo(s: Pick<GameState, "pieces" | "players" | "colorOf">, color: Color, t: number | null): number {
  if (t === null || SAFE.has(t)) return 0;
  let n = 0;
  for (const p of s.players) {
    const c = s.colorOf[p]!;
    if (c === color) continue;
    for (const prog of s.pieces[c]) {
      const at = trackIndex(c, prog);
      if (at === null) continue;
      const d = (t - at + TRACK) % TRACK;
      // a peça ainda está no circuito ao chegar (não entrou na reta final antes)
      if (d >= 1 && d <= 6 && prog + d <= LAST_TRACK) n++;
    }
  }
  return n;
}

/** Nota do lance: chegar, capturar, sair da base, fugir de ameaça e não parar ao alcance de ninguém. */
function score(view: PlayerView, color: Color, piece: number, die: number): number {
  const from = view.pieces[color][piece];
  const to = target(from, die)!;
  const captured = capturesAt(view, color, to);
  let v = 0;
  if (to === HOME) v += 90;
  if (captured.length) v += 80 + captured.reduce((n, c) => n + c.from, 0) * 0.6;
  if (from === BASE) v += 55;

  const tFrom = trackIndex(color, from);
  const tTo = trackIndex(color, to);
  const before = threatsTo(view, color, tFrom);
  const after = tTo === null ? 0 : threatsTo(view, color, tTo);
  // peça ameaçada que escapa vale mais quanto mais longe já andou
  if (before > 0 && after === 0) v += 30 + from * 0.5;
  if (after > 0) v -= 22 + to * 0.6 + after * 6;
  if (tTo !== null && SAFE.has(tTo)) v += 14;
  if (from <= LAST_TRACK && to > LAST_TRACK) v += 35; // entra na reta final: ninguém pega mais
  // avançar: prefere a peça mais adiantada, mas sem deixar as outras para trás
  v += to * 0.25;
  return v;
}

/** Lance da IA usando só a visão do bot. */
export function decide(view: PlayerView, rng: () => number = Math.random): Action | null {
  if (view.canRoll) return { type: "roll", seat: view.seat };
  if (!view.canMove || view.myColor === null || view.die === null || view.movable.length === 0) return null;
  const color = view.myColor;
  const die = view.die;
  const best = view.movable
    .map((piece) => ({ piece, v: score(view, color, piece, die) + rng() * 2 }))
    .sort((a, b) => b.v - a.v)[0].piece;
  return { type: "move", seat: view.seat, piece: best };
}
