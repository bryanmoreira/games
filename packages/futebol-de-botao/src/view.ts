import type { Disc, GameState, Player, PlayerView } from "./types";

// duas casas bastam para desenhar e deixam a mensagem bem menor (vai 30 vezes por segundo)
const r2 = (n: number) => Math.round(n * 100) / 100;
const disc = (d: Disc): Disc => ({ x: r2(d.x), y: r2(d.y), vx: r2(d.vx), vy: r2(d.vy) });

/** Visão de um lugar (ou de quem assiste, `seat` null). Nada é escondido. */
export function viewFor(s: GameState, seat: number | null): PlayerView {
  return {
    me: seat,
    tick: s.tick,
    phase: s.phase,
    wait: s.wait,
    timeLeft: s.timeLeft,
    golden: s.golden,
    score: s.score,
    kickoffTeam: s.kickoffTeam,
    ball: disc(s.ball),
    players: s.players.map((p): Player => ({ ...p, ...disc(p) })),
    goals: s.goals,
    winner: s.winner,
    kicks: s.kicks,
    posts: s.posts,
  };
}
