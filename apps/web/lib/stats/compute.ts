import { bestStreak, currentStreak, type ResultRow } from "@/lib/stats/achievements";
import { STAT_GAMES, type StatGame } from "@/lib/stats/games";

// Cálculos do perfil sobre linhas já lidas do banco (sem banco aqui, para testar).

export interface ModeStats {
  games: number;
  wins: number;
  losses: number;
  draws: number;
  /** aproveitamento: vitórias / partidas, 0–100 */
  pct: number;
  streak: number;
  bestStreak: number;
}

export interface Chip {
  label: string;
  value: string;
}

/** Tabela de recordes por variante (níveis do Sudoku, naipes do Spider). */
export interface RecordTable {
  cols: string[];
  rows: { label: string; values: (string | null)[] }[];
}

export interface GameStats {
  game: StatGame;
  /** Online e contra IA, separados (jogos solo não têm). */
  modes: { online?: ModeStats; ai?: ModeStats };
  wins: number;
  chips: Chip[];
  table?: RecordTable;
}

export interface Rivalry {
  me: number;
  them: number;
  games: { game: StatGame; me: number; them: number }[];
}

/** Linha de uma partida em comum entre dois jogadores (eu = a, o outro = b). */
export interface RivalryRow {
  game: string;
  mine: string;
  theirs: string;
  myPlace: number | null;
  theirPlace: number | null;
}

const LEVELS: [string, string][] = [
  ["easy", "Fácil"],
  ["medium", "Médio"],
  ["hard", "Difícil"],
  ["expert", "Expert"],
];

const num = (r: ResultRow, k: string) => Number(r.data[k] ?? NaN);
const isWin = (r: ResultRow) => r.outcome === "win";

export function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0");
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const minOf = (xs: number[]) => (xs.length ? Math.min(...xs) : null);
const maxOf = (xs: number[]) => (xs.length ? Math.max(...xs) : null);

export function modeStats(rs: ResultRow[]): ModeStats | undefined {
  if (!rs.length) return undefined;
  const wins = rs.filter(isWin).length;
  const draws = rs.filter((r) => r.outcome === "draw").length;
  return {
    games: rs.length,
    wins,
    losses: rs.length - wins - draws,
    draws,
    pct: Math.round((wins / rs.length) * 100),
    streak: currentStreak(rs),
    bestStreak: bestStreak(rs),
  };
}

export function gameStats(game: StatGame, rs: ResultRow[]): GameStats {
  const wins = rs.filter(isWin);
  const stats: GameStats = {
    game,
    modes: { online: modeStats(rs.filter((r) => r.mode === "online")), ai: modeStats(rs.filter((r) => r.mode === "ai")) },
    wins: wins.length,
    chips: [],
  };
  const chip = (label: string, value: string | number | null) => value !== null && stats.chips.push({ label, value: String(value) });

  switch (game) {
    case "connect4":
      chip("Vitória mais rápida", ((n) => (n === null ? null : `${n} peças`))(minOf(wins.map((r) => num(r, "pieces")).filter(Number.isFinite))));
      break;
    case "batalha-naval": {
      const acc = wins.filter((r) => num(r, "shots") > 0).map((r) => num(r, "hits") / num(r, "shots"));
      chip("Melhor mira", ((x) => (x === null ? null : `${Math.round(x * 100)}%`))(maxOf(acc)));
      chip("Menos tiros", minOf(wins.map((r) => num(r, "shots")).filter(Number.isFinite)));
      break;
    }
    case "stop": {
      const placed = rs.filter((r) => r.placement !== null && !r.data.abandoned);
      chip("Melhor pontuação", maxOf(rs.map((r) => num(r, "score")).filter(Number.isFinite)));
      if (placed.length) chip("Colocação média", `${(placed.reduce((n, r) => n + r.placement!, 0) / placed.length).toFixed(1).replace(".", ",")}º`);
      chip("Respostas únicas", rs.reduce((n, r) => n + (num(r, "unique") || 0), 0));
      break;
    }
    case "codenames":
      chip("Vitórias como mestre", wins.filter((r) => r.data.role === "master").length);
      chip("Vitórias como agente", wins.filter((r) => r.data.role === "agent").length);
      chip("Assassino", rs.filter((r) => r.data.assassin === true).length);
      break;
    case "sudoku":
      stats.table = {
        cols: ["Vitórias", "Melhor tempo", "Perfeitas"],
        rows: LEVELS.map(([k, label]) => {
          const w = wins.filter((r) => r.data.difficulty === k);
          const best = minOf(w.map((r) => num(r, "timeMs")).filter(Number.isFinite));
          return {
            label,
            values: [String(w.length), best === null ? null : formatMs(best), String(w.filter((r) => num(r, "mistakes") === 0 && num(r, "hints") === 0).length)],
          };
        }),
      };
      break;
    case "paciencia-spider":
      stats.table = {
        cols: ["Vitórias", "Melhor tempo", "Pontos", "Jogadas"],
        rows: [1, 2, 4].map((suits) => {
          const w = wins.filter((r) => num(r, "suits") === suits);
          const best = minOf(w.map((r) => num(r, "timeMs")).filter(Number.isFinite));
          const score = maxOf(w.map((r) => num(r, "score")).filter(Number.isFinite));
          const moves = minOf(w.map((r) => num(r, "moves")).filter(Number.isFinite));
          return {
            label: `${suits} naipe${suits > 1 ? "s" : ""}`,
            values: [String(w.length), best === null ? null : formatMs(best), score === null ? null : String(score), moves === null ? null : String(moves)],
          };
        }),
      };
      break;
  }
  return stats;
}

/** Separa os resultados (já em ordem) por jogo e calcula as estatísticas na ordem da tela. */
export function statsByGame(results: (ResultRow & { game: string })[]): GameStats[] {
  const byGame = new Map<string, ResultRow[]>();
  for (const r of results) {
    const list = byGame.get(r.game) ?? [];
    list.push(r);
    byGame.set(r.game, list);
  }
  return STAT_GAMES.filter((g) => byGame.has(g)).map((g) => gameStats(g, byGame.get(g)!));
}

/** Placar nas partidas em comum: colocação decide (quem abandonou não tem e perde); sem colocação, vitória contra derrota. */
export function computeRivalry(rows: RivalryRow[]): Rivalry {
  const per = new Map<string, { me: number; them: number }>();
  for (const r of rows) {
    const score = per.get(r.game) ?? { me: 0, them: 0 };
    if (r.myPlace !== null && r.theirPlace !== null) {
      if (r.myPlace < r.theirPlace) score.me++;
      else if (r.theirPlace < r.myPlace) score.them++;
    }
    // Stop: quem abandona fica sem colocação e perde para quem terminou
    else if (r.myPlace !== null) score.me++;
    else if (r.theirPlace !== null) score.them++;
    else if (r.mine === "win" && r.theirs === "loss") score.me++;
    else if (r.theirs === "win" && r.mine === "loss") score.them++;
    per.set(r.game, score);
  }
  const games = STAT_GAMES.flatMap((g) => {
    const s = per.get(g);
    return s && s.me + s.them > 0 ? [{ game: g, ...s }] : [];
  });
  return { me: games.reduce((n, g) => n + g.me, 0), them: games.reduce((n, g) => n + g.them, 0), games };
}
