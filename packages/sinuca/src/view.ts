import { onEight, targetsFor } from "./rules";
import { teamOf, type GameState, type PlayerView } from "./types";

/** Na sinuca nada fica escondido: a visão é o estado mais o que vale para quem vê. */
export function viewFor(s: GameState, seat: number | null, now = Date.now()): PlayerView {
  const { deadline, ...rest } = s;
  const team = seat === null || !s.players.includes(seat) ? null : teamOf(seat);
  return {
    ...rest,
    seat,
    team,
    mine: team === null ? null : s.groups[team],
    myTurn: s.phase !== "over" && s.turn === seat,
    targets: s.phase === "over" ? [] : targetsFor(s, s.turn),
    onEight: s.phase === "play" && onEight(s, teamOf(s.turn)),
    timeLeft: deadline === null ? null : Math.max(0, deadline - now),
  };
}
