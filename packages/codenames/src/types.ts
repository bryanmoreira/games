/*
 * Codenames — regras
 * - Só online, sem IA. Dois times (vermelho e azul), cada um com 1 mestre e de 1 a 5 agentes.
 *   Para começar, cada time precisa do mestre e de pelo menos 1 agente.
 * - Mesa de 25 palavras. O time que começa tem 9 palavras, o outro 8; 7 são civis (neutras) e 1 é o assassino.
 *   Só os mestres veem o mapa com a cor de cada palavra.
 * - Palavras: o host cola uma lista no lobby (uma por linha). Com 25 ou mais, sorteia 25 da lista;
 *   com menos, completa com a lista pronta. No "De novo", evita repetir as palavras da partida anterior.
 * - Na vez do time, o mestre digita a dica: UMA palavra (sem espaço e diferente das palavras ainda cobertas)
 *   e um número de 0 a 9 ou ∞. Com número N (1 a 9), os agentes podem tocar até N+1 palavras; com 0 ou ∞, sem limite.
 * - Agentes marcam palavras (cada um pode marcar várias; todos veem as marcas) e qualquer agente do time
 *   revela uma por vez.
 *   Palavra do próprio time: continua (enquanto houver toques). Civil ou do adversário: a vez passa.
 *   Assassino: o time perde na hora. Depois do primeiro toque, os agentes podem PASSAR.
 * - Vence quem tiver todas as suas palavras reveladas (mesmo que o adversário revele a última).
 * - Tempo (opcional, escolhido pelo host): o mesmo limite vale para o mestre dar a dica e, reiniciado,
 *   para os agentes tocarem. Acabou o tempo, a vez passa.
 * - O time que começa é sorteado na primeira partida e alterna no "De novo".
 */

export const TEAM_SEATS = 6;
export const MASTER_SLOTS = 1;
export const SEATS = TEAM_SEATS * 2;
export const BOARD = 25;
/** Palavras do time que começa, do outro e civis (o que sobra é o assassino). */
export const STARTER_CARDS = 9;
export const OTHER_CARDS = 8;
export const NEUTRAL_CARDS = 7;

export const MAX_CLUE = 20;
export const MAX_WORD = 20;
/** Tamanho máximo do texto da lista de palavras do host. */
export const MAX_WORDS_TEXT = 8000;
/** Segundos por fase; 0 = sem tempo. */
export const TIME_OPTIONS = [0, 60, 90, 120, 180] as const;

export type Seat = number;
/** 0 = vermelho, 1 = azul. */
export type Team = 0 | 1;
export type Role = "master" | "agent";
/** Cor de uma palavra no mapa. */
export type Key = Team | "neutral" | "assassin";

export interface Settings {
  /** Lista do host como foi digitada (uma palavra por linha). */
  words: string;
  time: number;
}

export const DEFAULT_SETTINGS: Settings = { words: "", time: 0 };

export interface Card {
  word: string;
  key: Key;
  revealed: boolean;
}

export interface Clue {
  team: Team;
  seat: Seat;
  word: string;
  /** 0 a 9; null = ∞. */
  number: number | null;
  /** Palavras reveladas com esta dica, na ordem. */
  guesses: number[];
}

/** clue: o mestre do time da vez dá a dica · guess: os agentes tocam nas palavras · gameOver: fim. */
export type Phase = "clue" | "guess" | "gameOver";

export interface GameState {
  gameNo: number;
  settings: Settings;
  /** Lugares que jogam esta partida. */
  players: Seat[];
  cards: Card[];
  starter: Team;
  turn: Team;
  phase: Phase;
  /** Cresce a cada mudança de fase (o servidor usa para não reiniciar o relógio). */
  phaseNo: number;
  /** Dicas da partida; a última é a atual durante "guess". */
  clues: Clue[];
  /** Toques que ainda restam com a dica atual (null = sem limite). */
  guessesLeft: number | null;
  /** Palavras marcadas por cada agente do time da vez (várias por agente). */
  marks: Record<Seat, number[]>;
  /** Última palavra revelada (a UI anima e toca som uma vez por id). */
  last: { id: number; index: number; seat: Seat } | null;
  /** A vez passou por tempo (para a UI avisar). */
  timeout: { id: number; team: Team; phase: "clue" | "guess" } | null;
  winner: Team | null;
  reason: "cards" | "assassin" | null;
}

export type Action =
  | { type: "clue"; seat: Seat; word: string; number: number | null }
  | { type: "mark"; seat: Seat; index: number | null }
  | { type: "guess"; seat: Seat; index: number }
  | { type: "pass"; seat: Seat }
  | { type: "advance" };

/** Ação como sai do cliente (o servidor injeta o assento). */
export type ClientAction =
  | { type: "clue"; word: string; number: number | null }
  | { type: "mark"; index: number | null }
  | { type: "guess"; index: number }
  | { type: "pass" };

export interface ViewCard {
  word: string;
  /** null: cor escondida (agente olhando palavra coberta). */
  key: Key | null;
  revealed: boolean;
}

export interface PlayerView {
  /** -1 para quem só está assistindo. */
  seat: Seat;
  team: Team;
  role: Role;
  /** Assistindo sem lugar na partida: vê a mesa como um agente (sem o mapa) até o fim. */
  spectator: boolean;
  gameNo: number;
  time: number;
  players: Seat[];
  cards: ViewCard[];
  starter: Team;
  turn: Team;
  phase: Phase;
  phaseNo: number;
  clues: Clue[];
  /** Dica valendo agora (só na fase "guess"). */
  clue: Clue | null;
  guessesLeft: number | null;
  marks: Record<Seat, number[]>;
  last: GameState["last"];
  timeout: GameState["timeout"];
  /** Palavras que faltam para cada time. */
  left: [number, number];
  winner: Team | null;
  reason: GameState["reason"];
  canClue: boolean;
  canGuess: boolean;
  canPass: boolean;
}
