import { describe, expect, setSystemTime, test } from "bun:test";
import type { ResultRow } from "@/lib/stats/achievements";
import { computeRivalry, formatMs, gameStats, modeStats, statsByGame, type RivalryRow } from "@/lib/stats/compute";
import { GAME_INFO, gameFromPath, isOnlineGame, isSoloGame, ONLINE_GAMES, SOLO_GAMES, STAT_GAMES } from "@/lib/stats/games";

type Data = Record<string, unknown>;

const row = (outcome: string, data: Data = {}, mode = "online", placement: number | null = null): ResultRow => ({
  mode,
  outcome,
  placement,
  data,
  createdAt: new Date(0),
});
const win = (data: Data = {}, mode?: string) => row("win", data, mode);
const loss = (data: Data = {}, mode?: string) => row("loss", data, mode);
const draw = (data: Data = {}, mode?: string) => row("draw", data, mode);
const solo = (data: Data) => row("win", data, "solo");
const chips = (game: Parameters<typeof gameStats>[0], rs: ResultRow[]) => gameStats(game, rs).chips;

describe("formatMs", () => {
  test.each([
    [0, "0:00"],
    [999, "0:00"],
    [1_000, "0:01"],
    [59_999, "0:59"],
    [60_000, "1:00"],
    [61_000, "1:01"],
    [599_000, "9:59"],
    [600_000, "10:00"],
    [3_599_999, "59:59"],
    [3_600_000, "1:00:00"],
    [3_661_000, "1:01:01"],
    [36_000_000, "10:00:00"],
  ])("%i ms → %s", (ms, text) => {
    expect(formatMs(ms)).toBe(text);
  });
});

describe("modeStats", () => {
  test("sem partidas: nada", () => {
    expect(modeStats([])).toBeUndefined();
  });

  test("conta vitórias, derrotas, empates, aproveitamento e sequências", () => {
    expect(modeStats([win(), win(), loss(), draw(), win()])).toEqual({ games: 5, wins: 3, losses: 1, draws: 1, pct: 60, streak: 1, bestStreak: 2 });
  });

  test.each([
    [1, 3, 33],
    [2, 3, 67],
    [1, 8, 13],
    [0, 4, 0],
    [4, 4, 100],
  ])("aproveitamento arredondado: %i de %i = %i%%", (w, n, pct) => {
    const rs = [...Array.from({ length: w }, () => win()), ...Array.from({ length: n - w }, () => loss())];
    expect(modeStats(rs)!.pct).toBe(pct);
  });

  test("abandono conta como derrota", () => {
    expect(modeStats([win(), loss({ abandoned: true })])).toMatchObject({ games: 2, losses: 1, pct: 50, streak: 0 });
  });
});

describe("gameStats: modos", () => {
  test("online e contra IA separados; vitórias somam tudo", () => {
    const s = gameStats("connect4", [win({}, "online"), loss({}, "online"), win({}, "ai"), win({}, "ai"), win({}, "ai")]);
    expect(s.wins).toBe(4);
    expect(s.modes.online).toMatchObject({ games: 2, wins: 1, pct: 50 });
    expect(s.modes.ai).toMatchObject({ games: 3, wins: 3, pct: 100, streak: 3 });
  });

  test("modo sem partidas fica vazio", () => {
    const s = gameStats("truco-paulista", [win()]);
    expect(s.modes.ai).toBeUndefined();
    expect(s.modes.online).toBeDefined();
  });

  test("jogo solo não tem modos", () => {
    const s = gameStats("sudoku", [solo({ difficulty: "easy" })]);
    expect(s.modes).toEqual({ online: undefined, ai: undefined });
    expect(s.wins).toBe(1);
  });

  test("Truco: sem recordes extras", () => {
    const s = gameStats("truco-paulista", [win({ scores: [12, 0] })]);
    expect(s.chips).toEqual([]);
    expect(s.table).toBeUndefined();
  });
});

describe("gameStats: Connect 4", () => {
  test("vitória mais rápida é a com menos peças, só entre vitórias", () => {
    expect(chips("connect4", [win({ pieces: 9 }), win({ pieces: 5 }), loss({ pieces: 4 })])).toEqual([{ label: "Vitória mais rápida", value: "5 peças" }]);
  });

  test("sem vitória (ou sem o número): sem recorde", () => {
    expect(chips("connect4", [loss({ pieces: 4 })])).toEqual([]);
    expect(chips("connect4", [win({})])).toEqual([]);
  });
});

describe("gameStats: Jogo da Velha", () => {
  test("vitória mais rápida, só entre vitórias", () => {
    expect(chips("jogo-da-velha", [win({ pieces: 5 }), win({ pieces: 3 }), loss({ pieces: 3 }), draw({ pieces: 4 })])).toEqual([
      { label: "Vitória mais rápida", value: "3 peças" },
    ]);
    expect(chips("jogo-da-velha", [loss({ pieces: 3 }), draw({})])).toEqual([]);
  });
});

describe("gameStats: Otrio", () => {
  test("vitória mais rápida pelas peças da cor e forma favorita, só entre vitórias", () => {
    const rs = [win({ colorPieces: 5, how: "line" }), win({ colorPieces: 4, how: "stack" }), win({ colorPieces: 6, how: "stack" }), loss({ pieces: 3 })];
    expect(chips("otrio", rs)).toEqual([
      { label: "Vitória mais rápida", value: "4 peças" },
      { label: "Forma favorita", value: "Alvo" },
    ]);
  });

  test("sem vitória: sem recorde", () => {
    expect(chips("otrio", [loss({ pieces: 3 }), draw({})])).toEqual([]);
  });
});

describe("gameStats: Batalha Naval", () => {
  test("melhor mira e menos tiros, só entre vitórias", () => {
    const rs = [win({ hits: 17, shots: 40 }), win({ hits: 17, shots: 25 }), loss({ hits: 10, shots: 10 })];
    expect(chips("batalha-naval", rs)).toEqual([
      { label: "Melhor mira", value: "68%" },
      { label: "Menos tiros", value: "25" },
    ]);
  });

  test("mira arredonda para o inteiro mais próximo", () => {
    expect(chips("batalha-naval", [win({ hits: 2, shots: 3 })])[0]).toEqual({ label: "Melhor mira", value: "67%" });
  });

  test("vitória com 0 tiros fica fora da mira mas entra em menos tiros (comportamento atual)", () => {
    expect(chips("batalha-naval", [win({ hits: 0, shots: 0 })])).toEqual([{ label: "Menos tiros", value: "0" }]);
  });

  test("sem vitória: sem recordes", () => {
    expect(chips("batalha-naval", [loss({ hits: 17, shots: 17 })])).toEqual([]);
  });
});

describe("gameStats: Stop", () => {
  const stop = (outcome: string, placement: number | null, data: Data = {}) => row(outcome, data, "online", placement);

  test("melhor pontuação (de qualquer partida), colocação média e respostas únicas", () => {
    const rs = [stop("win", 1, { score: 120, unique: 5 }), stop("loss", 2, { score: 150, unique: 3 }), stop("loss", 3, { score: 80 })];
    expect(chips("stop", rs)).toEqual([
      { label: "Melhor pontuação", value: "150" },
      { label: "Colocação média", value: "2,0º" },
      { label: "Respostas únicas", value: "8" },
    ]);
  });

  test("colocação média com vírgula e uma casa", () => {
    expect(chips("stop", [stop("win", 1), stop("loss", 2)])[0]).toEqual({ label: "Colocação média", value: "1,5º" });
  });

  test("abandono e partida sem colocação ficam fora da média", () => {
    const rs = [stop("win", 1, { score: 50 }), stop("loss", 4, { abandoned: true }), stop("loss", null, { abandoned: true })];
    expect(chips("stop", rs)).toContainEqual({ label: "Colocação média", value: "1,0º" });
  });

  test("só abandonos: sem pontuação nem média, respostas únicas zeradas", () => {
    expect(chips("stop", [stop("loss", null, { abandoned: true })])).toEqual([{ label: "Respostas únicas", value: "0" }]);
  });
});

describe("gameStats: Codenames", () => {
  test("vitórias por papel e vezes no assassino", () => {
    const rs = [win({ role: "master" }), win({ role: "agent" }), win({ role: "agent" }), loss({ role: "master", assassin: true }), loss({ role: "agent", assassin: false })];
    expect(chips("codenames", rs)).toEqual([
      { label: "Vitórias como mestre", value: "1" },
      { label: "Vitórias como agente", value: "2" },
      { label: "Assassino", value: "1" },
    ]);
  });
});

describe("gameStats: Sudoku", () => {
  test("tabela por dificuldade: vitórias, melhor tempo e perfeitas", () => {
    const rs = [
      solo({ difficulty: "easy", timeMs: 300_000, mistakes: 0, hints: 0 }),
      solo({ difficulty: "easy", timeMs: 185_500, mistakes: 1, hints: 0 }),
      solo({ difficulty: "expert", timeMs: 3_725_000, mistakes: 0, hints: 0 }),
      solo({ difficulty: "insane", timeMs: 1_000 }),
    ];
    expect(gameStats("sudoku", rs).table).toEqual({
      cols: ["Vitórias", "Melhor tempo", "Perfeitas"],
      rows: [
        { label: "Fácil", values: ["2", "3:05", "1"] },
        { label: "Médio", values: ["0", null, "0"] },
        { label: "Difícil", values: ["0", null, "0"] },
        { label: "Expert", values: ["1", "1:02:05", "1"] },
      ],
    });
  });

  test("melhor tempo ignora partida sem tempo e derrotas", () => {
    const rs = [solo({ difficulty: "hard" }), solo({ difficulty: "hard", timeMs: 900_000 }), row("loss", { difficulty: "hard", timeMs: 1_000 }, "solo")];
    expect(gameStats("sudoku", rs).table!.rows[2]).toEqual({ label: "Difícil", values: ["2", "15:00", "0"] });
  });
});

describe("gameStats: Paciência Spider", () => {
  test("tabela por naipes: vitórias, melhor tempo, mais pontos e menos jogadas (cada um da sua melhor partida)", () => {
    const rs = [
      solo({ suits: 1, timeMs: 400_000, score: 900, moves: 120 }),
      solo({ suits: 1, timeMs: 500_000, score: 1_100, moves: 100 }),
      solo({ suits: 4, timeMs: 2_000_000, score: 600, moves: 300 }),
      solo({ suits: 3, timeMs: 1_000, score: 9_999, moves: 1 }),
    ];
    expect(gameStats("paciencia-spider", rs).table).toEqual({
      cols: ["Vitórias", "Melhor tempo", "Pontos", "Jogadas"],
      rows: [
        { label: "1 naipe", values: ["2", "6:40", "1100", "100"] },
        { label: "2 naipes", values: ["0", null, null, null] },
        { label: "4 naipes", values: ["1", "33:20", "600", "300"] },
      ],
    });
  });
});

describe("gameStats: desafio diário", () => {
  const daily = (day: string, at = day, outcome = "win"): ResultRow => ({ ...row(outcome, { suits: 4, timeMs: 1_000 }, "solo"), daily: day, createdAt: new Date(`${at}T12:00:00-03:00`) });
  const days = (n: number) => Array.from({ length: n }, (_, i) => `2026-08-${String(i + 1).padStart(2, "0")}`);

  test("sem desafio: sem os números do desafio", () => {
    expect(chips("paciencia-spider", [solo({ suits: 4 })])).toEqual([]);
  });

  test("conta os desafios vencidos (rejogados também) e as vitórias entram na tabela normal", () => {
    const rs = [daily("2026-08-01", "2026-09-01"), daily("2026-08-03"), daily("2026-08-05", "2026-08-05", "loss")];
    expect(chips("paciencia-spider", rs)).toEqual([{ label: "Desafios diários", value: "2" }]);
    expect(gameStats("paciencia-spider", rs).table!.rows[2].values[0]).toBe("2");
  });

  test("sequência no próprio dia: atual, recorde ou os dois", () => {
    const seq = (now: string) => {
      setSystemTime(new Date(`${now}T12:00:00-03:00`));
      const c = chips("sudoku", [...days(3).map((d) => daily(d)), daily("2026-08-10"), daily("2026-08-11")]).find((c) => c.label === "Desafios seguidos")?.value;
      setSystemTime();
      return c;
    };
    expect(seq("2026-08-03")).toBe("3");
    expect(seq("2026-08-11")).toBe("2 · recorde 3");
    expect(seq("2026-09-01")).toBe("recorde 3");
    expect(chips("sudoku", [daily("2026-08-01")])).toEqual([{ label: "Desafios diários", value: "1" }]);
  });
});

describe("gameStats: Verbete", () => {
  const vb = (mode: number, attempts: number, outcome = "win", day?: string, at = day): ResultRow => ({
    ...row(outcome, { mode, attempts }, "solo"),
    ...(day ? { daily: `${day}:${mode}`, createdAt: new Date(`${at}T12:00:00-03:00`) } : {}),
  });

  test("tabela por modo: jogos, vitórias, média de tentativas nas vitórias e maior sequência de dias", () => {
    const rs = [
      vb(1, 3, "win", "2026-08-01"),
      vb(1, 4, "win", "2026-08-02"),
      vb(1, 6, "loss", "2026-08-03"),
      vb(1, 2),
      vb(2, 7, "loss"),
      vb(4, 9, "win", "2026-08-01", "2026-08-05"),
    ];
    expect(gameStats("verbete", rs).table).toEqual({
      cols: ["Jogos", "Vitórias", "Média", "Sequência"],
      rows: [
        { label: "Verbete", values: ["4", "75%", "3,0", "2"] },
        { label: "Dueto", values: ["1", "0%", null, null] },
        // vencido em outro dia: não conta na sequência
        { label: "Quarteto", values: ["1", "100%", "9,0", null] },
      ],
    });
  });

  test("palavras do dia de vários modos no mesmo dia contam como um dia", () => {
    const rs = [vb(1, 3, "win", "2026-08-01"), vb(2, 5, "win", "2026-08-01"), vb(4, 8, "win", "2026-08-02")];
    expect(chips("verbete", rs)).toContainEqual({ label: "Desafios seguidos", value: "recorde 2" });
  });
});

describe("statsByGame", () => {
  test("agrupa por jogo na ordem da tela, pula jogos sem partida e ignora jogos desconhecidos", () => {
    const rs = [
      { ...solo({ difficulty: "easy" }), game: "sudoku" },
      { ...win(), game: "truco-paulista" },
      { ...loss(), game: "jogo-velho" },
      { ...win({ pieces: 4 }), game: "connect4" },
      { ...loss(), game: "truco-paulista" },
    ];
    const out = statsByGame(rs);
    expect(out.map((s) => s.game)).toEqual(["truco-paulista", "connect4", "sudoku"]);
    expect(out[0].modes.online).toMatchObject({ games: 2, wins: 1, streak: 0 });
  });

  test("sem resultados: lista vazia", () => {
    expect(statsByGame([])).toEqual([]);
  });
});

describe("rivalidade", () => {
  const r = (game: string, mine: string, theirs: string, myPlace: number | null = null, theirPlace: number | null = null): RivalryRow => ({ game, mine, theirs, myPlace, theirPlace });

  test("sem partidas em comum: zero a zero", () => {
    expect(computeRivalry([])).toEqual({ me: 0, them: 0, games: [] });
  });

  test.each([
    ["win", "loss", 1, 0],
    ["loss", "win", 0, 1],
    ["win", "win", 0, 0],
    ["loss", "loss", 0, 0],
    ["draw", "draw", 0, 0],
    ["draw", "loss", 0, 0],
    ["win", "draw", 0, 0],
  ])("eu %s, o outro %s: %i a %i", (mine, theirs, me, them) => {
    const out = computeRivalry([r("connect4", mine, theirs)]);
    expect([out.me, out.them]).toEqual([me, them]);
  });

  test("parceiros de time (mesmo resultado) não contam", () => {
    expect(computeRivalry([r("truco-paulista", "win", "win"), r("codenames", "loss", "loss")])).toEqual({ me: 0, them: 0, games: [] });
  });

  test.each([
    [1, 2, 1, 0],
    [3, 2, 0, 1],
    [2, 2, 0, 0],
  ])("colocação %i contra %i: %i a %i", (mine, theirs, me, them) => {
    const out = computeRivalry([r("stop", "loss", "loss", mine, theirs)]);
    expect([out.me, out.them]).toEqual([me, them]);
  });

  test("colocação manda mais que o resultado", () => {
    expect(computeRivalry([r("stop", "loss", "win", 1, 2)]).me).toBe(1);
  });

  test("Stop: quem abandonou (sem colocação) perde para quem terminou, mesmo fora do 1º lugar", () => {
    expect(computeRivalry([r("stop", "win", "loss", 1, null)])).toMatchObject({ me: 1, them: 0 });
    expect(computeRivalry([r("stop", "loss", "loss", 2, null)])).toMatchObject({ me: 1, them: 0 });
    expect(computeRivalry([r("stop", "loss", "loss", null, 3)])).toMatchObject({ me: 0, them: 1 });
  });

  test("Stop: os dois abandonaram, ninguém pontua", () => {
    expect(computeRivalry([r("stop", "loss", "loss", null, null)])).toMatchObject({ me: 0, them: 0 });
  });

  test("placar por jogo na ordem da tela, total somado, jogo sem ponto e desconhecido ficam fora", () => {
    const rows = [
      r("sudoku", "win", "loss"),
      r("stop", "loss", "loss", 1, 3),
      r("connect4", "win", "loss"),
      r("connect4", "loss", "win"),
      r("connect4", "win", "loss"),
      r("batalha-naval", "draw", "draw"),
      r("jogo-velho", "win", "loss"),
      r("truco-paulista", "loss", "win"),
    ];
    expect(computeRivalry(rows)).toEqual({
      me: 4,
      them: 2,
      games: [
        { game: "truco-paulista", me: 0, them: 1 },
        { game: "connect4", me: 2, them: 1 },
        { game: "stop", me: 1, them: 0 },
        { game: "sudoku", me: 1, them: 0 },
      ],
    });
  });
});

describe("jogos", () => {
  test("todo jogo aparece uma vez na tela: online primeiro, depois solo", () => {
    expect(STAT_GAMES).toEqual([...ONLINE_GAMES, ...SOLO_GAMES]);
    expect(new Set(STAT_GAMES).size).toBe(STAT_GAMES.length);
    expect(Object.keys(GAME_INFO).sort()).toEqual([...STAT_GAMES].sort());
  });

  test.each([
    ["/connect-4", "connect4"],
    ["/connect-4/sala/ABCD", "connect4"],
    ["/otrio/sala/ABCD", "otrio"],
    ["/jogo-da-velha/sala/ABCD", "jogo-da-velha"],
    ["/truco-paulista/sala/XY12", "truco-paulista"],
    ["/sudoku/jogo", "sudoku"],
    ["/paciencia-spider/jogo", "paciencia-spider"],
    ["/stop", "stop"],
    ["/", null],
    ["/perfil", null],
    ["/connect-40", null],
    ["/stopwatch", null],
    ["/sala/sudoku", null],
  ])("gameFromPath(%p) = %p", (path, game) => {
    expect(gameFromPath(path)).toBe(game as never);
  });

  test.each(STAT_GAMES.map((g) => [g]))("%s é online ou solo, nunca os dois", (g) => {
    expect(isOnlineGame(g)).not.toBe(isSoloGame(g));
  });

  test("nomes fora da lista não são jogo", () => {
    for (const g of ["", "xadrez", "Sudoku", "connect-4"]) {
      expect(isOnlineGame(g)).toBe(false);
      expect(isSoloGame(g)).toBe(false);
    }
  });
});
