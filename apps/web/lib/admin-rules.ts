import { prevDay } from "@/lib/stats/achievements";
import { DAILY_GAMES, dailyDay, type DailyGame } from "@/lib/daily/challenge";
import { STAT_GAMES, type Mode, type StatGame } from "@/lib/stats/games";

// Contas do admin sobre linhas já lidas do banco (sem banco aqui, para testar). O banco fica em lib/admin-stats.ts.

/** Os `n` dias até `today` (AAAA-MM-DD), do mais antigo ao mais novo. */
export function lastDays(today: string, n: number): string[] {
  const out = [today];
  while (out.length < n) out.unshift(prevDay(out[0]));
  return out;
}

/** Valor de cada dia de `days` (0 nos que não vieram). */
export function fillDays(rows: { day: string; n: number }[], days: string[]): number[] {
  const by = new Map(rows.map((r) => [r.day, r.n]));
  return days.map((d) => by.get(d) ?? 0);
}

/** Jogos que só mandam vitória (ver lib/stats/solo-result.ts): % de vitórias não diz nada neles. */
export const WINS_ONLY: readonly string[] = ["sudoku", "paciencia-spider", "caca-palavras"];

/** 0–100, arredondado; null sem base. */
export const pct = (part: number, total: number): number | null => (total > 0 ? Math.round((part / total) * 100) : null);

export interface OutcomeCount {
  win: number;
  loss: number;
  draw: number;
}

export interface GameSummary {
  game: StatGame;
  /** partidas (uma por mesa, não por jogador) */
  matches: number;
  byMode: Record<Mode, number>;
  players: number;
  /** resultado de quem jogou contra a IA (ou sozinho, nos jogos solo) */
  house: OutcomeCount;
}

export type MatchRow = { game: string; mode: string; n: number };
export type OutcomeRow = { game: string; outcome: string; n: number };
export type PlayerRow = { game: string; n: number };

/** Um resumo por jogo, na ordem do perfil, só dos jogos que tiveram partida. Mais jogados primeiro. */
export function summarizeGames(matches: MatchRow[], house: OutcomeRow[], players: PlayerRow[]): GameSummary[] {
  const by = new Map<string, GameSummary>(
    STAT_GAMES.map((game) => [game, { game, matches: 0, byMode: { solo: 0, ai: 0, online: 0 }, players: 0, house: { win: 0, loss: 0, draw: 0 } }]),
  );
  for (const r of matches) {
    const s = by.get(r.game);
    if (s && r.mode in s.byMode) {
      s.byMode[r.mode as Mode] += r.n;
      s.matches += r.n;
    }
  }
  for (const r of house) {
    const s = by.get(r.game);
    if (s && r.outcome in s.house) s.house[r.outcome as keyof OutcomeCount] += r.n;
  }
  for (const r of players) {
    const s = by.get(r.game);
    if (s) s.players = r.n;
  }
  return [...by.values()].filter((s) => s.matches > 0).sort((a, b) => b.matches - a.matches);
}

export interface DailyCell {
  /** quem terminou ao menos uma partida do desafio */
  players: number;
  /** partidas terminadas (no Verbete, uma por modo) */
  plays: number;
  wins: number;
  /** tempo médio de quem venceu (ms), sem o Verbete */
  avgMs: number | null;
}

export type DailyRow = { game: string; daily: string; userId: string; outcome: string; timeMs: number | null };

/** Desafios por dia (mais novo primeiro), com uma célula por jogo diário. */
export function summarizeDailies(rows: DailyRow[], days: string[]): { day: string; games: Record<DailyGame, DailyCell> }[] {
  const acc = new Map<string, { users: Set<string>; plays: number; wins: number; ms: number[] }>();
  for (const r of rows) {
    const key = `${r.game}|${dailyDay(r.daily)}`;
    let a = acc.get(key);
    if (!a) acc.set(key, (a = { users: new Set(), plays: 0, wins: 0, ms: [] }));
    a.users.add(r.userId);
    a.plays++;
    if (r.outcome === "win") {
      a.wins++;
      if (r.timeMs && r.timeMs > 0) a.ms.push(r.timeMs);
    }
  }
  return [...days].reverse().map((day) => ({
    day,
    games: Object.fromEntries(
      DAILY_GAMES.map((g) => {
        const a = acc.get(`${g}|${day}`);
        const cell: DailyCell = a
          ? { players: a.users.size, plays: a.plays, wins: a.wins, avgMs: a.ms.length ? Math.round(a.ms.reduce((x, y) => x + y, 0) / a.ms.length) : null }
          : { players: 0, plays: 0, wins: 0, avgMs: null };
        return [g, cell];
      }),
    ) as Record<DailyGame, DailyCell>,
  }));
}

/** "Chrome · Windows" a partir do user agent (só o suficiente para reconhecer o aparelho). */
export function deviceLabel(ua: string | null | undefined): string {
  if (!ua) return "—";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /SamsungBrowser\//.test(ua)
          ? "Samsung"
          : /Chrome\/|CriOS\//.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : null;
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iPod/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : null;
  return [browser, os].filter(Boolean).join(" · ") || "Outro";
}
