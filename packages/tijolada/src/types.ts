/*
 * Tijolada — regras
 * - Campo de 10 colunas × 20 linhas. Caem peças de 4 blocos (I, O, T, S, Z, J, L), sorteadas em
 *   "sacos" de 7: cada peça sai uma vez a cada 7, em ordem embaralhada.
 * - Mover para os lados, girar (nos dois sentidos, com chutes de parede), descer (queda suave, +1 ponto
 *   por linha) e cair de vez (queda instantânea, +2 pontos por linha).
 * - Guardar: troca a peça da vez com a guardada (ou guarda e puxa a próxima). Uma troca por peça.
 * - A peça que encosta no chão ou em blocos trava depois de meio segundo; mexer ou girar adia a trava
 *   até 15 vezes.
 * - Linha completa some. Pontos × nível: 1 linha 100, 2 linhas 300, 3 linhas 500, 4 linhas 800.
 *   4 linhas logo depois de outras 4 (sem limpar 1 a 3 no meio) valem 1,5×. Combo: limpar linhas em
 *   peças seguidas dá 50 × combo × nível a mais.
 * - Solo: o nível sobe a cada 10 linhas. 1×1: os dois recebem as mesmas peças, cada um no seu campo,
 *   e o nível sobe a cada 30 segundos, igual para os dois. A partir do nível 20 a velocidade não sobe mais.
 * - A partida acaba quando a peça nova nasce em cima de blocos. No 1×1 perde quem acabar primeiro;
 *   acabar no mesmo instante é empate.
 */

/** Passos por segundo (o servidor roda nesse ritmo no 1×1). */
export const TICK_RATE = 60;
export const TICK_MS = 1000 / TICK_RATE;

export const COLS = 10;
/** Linhas escondidas acima do campo (onde a peça pode girar logo ao nascer). */
export const HIDDEN = 4;
export const VISIBLE = 20;
export const ROWS = HIDDEN + VISIBLE;

/** Passos que a peça espera no chão antes de travar. */
export const LOCK_TICKS = 30;
/** Quantas vezes mexer/girar no chão adia a trava. */
export const LOCK_RESETS = 15;
export const MAX_LEVEL = 20;
/** Solo: linhas por nível. */
export const LINES_PER_LEVEL = 10;
/** 1×1: passos por nível (30 s). */
export const VERSUS_LEVEL_TICKS = 30 * TICK_RATE;
/** 1×1: contagem antes de começar. */
export const COUNTDOWN_TICKS = 3 * TICK_RATE;
/** Peças à vista na fila. */
export const NEXT_SHOWN = 3;

/** 1 = I, 2 = O, 3 = T, 4 = S, 5 = Z, 6 = J, 7 = L. No campo, 0 é vazio. */
export type Kind = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const KINDS: Kind[] = [1, 2, 3, 4, 5, 6, 7];
export const KIND_NAME: Record<Kind, string> = { 1: "I", 2: "O", 3: "T", 4: "S", 5: "Z", 6: "J", 7: "L" };

/** 0 = nascendo, 1 = girada à direita, 2 = de cabeça para baixo, 3 = girada à esquerda. */
export type Rot = 0 | 1 | 2 | 3;

export interface Piece {
  kind: Kind;
  rot: Rot;
  /** Canto de cima à esquerda da caixa da peça no campo. */
  x: number;
  y: number;
}

export type Mode = "solo" | "versus";

export type Key = "left" | "right" | "down" | "drop" | "cw" | "ccw" | "hold";
export const KEYS: Key[] = ["left", "right", "down", "drop", "cw", "ccw", "hold"];

/** Última limpeza de linhas (a tela anima e toca o som uma vez por `id`). */
export interface Clear {
  id: number;
  /** Linhas do campo que sumiram (antes de descer as de cima). */
  rows: number[];
  /** Pontos que a limpeza deu. */
  points: number;
  b2b: boolean;
  combo: number;
}

export interface Game {
  mode: Mode;
  /** ROWS × COLS, linha a linha de cima para baixo; 0 = vazio, senão o tipo da peça que travou ali. */
  board: number[];
  /**
   * Qual peça ocupa cada casa (1 a 35, repetindo; 0 = vazio): a tela junta as casas da mesma peça num bloco só.
   * Cabe num caractere na mensagem.
   */
  ids: number[];
  piece: Piece | null;
  hold: Kind | null;
  /** Já guardou nesta peça. */
  held: boolean;
  queue: Kind[];
  /** Estado do sorteio (as próximas peças saem dele). */
  rng: number;
  /** Passos já rodados. */
  tick: number;
  /** Gravidade acumulada (1/65536 de linha). */
  acc: number;
  /** Passos parada no chão. */
  lock: number;
  /** Adiamentos da trava já usados nesta peça. */
  resets: number;
  /** Linha mais baixa que a peça já alcançou (zera os adiamentos ao descer mais). */
  low: number;
  level: number;
  lines: number;
  score: number;
  /** Peças seguidas limpando linhas (-1 = nenhuma). */
  combo: number;
  maxCombo: number;
  /** A última limpeza foi de 4 linhas. */
  b2b: boolean;
  tetras: number;
  pieces: number;
  /** Peças travadas (a tela toca o som da trava uma vez por número). */
  locks: number;
  clear: Clear | null;
  over: boolean;
  /** Passo em que acabou. */
  overTick: number | null;
}
