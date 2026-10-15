// Medidas do campo (origem no centro; x para a direita, y para baixo) e da física.

/** Metade do comprimento e da largura do campo (até as linhas). */
export const HALF_W = 420;
export const HALF_H = 200;
/** Metade da boca do gol e profundidade da rede. */
export const GOAL_HALF = 64;
export const GOAL_DEPTH = 36;
export const CENTER_R = 70;
/** Até onde os botões podem ir além das linhas. */
export const MARGIN = 36;

export const BALL_R = 10;
export const PLAYER_R = 15;
export const POST_R = 7;

/** Física por passo (60 por segundo). */
export const PLAYER_ACCEL = 0.11;
export const PLAYER_KICK_ACCEL = 0.075;
export const PLAYER_DAMP = 0.96;
export const BALL_DAMP = 0.99;
/** Massa inversa: a bola é mais leve que o botão. */
export const BALL_INV_MASS = 1;
export const PLAYER_INV_MASS = 0.5;
export const BOUNCE_BALL_PLAYER = 0.5;
export const BOUNCE_PLAYERS = 0.5;
export const BOUNCE_WALL = 0.5;
export const BOUNCE_POST = 0.5;
/** Folga entre o botão e a bola para o chute pegar, e a força dele. */
export const KICK_RANGE = 4;
export const KICK_POWER = 5;

export interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

const seg = (ax: number, ay: number, bx: number, by: number): Segment => ({ ax, ay, bx, by });

/** Paredes que a bola enxerga: as linhas do campo (com a boca dos gols aberta) e as redes. */
export const BALL_WALLS: Segment[] = [
  seg(-HALF_W, -HALF_H, HALF_W, -HALF_H),
  seg(-HALF_W, HALF_H, HALF_W, HALF_H),
  seg(-HALF_W, -HALF_H, -HALF_W, -GOAL_HALF),
  seg(-HALF_W, GOAL_HALF, -HALF_W, HALF_H),
  seg(HALF_W, -HALF_H, HALF_W, -GOAL_HALF),
  seg(HALF_W, GOAL_HALF, HALF_W, HALF_H),
  // redes
  seg(-HALF_W, -GOAL_HALF, -HALF_W - GOAL_DEPTH, -GOAL_HALF),
  seg(-HALF_W - GOAL_DEPTH, -GOAL_HALF, -HALF_W - GOAL_DEPTH, GOAL_HALF),
  seg(-HALF_W - GOAL_DEPTH, GOAL_HALF, -HALF_W, GOAL_HALF),
  seg(HALF_W, -GOAL_HALF, HALF_W + GOAL_DEPTH, -GOAL_HALF),
  seg(HALF_W + GOAL_DEPTH, -GOAL_HALF, HALF_W + GOAL_DEPTH, GOAL_HALF),
  seg(HALF_W + GOAL_DEPTH, GOAL_HALF, HALF_W, GOAL_HALF),
];

/** Traves (círculos fixos nos cantos da boca do gol). */
export const POSTS: { x: number; y: number }[] = [
  { x: -HALF_W, y: -GOAL_HALF },
  { x: -HALF_W, y: GOAL_HALF },
  { x: HALF_W, y: -GOAL_HALF },
  { x: HALF_W, y: GOAL_HALF },
];

/** Para onde cada time ataca: +1 = gol da direita. */
export const attackDir = (team: 0 | 1) => (team === 0 ? 1 : -1);

/** Posições da saída de bola por time e quantidade, para o time vermelho (o azul espelha x). */
export const FORMATIONS: Record<number, { x: number; y: number }[]> = {
  1: [{ x: -200, y: 0 }],
  2: [
    { x: -170, y: -70 },
    { x: -300, y: 60 },
  ],
  3: [
    { x: -160, y: 0 },
    { x: -260, y: -110 },
    { x: -320, y: 90 },
  ],
};
