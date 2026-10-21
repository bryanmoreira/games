import { BEVEL, bevelFacets, outline, toneColor } from "./blocks";
import { COLORS } from "./colors";

// Campo de exemplo (página do jogo, "Como jogar", home e prévia de link): 8 colunas, as 4 linhas de baixo
// quase cheias e um I caindo no buraco. Cada letra é uma peça (pedaços de peça também valem), que dá a cor.
const ROWS_ART = [
  "........",
  "........",
  "........",
  "........",
  "x.....y.",
  "LLLJI.qq",
  "LJJJI.qq",
  "OOPPI.rr",
  "OOPPI.rr",
];
const KIND: Record<string, number> = { x: 3, y: 7, L: 7, J: 6, I: 1, O: 2, P: 4, q: 2, r: 5 };
const FALLING: [number, number][] = [
  [5, 0],
  [5, 1],
  [5, 2],
  [5, 3],
];
/** As 4 linhas de baixo, que o I completa. */
const FULL_FROM = 5;

/** Blocos de uma peça em SVG (unidade = 1 casa). Chamada como função na prévia de link. */
export function PieceSvg({ cells, color }: { cells: [number, number][]; color: string }) {
  return (
    <g>
      {cells.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          {/* o quadrado na cor da face por baixo: sem fio escuro nas diagonais */}
          <rect x={x} y={y} width={1} height={1} fill={color} />
          {bevelFacets(x, y, x + 1, y + 1, BEVEL).map((f) => (
            <polygon key={f.tone} points={f.points.map((p) => p.join(",")).join(" ")} fill={toneColor(color, f.tone)} />
          ))}
        </g>
      ))}
    </g>
  );
}

/**
 * `width`/`height`: tamanho fixo (a prévia de link não usa CSS).
 * `play`: no hover do card da home o I cai no buraco, as 4 linhas piscam e somem e o resto desce (.hc-tj-*).
 */
export function TijoladaArt({ className = "", width, height, play = false }: { className?: string; width?: number; height?: number; play?: boolean }) {
  const w = ROWS_ART[0].length;
  const h = ROWS_ART.length;
  // peças chamadas como função: a prévia de link (Satori) só aceita elementos do próprio SVG
  const pieces = (from: number, to: number) => {
    const byId = new Map<string, [number, number][]>();
    ROWS_ART.slice(from, to).forEach((row, i) =>
      [...row].forEach((c, x) => {
        if (c !== ".") byId.set(c, [...(byId.get(c) ?? []), [x, from + i]]);
      }),
    );
    return [...byId].map(([id, cells]) => <g key={id}>{PieceSvg({ cells, color: COLORS[KIND[id]] })}</g>);
  };
  const fall = h - FULL_FROM;
  const ghost = outline(FALLING.map(([x, y]) => [x, y + fall + 1]))
    .map(([x1, y1, x2, y2]) => `M${x1} ${y1}L${x2} ${y2}`)
    .join("");
  return (
    <svg viewBox={`-0.4 -0.4 ${w + 0.8} ${h + 0.8}`} className={className} width={width} height={height} role="img" aria-label="Campo com peças coloridas e uma peça caindo">
      <rect x={-0.3} y={-0.3} width={w + 0.6} height={h + 0.6} rx={0.35} fill="#3b2512" />
      <rect x={-0.15} y={-0.15} width={w + 0.3} height={h + 0.3} rx={0.25} fill="#5b3a1e" />
      <rect x={0} y={0} width={w} height={h} rx={0.15} fill="#0b120e" />
      <g className={play ? "hc-tj-sink" : undefined} style={play ? ({ "--tj-y": `${fall}px` } as React.CSSProperties) : undefined}>
        {pieces(0, FULL_FROM)}
      </g>
      <g className={play ? "hc-tj-clear" : undefined}>{pieces(FULL_FROM, h)}</g>
      <g className={play ? "hc-tj-ghost" : undefined}>
        <path d={ghost} fill="none" stroke={COLORS[1]} strokeWidth={0.08} strokeLinecap="square" opacity={0.6} />
      </g>
      <g className={play ? "hc-tj-fall" : undefined} style={play ? ({ "--tj-y": `${fall + 1}px` } as React.CSSProperties) : undefined}>
        {PieceSvg({ cells: FALLING, color: COLORS[1] })}
      </g>
    </svg>
  );
}
