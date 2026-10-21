"use client";

import { useEffect, useRef, useState } from "react";
import type { Board as BoardState, Side, Tile } from "@mesa/domino";
import { bestLimit, layoutBoard, type Spot } from "./layout";
import { TileFace } from "./Tile";

/** Peça no máximo deste tamanho (px por unidade = meia peça), para a mesa vazia não ficar gigante. */
const MAX_UNIT = 30;

const place = (s: Spot) => `translate(${s.cx}px, ${s.cy}px) rotate(${s.rot}deg)`;

/**
 * As peças da mesa num SVG que se ajusta à área: a fileira tem a largura que melhor aproveita o
 * espaço e a vista afasta conforme a mesa cresce. Com uma peça escolhida que entra dos dois lados,
 * as duas pontas viram alvos.
 */
export function Board({
  board,
  pick,
  sides = [],
  onSide,
  className = "",
}: {
  board: BoardState;
  pick?: Tile | null;
  sides?: Side[];
  onSide?: (side: Side) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 400 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const lim = bestLimit(size.w, size.h);
  const { spots, next, box } = layoutBoard(board, lim);
  const ghosts = pick && board.first ? sides.map((side) => ({ side, spot: next[side](pick) })) : [];

  // caixa com as peças e os alvos, uma margem e um tamanho mínimo
  let { x0, y0, x1, y1 } = box;
  for (const { spot: g } of ghosts) {
    x0 = Math.min(x0, g.cx - 1);
    x1 = Math.max(x1, g.cx + 1);
    y0 = Math.min(y0, g.cy - 1);
    y1 = Math.max(y1, g.cy + 1);
  }
  const w = Math.max(x1 - x0 + 1.5, size.w / MAX_UNIT);
  const h = Math.max(y1 - y0 + 1.5, size.h / MAX_UNIT);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const last = Math.max(-1, ...spots.map((s) => s.key));

  return (
    <div ref={ref} className={className}>
      <svg viewBox={`${cx - w / 2} ${cy - h / 2} ${w} ${h}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Mesa">
        {spots.map((s) => (
          <g key={s.key} style={{ transform: place(s), transition: "transform 0.45s ease" }}>
            <g className={s.key === last ? "dm-in" : undefined}>
              <TileFace a={s.a} b={s.b} />
            </g>
          </g>
        ))}
        {ghosts.map(({ side, spot }) => (
          <g key={side} style={{ transform: place(spot) }} className="cursor-pointer" onClick={() => onSide?.(side)}>
            <rect x={-0.5} y={-1} width={1} height={2} rx={0.13} className="dm-target" fill="#f2c14e" fillOpacity={0.25} stroke="#f2c14e" strokeWidth={0.07} strokeDasharray="0.18 0.12" />
            <rect x={-0.8} y={-1.3} width={1.6} height={2.6} fill="transparent" />
          </g>
        ))}
      </svg>
    </div>
  );
}
