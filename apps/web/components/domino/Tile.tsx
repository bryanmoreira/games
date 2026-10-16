/** Posição dos pontos numa metade da peça (quadrado de 0 a 1), de 0 a 6. */
const PIPS: [number, number][][] = [
  [],
  [[0.5, 0.5]],
  [[0.27, 0.27], [0.73, 0.73]],
  [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]],
];

const FACE = "#f7f1e1";
const EDGE = "#c9bc9a";
const INK = "#1f1a17";

/**
 * Peça em pé em coordenadas locais: 1 de largura por 2 de altura, centrada na origem; `a` em cima e
 * `b` embaixo. Para deitar ou virar, gire o grupo de fora.
 */
export function TileFace({ a, b }: { a: number; b: number }) {
  return (
    <g>
      <rect x={-0.5} y={-1} width={1} height={2} rx={0.13} fill="rgba(0,0,0,0.35)" transform="translate(0.04 0.06)" />
      <rect x={-0.5} y={-1} width={1} height={2} rx={0.13} fill={FACE} stroke={EDGE} strokeWidth={0.04} />
      <line x1={-0.36} x2={0.36} y1={0} y2={0} stroke={EDGE} strokeWidth={0.05} strokeLinecap="round" />
      <circle r={0.06} fill="#b08a3e" />
      {PIPS[a].map(([x, y], i) => (
        <circle key={`a${i}`} cx={x - 0.5} cy={y - 1} r={0.095} fill={INK} />
      ))}
      {PIPS[b].map(([x, y], i) => (
        <circle key={`b${i}`} cx={x - 0.5} cy={y} r={0.095} fill={INK} />
      ))}
    </g>
  );
}

/** Verso da peça (mão dos outros, monte), nas mesmas coordenadas da face. */
export function TileBack() {
  return (
    <g>
      <rect x={-0.5} y={-1} width={1} height={2} rx={0.13} fill="rgba(0,0,0,0.35)" transform="translate(0.04 0.06)" />
      <rect x={-0.5} y={-1} width={1} height={2} rx={0.13} fill="#7a2a1c" stroke="#4a160d" strokeWidth={0.04} />
      <rect x={-0.36} y={-0.86} width={0.72} height={1.72} rx={0.08} fill="none" stroke="#e0b25a" strokeOpacity={0.55} strokeWidth={0.04} />
      <circle r={0.12} fill="none" stroke="#e0b25a" strokeOpacity={0.7} strokeWidth={0.04} />
    </g>
  );
}

/** Peça solta (mão, ilustrações): em pé por padrão, ou deitada com `flat`. */
export function Domino({
  a,
  b,
  back,
  flat,
  className = "",
}: {
  a: number;
  b: number;
  back?: boolean;
  flat?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox={flat ? "-1.08 -0.58 2.2 1.2" : "-0.58 -1.08 1.2 2.2"} className={`block ${className}`} aria-hidden="true">
      <g transform={flat ? "rotate(-90)" : undefined}>{back ? <TileBack /> : <TileFace a={a} b={b} />}</g>
    </svg>
  );
}
