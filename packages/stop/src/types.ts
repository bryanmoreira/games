/*
 * Stop (Adedonha) — regras
 * - Só online, de 2 a 8 jogadores, sem IA. O host escolhe no lobby as categorias (mínimo 3, das prontas
 *   ou criadas por ele),
 *   o número de rodadas (3, 5 ou 10) e o tempo da rodada (1, 2, 3 min ou sem limite).
 * - Cada rodada sorteia uma letra (sem K, W, X, Y e sem repetir na partida).
 * - Todos escrevem ao mesmo tempo, uma palavra por categoria começando com a letra.
 * - Quem preencher todas as categorias com a letra certa pode apertar STOP: todos travam na hora.
 *   Com tempo limite, a rodada também trava quando o tempo acaba.
 * - Correção: uma categoria por vez. Cada jogador pode votar ✗ nas respostas dos outros.
 *   A resposta é anulada se mais da metade dos outros jogadores presentes votar contra (empate mantém).
 *   A tela avança quando todos os presentes apertam PRONTO ou depois de 30 s.
 * - Resposta vazia ou com outra letra inicial vale 0 sem votação.
 * - Resposta com uma letra só ("B") vale para o STOP, mas entra na correção com ✗ de todos os outros
 *   (anulada); cada um pode tirar o seu voto.
 * - Pontos por categoria: 10 resposta única, 5 repetida (sem diferenciar acento nem maiúscula), 0 vazia ou anulada.
 * - Depois da última rodada, vence a maior soma; empate no topo = empate.
 * - Quem cai continua na partida (o que escreveu fica guardado), mas não conta na maioria nem no PRONTO.
 */

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

/** Letras sorteáveis: sem K, W, X e Y. */
export const LETTERS = "ABCDEFGHIJLMNOPQRSTUVZ".split("");

export const MAX_ANSWER = 40;
export const MIN_CATEGORIES = 3;
/** Temas criados pelo host: quantos e tamanho do nome. */
export const MAX_CUSTOM = 10;
export const MAX_CUSTOM_NAME = 24;

export type Seat = number;

export interface CategoryDef {
  id: string;
  name: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "nome", name: "Nome" },
  { id: "cep", name: "Cidade, estado ou país" },
  { id: "animal", name: "Animal" },
  { id: "fruta", name: "Fruta" },
  { id: "cor", name: "Cor" },
  { id: "objeto", name: "Objeto" },
  { id: "comida", name: "Comida" },
  { id: "profissao", name: "Profissão" },
  { id: "marca", name: "Marca" },
  { id: "filme", name: "Filme ou série" },
  { id: "corpo", name: "Parte do corpo" },
  { id: "famoso", name: "Famoso" },
  { id: "bebida", name: "Bebida" },
  { id: "adjetivo", name: "Adjetivo" },
  { id: "sogra", name: "Minha sogra é..." },
];

export const DEFAULT_CATEGORIES = CATEGORIES.slice(0, 8).map((c) => c.id);
export const ROUND_OPTIONS = [3, 5, 10] as const;
/** Segundos por rodada; 0 = sem limite. */
export const TIME_OPTIONS = [60, 120, 180, 0] as const;

export interface Settings {
  /** Ids das categorias escolhidas (prontas ou `c:<nome>` dos temas criados). */
  categories: string[];
  /** Nomes dos temas criados pelo host. */
  custom: string[];
  rounds: number;
  time: number;
}

export const DEFAULT_SETTINGS: Settings = { categories: DEFAULT_CATEGORIES, custom: [], rounds: 5, time: 120 };

/** Pausas com tempo, disparadas pelo servidor com "advance". */
export const LETTER_MS = 2600;
export const REVIEW_MS = 30_000;
export const ROUND_END_MS = 20_000;

/**
 * letter: roleta sorteando a letra · writing: todos escrevem · review: correção de uma categoria
 * · roundEnd: pontos da rodada · gameOver: fim.
 */
export type Phase = "letter" | "writing" | "review" | "roundEnd" | "gameOver";

export interface RoundResult {
  letter: string;
  /** Respostas por lugar, na ordem das categorias. */
  answers: Record<Seat, string[]>;
  points: Record<Seat, number[]>;
  annulled: Record<Seat, boolean[]>;
  stoppedBy: Seat | null;
}

export interface GameState {
  gameNo: number;
  settings: Settings;
  /** Lugares que jogam esta partida. */
  players: Seat[];
  /** Jogadores desconectados (não contam na maioria nem no PRONTO). */
  away: Seat[];
  round: number;
  /** Letras já sorteadas; a última é a da rodada. */
  letters: string[];
  phase: Phase;
  /** Cresce a cada mudança de fase (o servidor usa para não reiniciar o relógio). */
  phaseNo: number;
  answers: Record<Seat, string[]>;
  stoppedBy: Seat | null;
  /** Categoria em correção. */
  review: number;
  /** votes[categoria][alvo] = quem votou ✗ na resposta do alvo. */
  votes: Record<Seat, Seat[]>[];
  ready: Seat[];
  history: RoundResult[];
  scores: Record<Seat, number>;
}

export type Action =
  | { type: "write"; seat: Seat; cat: number; text: string }
  | { type: "stop"; seat: Seat; answers?: string[] }
  | { type: "vote"; seat: Seat; target: Seat; against: boolean }
  | { type: "ready"; seat: Seat }
  | { type: "away"; seats: Seat[] }
  | { type: "advance" };

/** Ação como sai do cliente (o servidor injeta o assento). */
export type ClientAction =
  | { type: "write"; cat: number; text: string }
  | { type: "stop"; answers?: string[] }
  | { type: "vote"; target: Seat; against: boolean }
  | { type: "ready" };

export interface PlayerView {
  seat: Seat;
  gameNo: number;
  settings: Settings;
  categories: CategoryDef[];
  players: Seat[];
  away: Seat[];
  round: number;
  /** null enquanto a roleta gira. */
  letter: string | null;
  phase: Phase;
  phaseNo: number;
  myAnswers: string[];
  /** Categorias preenchidas com a letra certa, por jogador. */
  progress: Record<Seat, number>;
  /** Respostas de todos: só depois do STOP. */
  answers: Record<Seat, string[]> | null;
  stoppedBy: Seat | null;
  review: number;
  /** Correção da categoria atual: quem votou ✗ em cada um, anulada ou não e pontos do momento. */
  votes: Record<Seat, Seat[]> | null;
  annulled: Record<Seat, boolean> | null;
  points: Record<Seat, number> | null;
  /** Em quem eu posso votar nesta categoria. */
  votable: Seat[];
  ready: Seat[];
  history: RoundResult[];
  scores: Record<Seat, number>;
  canWrite: boolean;
  canStop: boolean;
  canReady: boolean;
}
