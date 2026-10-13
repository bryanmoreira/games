import {
  BOARD,
  DEFAULT_SETTINGS,
  MASTER_SLOTS,
  MAX_CLUE,
  MAX_WORD,
  MAX_WORDS_TEXT,
  NEUTRAL_CARDS,
  OTHER_CARDS,
  SEATS,
  STARTER_CARDS,
  TEAM_SEATS,
  TIME_OPTIONS,
  type Action,
  type Card,
  type GameState,
  type Key,
  type Role,
  type Seat,
  type Settings,
  type Team,
} from "./types";
import { DEFAULT_WORDS } from "./words";

export type Result = { ok: true; state: GameState } | { ok: false; error: string };

/* ---------- lugares ---------- */

/** Lugares 0–5 = vermelho, 6–11 = azul; o primeiro de cada time é o do mestre. */
export const teamOf = (seat: Seat): Team => (seat < TEAM_SEATS ? 0 : 1);
export const roleOf = (seat: Seat): Role => (seat % TEAM_SEATS < MASTER_SLOTS ? "master" : "agent");
export const masterSeats = (team: Team): Seat[] => Array.from({ length: MASTER_SLOTS }, (_, i) => team * TEAM_SEATS + i);
export const agentSeats = (team: Team): Seat[] =>
  Array.from({ length: TEAM_SEATS - MASTER_SLOTS }, (_, i) => team * TEAM_SEATS + MASTER_SLOTS + i);
export const other = (team: Team): Team => (team === 0 ? 1 : 0);

/** Cada time com o mestre e pelo menos 1 agente. */
export function canStart(seats: Seat[]): boolean {
  return ([0, 1] as Team[]).every(
    (t) => seats.some((s) => s < SEATS && teamOf(s) === t && roleOf(s) === "master") && seats.some((s) => s < SEATS && teamOf(s) === t && roleOf(s) === "agent"),
  );
}

/* ---------- palavras ---------- */

/** Minúsculas, sem acento e com espaços simples. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const cleanWord = (w: string) => w.replace(/\s+/g, " ").trim().slice(0, MAX_WORD).trim();

/** Lista do host: uma palavra por linha, sem vazias nem repetidas (acento e maiúscula não contam). */
export function parseWords(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const w = cleanWord(line);
    const n = normalize(w);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(w);
  }
  return out;
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sorteia `n` da lista, preferindo as que não estão em `avoid`. */
function pick(list: string[], n: number, avoid: Set<string>, rng: () => number): string[] {
  const s = shuffle(list, rng);
  return [...s.filter((w) => !avoid.has(normalize(w))), ...s.filter((w) => avoid.has(normalize(w)))].slice(0, n);
}

/** As 25 palavras: da lista do host (sorteadas se tiver mais) e, se faltar, completadas com a lista pronta. */
export function pickWords(custom: string[], rng: () => number, avoid: string[] = []): string[] {
  const avoidSet = new Set(avoid.map(normalize));
  if (custom.length >= BOARD) return pick(custom, BOARD, avoidSet, rng);
  const taken = new Set(custom.map(normalize));
  const fill = DEFAULT_WORDS.filter((w) => !taken.has(normalize(w)));
  return shuffle([...custom, ...pick(fill, BOARD - custom.length, avoidSet, rng)], rng);
}

/** Configuração vinda do lobby, validada (o que vier errado fica como estava). */
export function parseSettings(raw: unknown, prev: Settings = DEFAULT_SETTINGS): Settings {
  const r = (raw ?? {}) as Partial<Settings>;
  return {
    words: typeof r.words === "string" ? r.words.slice(0, MAX_WORDS_TEXT) : prev.words,
    time: (TIME_OPTIONS as readonly number[]).includes(Number(r.time)) ? Number(r.time) : prev.time,
  };
}

/* ---------- partida ---------- */

export function newGame(
  rng: () => number,
  { players, settings }: { players: Seat[]; settings: Settings },
  prev?: GameState | null,
): GameState {
  const starter: Team = prev ? other(prev.starter) : rng() < 0.5 ? 0 : 1;
  const keys: Key[] = shuffle(
    [
      ...Array<Key>(STARTER_CARDS).fill(starter),
      ...Array<Key>(OTHER_CARDS).fill(other(starter)),
      ...Array<Key>(NEUTRAL_CARDS).fill("neutral"),
      "assassin",
    ],
    rng,
  );
  const words = pickWords(parseWords(settings.words), rng, prev?.cards.map((c) => c.word));
  return {
    gameNo: (prev?.gameNo ?? 0) + 1,
    settings,
    players: [...players].filter((p) => p >= 0 && p < SEATS).sort((a, b) => a - b),
    cards: words.map((word, i): Card => ({ word, key: keys[i], revealed: false })),
    starter,
    turn: starter,
    phase: "clue",
    phaseNo: 0,
    clues: [],
    guessesLeft: null,
    marks: {},
    last: null,
    timeout: null,
    winner: null,
    reason: null,
  };
}

/** Palavras que faltam revelar de um time. */
export const remaining = (s: Pick<GameState, "cards">, team: Team) => s.cards.filter((c) => c.key === team && !c.revealed).length;

const isMasterOfTurn = (s: GameState, seat: Seat) => s.players.includes(seat) && teamOf(seat) === s.turn && roleOf(seat) === "master";
const isAgentOfTurn = (s: GameState, seat: Seat) => s.players.includes(seat) && teamOf(seat) === s.turn && roleOf(seat) === "agent";

export const canClue = (s: GameState, seat: Seat) => s.phase === "clue" && isMasterOfTurn(s, seat);
export const canGuess = (s: GameState, seat: Seat) => s.phase === "guess" && isAgentOfTurn(s, seat);
/** Passar só depois do primeiro toque com a dica. */
export const canPass = (s: GameState, seat: Seat) => canGuess(s, seat) && (s.clues.at(-1)?.guesses.length ?? 0) > 0;

/** Dica: uma palavra só (hífen vale), sem número, e que não seja uma palavra ainda coberta na mesa. */
export function clueError(s: { cards: { word: string; revealed: boolean }[] }, word: string): string | null {
  const w = word.trim();
  if (!w) return "Digite a dica";
  if (/\s/.test(w)) return "Uma palavra só";
  if (w.length > MAX_CLUE) return "Dica muito longa";
  if (/\d/.test(w)) return "Sem números";
  const n = normalize(w);
  if (s.cards.some((c) => !c.revealed && normalize(c.word) === n)) return "Essa palavra está na mesa";
  return null;
}

function nextTurn(s: GameState) {
  s.turn = other(s.turn);
  s.phase = "clue";
  s.phaseNo++;
  s.guessesLeft = null;
  s.marks = {};
}

function finish(s: GameState, winner: Team, reason: "cards" | "assassin") {
  s.winner = winner;
  s.reason = reason;
  s.phase = "gameOver";
  s.phaseNo++;
  s.marks = {};
}

export function applyAction(state: GameState, action: Action): Result {
  const fail = (error: string): Result => ({ ok: false, error });
  if (state.phase === "gameOver") return fail("Partida encerrada");
  const s = structuredClone(state);

  if (action.type === "advance") {
    // acabou o tempo: a vez passa
    s.timeout = { id: (s.timeout?.id ?? 0) + 1, team: s.turn, phase: s.phase as "clue" | "guess" };
    nextTurn(s);
    return { ok: true, state: s };
  }

  const seat = action.seat;
  if (!s.players.includes(seat)) return fail("Você não está na partida");

  switch (action.type) {
    case "clue": {
      if (!canClue(s, seat)) return fail("Não é sua vez de dar a dica");
      const word = String(action.word ?? "").trim();
      const err = clueError(s, word);
      if (err) return fail(err);
      const n = action.number;
      if (n !== null && !(Number.isInteger(n) && n >= 0 && n <= 9)) return fail("Número inválido");
      s.clues.push({ team: s.turn, seat, word, number: n, guesses: [] });
      s.guessesLeft = n === null || n === 0 ? null : n + 1;
      s.phase = "guess";
      s.phaseNo++;
      s.marks = {};
      return { ok: true, state: s };
    }

    case "mark": {
      if (!canGuess(s, seat)) return fail("Não é sua vez");
      const i = action.index;
      // null: limpa as marcas do agente
      if (i === null) {
        delete s.marks[seat];
        return { ok: true, state: s };
      }
      if (!Number.isInteger(i) || i < 0 || i >= BOARD || s.cards[i].revealed) return fail("Palavra inválida");
      const mine = s.marks[seat] ?? [];
      const next = mine.includes(i) ? mine.filter((m) => m !== i) : [...mine, i];
      if (next.length) s.marks[seat] = next;
      else delete s.marks[seat];
      return { ok: true, state: s };
    }

    case "guess": {
      if (!canGuess(s, seat)) return fail("Não é sua vez");
      const i = action.index;
      if (!Number.isInteger(i) || i < 0 || i >= BOARD) return fail("Palavra inválida");
      const card = s.cards[i];
      if (card.revealed) return fail("Palavra já revelada");
      card.revealed = true;
      s.clues.at(-1)!.guesses.push(i);
      s.last = { id: (s.last?.id ?? 0) + 1, index: i, seat };
      for (const [k, v] of Object.entries(s.marks)) {
        const rest = v.filter((m) => m !== i);
        if (rest.length) s.marks[Number(k)] = rest;
        else delete s.marks[Number(k)];
      }

      const team = s.turn;
      if (card.key === "assassin") {
        finish(s, other(team), "assassin");
      } else if (remaining(s, team) === 0) {
        finish(s, team, "cards");
      } else if (remaining(s, other(team)) === 0) {
        finish(s, other(team), "cards");
      } else if (card.key === team) {
        if (s.guessesLeft !== null) s.guessesLeft--;
        if (s.guessesLeft === 0) nextTurn(s);
      } else {
        nextTurn(s);
      }
      return { ok: true, state: s };
    }

    case "pass": {
      if (!canPass(s, seat)) return fail("Toque em pelo menos uma palavra");
      nextTurn(s);
      return { ok: true, state: s };
    }
  }
  return fail("Ação inválida");
}
