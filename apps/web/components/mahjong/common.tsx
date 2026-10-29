import type { CSSProperties } from "react";
import { getLayout, KIND_FILES, type Kind } from "@mesa/mahjong";

export { formatTime } from "@/components/sudoku/common";

export const tileSrc = (k: Kind) => `/mahjong/${KIND_FILES[k]}.svg`;

/** Proporção da peça (altura / largura), igual à das imagens. */
export const TILE_RATIO = 4 / 3;

/** Cores da peça: face de marfim, lateral em camadas e sombra. Iguais na mesa, na arte da home e na prévia de link. */
export const FACE = "#f6f1e7";
export const SIDE = ["#e3d6b8", "#c9b285", "#a88c58"];

/** Lateral da peça como sombras, para a espessura `e` (em px). */
export function sideShadow(e: number, extra = "") {
  const s = e / 3;
  return [`${s}px ${s}px 0 ${SIDE[0]}`, `${2 * s}px ${2 * s}px 0 ${SIDE[1]}`, `${e}px ${e}px 0 ${SIDE[2]}`, `${e + 1}px ${e + 2}px ${e * 1.2}px rgba(0,0,0,.45)`, extra]
    .filter(Boolean)
    .join(", ");
}

/** Uma peça solta (para "Como jogar", a home e ilustrações). `w` em px. */
export function TileFace({ kind, w, className = "", style }: { kind: Kind; w: number; className?: string; style?: CSSProperties }) {
  const e = Math.max(2, Math.round(w * 0.1));
  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: w, height: w * TILE_RATIO, borderRadius: w * 0.13, background: FACE, boxShadow: sideShadow(e), ...style }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={tileSrc(kind)} alt="" draggable={false} className="absolute inset-[5%] h-[90%] w-[90%]" />
    </span>
  );
}

/** Miniatura do formato: cada peça vira um retângulo, mais claro nos andares de cima. */
export function LayoutThumb({ id, className = "" }: { id: string; className?: string }) {
  const l = getLayout(id);
  const d = 0.35;
  const w = l.width + (l.depth - 1) * d + 0.6;
  const h = l.height * TILE_RATIO + (l.depth - 1) * d + 0.6;
  const off = (l.depth - 1) * d;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      {l.slots.map((s, i) => {
        const x = s.x + off - s.z * d;
        const y = s.y * TILE_RATIO + off - s.z * d;
        const light = 62 + (s.z / Math.max(1, l.depth - 1)) * 30;
        return (
          <g key={i}>
            <rect x={x + 0.35} y={y + 0.35} width={1.85} height={2 * TILE_RATIO - 0.15} rx={0.3} fill="#000" opacity={0.35} />
            <rect x={x} y={y} width={1.85} height={2 * TILE_RATIO - 0.15} rx={0.3} fill={`hsl(40 30% ${light}%)`} stroke="#6b5a3a" strokeWidth={0.12} />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Arte do jogo (home e prévia de link): três peças embaixo e um par de dragões vermelhos por cima.
 * Posições em larguras de peça; `top` são as duas de cima, o par que sai no hover.
 */
export const ART_TILES: { kind: Kind; x: number; y: number; top?: boolean }[] = [
  { kind: 18, x: 0, y: 0.35 },
  { kind: 13, x: 1, y: 0.35 },
  { kind: 6, x: 2, y: 0.35 },
  { kind: 31, x: 0.5, y: 0, top: true },
  { kind: 31, x: 1.5, y: 0, top: true },
];

/** `pair`: o par de cima sobe e some no hover do card. Tamanho pela fonte (a peça tem 2,4em de largura). */
export function MahjongArt({ pair = false, className = "" }: { pair?: boolean; className?: string }) {
  const w = 2.4;
  const lift = 0.22;
  return (
    <div className={`relative ${className}`} style={{ width: `${3 * w + 0.4}em`, height: `${w * TILE_RATIO + 0.35 * w + 0.4}em` }}>
      {ART_TILES.map((t, i) => (
        <span
          key={i}
          className={`absolute ${t.top && pair ? "hc-mj" : ""}`}
          style={{
            left: `${t.x * w + (t.top ? 0 : lift)}em`,
            top: `${t.y * w * TILE_RATIO + (t.top ? 0 : lift)}em`,
            width: `${w}em`,
            height: `${w * TILE_RATIO}em`,
            borderRadius: `${w * 0.13}em`,
            background: FACE,
            boxShadow: `0.08em 0.08em 0 ${SIDE[0]}, 0.16em 0.16em 0 ${SIDE[1]}, 0.24em 0.24em 0 ${SIDE[2]}, 0.3em 0.4em 0.4em rgba(0,0,0,.45)`,
            ...({ "--d": t.top ? i - 3 : 0 } as CSSProperties),
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={tileSrc(t.kind)} alt="" draggable={false} className="absolute inset-[5%] h-[90%] w-[90%]" />
        </span>
      ))}
    </div>
  );
}
