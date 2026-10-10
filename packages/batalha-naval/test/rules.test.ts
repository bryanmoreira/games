import { describe, expect, test } from "bun:test";
import {
  applyAction,
  decide,
  fleetError,
  FLEET,
  heatMap,
  newGame,
  randomFleet,
  shipCells,
  turnShip,
  canPlaceShip,
  SIZE,
  viewFor,
  type GameState,
  type Seat,
  type Ship,
} from "../src";

/** rng determinístico (mulberry32) */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uma linha por navio, encostados, a partir da coluna 0: linhas 0 a 4. */
const ROWS_FLEET: Ship[] = FLEET.map((_, i) => ({ col: 0, row: i, dir: "h" }));

function ok(s: GameState, a: Parameters<typeof applyAction>[1]): GameState {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

/** Batalha começando com o lugar 0, as duas frotas em `ROWS_FLEET`. */
function battle(): GameState {
  let s = { ...newGame(), starter: 0 as Seat };
  s = ok(s, { type: "place", seat: 0, ships: ROWS_FLEET });
  s = ok(s, { type: "place", seat: 1, ships: ROWS_FLEET });
  return s;
}

const shoot = (s: GameState, seat: Seat, col: number, row: number) => ok(s, { type: "shoot", seat, col, row });

describe("posicionamento", () => {
  test("frota válida, inclusive com navios encostados", () => {
    expect(fleetError(ROWS_FLEET)).toBeNull();
    const touching: Ship[] = [
      { col: 0, row: 0, dir: "v" },
      { col: 1, row: 0, dir: "v" },
      { col: 2, row: 0, dir: "v" },
      { col: 3, row: 3, dir: "h" },
      { col: 3, row: 4, dir: "h" },
    ];
    expect(fleetError(touching)).toBeNull();
  });

  test("frota inválida", () => {
    expect(fleetError(ROWS_FLEET.slice(1))).toBe("Frota incompleta");
    expect(fleetError(null)).toBe("Frota incompleta");
    const out = ROWS_FLEET.map((s, i) => (i === 0 ? { ...s, col: 6 } : s));
    expect(fleetError(out)).toBe("Navio fora do mar");
    const down = ROWS_FLEET.map((s, i) => (i === 1 ? { col: 9, row: 7, dir: "v" as const } : s));
    expect(fleetError(down)).toBe("Navio fora do mar");
    const neg = ROWS_FLEET.map((s, i) => (i === 4 ? { ...s, col: -1 } : s));
    expect(fleetError(neg)).toBe("Navio fora do mar");
    const frac = ROWS_FLEET.map((s, i) => (i === 4 ? { ...s, col: 0.5 } : s));
    expect(fleetError(frac)).toBe("Navio fora do mar");
    const bad = ROWS_FLEET.map((s, i) => (i === 4 ? { ...s, dir: "x" as "h" } : s));
    expect(fleetError(bad)).toBe("Navio fora do mar");
    const over = ROWS_FLEET.map((s, i) => (i === 1 ? { col: 2, row: 0, dir: "v" as const } : s));
    expect(fleetError(over)).toBe("Navios sobrepostos");
  });

  test("frota sorteada é sempre válida", () => {
    const rng = seeded(3);
    for (let i = 0; i < 500; i++) expect(fleetError(randomFleet(rng))).toBeNull();
  });

  test("girar em volta da casa do meio e girar de novo volta ao lugar", () => {
    const ships: Ship[] = [
      { col: 2, row: 4, dir: "h" }, // porta-aviões: casas 2..6, meio na coluna 4
      { col: 0, row: 0, dir: "h" },
      { col: 0, row: 9, dir: "h" },
      { col: 9, row: 0, dir: "v" },
      { col: 7, row: 9, dir: "h" },
    ];
    const turned = turnShip(ships, 0)!;
    expect(turned).toEqual({ col: 4, row: 2, dir: "v" });
    const back = turnShip(ships.map((s, i) => (i === 0 ? turned : s)), 0);
    expect(back).toEqual(ships[0]);
    // destróier (tamanho par): eixo na primeira casa
    expect(turnShip([...ships.slice(0, 4), { col: 4, row: 7, dir: "h" }], 4)).toEqual({ col: 4, row: 7, dir: "v" });
  });

  test("girar na borda ou encostado empurra para a posição livre mais próxima", () => {
    const ships: Ship[] = [
      { col: 0, row: 0, dir: "h" }, // em pé ficaria com linhas -2..2: desce para 0..4
      { col: 0, row: 9, dir: "h" },
      { col: 4, row: 2, dir: "v" },
      { col: 9, row: 0, dir: "v" },
      { col: 7, row: 9, dir: "h" },
    ];
    expect(turnShip(ships, 0)).toEqual({ col: 2, row: 0, dir: "v" });
    expect(fleetError(ships.map((s, i) => (i === 0 ? turnShip(ships, 0)! : s)))).toBeNull();
  });

  test("girar sem lugar livre perto não acontece", () => {
    // destróier deitado na linha 2, entre navios nas linhas 0, 1 e 3
    const ships: Ship[] = [
      { col: 0, row: 0, dir: "h" },
      { col: 0, row: 1, dir: "h" },
      { col: 0, row: 3, dir: "h" },
      { col: 5, row: 0, dir: "v" },
      { col: 0, row: 2, dir: "h" },
    ];
    // em pé no lugar bate no cruzador da linha 3; a 2 casas, desce para as linhas 4-5
    expect(turnShip(ships, 4)).toEqual({ col: 0, row: 4, dir: "v" });
    // sem poder empurrar, não gira
    expect(turnShip(ships, 4, 0, 0)).toBeNull();
    expect(turnShip(ships, 4, 0, 1)).toBeNull();
    expect(canPlaceShip(ships, 4, ships[4])).toBe(true);
  });

  test("os dois confirmam em qualquer ordem e a batalha começa com quem abre", () => {
    let s = { ...newGame(), starter: 1 as Seat };
    expect(s.phase).toBe("placing");
    expect(viewFor(s, 0).canPlace).toBe(true);
    s = ok(s, { type: "place", seat: 0, ships: ROWS_FLEET });
    expect(s.phase).toBe("placing");
    expect(viewFor(s, 0).canPlace).toBe(false);
    expect(viewFor(s, 1).ready).toEqual([true, false]);
    expect(applyAction(s, { type: "place", seat: 0, ships: ROWS_FLEET })).toEqual({ ok: false, error: "Frota já confirmada" });
    expect(applyAction(s, { type: "shoot", seat: 1, col: 0, row: 0 }).ok).toBe(false);
    s = ok(s, { type: "place", seat: 1, ships: ROWS_FLEET });
    expect(s.phase).toBe("battle");
    expect(s.turn).toBe(1);
    expect(applyAction(s, { type: "place", seat: 1, ships: ROWS_FLEET }).ok).toBe(false);
  });

  test("frota inválida não é aceita", () => {
    const s = newGame();
    expect(applyAction(s, { type: "place", seat: 0, ships: ROWS_FLEET.slice(2) }).ok).toBe(false);
  });
});

describe("batalha", () => {
  test("água passa a vez", () => {
    const s = shoot(battle(), 0, 9, 9);
    expect(s.shots.at(-1)).toEqual({ col: 9, row: 9, seat: 0, hit: false, sunk: null });
    expect(s.turn).toBe(1);
  });

  test("acerto atira de novo", () => {
    const s = shoot(battle(), 0, 0, 0);
    expect(s.shots.at(-1)?.hit).toBe(true);
    expect(s.turn).toBe(0);
  });

  test("fora da vez, fora do mar e casa repetida", () => {
    const s = battle();
    expect(applyAction(s, { type: "shoot", seat: 1, col: 0, row: 0 })).toEqual({ ok: false, error: "Não é sua vez" });
    expect(applyAction(s, { type: "shoot", seat: 0, col: 10, row: 0 }).ok).toBe(false);
    expect(applyAction(s, { type: "shoot", seat: 0, col: 1, row: -1 }).ok).toBe(false);
    expect(applyAction(s, { type: "shoot", seat: 0, col: 1.5, row: 1 }).ok).toBe(false);
    const hit = shoot(s, 0, 0, 0);
    expect(applyAction(hit, { type: "shoot", seat: 0, col: 0, row: 0 })).toEqual({ ok: false, error: "Casa já atingida" });
  });

  test("a mesma casa no mar de cada um vale para os dois", () => {
    let s = shoot(battle(), 0, 9, 9);
    s = shoot(s, 1, 9, 9);
    expect(s.turn).toBe(0);
  });

  test("não altera o estado original", () => {
    const s = battle();
    applyAction(s, { type: "shoot", seat: 0, col: 0, row: 0 });
    expect(s.shots).toEqual([]);
  });

  test("afunda o navio quando todas as casas são atingidas", () => {
    let s = battle();
    s = shoot(s, 0, 0, 4);
    expect(s.shots.at(-1)?.sunk).toBeNull();
    expect(viewFor(s, 0).enemyShips).toEqual([]);
    s = shoot(s, 0, 1, 4);
    expect(s.shots.at(-1)?.sunk).toBe(4);
    expect(viewFor(s, 0).enemyShips).toEqual([{ index: 4, ship: ROWS_FLEET[4], sunk: true }]);
    // o dono do navio não ganha informação nova sobre a frota de quem atirou
    expect(viewFor(s, 1).enemyShips).toEqual([]);
  });

  test("navios encostados afundam um de cada vez", () => {
    let s = battle();
    // destróier (linha 4, colunas 0-1) e submarino (linha 3, colunas 0-2) encostados
    s = shoot(s, 0, 0, 3);
    s = shoot(s, 0, 0, 4);
    s = shoot(s, 0, 1, 4);
    expect(s.shots.at(-1)?.sunk).toBe(4);
    expect(viewFor(s, 0).enemyShips.map((k) => k.index)).toEqual([4]);
  });

  test("afundar a frota inteira vence e soma o placar", () => {
    let s = battle();
    for (let i = 0; i < FLEET.length; i++) for (const c of shipCells(ROWS_FLEET[i], i)) s = shoot(s, 0, c.col, c.row);
    expect(s.phase).toBe("gameOver");
    expect(s.winner).toBe(0);
    expect(s.scores).toEqual([1, 0]);
    expect(s.shots.length).toBe(17);
    expect(applyAction(s, { type: "shoot", seat: 0, col: 9, row: 9 }).ok).toBe(false);
    // no fim, a frota inteira do adversário aparece (afundada ou não)
    expect(viewFor(s, 1).enemyShips.length).toBe(5);
    expect(viewFor(s, 1).enemyShips.every((k) => !k.sunk)).toBe(true);
    expect(viewFor(s, 0).canShoot).toBe(false);
  });

  test("De novo mantém o placar e alterna quem começa", () => {
    let s = battle();
    for (let i = 0; i < FLEET.length; i++) for (const c of shipCells(ROWS_FLEET[i], i)) s = shoot(s, 0, c.col, c.row);
    const next = newGame(Math.random, s);
    expect(next.scores).toEqual([1, 0]);
    expect(next.starter).toBe(1);
    expect(next.phase).toBe("placing");
    expect(next.fleets).toEqual([null, null]);
    expect(next.gameNo).toBe(s.gameNo + 1);
  });

  test("visão não revela a frota inimiga", () => {
    const s = battle();
    const v = viewFor(s, 0);
    expect(v.myFleet).toEqual(ROWS_FLEET);
    expect(v.enemyShips).toEqual([]);
    expect(JSON.stringify(v)).not.toContain("fleets");
    expect(v.canShoot).toBe(true);
    expect(viewFor(s, 1).canShoot).toBe(false);
  });
});

describe("IA", () => {
  test("posiciona uma frota válida", () => {
    const a = decide(viewFor(newGame(), 1));
    expect(a?.type).toBe("place");
    if (a?.type === "place") expect(fleetError(a.ships)).toBeNull();
  });

  test("depois de acertar, atira ao lado", () => {
    let s = battle();
    s = shoot(s, 0, 9, 9); // água: vez do 1
    s = shoot(s, 1, 4, 2); // água
    s = shoot(s, 0, 8, 8); // água
    s = shoot(s, 1, 2, 0); // acerta o porta-aviões do 0
    const a = decide(viewFor(s, 1), seeded(1));
    expect(a?.type).toBe("shoot");
    if (a?.type === "shoot") expect(Math.abs(a.col - 2) + Math.abs(a.row - 0)).toBe(1);
  });

  test("com dois acertos em linha, segue a linha", () => {
    let s = battle();
    s = shoot(s, 0, 1, 1); // encouraçado do 1 nas colunas 0-3
    s = shoot(s, 0, 2, 1);
    for (let i = 0; i < 20; i++) {
      const a = decide(viewFor(s, 0), seeded(i));
      expect(a?.type === "shoot" && a.row).toBe(1);
    }
  });

  test("nunca atira em casa repetida nem sem ser a vez", () => {
    const s = shoot(battle(), 0, 9, 9);
    expect(decide(viewFor(s, 0))).toBeNull();
    const heat = heatMap(viewFor(s, 1));
    expect(heat.length).toBe(SIZE * SIZE);
  });

  test("simulação: 300 partidas só com IAs terminam", () => {
    const rng = seeded(42);
    let total = 0;
    for (let g = 0; g < 300; g++) {
      let s = newGame(rng);
      let steps = 0;
      while (s.phase !== "gameOver") {
        const actor = s.phase === "placing" ? (s.fleets[0] ? 1 : 0) : s.turn;
        const a = decide(viewFor(s, actor), rng);
        expect(a).not.toBeNull();
        const r = applyAction(s, a!);
        expect(r.ok).toBe(true);
        if (r.ok) s = r.state;
        expect(++steps).toBeLessThanOrEqual(2 + 2 * SIZE * SIZE);
      }
      const winnerShots = s.shots.filter((t) => t.seat === s.winner).length;
      total += winnerShots;
      expect(winnerShots).toBeGreaterThanOrEqual(17);
      expect(viewFor(s, 0).canShoot || viewFor(s, 1).canShoot).toBe(false);
    }
    // tiro ao acaso precisa de ~95 tiros; caçar e perseguir fica bem abaixo
    expect(total / 300).toBeLessThan(55);
  }, 20_000);
});
