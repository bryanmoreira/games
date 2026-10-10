import {
  CATEGORIES,
  DEFAULT_SETTINGS,
  LETTERS,
  MAX_ANSWER,
  MAX_CUSTOM,
  MAX_CUSTOM_NAME,
  MIN_CATEGORIES,
  ROUND_OPTIONS,
  TIME_OPTIONS,
  type Action,
  type CategoryDef,
  type GameState,
  type Seat,
  type Settings,
} from "./types";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

/** Minúsculas, sem acento e com espaços simples: "  Água  Viva" → "agua viva". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Resposta preenchida e começando com a letra da rodada. */
export const matchesLetter = (text: string | undefined, letter: string) => {
  const n = normalize(text ?? "");
  return n.length > 0 && n[0] === letter.toLowerCase();
};

/** Id de um tema criado pelo host (o mesmo nome, com ou sem acento, vira o mesmo tema). */
export const customId = (name: string) => `c:${normalize(name)}`;

/** Nome de tema digitado: espaços simples, tamanho máximo. */
export const cleanCustom = (name: unknown) => String(name ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_CUSTOM_NAME).trim();

/** Temas criados, sem vazios, repetidos ou iguais a uma categoria pronta. */
function parseCustom(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const taken = new Set(CATEGORIES.map((c) => normalize(c.name)));
  const out: string[] = [];
  for (const item of raw) {
    const name = cleanCustom(item);
    const key = normalize(name);
    if (!key || taken.has(key)) continue;
    taken.add(key);
    out.push(name);
  }
  return out.slice(0, MAX_CUSTOM);
}

/** Todas as categorias disponíveis: as prontas e depois os temas criados. */
export const allCategories = (s: Pick<Settings, "custom">): CategoryDef[] => [
  ...CATEGORIES,
  ...s.custom.map((name) => ({ id: customId(name), name })),
];

/** Configuração vinda do lobby, validada (o que vier errado volta ao padrão). */
export function parseSettings(raw: unknown, prev: Settings = DEFAULT_SETTINGS): Settings {
  const r = (raw ?? {}) as Partial<Settings>;
  const custom = r.custom === undefined ? prev.custom : parseCustom(r.custom);
  const picked = Array.isArray(r.categories) ? r.categories : prev.categories;
  const categories = allCategories({ custom })
    .map((c) => c.id)
    .filter((id) => picked.includes(id));
  // menos de 3 categorias: a mudança de temas é recusada
  const ok = categories.length >= MIN_CATEGORIES;
  return {
    categories: ok ? categories : prev.categories,
    custom: ok ? custom : prev.custom,
    rounds: (ROUND_OPTIONS as readonly number[]).includes(Number(r.rounds)) ? Number(r.rounds) : prev.rounds,
    time: (TIME_OPTIONS as readonly number[]).includes(Number(r.time)) ? Number(r.time) : prev.time,
  };
}

export const categoryDefs = (s: Settings): CategoryDef[] => {
  const all = allCategories(s);
  return s.categories.map((id) => all.find((c) => c.id === id)!);
};

export const letterOf = (s: GameState) => s.letters[s.letters.length - 1];

/** Jogadores presentes (os que contam na maioria e no PRONTO). */
export const present = (s: GameState) => s.players.filter((p) => !s.away.includes(p));

function pickLetter(used: string[], rng: () => number): string {
  const free = LETTERS.filter((l) => !used.includes(l));
  return free[Math.floor(rng() * free.length)];
}

export function newGame(
  rng: () => number,
  { players, settings }: { players: Seat[]; settings: Settings },
  prev?: GameState | null,
): GameState {
  const cats = settings.categories.length;
  return {
    gameNo: (prev?.gameNo ?? 0) + 1,
    settings,
    players: [...players].sort((a, b) => a - b),
    away: [],
    round: 1,
    letters: [pickLetter([], rng)],
    phase: "letter",
    phaseNo: 0,
    answers: Object.fromEntries(players.map((p) => [p, Array(cats).fill("")])),
    stoppedBy: null,
    review: 0,
    votes: [],
    ready: [],
    history: [],
    scores: Object.fromEntries(players.map((p) => [p, 0])),
  };
}

/** Anulada se mais da metade dos outros jogadores presentes votou ✗. */
export function isAnnulled(s: GameState, cat: number, target: Seat): boolean {
  const voters = s.votes[cat]?.[target] ?? [];
  const eligible = present(s).filter((p) => p !== target).length;
  return eligible > 0 && voters.length * 2 > eligible;
}

/** Pontos de cada jogador numa categoria: 10 única, 5 repetida, 0 vazia/letra errada/anulada. */
export function categoryPoints(s: GameState, cat: number): Record<Seat, number> {
  const letter = letterOf(s);
  const valid = new Map<Seat, string>();
  for (const p of s.players) {
    const a = s.answers[p]?.[cat] ?? "";
    if (matchesLetter(a, letter) && !isAnnulled(s, cat, p)) valid.set(p, normalize(a));
  }
  const count = new Map<string, number>();
  for (const n of valid.values()) count.set(n, (count.get(n) ?? 0) + 1);
  return Object.fromEntries(s.players.map((p) => [p, valid.has(p) ? (count.get(valid.get(p)!)! > 1 ? 5 : 10) : 0]));
}

const allFilled = (s: GameState, seat: Seat) => s.settings.categories.every((_, i) => matchesLetter(s.answers[seat]?.[i], letterOf(s)));

export const canStop = (s: GameState, seat: Seat) => s.phase === "writing" && s.players.includes(seat) && allFilled(s, seat);

const nextPhase = (s: GameState, phase: GameState["phase"]) => {
  s.phase = phase;
  s.phaseNo++;
  s.ready = [];
};

function endWriting(s: GameState, stopper: Seat | null) {
  s.stoppedBy = stopper;
  s.review = 0;
  s.votes = s.settings.categories.map(() => ({}));
  nextPhase(s, "review");
}

function finishRound(s: GameState) {
  const cats = s.settings.categories.length;
  const result = {
    letter: letterOf(s),
    answers: structuredClone(s.answers),
    points: Object.fromEntries(s.players.map((p) => [p, [] as number[]])),
    annulled: Object.fromEntries(s.players.map((p) => [p, [] as boolean[]])),
    stoppedBy: s.stoppedBy,
  };
  for (let c = 0; c < cats; c++) {
    const pts = categoryPoints(s, c);
    for (const p of s.players) {
      result.points[p].push(pts[p]);
      result.annulled[p].push(isAnnulled(s, c, p));
      s.scores[p] += pts[p];
    }
  }
  s.history.push(result);
  nextPhase(s, "roundEnd");
}

function nextCategory(s: GameState) {
  if (s.review < s.settings.categories.length - 1) {
    s.review++;
    nextPhase(s, "review");
  } else finishRound(s);
}

function nextRound(s: GameState, rng: () => number) {
  if (s.round >= s.settings.rounds) return nextPhase(s, "gameOver");
  s.round++;
  s.letters.push(pickLetter(s.letters, rng));
  s.answers = Object.fromEntries(s.players.map((p) => [p, Array(s.settings.categories.length).fill("")]));
  s.stoppedBy = null;
  s.votes = [];
  s.review = 0;
  nextPhase(s, "letter");
}

/** Todos os presentes prontos: a fase avança sem esperar o tempo. */
function checkReady(s: GameState, rng: () => number) {
  const here = present(s);
  if (here.length === 0 || !here.every((p) => s.ready.includes(p))) return;
  if (s.phase === "review") nextCategory(s);
  else if (s.phase === "roundEnd") nextRound(s, rng);
}

const clean = (text: unknown) => String(text ?? "").replace(/\s+/g, " ").slice(0, MAX_ANSWER);

export function applyAction(state: GameState, action: Action, rng: () => number = Math.random): Result {
  const fail = (error: string): Result => ({ ok: false, error });
  if (state.phase === "gameOver") return fail("Partida encerrada");
  const s = structuredClone(state);

  switch (action.type) {
    case "advance":
      if (s.phase === "letter") nextPhase(s, "writing");
      else if (s.phase === "writing") endWriting(s, null);
      else if (s.phase === "review") nextCategory(s);
      else if (s.phase === "roundEnd") nextRound(s, rng);
      return { ok: true, state: s };

    case "away": {
      const away = s.players.filter((p) => action.seats.includes(p));
      if (away.length === s.away.length && away.every((p) => s.away.includes(p))) return fail("Sem mudança");
      s.away = away;
      checkReady(s, rng);
      return { ok: true, state: s };
    }
  }

  const seat = action.seat;
  if (!s.players.includes(seat)) return fail("Você não está na partida");

  switch (action.type) {
    case "write": {
      if (s.phase !== "writing") return fail("Rodada travada");
      if (!Number.isInteger(action.cat) || action.cat < 0 || action.cat >= s.settings.categories.length) return fail("Categoria inválida");
      s.answers[seat][action.cat] = clean(action.text);
      return { ok: true, state: s };
    }

    case "stop": {
      if (s.phase !== "writing") return fail("Rodada travada");
      if (Array.isArray(action.answers)) {
        s.settings.categories.forEach((_, i) => (s.answers[seat][i] = clean(action.answers![i])));
      }
      if (!allFilled(s, seat)) return fail("Preencha tudo com a letra");
      endWriting(s, seat);
      return { ok: true, state: s };
    }

    case "vote": {
      if (s.phase !== "review") return fail("Fora da correção");
      const target = action.target;
      if (target === seat || !s.players.includes(target)) return fail("Voto inválido");
      if (!matchesLetter(s.answers[target][s.review], letterOf(s))) return fail("Resposta já zerada");
      const voters = (s.votes[s.review][target] ??= []).filter((v) => v !== seat);
      s.votes[s.review][target] = action.against ? [...voters, seat] : voters;
      return { ok: true, state: s };
    }

    case "ready": {
      if (s.phase !== "review" && s.phase !== "roundEnd") return fail("Nada para confirmar");
      if (!s.ready.includes(seat)) s.ready.push(seat);
      checkReady(s, rng);
      return { ok: true, state: s };
    }
  }
  return fail("Ação inválida");
}

/** Pontuação final: maior soma vence; empate no topo = sem vencedor único. */
export function winners(s: GameState): Seat[] {
  const best = Math.max(...s.players.map((p) => s.scores[p]));
  return s.players.filter((p) => s.scores[p] === best);
}
