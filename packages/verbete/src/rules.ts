import { LENGTH, MAX_GUESSES, plain, type Mark, type Mode } from "./modes";
import { ANSWERS, EXTRA } from "./words";

// Verbete: regras do jogo.
// - Adivinhe a palavra de 5 letras. Verbete (1 palavra) tem 6 tentativas, Dueto (2) tem 7, Quarteto (4) tem 9.
// - Cada chute vale para todos os quadros ainda não resolvidos.
// - Verde: letra no lugar certo. Amarelo: a letra existe em outro lugar. Cinza: não existe (ou já foi marcada todas as vezes).
// - Letras podem se repetir; o chute só leva tantas marcas de uma letra quantas vezes ela aparece na resposta.
// - Acentos e cedilha são preenchidos sozinhos e não contam nas dicas (ç = c).
// - Só valem palavras da lista; palavra fora dela não gasta tentativa.
// - As respostas saem só das palavras comuns (ANSWERS); as raras (EXTRA) valem só como chute.

let byKey: Map<string, string> | null = null;
const dict = () => (byKey ??= new Map([...ANSWERS, ...EXTRA].map((w) => [plain(w), w])));

/** A palavra com acento, ou null se não está na lista. */
export const accented = (word: string): string | null => dict().get(plain(word)) ?? null;
export const isWord = (word: string) => dict().has(plain(word));

let answerKeys: Set<string> | null = null;
/** Está entre as palavras que podem ser resposta. */
export const isAnswer = (word: string) => (answerKeys ??= new Set(ANSWERS.map(plain))).has(plain(word));

/** Marcas de um chute contra a resposta (os dois sem acento). */
export function score(guess: string, answer: string): Mark[] {
  const g = plain(guess);
  const a = plain(answer);
  const marks: Mark[] = Array(LENGTH).fill("absent");
  const left = new Map<string, number>();
  for (let i = 0; i < LENGTH; i++) {
    if (g[i] === a[i]) marks[i] = "right";
    else left.set(a[i], (left.get(a[i]) ?? 0) + 1);
  }
  for (let i = 0; i < LENGTH; i++) {
    if (marks[i] === "right") continue;
    const n = left.get(g[i]) ?? 0;
    if (n > 0) {
      marks[i] = "place";
      left.set(g[i], n - 1);
    }
  }
  return marks;
}

export interface GameState {
  mode: Mode;
  /** respostas sem acento, uma por quadro */
  answers: string[];
  /** chutes aceitos, sem acento */
  guesses: string[];
}

export type Status = "playing" | "won" | "lost";

export function newGame(mode: Mode, answers: string[]): GameState {
  if (answers.length !== mode) throw new Error(`o modo ${mode} pede ${mode} palavras`);
  return { mode, answers: answers.map(plain), guesses: [] };
}

/** Tentativa (0 = primeira) em que o quadro foi resolvido, ou -1. */
export const solvedAt = (s: GameState, board: number) => s.guesses.indexOf(s.answers[board]);
export const isSolved = (s: GameState, board: number) => solvedAt(s, board) >= 0;

export function status(s: GameState): Status {
  if (s.answers.every((_, b) => isSolved(s, b))) return "won";
  return s.guesses.length >= MAX_GUESSES[s.mode] ? "lost" : "playing";
}

/** Chutes que entraram no quadro: até o que o resolveu. */
export function boardGuesses(s: GameState, board: number): string[] {
  const at = solvedAt(s, board);
  return at < 0 ? s.guesses : s.guesses.slice(0, at + 1);
}

export type GuessError = "short" | "unknown" | "over";

export function guess(s: GameState, word: string): { ok: true; state: GameState } | { ok: false; error: GuessError } {
  if (status(s) !== "playing") return { ok: false, error: "over" };
  const w = plain(word);
  if (!/^[a-z]{5}$/.test(w)) return { ok: false, error: "short" };
  if (!isWord(w)) return { ok: false, error: "unknown" };
  return { ok: true, state: { ...s, guesses: [...s.guesses, w] } };
}

/** Refaz uma partida a partir dos chutes. null = algum chute inválido ou depois do fim. */
export function replay(mode: Mode, answers: string[], guesses: string[]): GameState | null {
  if (answers.length !== mode || new Set(answers.map(plain)).size !== mode || !answers.every(isAnswer)) return null;
  let s = newGame(mode, answers);
  for (const g of guesses) {
    const r = guess(s, g);
    if (!r.ok) return null;
    s = r.state;
  }
  return s;
}

const RANK: Record<Mark, number> = { absent: 0, place: 1, right: 2 };

/** Melhor marca de cada letra num quadro (para o teclado). */
export function letterMarks(s: GameState, board: number): Record<string, Mark> {
  const out: Record<string, Mark> = {};
  for (const g of boardGuesses(s, board)) {
    const marks = score(g, s.answers[board]);
    for (let i = 0; i < LENGTH; i++) {
      const prev = out[g[i]];
      if (!prev || RANK[marks[i]] > RANK[prev]) out[g[i]] = marks[i];
    }
  }
  return out;
}

// ---------- sorteio ----------

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `n` respostas diferentes (com acento), fora as de `skip`. */
export function pickWords(n: number, rng: Rng = Math.random, skip: Iterable<string> = []): string[] {
  const out: string[] = [];
  const used = new Set([...skip].map(plain));
  while (out.length < n) {
    const w = ANSWERS[Math.floor(rng() * ANSWERS.length)];
    if (used.has(plain(w))) continue;
    used.add(plain(w));
    out.push(w);
  }
  return out;
}

// ---------- palavras do dia ----------
// Sem sorteio: uma sequência fixa e embaralhada das respostas, lida em ordem.
// Cada dia usa as 7 seguintes (1 do Verbete, 2 do Dueto, 4 do Quarteto), então ninguém repete no mesmo dia
// e cada palavra aparece uma vez por ciclo (1.442 / 7 = 206 dias). Cada ciclo é outro embaralhamento, e as
// palavras do fim de um ciclo não estão no começo do próximo: entre duas vezes da mesma palavra passam pelo
// menos `MIN_GAP_DAYS` dias. Mudar a lista de respostas muda a sequência; os dias já gerados ficam no banco.

export const DAILY_COUNT = 7;
export const MIN_GAP_DAYS = 30;
const DAILY_SEED = 0x7e7b37e;

const cycles: number[][] = [];

/** Ordem das respostas (índices em ANSWERS) no ciclo `c`. */
function cycle(c: number): number[] {
  while (cycles.length <= c) {
    const k = cycles.length;
    const rng = mulberry32(DAILY_SEED + k);
    const p = ANSWERS.map((_, i) => i);
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    if (k > 0) {
      // as palavras dos últimos dias do ciclo anterior vão para depois do começo deste
      const gap = MIN_GAP_DAYS * DAILY_COUNT;
      const recent = new Set(cycles[k - 1].slice(-gap));
      for (let i = 0; i < gap; i++) {
        if (!recent.has(p[i])) continue;
        let j: number;
        do j = gap + Math.floor(rng() * (p.length - gap));
        while (recent.has(p[j]));
        [p[i], p[j]] = [p[j], p[i]];
      }
    }
    cycles.push(p);
  }
  return cycles[c];
}

/** Palavras do dia `day` (0 = primeiro dia): uma para o Verbete, duas para o Dueto e quatro para o Quarteto, todas diferentes. */
export function dailyWords(day: number): Record<`${Mode}`, string[]> {
  const perCycle = Math.floor(ANSWERS.length / DAILY_COUNT);
  const order = cycle(Math.floor(day / perCycle));
  const at = (day % perCycle) * DAILY_COUNT;
  const all = order.slice(at, at + DAILY_COUNT).map((i) => ANSWERS[i]);
  return { 1: all.slice(0, 1), 2: all.slice(1, 3), 4: all.slice(3, 7) };
}

// ---------- compartilhar ----------

const SQUARE: Record<Mark, string> = { right: "🟩", place: "🟨", absent: "⬛" };
const KEYCAP = (n: number) => `${n}️⃣`;
/** Lugar de um quadro que já acabou, para o da direita continuar alinhado. */
const BLANK = "　".repeat(LENGTH);

/** Marcas de cada linha de cada quadro (até o chute que o resolveu): o que a imagem e o texto desenham. */
export const boardMarks = (s: GameState): Mark[][][] => s.answers.map((a, b) => boardGuesses(s, b).map((g) => score(g, a)));

/**
 * Resultado em emojis, sem as letras:
 * Verbete com "3/6" e a grade; Dueto e Quarteto com a tentativa de cada palavra (🟥 na que faltou),
 * o Dueto com as duas grades lado a lado (no Quarteto a grade vai na imagem). `streak` > 0 entra como 🔥.
 */
export function shareText(s: GameState, title: string, streak = 0): string {
  const won = status(s) === "won";
  const fire = streak > 0 ? ` 🔥 ${streak}` : "";
  const line = (ms: Mark[]) => ms.map((m) => SQUARE[m]).join("");
  const grids = boardMarks(s);
  if (s.mode === 1) return [`${title} ${won ? s.guesses.length : "X"}/${MAX_GUESSES[1]}${fire}`, "", ...grids[0].map(line)].join("\n");
  const cells = s.answers.map((_, b) => (isSolved(s, b) ? KEYCAP(solvedAt(s, b) + 1) : "🟥"));
  const tries = s.mode === 2 ? [cells.join("")] : [cells.slice(0, 2).join(""), cells.slice(2).join("")];
  const out = [`${title}${fire}`, "", ...tries];
  if (s.mode === 2) {
    const rows = Math.max(grids[0].length, grids[1].length);
    out.push("", ...Array.from({ length: rows }, (_, r) => `${grids[0][r] ? line(grids[0][r]) : BLANK} ${grids[1][r] ? line(grids[1][r]) : ""}`.trimEnd()));
  }
  return out.join("\n");
}
