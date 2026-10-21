import { COLS, input, ROWS, type Game, type Key } from "../src";

// Jogador automático dos testes: testa cada giro e coluna e fica com o campo mais baixo e sem buracos.

function rate(g: Game, lines: number): number {
  let height = 0;
  let holes = 0;
  let bump = 0;
  let prev = -1;
  for (let x = 0; x < COLS; x++) {
    let top = ROWS;
    for (let y = 0; y < ROWS; y++)
      if (g.board[y * COLS + x]) {
        top = y;
        break;
      }
    for (let y = top + 1; y < ROWS; y++) if (!g.board[y * COLS + x]) holes++;
    const h = ROWS - top;
    height += h;
    if (prev >= 0) bump += Math.abs(h - prev);
    prev = h;
  }
  return -0.51 * height + 0.76 * lines - 0.36 * holes - 0.18 * bump - (g.over ? 1000 : 0);
}

/** Comandos para pôr a peça da vez no melhor lugar (terminam com "drop"). */
export function plan(g: Game): Key[] {
  let best: Key[] = ["drop"];
  let bestScore = -Infinity;
  for (let r = 0; r < 4; r++) {
    for (let dx = -5; dx <= 5; dx++) {
      const keys: Key[] = [...Array<Key>(r).fill("cw"), ...Array<Key>(Math.abs(dx)).fill(dx < 0 ? "left" : "right"), "drop"];
      const sim: Game = { ...g, board: g.board.slice(), ids: g.ids.slice(), piece: { ...g.piece! }, queue: g.queue.slice() };
      const lines = sim.lines;
      let ok = true;
      for (const k of keys.slice(0, -1)) ok = input(sim, k) && ok;
      if (!ok) continue;
      input(sim, "drop");
      const sc = rate(sim, sim.lines - lines);
      if (sc > bestScore) {
        bestScore = sc;
        best = keys;
      }
    }
  }
  return best;
}
