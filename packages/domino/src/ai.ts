import { nextSeat, teamOf, winType } from "./rules";
import { boardSize, endsOf, handPips, hasNumber, isDouble, makeSet, pips, sameTile } from "./tiles";
import { WIN_POINTS, type Action, type Board, type PlayerView, type Seat, type Side, type Tile } from "./types";

/** Peças na mesa. */
function boardTiles(b: Board): Tile[] {
  return b.first ? [b.first.tile, ...b.left.map((p) => p.tile), ...b.right.map((p) => p.tile)] : [];
}

/** Peças que eu não vejo (nas mãos dos outros ou no monte). */
export function unseenTiles(v: Pick<PlayerView, "board" | "myHand">): Tile[] {
  const seen = [...boardTiles(v.board), ...v.myHand];
  return makeSet().filter((t) => !seen.some((x) => sameTile(x, t)));
}

/** Números que cada lugar com certeza não tem: as pontas de quando passou a vez. */
export function lacks(v: Pick<PlayerView, "events">): Set<number>[] {
  const out = Array.from({ length: 4 }, () => new Set<number>());
  for (const e of v.events) if (e.kind === "pass") for (const n of e.ends) out[e.seat].add(n);
  return out;
}

/** Pontas depois de jogar `t` em `side`. */
function endsAfter(b: Board, t: Tile, side: Side): [number, number] {
  const ends = endsOf(b);
  if (!ends) return [t[0], t[1]];
  const end = side === "left" ? ends[0] : ends[1];
  const outer = t[0] === end ? t[1] : t[0];
  return side === "left" ? [outer, ends[1]] : [ends[0], outer];
}

/** Ninguém mais tem peça com os números das pontas: o jogo fecha. */
function closes(v: PlayerView, t: Tile, ends: [number, number]): boolean {
  const out = [...boardTiles(v.board), t];
  const rest = v.myHand.filter((x) => !sameTile(x, t));
  if (rest.some((x) => hasNumber(x, ends[0]) || hasNumber(x, ends[1]))) return false;
  return makeSet()
    .filter((x) => hasNumber(x, ends[0]) || hasNumber(x, ends[1]))
    .every((x) => out.some((o) => sameTile(o, x)));
}

/**
 * Nota de um lance: bater (quanto mais vale, melhor), largar peça pesada e carroça, ficar com peças que
 * encaixam nas pontas novas, deixar o adversário seguinte sem jogo e não travar o parceiro. Fechar o
 * jogo só quando a conta das mãos favorece a minha dupla.
 */
function score(v: PlayerView, t: Tile, side: Side, rng: () => number): number {
  const ends = endsOf(v.board);
  if (v.myHand.length === 1) return 1000 + (ends ? WIN_POINTS[winType(t, ends)] : 1) * 10;

  const after = endsAfter(v.board, t, side);
  const rest = v.myHand.filter((x) => !sameTile(x, t));
  let val = pips(t) * 1.2 + (isDouble(t) ? 6 : 0);
  val += rest.filter((x) => hasNumber(x, after[0]) || hasNumber(x, after[1])).length * 3;

  const me = v.seat;
  const lack = lacks(v);
  const next = nextSeat(v, me);
  const blocked = (s: Seat) => lack[s].has(after[0]) && lack[s].has(after[1]);
  if (teamOf(next) !== teamOf(me) && blocked(next)) val += 8;
  if (v.mode === "duplas" && blocked((me + 2) % 4)) val -= 6;

  if (boardSize(v.board) > 0 && closes(v, t, after)) {
    const unseen = unseenTiles(v);
    const total = handPips(unseen);
    const mine = handPips(rest);
    let us = mine;
    let them = total;
    if (v.mode === "duplas") {
      // peças escondidas divididas pela quantidade na mão de cada um
      const others = v.players.filter((p) => p !== me);
      const count = others.reduce((n, p) => n + v.handCounts[p], 0) || 1;
      const partner = (me + 2) % 4;
      const part = (total * v.handCounts[partner]) / count;
      us = mine + part;
      them = total - part;
    }
    val += us + 3 < them ? 60 : us > them ? -60 : -10;
  }
  return val + rng() * 1.5;
}

/** Lance da IA a partir da visão do bot (sem ver as mãos dos outros). */
export function decide(v: PlayerView, rng: () => number = Math.random): Action | null {
  if (v.phase !== "playing" || v.turn !== v.seat) return null;
  if (v.canDraw) return { type: "draw", seat: v.seat };
  if (!v.canPlay) return null;
  let best: { tile: Tile; side: Side; val: number } | null = null;
  for (const o of v.options) {
    for (const side of o.sides) {
      const val = score(v, o.tile, side, rng);
      if (!best || val > best.val) best = { tile: o.tile, side, val };
    }
  }
  return best ? { type: "play", seat: v.seat, tile: best.tile, side: best.side } : null;
}
