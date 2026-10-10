import { canStop, categoryDefs, categoryPoints, isAnnulled, letterOf, matchesLetter } from "./rules";
import type { GameState, PlayerView, Seat } from "./types";

/** O que um jogador vê: as próprias respostas e, antes do STOP, só o progresso dos outros. */
export function viewFor(state: GameState, seat: Seat): PlayerView {
  const s = structuredClone(state);
  const letter = letterOf(s);
  const revealed = s.phase !== "letter" && s.phase !== "writing";
  const reviewing = s.phase === "review";
  const cat = s.review;

  return {
    seat,
    gameNo: s.gameNo,
    settings: s.settings,
    categories: categoryDefs(s.settings),
    players: s.players,
    away: s.away,
    round: s.round,
    letter: s.phase === "letter" ? null : letter,
    phase: s.phase,
    phaseNo: s.phaseNo,
    myAnswers: s.answers[seat] ?? [],
    progress: Object.fromEntries(s.players.map((p) => [p, (s.answers[p] ?? []).filter((a) => matchesLetter(a, letter)).length])),
    answers: revealed ? s.answers : null,
    stoppedBy: s.stoppedBy,
    review: cat,
    votes: reviewing ? Object.fromEntries(s.players.map((p) => [p, s.votes[cat]?.[p] ?? []])) : null,
    annulled: reviewing ? Object.fromEntries(s.players.map((p) => [p, isAnnulled(s, cat, p)])) : null,
    points: reviewing ? categoryPoints(s, cat) : null,
    votable: reviewing && s.players.includes(seat) ? s.players.filter((p) => p !== seat && matchesLetter(s.answers[p][cat], letter)) : [],
    ready: s.ready,
    history: s.history,
    scores: s.scores,
    canWrite: s.phase === "writing" && s.players.includes(seat),
    canStop: canStop(s, seat),
    canReady: (s.phase === "review" || s.phase === "roundEnd") && s.players.includes(seat) && !s.ready.includes(seat),
  };
}
