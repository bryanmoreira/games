/*
 * Mesa de sinuca vista de cima, para o card da página inicial e a prévia de link. Com `play`, no hover do card
 * o taco bate, a branca corre até a 8 e a 8 cai na caçapa do canto (classes .hc-sn-* em globals.css).
 * Os pedaços são funções (não componentes) porque a prévia de link (Satori) só aceita elementos do próprio SVG.
 */

const COLORS: Record<number, string> = { 1: "#f4c20d", 2: "#1d4fc4", 3: "#d8231f", 4: "#5a2a8c", 5: "#f2750f", 6: "#0e7d3c", 7: "#7c1c1c", 8: "#121212" };
const W = 260;
const H = 150;
const RAIL = 13;
const BALL = 6.5;
const POCKETS: [number, number][] = [
  [RAIL, RAIL],
  [W / 2, RAIL - 2],
  [W - RAIL, RAIL],
  [RAIL, H - RAIL],
  [W / 2, H - RAIL + 2],
  [W - RAIL, H - RAIL],
];

function ball(n: number, x: number, y: number, key?: string) {
  const color = n === 0 ? "#f6f2e6" : COLORS[n > 8 ? n - 8 : n];
  return (
    <g key={key ?? `b${n}`}>
      <circle cx={x + 1.2} cy={y + 1.6} r={BALL} fill="rgba(0,0,0,0.35)" />
      <circle cx={x} cy={y} r={BALL} fill={n > 8 ? "#f6f2e6" : color} />
      {n > 8 && <rect x={x - BALL * 0.92} y={y - BALL * 0.5} width={BALL * 1.84} height={BALL} rx={BALL * 0.3} fill={color} />}
      {n > 0 && <circle cx={x} cy={y} r={BALL * 0.42} fill="#f6f2e6" />}
      <circle cx={x - BALL * 0.35} cy={y - BALL * 0.38} r={BALL * 0.3} fill="rgba(255,255,255,0.55)" />
    </g>
  );
}

/** A 8 está aqui e cai na caçapa do canto de cima à direita; a branca vem de baixo à esquerda. */
const EIGHT = { x: 205, y: 42 };
const CUE = { x: 92, y: 100 };

export function SinucaArt({ className, width, height, play = false }: { className?: string; width?: number; height?: number; play?: boolean }) {
  // direção da 8 para a caçapa e o ponto de contato da branca
  const [px, py] = POCKETS[2];
  const dl = Math.hypot(px - EIGHT.x, py - EIGHT.y);
  const ux = (px - EIGHT.x) / dl;
  const uy = (py - EIGHT.y) / dl;
  const gx = EIGHT.x - ux * BALL * 2;
  const gy = EIGHT.y - uy * BALL * 2;
  const sx = CUE.x - gx;
  const sy = CUE.y - gy;
  const sl = Math.hypot(sx, sy);
  const bx = sx / sl;
  const by = sy / sl;
  const stick = (from: number, to: number) => `M${CUE.x + bx * from} ${CUE.y + by * from}L${CUE.x + bx * to} ${CUE.y + by * to}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={width} height={height} className={className} aria-hidden="true" style={{ overflow: "visible" }}>
      <rect x="0" y="0" width={W} height={H} rx="12" fill="#7a4220" />
      <rect x="4" y="4" width={W - 8} height={H - 8} rx="9" fill="#8f4f27" />
      <rect x={RAIL - 4} y={RAIL - 4} width={W - 2 * RAIL + 8} height={H - 2 * RAIL + 8} rx="3" fill="#0d6034" />
      <rect x={RAIL} y={RAIL} width={W - 2 * RAIL} height={H - 2 * RAIL} fill="#178548" />
      {[-3, -2, -1, 1, 2, 3].map((k) => (
        <g key={k} fill="#f3e6c8">
          <circle cx={W / 2 + (k * (W - 2 * RAIL)) / 8} cy="6.5" r="1.4" />
          <circle cx={W / 2 + (k * (W - 2 * RAIL)) / 8} cy={H - 6.5} r="1.4" />
        </g>
      ))}
      {POCKETS.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="8.5" fill="#070707" />
      ))}
      <path d={`M${RAIL + 50} ${RAIL}V${H - RAIL}`} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      {ball(3, 160, 98)}
      {ball(11, 172, 106)}
      {ball(2, 214, 96)}
      {ball(14, 125, 58)}
      {ball(6, 60, 44)}
      {ball(12, 228, 120)}
      {/* linha de mira até a bola fantasma */}
      {!play && <path d={`M${CUE.x - bx * BALL} ${CUE.y - by * BALL}L${gx + bx * BALL} ${gy + by * BALL}`} stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeDasharray="3 3" />}
      {!play && <circle cx={gx} cy={gy} r={BALL} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />}
      <g className={play ? "hc-sn-eight" : undefined}>{ball(8, EIGHT.x, EIGHT.y)}</g>
      <g className={play ? "hc-sn-white" : undefined} style={play ? ({ "--tx": `${-sx}px`, "--ty": `${-sy}px` } as React.CSSProperties) : undefined}>
        {ball(0, CUE.x, CUE.y)}
      </g>
      <g className={play ? "hc-sn-cue" : undefined}>
        <path d={stick(BALL + 3, BALL + 150)} stroke="rgba(0,0,0,0.35)" strokeWidth="5" strokeLinecap="round" transform="translate(1.5 2)" />
        <path d={stick(BALL + 3, BALL + 150)} stroke="#e2c08a" strokeWidth="4" strokeLinecap="round" />
        <path d={stick(BALL + 95, BALL + 150)} stroke="#4a2412" strokeWidth="5" strokeLinecap="round" />
        <path d={stick(BALL + 3, BALL + 6)} stroke="#3a72d8" strokeWidth="4" />
      </g>
    </svg>
  );
}

/** Deslocamento da 8 até a caçapa, para o CSS do hover. */
export const SINUCA_ART_EIGHT = { x: POCKETS[2][0] - EIGHT.x, y: POCKETS[2][1] - EIGHT.y };
