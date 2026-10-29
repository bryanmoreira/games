import { attempts, bestBefore, CLOSEST, closest, freeSecret, guess, hint, hintsUsed, replay, status, type GameState } from "@mesa/quente-ou-frio";
import { getChallenge } from "@/lib/daily/db";
import type { Outcome } from "@/lib/stats/games";
import { getModel } from "./model";
import type { PlayRequest, PlayResponse, Reveal } from "./protocol";

/** Resultado para o perfil, quando a jogada termina a partida. */
export interface Finished {
  outcome: Outcome;
  data: Record<string, unknown>;
  /** dia do desafio, para contar uma vez por jogador */
  daily: string | null;
}

/** Palavra secreta da partida (a do dia vem do banco), ou null se o dia não tem desafio. */
async function secretOf(req: PlayRequest): Promise<{ word: string; day: string | null } | null> {
  if ("id" in req.game) return { word: freeSecret(req.game.id), day: null };
  const ch = await getChallenge("quente-ou-frio", req.game.day);
  return ch?.game === "quente-ou-frio" ? { word: ch.data.word, day: ch.day } : null;
}

function finished(s: GameState, req: PlayRequest, day: string | null): Finished {
  return {
    outcome: status(s) === "won" ? "win" : "loss",
    daily: day,
    data: {
      mode: day ? "daily" : "free",
      attempts: attempts(s),
      hints: hintsUsed(s),
      best: Number.isFinite(bestBefore(s)) ? bestBefore(s) : null,
      ...("id" in req.game ? { gid: req.game.id } : {}),
    },
  };
}

/** Joga um pedido. `status` 400 = pedido inválido (movimentos que não batem com a partida). */
export async function play(req: PlayRequest): Promise<{ status: number; body: PlayResponse | { error: "invalid" }; finished?: Finished }> {
  const invalid = { status: 400, body: { error: "invalid" as const } };
  const secret = await secretOf(req);
  const model = getModel();
  const si = secret && model.indexOf(secret.word);
  if (!secret || si === null || si === undefined) return invalid;
  const s = replay(model, si, req.moves, req.gaveUp);
  if (!s) return invalid;
  const reveal = (): Reveal => ({ closest: closest(model, si, CLOSEST), total: model.size });

  if (req.action === "end") return status(s) === "playing" ? invalid : { status: 200, body: { end: reveal() } };

  if (req.action === "giveup") {
    if (status(s) !== "playing") return invalid;
    const over = { ...s, gaveUp: true };
    return { status: 200, body: { end: reveal() }, finished: finished(over, req, secret.day) };
  }

  if (req.action === "hint") {
    const r = hint(model, si, s);
    if (!r.ok) return { status: 200, body: { error: "none" } };
    return { status: 200, body: { move: r.move, total: model.size } };
  }

  const r = guess(model, si, s, req.word!);
  if (!r.ok) return { status: 200, body: { error: r.error, word: r.word } };
  if (status(r.state) === "won") return { status: 200, body: { move: r.move, total: model.size, end: reveal() }, finished: finished(r.state, req, secret.day) };
  return { status: 200, body: { move: r.move, total: model.size } };
}
