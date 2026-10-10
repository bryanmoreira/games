import { randomFleet, shipCells } from "./rules";
import { FLEET, SIZE, type Action, type Cell, type PlayerView } from "./types";

// Mapa de probabilidade: para cada navio ainda vivo, conta todas as posições possíveis que não passam
// por água nem por navio afundado. Com acertos ainda sem navio afundado ("alvo"), só valem as posições
// que passam por eles, com peso maior quanto mais acertos cobrem (segue a linha do navio).

const ALIGN = 30;
const FREE = 0;
const WATER = 1;
const HIT = 2;
const SUNK = 3;

/** Nota de cada casa (índice = row * SIZE + col); -1 nas casas já atingidas. */
export function heatMap(view: PlayerView): number[] {
  const grid = new Int8Array(SIZE * SIZE);
  for (const s of view.shots) if (s.seat === view.seat) grid[s.row * SIZE + s.col] = s.hit ? HIT : WATER;
  const sunk = new Set<number>();
  for (const k of view.enemyShips) {
    if (!k.sunk) continue;
    sunk.add(k.index);
    for (const c of shipCells(k.ship, k.index)) grid[c.row * SIZE + c.col] = SUNK;
  }
  const target = grid.includes(HIT);

  const heat = new Array<number>(SIZE * SIZE).fill(0);
  for (let i = 0; i < FLEET.length; i++) {
    if (sunk.has(i)) continue;
    const len = FLEET[i].size;
    for (const step of [1, SIZE]) {
      // step 1 = horizontal, SIZE = vertical
      const maxCol = step === 1 ? SIZE - len : SIZE - 1;
      const maxRow = step === 1 ? SIZE - 1 : SIZE - len;
      for (let row = 0; row <= maxRow; row++) {
        for (let col = 0; col <= maxCol; col++) {
          const start = row * SIZE + col;
          let hits = 0;
          let blocked = false;
          for (let k = 0, p = start; k < len; k++, p += step) {
            const v = grid[p];
            if (v === WATER || v === SUNK) {
              blocked = true;
              break;
            }
            if (v === HIT) hits++;
          }
          if (blocked || (target && hits === 0)) continue;
          const w = target ? ALIGN ** hits : 1;
          for (let k = 0, p = start; k < len; k++, p += step) if (grid[p] === FREE) heat[p] += w;
        }
      }
    }
  }
  for (let p = 0; p < heat.length; p++) if (grid[p] !== FREE) heat[p] = -1;
  // nenhuma posição passa pelos acertos abertos (não deveria acontecer): volta a caçar
  if (target && heat.every((h) => h <= 0)) {
    for (let p = 0; p < heat.length; p++) if (grid[p] === FREE) heat[p] = 1;
  }
  return heat;
}

/** Lance da IA a partir da visão do bot: sorteia a frota ou atira na casa mais provável. */
export function decide(view: PlayerView, rng: () => number = Math.random): Action | null {
  if (view.canPlace) return { type: "place", seat: view.seat, ships: randomFleet(rng) };
  if (!view.canShoot) return null;
  const heat = heatMap(view);
  const best = Math.max(...heat);
  if (best < 0) return null;
  const top: Cell[] = [];
  heat.forEach((h, p) => h === best && top.push({ col: p % SIZE, row: Math.floor(p / SIZE) }));
  const pick = top[Math.floor(rng() * top.length)];
  return { type: "shoot", seat: view.seat, col: pick.col, row: pick.row };
}
