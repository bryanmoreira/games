import { cellOf, placeableSlots, SLOT_TRIPLES, sizeOf, winningSlots } from "./rules";
import type { Action, Color, GameState, PlayerView } from "./types";

type Board = Pick<GameState, "board" | "stock">;

/** Cores que jogam depois da cor da vez, na ordem da rodada (só as que ainda têm peça). */
function upcoming(s: Pick<GameState, "order" | "turn" | "stock">): Color[] {
  const out: Color[] = [];
  for (let k = 1; k < s.order.length; k++) {
    const c = s.order[(s.turn + k) % s.order.length];
    if (s.stock[c].some((n) => n > 0)) out.push(c);
  }
  return out;
}

/** Encaixes em que o primeiro adversário a jogar (que tenha ameaça) fecharia uma trinca. */
export function rivalThreats(view: PlayerView): number[] {
  for (const c of upcoming(view)) {
    if (view.myColors.includes(c)) continue;
    const threats = winningSlots(view, c);
    if (threats.length) return threats;
  }
  return [];
}

/** Quantos encaixes diferentes `color` ameaçaria (a uma peça da trinca) depois de jogar em `slot`. */
function threatsAfter(b: Board, slot: number, color: Color): number {
  const size = sizeOf(slot);
  const out = new Set<number>();
  for (const t of SLOT_TRIPLES[slot]) {
    let mine = 0;
    let free = -1;
    for (const x of t.slots) {
      if (x === slot || b.board[x] === color) mine++;
      else if (b.board[x] === null) free = x;
    }
    // o encaixe que falta precisa de peça daquele tamanho (já sem a que acabou de ser jogada)
    if (mine === 2 && free >= 0 && b.stock[color][sizeOf(free)] - (sizeOf(free) === size ? 1 : 0) > 0) out.add(free);
  }
  return out.size;
}

/** Nota do lance de `color` em `slot`: trincas que abre, ameaças que cria e o que tira dos outros. */
function score(b: Board, slot: number, color: Color, mine: Color[], next: Color | null): number {
  let v = 0;
  for (const t of SLOT_TRIPLES[slot]) {
    const others = t.slots.filter((x) => x !== slot).map((x) => b.board[x]);
    const colors = new Set(others.filter((x) => x !== null));
    if (colors.size === 0) v += 1;
    else if (colors.size === 1) {
      const [c] = colors;
      const n = others.filter((x) => x !== null).length;
      if (c === color) v += 4 * n;
      else if (!mine.includes(c)) v += 2.5 * n; // atrapalha a trinca de um adversário
    }
  }
  // duas ameaças de uma vez: ninguém bloqueia as duas
  const threats = threatsAfter(b, slot, color);
  if (threats >= 2) v += 40;
  else if (threats === 1) v += 6;

  // o próximo adversário consegue armar duas ameaças depois deste lance?
  if (next !== null) {
    b.board[slot] = color;
    const fork = placeableSlots(b, next).some((x) => threatsAfter(b, x, next) >= 2);
    b.board[slot] = null;
    if (fork) v -= 25;
  }
  const cell = cellOf(slot);
  if (cell === 4) v += 1.5;
  else if (cell % 2 === 0) v += 0.5;
  return v;
}

/** Lance da IA, usando só a visão do bot: fecha trinca, bloqueia o próximo, senão o lance de melhor nota. */
export function decide(view: PlayerView, rng: () => number = Math.random): Action | null {
  if (!view.canPlay || view.color === null || view.placeable.length === 0) return null;
  const color = view.color;
  const b: Board = { board: [...view.board], stock: view.stock.map((s) => [...s] as [number, number, number]) };
  const pick = (slots: number[]): Action => {
    const best = slots.map((x) => ({ x, v: score(b, x, color, view.myColors, null) + rng() * 1.5 })).sort((p, q) => q.v - p.v)[0].x;
    return { type: "place", seat: view.seat, cell: cellOf(best), size: sizeOf(best) };
  };

  const win = winningSlots(b, color);
  if (win.length) return pick(win);

  // bloqueia a ameaça do adversário que joga primeiro (se der)
  const blocks = rivalThreats(view).filter((x) => view.placeable.includes(x));
  if (blocks.length) return pick(blocks);

  const next = upcoming(view).find((c) => !view.myColors.includes(c)) ?? null;
  const scored = view.placeable.map((x) => ({ x, v: score(b, x, color, view.myColors, next) + rng() * 1.5 }));
  const best = scored.sort((p, q) => q.v - p.v)[0].x;
  return { type: "place", seat: view.seat, cell: cellOf(best), size: sizeOf(best) };
}
