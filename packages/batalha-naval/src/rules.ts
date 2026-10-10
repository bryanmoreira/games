import { FLEET, SIZE, type Action, type Cell, type GameState, type Seat, type Ship, type Shot } from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

/** Partida nova. Com `prev` (o "De novo"), mantém o placar e inverte quem começa. */
export function newGame(rng: () => number = Math.random, prev?: GameState | null): GameState {
  const starter: Seat = prev ? ((1 - prev.starter) as Seat) : rng() < 0.5 ? 0 : 1;
  return {
    phase: "placing",
    fleets: [null, null],
    turn: starter,
    starter,
    shots: [],
    winner: null,
    scores: prev ? [...prev.scores] : [0, 0],
    gameNo: (prev?.gameNo ?? 0) + 1,
  };
}

export const inBounds = (col: number, row: number) =>
  Number.isInteger(col) && Number.isInteger(row) && col >= 0 && col < SIZE && row >= 0 && row < SIZE;

/** Casas ocupadas pelo navio `index` posicionado em `ship`. */
export function shipCells(ship: Ship, index: number): Cell[] {
  const size = FLEET[index].size;
  return Array.from({ length: size }, (_, k) =>
    ship.dir === "h" ? { col: ship.col + k, row: ship.row } : { col: ship.col, row: ship.row + k },
  );
}

export const shipFits = (ship: Ship, index: number) =>
  (ship.dir === "h" || ship.dir === "v") && shipCells(ship, index).every((c) => inBounds(c.col, c.row));

/** Problema na frota, ou null se ela é válida (tamanho certo, dentro do mar, sem sobrepor). */
export function fleetError(ships: unknown): string | null {
  if (!Array.isArray(ships) || ships.length !== FLEET.length) return "Frota incompleta";
  const used = new Set<number>();
  for (let i = 0; i < FLEET.length; i++) {
    const s = ships[i] as Ship;
    if (!s || typeof s !== "object" || !shipFits(s, i)) return "Navio fora do mar";
    for (const c of shipCells(s, i)) {
      const key = c.row * SIZE + c.col;
      if (used.has(key)) return "Navios sobrepostos";
      used.add(key);
    }
  }
  return null;
}

/** Frota sorteada (do maior para o menor, tentando posições até caber). */
export function randomFleet(rng: () => number = Math.random): Ship[] {
  for (;;) {
    const ships: Ship[] = [];
    const used = new Set<number>();
    let ok = true;
    for (let i = 0; i < FLEET.length && ok; i++) {
      ok = false;
      for (let tries = 0; tries < 200; tries++) {
        const dir = rng() < 0.5 ? "h" : "v";
        const len = FLEET[i].size;
        const ship: Ship = {
          dir,
          col: Math.floor(rng() * (dir === "h" ? SIZE - len + 1 : SIZE)),
          row: Math.floor(rng() * (dir === "v" ? SIZE - len + 1 : SIZE)),
        };
        const cells = shipCells(ship, i).map((c) => c.row * SIZE + c.col);
        if (cells.some((k) => used.has(k))) continue;
        cells.forEach((k) => used.add(k));
        ships.push(ship);
        ok = true;
        break;
      }
    }
    if (ok) return ships;
  }
}

/** O navio `index` cabe em `ship` sem sair do mar nem sobrepor os outros da frota. */
export function canPlaceShip(ships: Ship[], index: number, ship: Ship): boolean {
  if (!shipFits(ship, index)) return false;
  const mine = new Set(shipCells(ship, index).map((c) => c.row * SIZE + c.col));
  return !ships.some((s, j) => j !== index && shipCells(s, j).some((c) => mine.has(c.row * SIZE + c.col)));
}

/** Casa do meio do navio (nos de tamanho par, a de antes do meio): o eixo padrão do giro. */
export const middleCell = (index: number) => Math.floor((FLEET[index].size - 1) / 2);

/**
 * Navio `index` girado 90° em volta da sua casa `pivot` (0 = ponta). Girar duas vezes volta ao lugar.
 * Se não couber ali, vai para a posição livre mais próxima (até `reach` casas de distância); sem nenhuma, null.
 */
export function turnShip(ships: Ship[], index: number, pivot = middleCell(index), reach = 2): Ship | null {
  const s = ships[index];
  const want: Ship = s.dir === "h" ? { dir: "v", col: s.col + pivot, row: s.row - pivot } : { dir: "h", col: s.col - pivot, row: s.row + pivot };
  if (canPlaceShip(ships, index, want)) return want;
  let best: Ship | null = null;
  let bestDist = Infinity;
  for (let dr = -reach; dr <= reach; dr++) {
    for (let dc = -reach; dc <= reach; dc++) {
      const d = Math.abs(dc) + Math.abs(dr);
      if (d === 0 || d > reach) continue;
      const ship = { ...want, col: want.col + dc, row: want.row + dr };
      // empate de distância: prefere andar ao longo do navio (parece o mesmo giro, só empurrado)
      const along = want.dir === "h" ? Math.abs(dr) : Math.abs(dc);
      const score = d + along * 0.1;
      if (score < bestDist && canPlaceShip(ships, index, ship)) {
        best = ship;
        bestDist = score;
      }
    }
  }
  return best;
}

/** Índice do navio de `fleet` que ocupa a casa, ou -1. */
export function shipAt(fleet: Ship[], col: number, row: number): number {
  return fleet.findIndex((s, i) => shipCells(s, i).some((c) => c.col === col && c.row === row));
}

/** Tiros que `seat` já deu. */
export const shotsBy = (shots: Shot[], seat: Seat) => shots.filter((s) => s.seat === seat);

export function applyAction(state: GameState, action: Action): Result {
  if (state.phase === "gameOver") return { ok: false, error: "Partida encerrada" };

  if (action.type === "place") {
    if (state.phase !== "placing") return { ok: false, error: "A batalha já começou" };
    if (state.fleets[action.seat]) return { ok: false, error: "Frota já confirmada" };
    const err = fleetError(action.ships);
    if (err) return { ok: false, error: err };
    const s = structuredClone(state);
    s.fleets[action.seat] = action.ships.map(({ col, row, dir }) => ({ col, row, dir }));
    if (s.fleets[0] && s.fleets[1]) {
      s.phase = "battle";
      s.turn = s.starter;
    }
    return { ok: true, state: s };
  }

  if (action.type === "shoot") {
    if (state.phase !== "battle") return { ok: false, error: "Posicione a frota" };
    if (action.seat !== state.turn) return { ok: false, error: "Não é sua vez" };
    const { col, row } = action;
    if (!inBounds(col, row)) return { ok: false, error: "Fora do mar" };
    if (state.shots.some((s) => s.seat === action.seat && s.col === col && s.row === row)) {
      return { ok: false, error: "Casa já atingida" };
    }

    const s = structuredClone(state);
    const enemy = s.fleets[1 - action.seat]!;
    const index = shipAt(enemy, col, row);
    const shot: Shot = { col, row, seat: action.seat, hit: index >= 0, sunk: null };
    s.shots.push(shot);

    if (index < 0) {
      s.turn = (1 - action.seat) as Seat;
      return { ok: true, state: s };
    }
    const mine = shotsBy(s.shots, action.seat);
    const sunk = shipCells(enemy[index], index).every((c) => mine.some((t) => t.col === c.col && t.row === c.row));
    if (sunk) shot.sunk = index;
    const allSunk = mine.filter((t) => t.sunk !== null).length === FLEET.length;
    if (allSunk) {
      s.phase = "gameOver";
      s.winner = action.seat;
      s.scores[action.seat]++;
    }
    return { ok: true, state: s };
  }

  return { ok: false, error: "Ação inválida" };
}
