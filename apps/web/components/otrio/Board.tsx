"use client";

import { useId } from "react";
import { cellOf, sizeOf, type Color, type Size } from "@truco/otrio";

/** Cores das peças: base, brilho e sombra (0 vermelho, 1 azul, 2 verde, 3 roxo). */
export const RING_COLORS = [
  { base: "#e5484d", light: "#ffa19c", dark: "#9b1c1f", text: "text-[#ff7b76]", border: "border-[#e5484d]" },
  { base: "#3e7bfa", light: "#a8c8ff", dark: "#1b3d99", text: "text-[#7aa6ff]", border: "border-[#3e7bfa]" },
  { base: "#2fb36b", light: "#98ecb9", dark: "#12663a", text: "text-[#5fd394]", border: "border-[#2fb36b]" },
  { base: "#a065e8", light: "#dcc2ff", dark: "#5a2a91", text: "text-[#c39bff]", border: "border-[#a065e8]" },
] as const;

export const SIZE_NAMES = ["P", "M", "G"] as const;

// Tabuleiro: viewBox de 330 (3 casas de 100 + borda de 15); anéis com raio por tamanho
const PAD = 15;
const VB = PAD * 2 + 300;
export const RADII = [11, 25, 39] as const;
export const RING_W = 7.5;

const center = (cell: number) => [PAD + (cell % 3) * 100 + 50, PAD + Math.floor(cell / 3) * 100 + 50] as const;

export interface Piece {
  slot: number;
  color: Color;
}

export interface Marker {
  slot: number;
  kind: "win" | "block";
}

/** Gradientes das 4 cores (o traço do anel recebe brilho em cima à esquerda). */
function RingGradients({ id }: { id: string }) {
  return (
    <defs>
      {RING_COLORS.map((c, i) => (
        <linearGradient key={i} id={`${id}-c${i}`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.45" stopColor={c.base} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
      ))}
    </defs>
  );
}

function Ring({ id, x, y, size, color, className, opacity }: { id: string; x: number; y: number; size: Size; color: Color; className?: string; opacity?: number }) {
  return (
    <g className={className} opacity={opacity}>
      <circle cx={x} cy={y + 2.2} r={RADII[size]} fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth={RING_W} />
      <circle cx={x} cy={y} r={RADII[size]} fill="none" stroke={`url(#${id}-c${color})`} strokeWidth={RING_W} />
    </g>
  );
}

/**
 * Tabuleiro 3×3 de madeira com os encaixes de cada casa. As peças vêm em `pieces` na ordem jogada;
 * a partir de `animateFrom` elas encaixam animadas. Com `win`, a trinca pisca e o resto apaga.
 */
export function Board({
  pieces,
  animateFrom = Infinity,
  win,
  last,
  markers,
  ghost,
  playable,
  onCell,
  onHover,
  dim = true,
  className = "",
}: {
  pieces: Piece[];
  animateFrom?: number;
  win?: readonly number[] | null;
  last?: number | null;
  markers?: Marker[];
  ghost?: Piece | null;
  /** Casas que aceitam peça agora (clicáveis). */
  playable?: Set<number>;
  onCell?: (cell: number) => void;
  onHover?: (cell: number | null) => void;
  /** Apaga as peças fora da trinca vencedora. */
  dim?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${VB} ${VB}`} className="block h-auto w-full select-none" role="img" aria-label="Tabuleiro do Otrio">
        <RingGradients id={id} />
        <defs>
          <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b98048" />
            <stop offset="1" stopColor="#7c4b22" />
          </linearGradient>
        </defs>
        <rect x="2" y="6" width={VB - 4} height={VB - 4} rx="26" fill="rgba(0,0,0,0.45)" />
        <rect x="2" y="2" width={VB - 4} height={VB - 4} rx="26" fill={`url(#${id}-wood)`} stroke="#3b2412" strokeWidth="3" />
        {Array.from({ length: 9 }, (_, cell) => {
          const [x, y] = center(cell);
          const can = !!playable?.has(cell);
          return (
            <g key={cell}>
              <rect x={x - 46} y={y - 46} width="92" height="92" rx="16" fill="rgba(40,20,5,0.2)" />
              {RADII.map((r) => (
                <circle key={r} cx={x} cy={y} r={r} fill="none" stroke="#4a2a10" strokeOpacity="0.5" strokeWidth={RING_W + 1.5} />
              ))}
              <circle cx={x} cy={y} r="3" fill="#4a2a10" fillOpacity="0.5" />
              {can && <rect x={x - 46} y={y - 46} width="92" height="92" rx="16" fill="none" stroke="#f2c14e" strokeOpacity="0.28" strokeWidth="2" />}
            </g>
          );
        })}

        {markers?.map((m) => {
          const [x, y] = center(cellOf(m.slot));
          return (
            <circle
              key={`mk-${m.slot}-${m.kind}`}
              className="[@media(hover:none)]:hidden"
              cx={x}
              cy={y}
              r={RADII[sizeOf(m.slot)]}
              fill="none"
              stroke={m.kind === "win" ? "#f2c14e" : "#ff8a80"}
              strokeWidth="3"
              strokeDasharray="5 4"
            />
          );
        })}

        {pieces.map((p, i) => {
          const [x, y] = center(cellOf(p.slot));
          const inWin = !!win?.includes(p.slot);
          const cls = inWin ? "ring-win" : i >= animateFrom ? "ring-in" : undefined;
          return <Ring key={`${p.slot}-${p.color}`} id={id} x={x} y={y} size={sizeOf(p.slot)} color={p.color} className={cls} opacity={win && dim && !inWin ? 0.45 : 1} />;
        })}

        {last != null && !win && (() => {
          const [x, y] = center(cellOf(last));
          return <circle cx={x} cy={y - RADII[sizeOf(last)]} r="2.2" fill="#fff" fillOpacity="0.9" pointerEvents="none" />;
        })()}

        {ghost && (() => {
          const [x, y] = center(cellOf(ghost.slot));
          return <Ring id={id} x={x} y={y} size={sizeOf(ghost.slot)} color={ghost.color} className="pointer-events-none animate-pulse [@media(hover:none)]:hidden" opacity={0.6} />;
        })()}

        {onCell &&
          Array.from({ length: 9 }, (_, cell) => {
            const [x, y] = center(cell);
            const can = !!playable?.has(cell);
            return (
              <rect
                key={`hit-${cell}`}
                x={x - 50}
                y={y - 50}
                width="100"
                height="100"
                fill="transparent"
                className={can ? "cursor-pointer" : "cursor-default"}
                onClick={() => can && onCell(cell)}
                onMouseEnter={() => onHover?.(cell)}
                onMouseLeave={() => onHover?.(null)}
              >
                <title>{`Casa ${cell + 1}`}</title>
              </rect>
            );
          })}
      </svg>
    </div>
  );
}

/** Anel solto para botões e ícones (tamanho relativo: a pequena aparece pequena). */
export function RingIcon({ color, size, className = "", dim }: { color: Color; size: Size; className?: string; dim?: boolean }) {
  const c = RING_COLORS[color];
  const r = (RADII[size] / 42) * 40;
  const w = (RING_W / 42) * 40 * (size === 0 ? 1.25 : 1);
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="52.5" r={r} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={w} />
      <circle cx="50" cy="50" r={r} fill="none" stroke={dim ? "rgba(255,255,255,0.15)" : c.base} strokeWidth={w} />
      {!dim && <circle cx="50" cy="50" r={r + w * 0.22} fill="none" stroke={c.light} strokeOpacity="0.55" strokeWidth={w * 0.22} strokeDasharray={`${r * 1.3} ${r * 9}`} strokeDashoffset={r * 3.9} />}
    </svg>
  );
}

/** Marca de uma cor: os três anéis encaixados (o "alvo"). */
export function ColorMark({ color, className = "" }: { color: Color; className?: string }) {
  const c = RING_COLORS[color];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {RADII.map((r0) => {
        const r = (r0 / 42) * 44;
        return <circle key={r0} cx="50" cy="50" r={r} fill="none" stroke={c.base} strokeWidth={(RING_W / 42) * 44 * 1.15} />;
      })}
    </svg>
  );
}

/**
 * Tabuleiro de enfeite a partir de 9 casas (linha a linha); cada casa é uma string de 3 letras
 * (pequena, média, grande) com "." vazio ou r/b/g/p da cor. `win` destaca os encaixes indicados.
 */
export function StaticBoard({ cells, win, dim, className = "" }: { cells: string[]; win?: number[]; dim?: boolean; className?: string }) {
  const pieces: Piece[] = [];
  cells.forEach((s, cell) =>
    [...s].forEach((ch, size) => {
      const color = "rbgp".indexOf(ch);
      if (color >= 0) pieces.push({ slot: cell * 3 + size, color });
    }),
  );
  return <Board pieces={pieces} win={win} dim={dim} className={className} />;
}
