import { DIFFICULTIES } from "@truco/sudoku";
import { isMode, MAX_GUESSES } from "@truco/verbete";
import type { Mode, Outcome, StatGame } from "@/lib/stats/games";

/** Resultado como vem do banco (só o que as regras usam). */
export interface ResultRow {
  mode: Mode | string;
  outcome: Outcome | string;
  placement: number | null;
  data: Record<string, unknown>;
  /** dia do desafio diário (AAAA-MM-DD), se a partida foi um */
  daily?: string | null;
  createdAt: Date;
}

export type AchievementIcon = "trophy" | "star" | "bolt" | "flame" | "target" | "shield" | "crown" | "calendar" | "grid";

interface Ctx {
  /** Resultados deste jogo, do mais antigo ao mais novo. */
  results: ResultRow[];
  /** Maior sequência de dias seguidos jogando (todos os jogos). */
  bestDays: number;
}

export interface AchievementDef {
  code: string;
  game: StatGame | null;
  title: string;
  desc: string;
  icon: AchievementIcon;
  check(ctx: Ctx): boolean;
}

// ---------- ajudantes ----------

const num = (r: ResultRow, k: string) => Number(r.data[k] ?? NaN);
const isWin = (r: ResultRow) => r.outcome === "win";
const winsOf = (rs: ResultRow[]) => rs.filter(isWin);

/** Maior sequência de vitórias (empate e derrota quebram). */
export function bestStreak(rs: ResultRow[]): number {
  let best = 0;
  let cur = 0;
  for (const r of rs) {
    cur = isWin(r) ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  return best;
}

/** Sequência de vitórias que está valendo agora. */
export function currentStreak(rs: ResultRow[]): number {
  let n = 0;
  for (let i = rs.length - 1; i >= 0 && isWin(rs[i]); i--) n++;
  return n;
}

const wins = (game: StatGame, n: number, icon: AchievementIcon = n >= 100 ? "crown" : n >= 50 ? "star" : "trophy"): AchievementDef => ({
  code: `${game}:wins_${n}`,
  game,
  title: `${n} vitórias`,
  desc: `Vencer ${n} partidas`,
  icon,
  check: ({ results }) => winsOf(results).length >= n,
});

const first = (game: StatGame): AchievementDef => ({
  code: `${game}:first`,
  game,
  title: "Primeira vitória",
  desc: "Vencer a primeira partida",
  icon: "trophy",
  check: ({ results }) => results.some(isWin),
});

const streak5 = (game: StatGame): AchievementDef => ({
  code: `${game}:streak_5`,
  game,
  title: "Embalado",
  desc: "5 vitórias seguidas",
  icon: "flame",
  check: ({ results }) => bestStreak(results) >= 5,
});

/** Desafios diários vencidos. */
export const dailyWins = (rs: ResultRow[]) => rs.filter((r) => r.daily && isWin(r));

/** Dia de um desafio (o Verbete guarda o modo junto: `AAAA-MM-DD:2`). */
const dailyDay = (daily: string) => daily.slice(0, 10);

/** Sequência de desafios vencidos no próprio dia (rejogar um dia antigo não conta). */
export const dailyStreaks = (rs: ResultRow[]) =>
  dayStreaks(dailyWins(rs).flatMap((r) => (dayKey(r.createdAt) === dailyDay(r.daily!) ? [dailyDay(r.daily!)] : [])));

const daily = (game: StatGame): AchievementDef[] => [
  {
    code: `${game}:daily_first`,
    game,
    title: "Desafio do dia",
    desc: "Completar um desafio diário",
    icon: "calendar",
    check: ({ results }) => dailyWins(results).length > 0,
  },
  {
    code: `${game}:daily_week`,
    game,
    title: "Semana em dia",
    desc: "7 desafios seguidos, cada um no seu dia",
    icon: "flame",
    check: ({ results }) => dailyStreaks(results).best >= 7,
  },
  {
    code: `${game}:daily_30`,
    game,
    title: "30 desafios",
    desc: "Completar 30 desafios diários",
    icon: "crown",
    check: ({ results }) => dailyWins(results).length >= 30,
  },
];

const days = (n: number): AchievementDef => ({
  code: `days_${n}`,
  game: null,
  title: `${n} dias seguidos`,
  desc: `Jogar ${n} dias seguidos`,
  icon: "calendar",
  check: ({ bestDays }) => bestDays >= n,
});

// ---------- lista ----------

export const ACHIEVEMENTS: AchievementDef[] = [
  days(7),
  days(30),

  first("truco-paulista"),
  {
    code: "truco-paulista:shutout",
    game: "truco-paulista",
    title: "Pneu",
    desc: "Ganhar de 12 a 0",
    icon: "crown",
    check: ({ results }) => winsOf(results).some((r) => (r.data.scores as number[] | undefined)?.[1] === 0),
  },
  streak5("truco-paulista"),
  wins("truco-paulista", 10),
  wins("truco-paulista", 50),
  wins("truco-paulista", 100),

  first("connect4"),
  {
    code: "connect4:quick",
    game: "connect4",
    title: "Relâmpago",
    desc: "Vencer com só 4 peças",
    icon: "bolt",
    check: ({ results }) => winsOf(results).some((r) => num(r, "pieces") === 4),
  },
  {
    code: "connect4:ai_10",
    game: "connect4",
    title: "Mais esperto que a máquina",
    desc: "Vencer a IA 10 vezes",
    icon: "star",
    check: ({ results }) => winsOf(results).filter((r) => r.mode === "ai").length >= 10,
  },
  streak5("connect4"),

  first("otrio"),
  {
    code: "otrio:quick",
    game: "otrio",
    title: "Relâmpago",
    desc: "Vencer com só 3 peças da cor",
    icon: "bolt",
    check: ({ results }) => winsOf(results).some((r) => num(r, "colorPieces") === 3),
  },
  {
    code: "otrio:stack",
    game: "otrio",
    title: "Na mosca",
    desc: "Vencer com os 3 tamanhos na mesma casa",
    icon: "target",
    check: ({ results }) => winsOf(results).some((r) => r.data.how === "stack"),
  },
  {
    code: "otrio:stair",
    game: "otrio",
    title: "Escadinha",
    desc: "Vencer com pequena, média e grande em linha",
    icon: "star",
    check: ({ results }) => winsOf(results).some((r) => r.data.how === "stair"),
  },
  {
    code: "otrio:all_kinds",
    game: "otrio",
    title: "Trinca completa",
    desc: "Vencer em linha, em escada e no alvo",
    icon: "crown",
    check: ({ results }) => ["line", "stair", "stack"].every((k) => winsOf(results).some((r) => r.data.how === k)),
  },
  {
    code: "otrio:full_table",
    game: "otrio",
    title: "Rei da mesa",
    desc: "Vencer uma partida com 4 jogadores",
    icon: "shield",
    check: ({ results }) => winsOf(results).some((r) => num(r, "players") === 4),
  },
  streak5("otrio"),

  first("jogo-da-velha"),
  {
    code: "jogo-da-velha:fork",
    game: "jogo-da-velha",
    title: "Garfo",
    desc: "Vencer depois de ameaçar duas linhas de uma vez",
    icon: "bolt",
    check: ({ results }) => winsOf(results).some((r) => r.data.fork === true),
  },
  {
    code: "jogo-da-velha:second",
    game: "jogo-da-velha",
    title: "De trás pra frente",
    desc: "Vencer a IA no Médio ou no Impossível jogando de O",
    icon: "star",
    check: ({ results }) =>
      winsOf(results).some((r) => r.mode === "ai" && r.data.starter === false && (r.data.level === "medium" || r.data.level === "hard")),
  },
  {
    code: "jogo-da-velha:wall",
    game: "jogo-da-velha",
    title: "Muralha",
    desc: "Empatar 5 vezes com a IA no Impossível",
    icon: "shield",
    check: ({ results }) => results.filter((r) => r.outcome === "draw" && r.mode === "ai" && r.data.level === "hard").length >= 5,
  },
  {
    code: "jogo-da-velha:draws_10",
    game: "jogo-da-velha",
    title: "Deu velha!",
    desc: "Empatar 10 partidas",
    icon: "grid",
    check: ({ results }) => results.filter((r) => r.outcome === "draw").length >= 10,
  },
  streak5("jogo-da-velha"),

  first("xadrez"),
  {
    code: "xadrez:blitz",
    game: "xadrez",
    title: "Relâmpago",
    desc: "Dar xeque-mate em até 20 lances",
    icon: "bolt",
    check: ({ results }) => winsOf(results).some((r) => r.data.end === "mate" && num(r, "moves") <= 20),
  },
  {
    code: "xadrez:promotion",
    game: "xadrez",
    title: "Coroação",
    desc: "Promover um peão e vencer a partida",
    icon: "crown",
    check: ({ results }) => winsOf(results).some((r) => num(r, "promotions") >= 1),
  },
  {
    code: "xadrez:comeback",
    game: "xadrez",
    title: "Virada",
    desc: "Vencer depois de estar 5 pontos de material atrás",
    icon: "star",
    check: ({ results }) => winsOf(results).some((r) => num(r, "behind") >= 5),
  },
  {
    code: "xadrez:untouched",
    game: "xadrez",
    title: "Intocável",
    desc: "Vencer sem perder a dama",
    icon: "shield",
    check: ({ results }) => winsOf(results).some((r) => r.data.lostQueen === false),
  },
  {
    code: "xadrez:master",
    game: "xadrez",
    title: "Grão-mestre",
    desc: "Vencer a IA no Difícil",
    icon: "target",
    check: ({ results }) => winsOf(results).some((r) => r.mode === "ai" && r.data.level === "hard"),
  },
  streak5("xadrez"),
  wins("xadrez", 10),
  wins("xadrez", 50),
  wins("xadrez", 100),

  first("damas"),
  {
    code: "damas:chain",
    game: "damas",
    title: "Rajada",
    desc: "Capturar 3 ou mais peças num lance só",
    icon: "bolt",
    check: ({ results }) => results.some((r) => num(r, "bestChain") >= 3),
  },
  {
    code: "damas:untouched",
    game: "damas",
    title: "Intocável",
    desc: "Vencer sem perder nenhuma peça",
    icon: "shield",
    check: ({ results }) => winsOf(results).some((r) => num(r, "lost") === 0),
  },
  {
    code: "damas:kings",
    game: "damas",
    title: "Coroação",
    desc: "Fazer 3 damas na mesma partida",
    icon: "crown",
    check: ({ results }) => results.some((r) => num(r, "kings") >= 3),
  },
  {
    code: "damas:comeback",
    game: "damas",
    title: "Virada",
    desc: "Vencer depois de estar 3 peças atrás",
    icon: "star",
    check: ({ results }) => winsOf(results).some((r) => num(r, "behind") >= 3),
  },
  {
    code: "damas:master",
    game: "damas",
    title: "Mestre",
    desc: "Vencer a IA no Difícil",
    icon: "target",
    check: ({ results }) => winsOf(results).some((r) => r.mode === "ai" && r.data.level === "hard"),
  },
  streak5("damas"),
  wins("damas", 10),
  wins("damas", 50),
  wins("damas", 100),

  first("ludo"),
  {
    code: "ludo:hunter",
    game: "ludo",
    title: "Caçador",
    desc: "Capturar 5 peças ou mais numa partida",
    icon: "target",
    check: ({ results }) => results.some((r) => num(r, "captures") >= 5),
  },
  {
    code: "ludo:untouched",
    game: "ludo",
    title: "Intocável",
    desc: "Vencer sem ter nenhuma peça capturada",
    icon: "shield",
    check: ({ results }) => winsOf(results).some((r) => num(r, "lost") === 0),
  },
  {
    code: "ludo:comeback",
    game: "ludo",
    title: "Virada",
    desc: "Vencer depois de estar com 0 peças na chegada e um adversário com 3",
    icon: "star",
    check: ({ results }) => winsOf(results).some((r) => r.data.comeback === true),
  },
  {
    code: "ludo:full_table",
    game: "ludo",
    title: "Mesa cheia",
    desc: "Vencer uma partida com 4 jogadores",
    icon: "crown",
    check: ({ results }) => winsOf(results).some((r) => num(r, "players") === 4),
  },
  streak5("ludo"),

  first("futebol-de-botao"),
  {
    code: "futebol-de-botao:hat_trick",
    game: "futebol-de-botao",
    title: "Hat-trick",
    desc: "Fazer os 3 gols da vitória sozinho",
    icon: "target",
    check: ({ results }) => winsOf(results).some((r) => num(r, "goals") >= 3),
  },
  {
    code: "futebol-de-botao:wall",
    game: "futebol-de-botao",
    title: "Muralha",
    desc: "Vencer sem levar gol",
    icon: "shield",
    check: ({ results }) => winsOf(results).some((r) => num(r, "ga") === 0),
  },
  {
    code: "futebol-de-botao:lightning",
    game: "futebol-de-botao",
    title: "Relâmpago",
    desc: "Vencer em menos de 1 minuto",
    icon: "bolt",
    check: ({ results }) => winsOf(results).some((r) => num(r, "ms") < 60_000),
  },
  {
    code: "futebol-de-botao:comeback",
    game: "futebol-de-botao",
    title: "Virada",
    desc: "Vencer depois de estar perdendo por 2 gols",
    icon: "star",
    check: ({ results }) => winsOf(results).some((r) => num(r, "deficit") >= 2),
  },
  {
    code: "futebol-de-botao:golden",
    game: "futebol-de-botao",
    title: "Gol de ouro",
    desc: "Vencer no gol de ouro",
    icon: "crown",
    check: ({ results }) => winsOf(results).some((r) => r.data.golden === true),
  },
  {
    code: "futebol-de-botao:scorer",
    game: "futebol-de-botao",
    title: "Artilheiro",
    desc: "Marcar 50 gols no total",
    icon: "flame",
    check: ({ results }) => results.reduce((n, r) => n + (num(r, "goals") || 0), 0) >= 50,
  },

  first("batalha-naval"),
  {
    code: "batalha-naval:sharp",
    game: "batalha-naval",
    title: "Mira afiada",
    desc: "Vencer com 60% ou mais de acertos",
    icon: "target",
    check: ({ results }) => winsOf(results).some((r) => num(r, "shots") > 0 && num(r, "hits") / num(r, "shots") >= 0.6),
  },
  {
    code: "batalha-naval:flawless",
    game: "batalha-naval",
    title: "Intocável",
    desc: "Vencer sem perder nenhum navio",
    icon: "shield",
    check: ({ results }) => winsOf(results).some((r) => num(r, "shipsLost") === 0),
  },
  streak5("batalha-naval"),

  first("stop"),
  {
    code: "stop:perfect_round",
    game: "stop",
    title: "Rodada perfeita",
    desc: "Todas as respostas únicas numa rodada",
    icon: "star",
    check: ({ results }) => results.some((r) => num(r, "perfectRounds") > 0),
  },
  {
    code: "stop:stops_10",
    game: "stop",
    title: "Mão rápida",
    desc: "Apertar o STOP 10 vezes",
    icon: "bolt",
    check: ({ results }) => results.reduce((n, r) => n + (num(r, "stops") || 0), 0) >= 10,
  },
  wins("stop", 10),
  wins("stop", 50),

  {
    code: "codenames:master",
    game: "codenames",
    title: "Mestre espião",
    desc: "Vencer como mestre",
    icon: "crown",
    check: ({ results }) => winsOf(results).some((r) => r.data.role === "master"),
  },
  {
    code: "codenames:agent",
    game: "codenames",
    title: "Agente de campo",
    desc: "Vencer como agente",
    icon: "trophy",
    check: ({ results }) => winsOf(results).some((r) => r.data.role === "agent"),
  },
  {
    code: "codenames:clue_3",
    game: "codenames",
    title: "Dica de ouro",
    desc: "Dica que rendeu 3 ou mais acertos",
    icon: "target",
    check: ({ results }) => results.some((r) => num(r, "bestClue") >= 3),
  },
  wins("codenames", 10),

  first("sudoku"),
  {
    code: "sudoku:all_levels",
    game: "sudoku",
    title: "Todos os níveis",
    desc: "Vencer no fácil, médio, difícil e expert",
    icon: "star",
    check: ({ results }) => DIFFICULTIES.every((d) => winsOf(results).some((r) => r.data.difficulty === d)),
  },
  {
    code: "sudoku:perfect",
    game: "sudoku",
    title: "Perfeito",
    desc: "Vencer sem erros e sem dicas",
    icon: "shield",
    check: ({ results }) => winsOf(results).some((r) => num(r, "mistakes") === 0 && num(r, "hints") === 0),
  },
  {
    code: "sudoku:expert_20",
    game: "sudoku",
    title: "Expert relâmpago",
    desc: "Vencer o expert em menos de 20 minutos",
    icon: "bolt",
    check: ({ results }) => winsOf(results).some((r) => r.data.difficulty === "expert" && num(r, "timeMs") < 20 * 60_000),
  },
  wins("sudoku", 10),
  wins("sudoku", 50),
  wins("sudoku", 100),
  ...daily("sudoku"),

  first("paciencia-spider"),
  {
    code: "paciencia-spider:suits_2",
    game: "paciencia-spider",
    title: "Dois naipes",
    desc: "Vencer com 2 naipes",
    icon: "star",
    check: ({ results }) => winsOf(results).some((r) => num(r, "suits") === 2),
  },
  {
    code: "paciencia-spider:suits_4",
    game: "paciencia-spider",
    title: "Quatro naipes",
    desc: "Vencer com 4 naipes",
    icon: "crown",
    check: ({ results }) => winsOf(results).some((r) => num(r, "suits") === 4),
  },
  wins("paciencia-spider", 10),
  wins("paciencia-spider", 50),
  wins("paciencia-spider", 100),
  ...daily("paciencia-spider"),

  { ...first("verbete"), desc: "Acertar a primeira palavra" },
  {
    code: "verbete:seer",
    game: "verbete",
    title: "Vidente",
    desc: "Acertar o Verbete na 1ª tentativa",
    icon: "target",
    check: ({ results }) => winsOf(results).some((r) => num(r, "mode") === 1 && num(r, "attempts") === 1),
  },
  {
    code: "verbete:close",
    game: "verbete",
    title: "Ufa!",
    desc: "Vencer na última tentativa",
    icon: "shield",
    check: ({ results }) => winsOf(results).some((r) => isMode(r.data.mode) && num(r, "attempts") === MAX_GUESSES[r.data.mode]),
  },
  {
    code: "verbete:duo_4",
    game: "verbete",
    title: "Dupla afinada",
    desc: "Vencer o Dueto em até 4 tentativas",
    icon: "bolt",
    check: ({ results }) => winsOf(results).some((r) => num(r, "mode") === 2 && num(r, "attempts") <= 4),
  },
  {
    code: "verbete:quartet",
    game: "verbete",
    title: "Quarteto completo",
    desc: "Vencer o Quarteto",
    icon: "grid",
    check: ({ results }) => winsOf(results).some((r) => num(r, "mode") === 4),
  },
  {
    code: "verbete:daily_5",
    game: "verbete",
    title: "Embalado",
    desc: "5 dias seguidos vencendo uma palavra do dia, no próprio dia",
    icon: "flame",
    check: ({ results }) => dailyStreaks(results).best >= 5,
  },
  { ...wins("verbete", 50), title: "Viciado" },
];

export const ACHIEVEMENT_BY_CODE = new Map(ACHIEVEMENTS.map((a) => [a.code, a]));

/** Conquistas novas para estes resultados (só as deste jogo e as gerais). */
export function newAchievements(game: StatGame, ctx: Ctx, have: Set<string>): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => (a.game === game || a.game === null) && !have.has(a.code) && a.check(ctx));
}

// ---------- dias seguidos ----------

const DAY_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

/** Dia no horário de Brasília (AAAA-MM-DD). */
export const dayKey = (d: Date) => DAY_FMT.format(d);

export const prevDay = (key: string) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Sequência de dias: a maior e a atual (vale se jogou hoje ou ontem). */
export function dayStreaks(dayKeys: Iterable<string>): { best: number; current: number } {
  const set = new Set(dayKeys);
  let best = 0;
  for (const k of set) {
    if (set.has(prevDay(k))) continue; // só conta a partir do começo de cada sequência
    let n = 0;
    for (let d = k; set.has(d); d = nextDay(d)) n++;
    best = Math.max(best, n);
  }
  const today = dayKey(new Date());
  let start = set.has(today) ? today : prevDay(today);
  let current = 0;
  while (set.has(start)) {
    current++;
    start = prevDay(start);
  }
  return { best, current };
}

export function nextDay(key: string) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
