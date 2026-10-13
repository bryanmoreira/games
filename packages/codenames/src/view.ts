import { canClue, canGuess, canPass, remaining, roleOf, teamOf } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

/**
 * O que um jogador vê: o mestre vê o mapa inteiro; o agente, só a cor das palavras reveladas. No fim, todos veem tudo.
 * `seat` null = espectador (sem lugar na partida): vê como um agente e não age.
 */
export function viewFor(state: GameState, seat: Seat | null): PlayerView {
  const s = structuredClone(state);
  const spectator = seat === null;
  const role = spectator ? "agent" : roleOf(seat);
  const all = role === "master" || s.phase === "gameOver";
  return {
    seat: seat ?? -1,
    team: spectator ? s.turn : teamOf(seat),
    role,
    spectator,
    gameNo: s.gameNo,
    time: s.settings.time,
    players: s.players,
    cards: s.cards.map((c) => ({ word: c.word, key: all || c.revealed ? c.key : null, revealed: c.revealed })),
    starter: s.starter,
    turn: s.turn,
    phase: s.phase,
    phaseNo: s.phaseNo,
    clues: s.clues,
    clue: s.phase === "guess" ? (s.clues.at(-1) ?? null) : null,
    guessesLeft: s.guessesLeft,
    marks: s.marks,
    last: s.last,
    timeout: s.timeout,
    left: [remaining(s, 0), remaining(s, 1)],
    winner: s.winner,
    reason: s.reason,
    canClue: !spectator && canClue(s, seat),
    canGuess: !spectator && canGuess(s, seat),
    canPass: !spectator && canPass(s, seat),
  };
}
