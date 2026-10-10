import type { GameState, KnownShip, PlayerView, Seat } from "./types";

/** O que `seat` pode ver: a própria frota, todos os tiros e só os navios inimigos afundados (todos no fim). */
export function viewFor(state: GameState, seat: Seat): PlayerView {
  const enemy = state.fleets[1 - seat];
  const sunk = new Set(state.shots.filter((s) => s.seat === seat && s.sunk !== null).map((s) => s.sunk!));
  const enemyShips: KnownShip[] = enemy
    ? enemy.flatMap((ship, index) =>
        sunk.has(index) || state.phase === "gameOver" ? [{ index, ship: { ...ship }, sunk: sunk.has(index) }] : [],
      )
    : [];
  return {
    seat,
    phase: state.phase,
    turn: state.turn,
    starter: state.starter,
    winner: state.winner,
    scores: [...state.scores],
    gameNo: state.gameNo,
    ready: [!!state.fleets[0], !!state.fleets[1]],
    myFleet: state.fleets[seat] ? structuredClone(state.fleets[seat]) : null,
    shots: structuredClone(state.shots),
    enemyShips,
    canPlace: state.phase === "placing" && !state.fleets[seat],
    canShoot: state.phase === "battle" && state.turn === seat,
  };
}
