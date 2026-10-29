// Quente ou Frio: o que o navegador precisa saber, sem o vocabulário nem a palavra secreta.
// - Descubra a palavra secreta. Tentativas ilimitadas.
// - Cada chute ganha uma posição pela proximidade de sentido com a secreta: a secreta é a nº 1.
// - Acento, maiúscula, plural e conjugação não contam: "Casas" vale como casa, "corri" como correr.
// - Palavra fora do vocabulário ou já chutada não conta como tentativa.
// - Dica: revela uma palavra na metade da sua melhor posição (300 sem nenhum chute); com a melhor na 2, a próxima livre depois dela.
// - Desistir mostra a secreta e conta como derrota.

/** Sem acento, sem cedilha e em minúsculas. */
export const plain = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Até aqui é quente (verde); até `WARM` é morno (amarelo); depois, frio (vermelho). */
export const HOT = 300;
export const WARM = 1500;
/** Posição da primeira dica, sem nenhum chute. */
export const FIRST_HINT = 300;
/** Quantas palavras mais próximas aparecem no fim. */
export const CLOSEST = 100;

export type Heat = "hot" | "warm" | "cold";
export const heat = (rank: number): Heat => (rank <= HOT ? "hot" : rank <= WARM ? "warm" : "cold");

/** Um chute ou uma dica: a palavra-base e a posição dela (1 = a secreta). */
export interface Move {
  word: string;
  rank: number;
  hint?: boolean;
}

export interface GameState {
  moves: Move[];
  gaveUp?: boolean;
}

export type Status = "playing" | "won" | "lost";

export const newGame = (): GameState => ({ moves: [] });

export function status(s: GameState): Status {
  if (s.moves.some((m) => m.rank === 1)) return "won";
  return s.gaveUp ? "lost" : "playing";
}

/** Tentativas: os chutes, sem as dicas. */
export const attempts = (s: GameState) => s.moves.filter((m) => !m.hint).length;
export const hintsUsed = (s: GameState) => s.moves.filter((m) => m.hint).length;
/** Melhor posição até agora (Infinity sem nada). */
export const best = (s: GameState) => Math.min(Infinity, ...s.moves.map((m) => m.rank));
/** Melhor posição antes de acertar (a dos chutes e dicas que não são a secreta). */
export const bestBefore = (s: GameState) => Math.min(Infinity, ...s.moves.filter((m) => m.rank > 1).map((m) => m.rank));

/**
 * Posição que a próxima dica revela: metade da melhor (300 sem nada).
 * As posições abaixo da melhor estão todas livres; com a melhor na 2, a primeira livre depois dela.
 */
export function hintRank(s: GameState, total: number): number | null {
  const b = best(s);
  if (b === Infinity) return Math.min(FIRST_HINT, total);
  if (b === 1) return null;
  const half = Math.max(2, Math.floor(b / 2));
  if (half < b) return half;
  const taken = new Set(s.moves.map((m) => m.rank));
  for (let r = b + 1; r <= total; r++) if (!taken.has(r)) return r;
  return null;
}

/**
 * Comprimento da barra (0 a 100) pela posição, em escala de log: a secreta enche,
 * a última quase some. Faz diferença entre 5 e 50, e quase nenhuma entre 20 mil e 30 mil.
 */
export function barPct(rank: number, total: number): number {
  return Math.max(2, Math.round(100 * (1 - Math.log(rank) / Math.log(total))));
}

/** Movimentos ordenados pela posição (a melhor em cima). */
export const byRank = (moves: readonly Move[]) => [...moves].sort((a, b) => a.rank - b.rank);

/** Texto para compartilhar: tentativas, dicas e uma faixa de quadrados por calor, sem as palavras. */
export function shareText(s: GameState, title: string): string {
  const won = status(s) === "won";
  const n = attempts(s);
  const h = hintsUsed(s);
  const count = { hot: 0, warm: 0, cold: 0 };
  for (const m of s.moves) count[heat(m.rank)]++;
  const line = (k: Heat, sq: string) => (count[k] ? `${sq} ${count[k]}` : "");
  return [
    `${title}`,
    won ? `${n} ${n === 1 ? "tentativa" : "tentativas"}${h ? ` · ${h} ${h === 1 ? "dica" : "dicas"}` : ""}` : "Desisti",
    [line("hot", "🟩"), line("warm", "🟨"), line("cold", "🟥")].filter(Boolean).join("  "),
  ].join("\n");
}
