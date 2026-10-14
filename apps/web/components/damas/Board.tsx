"use client";

import { isDark, SQUARES } from "@truco/damas";

/** Peça na tela: `id` estável para a transição de posição; `sq` em coordenadas do tabuleiro (visão das brancas). */
export interface UiPiece {
  id: number;
  sq: number;
  /** 1/2 brancas (pedra/dama), -1/-2 pretas */
  p: number;
  /** Capturada: some aos poucos. */
  out?: boolean;
}

export type Mark = "last" | "selected" | "movable" | "target" | "step" | "threat";

/** Peça de damas em SVG: disco com borda e sulcos; a dama ganha uma coroa dourada. */
export function PieceShape({ p, className = "" }: { p: number; className?: string }) {
  const white = p > 0;
  const king = Math.abs(p) === 2;
  const face = white ? "#f4e7cb" : "#2a2420";
  const rim = white ? "#c7ad7c" : "#0f0c0a";
  const groove = white ? "#d9c49b" : "#4a3f37";
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <ellipse cx="50" cy="56" rx="42" ry="40" fill="rgba(0,0,0,0.35)" />
      <circle cx="50" cy="50" r="42" fill={rim} />
      <circle cx="50" cy="47" r="40" fill={face} />
      <circle cx="50" cy="47" r="30" fill="none" stroke={groove} strokeWidth="3" />
      <circle cx="50" cy="47" r="20" fill="none" stroke={groove} strokeWidth="2" />
      {king && (
        <path
          d="M30 58 L27 36 L39 46 L50 30 L61 46 L73 36 L70 58 Z"
          fill="#f2c14e"
          stroke="#8a5a12"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** Posição de uma casa em % (já virada para quem joga de pretas). */
function place(sq: number, flip: boolean) {
  const v = flip ? SQUARES - 1 - sq : sq;
  return { col: v % 8, row: Math.floor(v / 8) };
}

/** Tabuleiro 8×8 com moldura de madeira, marcas nas casas e peças que deslizam. */
export function Board({
  pieces,
  flip = false,
  marks = {},
  step = 300,
  className = "",
  children,
}: {
  pieces: UiPiece[];
  flip?: boolean;
  marks?: Partial<Record<number, Mark[]>>;
  /** Duração do deslize de cada trecho (ms). */
  step?: number;
  className?: string;
  /** Camada de cliques por cima de tudo. */
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative aspect-square rounded-xl bg-[#5b3920] p-[2.5%] shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.15)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-md ring-2 ring-black/40">
        {/* casas */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: SQUARES }, (_, i) => {
            const sq = flip ? SQUARES - 1 - i : i;
            const m = marks[sq] ?? [];
            return (
              <div key={i} className={`relative ${isDark(sq) ? "bg-[#86552f]" : "bg-[#e8cf9f]"}`}>
                {m.includes("last") && <div className="absolute inset-0 bg-gold/30" />}
                {m.includes("selected") && <div className="absolute inset-0 bg-gold/45" />}
                {m.includes("movable") && <div className="db-movable absolute inset-[6%] rounded-full" />}
                {m.includes("threat") && <div className="absolute inset-[6%] rounded-full ring-[3px] ring-red-500/90" />}
                {m.includes("step") && <div className="absolute inset-[38%] rounded-full bg-gold/80" />}
                {m.includes("target") && <div className="absolute inset-[32%] rounded-full bg-gold/85 shadow-[0_0_10px_rgba(242,193,78,0.8)]" />}
              </div>
            );
          })}
        </div>
        {/* peças */}
        {pieces.map((pc) => {
          const { col, row } = place(pc.sq, flip);
          return (
            <div
              key={pc.id}
              className={`pointer-events-none absolute left-0 top-0 h-[12.5%] w-[12.5%] p-[1.2%] ${pc.out ? "db-out" : ""}`}
              style={{ transform: `translate(${col * 100}%, ${row * 100}%)`, transition: `transform ${step}ms cubic-bezier(.3,.7,.4,1)` }}
            >
              <PieceShape p={pc.p} className="h-full w-full" />
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}

/** Peças a partir do tabuleiro; `gen` muda os ids para as peças não deslizarem desde a montagem anterior. */
export const piecesOf = (board: readonly number[], gen = 0): UiPiece[] =>
  board.flatMap((p, sq) => (p ? [{ id: gen * 64 + sq, sq, p }] : []));

/**
 * Tabuleiro parado para ilustrações (home, "Como jogar"): 8 linhas com w/W brancas, b/B pretas.
 * `marks` usa as mesmas marcas da mesa.
 */
export function StaticBoard({ rows, marks, className }: { rows: string[]; marks?: Partial<Record<number, Mark[]>>; className?: string }) {
  const map: Record<string, number> = { w: 1, W: 2, b: -1, B: -2 };
  const board = [...rows, ...Array(8 - rows.length).fill("")].flatMap((r: string) =>
    r
      .padEnd(8, ".")
      .split("")
      .map((c) => map[c] ?? 0),
  );
  return <Board pieces={piecesOf(board)} marks={marks} className={className} />;
}
