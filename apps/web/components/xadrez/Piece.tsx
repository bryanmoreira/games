import { BISHOP, KING, KNIGHT, PAWN, QUEEN, ROOK } from "@truco/xadrez";

// Peças desenhadas para o site (viewBox 100×100): corpo preenchido com contorno, detalhes com a cor do contorno.

/** Base comum: degrau de baixo e anel do pescoço. */
const BASE = "M24 90h52a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4H24a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4Z";

const SHAPES: Record<number, { body: string[]; detail?: string[]; dots?: [number, number, number][] }> = {
  [PAWN]: {
    body: ["M40 50c0 12-6 20-11 30h42c-5-10-11-18-11-30Z", "M35 52h30a3 3 0 0 0 0-6H35a3 3 0 0 0 0 6Z"],
    dots: [[50, 31, 13]],
  },
  [ROOK]: {
    body: ["M33 42h34l3 32H30Z", "M27 16h9v8h7v-8h14v8h7v-8h9v20l-6 6H33l-6-6Z", "M28 80h44v-6H28Z"],
    detail: ["M33 42h34", "M30 74h40"],
  },
  [KNIGHT]: {
    body: [
      "M68 80H30c0-14 9-20 16-27-5-1-10 2-15 5-6 3-12-1-11-7l20-24c1-6 5-10 10-12l3-7 4 8c14 4 21 19 20 36-1 12-6 20-9 28Z",
    ],
    detail: ["M58 20c6 6 9 16 8 30"],
    dots: [[44, 30, 3]],
  },
  [BISHOP]: {
    body: ["M50 20c14 9 18 23 12 36H38c-6-13-2-27 12-36Z", "M36 62h28a3 3 0 0 0 0-6H36a3 3 0 0 0 0 6Z", "M40 62c0 7-4 12-8 18h36c-4-6-8-11-8-18Z"],
    detail: ["M55 30 46 42"],
    dots: [[50, 14, 6]],
  },
  [QUEEN]: {
    body: ["M24 30l10 30h32l10-30-14 14 2-22-10 20-4-24-4 24-10-20 2 22Z", "M33 66h34a3 3 0 0 0 0-6H33a3 3 0 0 0 0 6Z", "M36 66l-4 14h36l-4-14Z"],
    dots: [
      [23, 27, 5],
      [36, 19, 5],
      [50, 13, 5],
      [64, 19, 5],
      [77, 27, 5],
    ],
  },
  [KING]: {
    body: [
      "M47 6h6v7h7v6h-7v9h-6v-9h-7v-6h7Z",
      "M28 38c0-9 12-12 22-3 10-9 22-6 22 3 0 10-8 16-8 22H36c0-6-8-12-8-22Z",
      "M33 66h34a3 3 0 0 0 0-6H33a3 3 0 0 0 0 6Z",
      "M36 66l-4 14h36l-4-14Z",
    ],
    detail: ["M50 35v25"],
  },
};

/** Desenho da peça (conteúdo de um SVG 100×100; a prévia de link chama como função): `p` positivo brancas, negativo pretas (1 peão … 6 rei). */
export function PieceArt({ p }: { p: number }) {
  const white = p > 0;
  const shape = SHAPES[Math.abs(p)];
  if (!shape) return null;
  const fill = white ? "#f7efdf" : "#2b2420";
  const line = white ? "#3a2c20" : "#0c0907";
  const detail = white ? "#3a2c20" : "#b59c7a";
  return (
    <g>
      <g fill={fill} stroke={line} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
        <path d={BASE} />
        {shape.body.map((d) => (
          <path key={d} d={d} />
        ))}
        {shape.dots?.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={r < 4 ? (white ? line : detail) : fill} />
        ))}
      </g>
      {shape.detail && (
        <g fill="none" stroke={detail} strokeWidth="3" strokeLinecap="round">
          {shape.detail.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      )}
    </g>
  );
}

/** Peça de xadrez em SVG. */
export function PieceShape({ p, className = "" }: { p: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <PieceArt p={p} />
    </svg>
  );
}
