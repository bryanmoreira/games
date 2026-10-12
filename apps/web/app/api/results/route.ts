import { headers } from "next/headers";
import { DIFFICULTIES } from "@truco/sudoku";
import { auth } from "@/lib/auth";
import { recordResults } from "@/lib/stats/record";

const int = (v: unknown, min: number, max: number) => (Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : null);

/** Dados de uma vitória solo (Sudoku/Spider), validados. null = inválido. */
function parse(game: unknown, raw: unknown): { game: "sudoku" | "paciencia-spider"; data: Record<string, unknown> } | null {
  const d = (raw ?? {}) as Record<string, unknown>;
  const timeMs = int(d.timeMs, 1000, 24 * 60 * 60 * 1000);
  if (timeMs === null) return null;
  if (game === "sudoku") {
    const mistakes = int(d.mistakes, 0, 99);
    const hints = int(d.hints, 0, 81);
    if (!DIFFICULTIES.includes(d.difficulty as never) || mistakes === null || hints === null) return null;
    return { game, data: { difficulty: d.difficulty, timeMs, mistakes, hints } };
  }
  if (game === "paciencia-spider") {
    const suits = int(d.suits, 1, 4);
    const moves = int(d.moves, 1, 100_000);
    const score = int(d.score, -100_000, 2000);
    if (suits === null || ![1, 2, 4].includes(suits) || moves === null || score === null) return null;
    return { game, data: { suits, moves, score, timeMs } };
  }
  return null;
}

/** Vitória num jogo solo, mandada pelo navegador. */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = parse(body?.game, body?.data);
  if (!parsed) return Response.json({ error: "inválido" }, { status: 400 });
  const unlocked = await recordResults(parsed.game, "solo", null, [{ userId: session.user.id, outcome: "win", data: parsed.data }]);
  const fresh = unlocked.get(session.user.id) ?? [];
  return Response.json({ achievements: fresh.map(({ code, title, desc, icon }) => ({ code, title, desc, icon })) });
}
