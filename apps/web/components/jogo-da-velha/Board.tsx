"use client";

import type { Mark } from "@truco/jogo-da-velha";

export type Ink = "gold" | "red";

export const INK: Record<Ink, string> = { gold: "#f2c14e", red: "#f87171" };

// viewBox 300×300, casas de 100; a grade é riscada a mão, meio torta
const GRID = ["M100 14Q105 150 98 286", "M201 12Q195 152 203 288", "M14 101Q150 95 286 99", "M12 199Q152 205 288 202"];
const center = (cell: number) => [(cell % 3) * 100 + 50, Math.floor(cell / 3) * 100 + 50] as const;

export interface Piece {
  cell: number;
  mark: Mark;
  ink: Ink;
  /** Traço animado (lance novo). */
  draw?: boolean;
  /** Vai sumir no próximo lance do dono (modo "some"). */
  fading?: boolean;
  /** Acabou de sumir: some com animação. */
  vanish?: boolean;
}

export function MarkShape({ mark, cell, draw, className = "" }: { mark: Mark; cell: number; draw?: boolean; className?: string }) {
  const [x, y] = center(cell);
  const ink = draw ? "ink-draw" : "";
  if (mark === "O") {
    return <circle cx={x} cy={y} r={30} pathLength={1} transform={`rotate(-80 ${x} ${y})`} className={`${ink} ${className}`} />;
  }
  return (
    <g className={className}>
      <path d={`M${x - 27} ${y - 28}Q${x} ${y - 2} ${x + 28} ${y + 27}`} pathLength={1} className={ink} />
      <path d={`M${x + 27} ${y - 27}Q${x + 2} ${y} ${x - 28} ${y + 28}`} pathLength={1} className={draw ? "ink-draw ink-draw-2" : ""} />
    </g>
  );
}

/** Marca solta (placar, lobby, ícones), no mesmo traço do tabuleiro. */
export function MarkIcon({ mark, ink, className = "h-5 w-5" }: { mark: Mark; ink: Ink; className?: string }) {
  return (
    <svg viewBox="12 12 76 76" className={className} fill="none" stroke={INK[ink]} strokeWidth={13} strokeLinecap="round" aria-hidden="true">
      <MarkShape mark={mark} cell={0} />
    </svg>
  );
}

/**
 * Tabuleiro 3×3 riscado a giz. `children` vai por cima (casas clicáveis).
 * `ghost`: prévia do lance sob o mouse; `markers`: casas que fecham a linha (dicas).
 */
export function Board({
  pieces,
  winLine,
  winInk = "gold",
  ghost,
  markers = [],
  className = "",
  children,
}: {
  pieces: Piece[];
  winLine?: number[] | null;
  winInk?: Ink;
  ghost?: { cell: number; mark: Mark } | null;
  markers?: { cell: number; ink: Ink }[];
  className?: string;
  children?: React.ReactNode;
}) {
  const ends = winLine && winLine.length >= 2 ? [center(winLine[0]), center(winLine[winLine.length - 1])] : null;
  // a linha da vitória passa um pouco das casas das pontas
  const win = ends && (() => {
    const [[x1, y1], [x2, y2]] = ends;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const [dx, dy] = [((x2 - x1) / len) * 38, ((y2 - y1) / len) * 38];
    return `M${x1 - dx} ${y1 - dy}L${x2 + dx} ${y2 + dy}`;
  })();

  return (
    <div className={`relative aspect-square ${className}`}>
      <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <g stroke="rgba(255,255,255,0.82)" strokeWidth={7}>
          {GRID.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {markers.map((m) => {
          const [x, y] = center(m.cell);
          return <circle key={`m${m.cell}`} cx={x} cy={y} r={14} stroke={INK[m.ink]} strokeWidth={4} strokeDasharray="5 6" opacity={0.8} />;
        })}
        {ghost && (
          <g stroke={INK.gold} strokeWidth={11} opacity={0.35} className="pointer-events-none">
            <MarkShape mark={ghost.mark} cell={ghost.cell} />
          </g>
        )}
        {pieces.map((p) => (
          <g
            key={`${p.cell}${p.mark}${p.vanish ? "v" : ""}`}
            stroke={INK[p.ink]}
            strokeWidth={13}
            className={p.vanish ? "ink-vanish" : p.fading ? "ink-fading" : ""}
          >
            <MarkShape mark={p.mark} cell={p.cell} draw={p.draw} />
          </g>
        ))}
        {win && <path d={win} pathLength={1} stroke={INK[winInk]} strokeWidth={10} className="ink-draw ink-win drop-shadow-[0_0_6px_rgba(0,0,0,0.5)]" />}
      </svg>
      {children}
    </div>
  );
}

/** Tabuleiro de enfeite: 9 letras linha a linha, X dourado, O vermelho, "." vazio. */
export function StaticBoard({ cells, win, className = "" }: { cells: string; win?: number[]; className?: string }) {
  const pieces = [...cells].flatMap((c, cell): Piece[] => (c === "X" ? [{ cell, mark: "X", ink: "gold" }] : c === "O" ? [{ cell, mark: "O", ink: "red" }] : []));
  const winInk: Ink = win && cells[win[0]] === "O" ? "red" : "gold";
  return <Board pieces={pieces} winLine={win} winInk={winInk} className={className} />;
}
