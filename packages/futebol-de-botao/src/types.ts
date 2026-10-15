/*
 * Futebol de Botão — regras
 * - Futebol visto de cima, em tempo real. Cada jogador é um botão (disco) e há uma bola.
 * - De 1×1 a 3×3. Lugares pares = time vermelho (ataca para a direita), ímpares = time azul.
 * - Controles: direção (setas/WASD ou direcional) e um botão de chute. Segurando o chute, o botão
 *   anda um pouco mais devagar e chuta a bola assim que encosta nela; para chutar de novo, solta e aperta.
 * - Gol quando a bola passa inteira da linha entre as traves.
 * - Saída de bola no centro: começa o time vermelho e, depois de cada gol, quem sofreu. Até alguém tocar
 *   na bola, cada time fica no seu campo e quem não sai fica fora do círculo central.
 * - A partida acaba quando um time faz 3 gols ou quando acabam os 3 minutos. Empate no fim do tempo:
 *   gol de ouro (o próximo gol vence).
 * - O relógio para durante a comemoração do gol e o "prepara" da saída de bola.
 */

/** Passos de física por segundo (o servidor roda nesse ritmo). */
export const TICK_RATE = 60;
export const TICK_MS = 1000 / TICK_RATE;
/** Gols para vencer. */
export const GOALS_TO_WIN = 3;
/** Duração do tempo normal, em passos. */
export const MATCH_TICKS = 3 * 60 * TICK_RATE;
/** Botões parados antes da saída de bola. */
export const FREEZE_TICKS = 45;
/** Comemoração do gol antes da próxima saída. */
export const GOAL_TICKS = 150;

export const MAX_PLAYERS = 6;
export type Team = 0 | 1;
export const teamOf = (seat: number): Team => (seat % 2) as Team;

export interface Disc {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Player extends Disc {
  seat: number;
  team: Team;
  /** Número na camisa (1, 2, 3 dentro do time). */
  number: number;
  /** Direção pedida (cada eixo de -1 a 1). */
  dx: number;
  dy: number;
  /** Botão de chute segurado. */
  kick: boolean;
  /** Pode chutar (soltou o botão desde o último chute). */
  kickReady: boolean;
}

export type Phase = "kickoff" | "play" | "goal" | "over";

export interface Goal {
  team: Team;
  /** Quem fez (último a tocar); null se ninguém tocou. */
  seat: number | null;
  /** Gol contra (o último toque foi do time que sofreu). */
  own: boolean;
  /** Passo da partida em que saiu. */
  tick: number;
}

export interface GameState {
  /** Passos desde o começo da partida. */
  tick: number;
  phase: Phase;
  /** Passos restantes de botões parados (saída de bola) ou de comemoração (gol). */
  wait: number;
  /** Passos restantes do tempo normal. */
  timeLeft: number;
  /** Tempo acabou empatado: o próximo gol vence. */
  golden: boolean;
  score: [number, number];
  kickoffTeam: Team;
  ball: Disc;
  players: Player[];
  goals: Goal[];
  /** Último a tocar na bola. */
  lastTouch: number | null;
  /** Maior desvantagem que cada time teve no placar. */
  maxDeficit: [number, number];
  winner: Team | null;
  /** Contadores para a interface tocar os sons uma vez só. */
  kicks: number;
  posts: number;
}

export type Action =
  | { type: "input"; seat: number; dx: number; dy: number; kick: boolean }
  /** Não usado pelo jogo (o tempo anda pelo `step`); aceito para o servidor de salas. */
  | { type: "advance" };

/** Sem informação escondida: todos veem o campo inteiro. */
export interface PlayerView {
  me: number | null;
  tick: number;
  phase: Phase;
  wait: number;
  timeLeft: number;
  golden: boolean;
  score: [number, number];
  kickoffTeam: Team;
  ball: Disc;
  players: Player[];
  goals: Goal[];
  winner: Team | null;
  kicks: number;
  posts: number;
}
