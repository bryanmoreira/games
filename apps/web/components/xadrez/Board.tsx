"use client";

import { fromFen, isDark, SQUARES } from "@truco/xadrez";
import { PieceShape } from "./Piece";

/** Peça na tela: `id` estável para deslizar; `sq` em coordenadas do tabuleiro (visão das brancas). */
export interface UiPiece {
  id: number;
  sq: number;
  p: number;
  /** Capturada: some aos poucos. */
  out?: boolean;
}

export type Mark = "last" | "selected" | "target" | "capture" | "check" | "hint";

const FILES = "abcdefgh";

/** Linha e coluna na tela (já virada para quem joga de pretas). */
export function place(sq: number, flip: boolean) {
  const v = flip ? SQUARES - 1 - sq : sq;
  return { col: v % 8, row: Math.floor(v / 8) };
}

/** Tabuleiro 8×8 com moldura de madeira, coordenadas, marcas nas casas e peças que deslizam. */
export function Board({
  pieces,
  flip = false,
  marks = {},
  coords = true,
  className = "",
  children,
}: {
  pieces: UiPiece[];
  flip?: boolean;
  marks?: Partial<Record<number, Mark[]>>;
  coords?: boolean;
  className?: string;
  /** Camadas por cima das peças (cliques, escolha da promoção). */
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative aspect-square rounded-xl bg-[#5b3920] p-[2.5%] shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.15)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-md ring-2 ring-black/40 [container-type:inline-size]">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: SQUARES }, (_, i) => {
            const sq = flip ? SQUARES - 1 - i : i;
            const m = marks[sq] ?? [];
            const dark = isDark(sq);
            const { col, row } = place(sq, flip);
            const ink = dark ? "text-[#e8cf9f]/90" : "text-[#86552f]";
            return (
              <div key={i} className={`relative ${dark ? "bg-[#a06c41]" : "bg-[#ecd6ac]"}`}>
                {m.includes("last") && <div className="absolute inset-0 bg-gold/35" />}
                {m.includes("hint") && <div className="absolute inset-0 bg-sky-400/45" />}
                {m.includes("selected") && <div className="absolute inset-0 bg-gold/55" />}
                {m.includes("check") && <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(239,68,68,0.95)_0%,rgba(239,68,68,0.5)_45%,transparent_75%)]" />}
                {coords && col === 0 && <span className={`absolute left-[4%] top-[2%] text-[2.2cqw] font-bold leading-none ${ink}`}>{8 - Math.floor(sq / 8)}</span>}
                {coords && row === 7 && <span className={`absolute bottom-[2%] right-[5%] text-[2.2cqw] font-bold leading-none ${ink}`}>{FILES[sq % 8]}</span>}
              </div>
            );
          })}
        </div>
        {pieces.map((pc) => {
          const { col, row } = place(pc.sq, flip);
          return (
            <div
              key={pc.id}
              className={`pointer-events-none absolute left-0 top-0 h-[12.5%] w-[12.5%] p-[0.4%] ${pc.out ? "db-out" : ""}`}
              style={{ transform: `translate(${col * 100}%, ${row * 100}%)`, transition: "transform 280ms cubic-bezier(.3,.7,.4,1)" }}
            >
              <PieceShape p={pc.p} className="h-full w-full drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]" />
            </div>
          );
        })}
        {/* destinos por cima das peças: ponto na casa vazia, anel na captura */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-8 grid-rows-8">
          {Array.from({ length: SQUARES }, (_, i) => {
            const m = marks[flip ? SQUARES - 1 - i : i] ?? [];
            return (
              <div key={i} className="relative">
                {m.includes("target") && <div className="absolute inset-[34%] rounded-full bg-black/30" />}
                {m.includes("capture") && <div className="absolute inset-[3%] rounded-full ring-[0.7cqw] ring-black/30" />}
              </div>
            );
          })}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Peças a partir do tabuleiro; `gen` muda os ids para as peças não deslizarem desde a montagem anterior. */
export const piecesOf = (board: readonly number[], gen = 0): UiPiece[] => board.flatMap((p, sq) => (p ? [{ id: gen * 64 + sq, sq, p }] : []));

/** Tabuleiro parado para ilustrações (home, "Como jogar"), a partir da parte das peças de um FEN. */
export function StaticBoard({
  fen,
  marks,
  flip,
  coords = false,
  className,
}: {
  fen: string;
  marks?: Partial<Record<number, Mark[]>>;
  flip?: boolean;
  coords?: boolean;
  className?: string;
}) {
  const board = fromFen(fen.includes(" ") ? fen : `${fen} w - - 0 1`).board;
  return <Board pieces={piecesOf(board)} marks={marks} flip={flip} coords={coords} className={className} />;
}
