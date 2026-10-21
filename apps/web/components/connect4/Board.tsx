"use client";

import { useId } from "react";
import { COLS, ROWS, type Cell, type Move, type Seat } from "@mesa/connect4";

export type DiscColor = "gold" | "red";

// Placa: viewBox com 2 unidades de borda em volta da grade de 70×60 (10 por casa)
const PAD = 2;
const VB_W = COLS * 10 + PAD * 2;
const VB_H = ROWS * 10 + PAD * 2;
const HOLE_R = 3.9;
const holeCenter = (col: number, row: number) => [PAD + col * 10 + 5, PAD + (ROWS - 1 - row) * 10 + 5];

const PLATE_PATH = (() => {
  let d = `M0 3a3 3 0 0 1 3-3h${VB_W - 6}a3 3 0 0 1 3 3v${VB_H - 6}a3 3 0 0 1-3 3h-${VB_W - 6}a3 3 0 0 1-3-3Z`;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      const [x, y] = holeCenter(c, r);
      d += `M${x - HOLE_R} ${y}a${HOLE_R} ${HOLE_R} 0 1 0 ${HOLE_R * 2} 0a${HOLE_R} ${HOLE_R} 0 1 0 -${HOLE_R * 2} 0Z`;
    }
  }
  return d;
})();

/** Posição de uma casa dentro da grade, em %. */
export const cellStyle = (col: number, row: number): React.CSSProperties => ({
  left: `${(col * 100) / COLS}%`,
  bottom: `${(row * 100) / ROWS}%`,
  width: `${100 / COLS}%`,
  height: `${100 / ROWS}%`,
});

// altura de uma casa em % da largura do tabuleiro
const CELL_PAD = `${((VB_H - PAD * 2) / ROWS / VB_W) * 100}%`;

export function Disc({ color, className = "" }: { color: DiscColor; className?: string }) {
  return <div className={`disc disc-${color} ${className}`} />;
}

export interface Marker extends Cell {
  color: DiscColor;
}

/**
 * Tabuleiro em pé com a placa azul por cima das peças (as peças aparecem pelos furos).
 * As peças vêm de `moves` na ordem jogada; a partir de `animateFrom` elas caem animadas.
 * `children` vai na camada da grade (por cima da placa): colunas clicáveis, peça fantasma etc.
 */
export function Board({
  moves,
  color,
  animateFrom = Infinity,
  winLine,
  last,
  markers,
  dim = true,
  padTop,
  className = "",
  children,
}: {
  moves: Move[];
  color: (seat: Seat) => DiscColor;
  animateFrom?: number;
  winLine?: Cell[] | null;
  last?: Cell | null;
  markers?: Marker[];
  /** Apaga as peças fora da linha vencedora. */
  dim?: boolean;
  /** Reserva uma linha vazia em cima (peça fantasma, seta). */
  padTop?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const id = useId();
  const inWin = (m: Cell) => !!winLine?.some((w) => w.col === m.col && w.row === m.row);
  const grid: React.CSSProperties = {
    left: `${(PAD / VB_W) * 100}%`,
    right: `${(PAD / VB_W) * 100}%`,
    top: `${(PAD / VB_H) * 100}%`,
    bottom: `${(PAD / VB_H) * 100}%`,
  };

  const board = (
    <div className="relative" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
      {/* fundo dos furos */}
      <div className="absolute rounded-[3%] bg-[#0a1630]" style={grid} />

      <div className="absolute" style={grid}>
        {markers?.map((m) => (
          <div key={`mk-${m.col}-${m.row}-${m.color}`} className="absolute [@media(hover:none)]:hidden" style={cellStyle(m.col, m.row)}>
            <div className={`absolute inset-[22%] rounded-full border-[3px] border-dashed ${m.color === "gold" ? "border-gold/80" : "border-red-400/80"}`} />
          </div>
        ))}
        {moves.map((m, i) => {
          const fall = ROWS - m.row;
          const anim = i >= animateFrom;
          const win = inWin(m);
          return (
            <div
              key={`${i}-${m.col}-${m.row}`}
              className={`absolute ${anim ? "disc-fall" : ""}`}
              style={
                {
                  ...cellStyle(m.col, m.row),
                  "--from": `${-fall * 100}%`,
                  "--dur": `${0.22 + fall * 0.07}s`,
                } as React.CSSProperties
              }
            >
              <Disc color={color(m.seat)} className={`absolute inset-[7%] text-[clamp(4px,1vw,10px)] ${win ? "disc-win" : winLine && dim ? "opacity-60" : ""}`} />
              {last && last.col === m.col && last.row === m.row && !winLine && (
                <span className="absolute left-1/2 top-1/2 h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
              )}
            </div>
          );
        })}
      </div>

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)]" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3b6fe0" />
            <stop offset="1" stopColor="#1f45a8" />
          </linearGradient>
        </defs>
        <path d={PLATE_PATH} fill={`url(#${id}-plate)`} fillRule="evenodd" />
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const [x, y] = holeCenter(Math.floor(i / ROWS), i % ROWS);
          return <circle key={i} cx={x} cy={y} r={HOLE_R} fill="none" stroke="#0d2766" strokeOpacity={0.7} strokeWidth={0.6} />;
        })}
        <path
          d={`M1 3a2 2 0 0 1 2-2h${VB_W - 6}a2 2 0 0 1 2 2`}
          fill="none"
          stroke="#fff"
          strokeOpacity={0.25}
          strokeWidth={0.6}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute" style={grid}>
        {children}
      </div>
    </div>
  );
  // padding em % é relativo à largura do pai: aqui o pai é o próprio wrapper com a largura do tabuleiro
  return <div className={className}>{padTop ? <div style={{ paddingTop: CELL_PAD }}>{board}</div> : board}</div>;
}

/**
 * Tabuleiro de enfeite a partir de linhas de cima para baixo: "." vazio, "y" dourada, "r" vermelha.
 * `win` destaca as casas indicadas como "col,row" (linha 0 embaixo).
 */
export function StaticBoard({
  rows,
  win,
  dim,
  padTop,
  className = "",
  children,
}: {
  rows: string[];
  win?: [number, number][];
  dim?: boolean;
  padTop?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const moves: Move[] = [];
  rows.forEach((line, i) => {
    const row = ROWS - 1 - i - (ROWS - rows.length);
    [...line].forEach((ch, col) => {
      if (ch === "y" || ch === "r") moves.push({ col, row, seat: ch === "y" ? 0 : 1 });
    });
  });
  return (
    <Board
      moves={moves}
      color={(s) => (s === 0 ? "gold" : "red")}
      winLine={win?.map(([col, row]) => ({ col, row }))}
      dim={dim}
      padTop={padTop}
      className={className}
    >
      {children}
    </Board>
  );
}
