"use client";

import { accented, boardGuesses, LENGTH, MAX_GUESSES, score, solvedAt, type GameState, type Mark } from "@truco/verbete";
import { BackspaceIcon, EnterIcon } from "@/components/ui/icons";
import { MARK_BG, Tile } from "./Tile";

/** Atraso entre uma casa e a próxima ao virar a linha, e quanto cada uma leva. */
export const FLIP_STEP = 220;
export const FLIP_MS = 500;
export const REVEAL_MS = FLIP_STEP * (LENGTH - 1) + FLIP_MS;

/** Clicar não tira o foco da página: Enter e espaço do teclado físico não "clicam" de novo no botão. */
const noFocus = (e: React.MouseEvent) => e.preventDefault();

const upper = (w: string) => [...(accented(w) ?? w)].map((l) => l.toUpperCase());

/** Um quadro: as linhas chutadas com as marcas, a linha que está sendo digitada e as vazias. */
export function Board({
  game,
  board,
  tile,
  input,
  cursor,
  typing,
  reveal,
  shake,
  popAt,
  jump,
  onCell,
}: {
  game: GameState;
  board: number;
  /** lado da casa em px */
  tile: number;
  input: string[];
  cursor: number;
  /** a partida está rolando e não está virando linha */
  typing: boolean;
  /** linha (índice do chute) virando agora */
  reveal: number | null;
  /** chave da tremida da linha digitada (palavra recusada) */
  shake: number | null;
  /** casa que acabou de receber letra */
  popAt: { i: number; key: number } | null;
  /** linha que acabou de virar: se resolveu o quadro, as letras pulam */
  jump: number | null;
  onCell: (i: number) => void;
}) {
  const max = MAX_GUESSES[game.mode];
  const guesses = boardGuesses(game, board);
  const solved = solvedAt(game, board);
  const answer = game.answers[board];
  const gap = Math.max(2, Math.round(tile * 0.1));
  const live = typing && solved < 0 && game.guesses.length < max;

  return (
    <div
      className={`flex flex-col rounded-xl transition-opacity ${solved >= 0 && reveal === null ? "opacity-90" : ""}`}
      style={{ gap }}
      role="grid"
      aria-label={game.mode > 1 ? `Palavra ${board + 1}` : "Palavra"}
    >
      {Array.from({ length: max }, (_, r) => {
        if (r < guesses.length) {
          const letters = upper(guesses[r]);
          const marks = score(guesses[r], answer);
          const flipping = reveal === r;
          const jumping = jump === r && r === solved;
          return (
            <div key={r} className="flex" style={{ gap }} role="row" aria-label={`${letters.join("")}: ${marks.map(markName).join(", ")}`}>
              {letters.map((l, i) => (
                <Tile
                  key={`${r}-${i}-${flipping ? "f" : jumping ? "j" : "s"}`}
                  letter={l}
                  mark={marks[i]}
                  size={tile}
                  className={flipping ? "vb-flip" : jumping ? "vb-jump" : ""}
                  style={flipping || jumping ? { animationDelay: `${i * (flipping ? FLIP_STEP : 90)}ms` } : undefined}
                />
              ))}
            </div>
          );
        }
        if (r === guesses.length && live) {
          return (
            <div key={`in-${shake ?? 0}`} className={`flex ${shake ? "vb-shake" : ""}`} style={{ gap }} role="row">
              {input.map((l, i) => (
                <button
                  key={popAt?.i === i ? `p-${popAt.key}` : i}
                  onClick={() => onCell(i)}
                  onMouseDown={noFocus}
                  aria-label={`Letra ${i + 1}${l ? `: ${l}` : ""}`}
                  className={`relative rounded-[12%] ${popAt?.i === i && l ? "vb-pop" : ""}`}
                >
                  <Tile letter={l} size={tile} className={i === cursor ? "!border-gold" : "!border-white/35"} />
                  {i === cursor && <span className="absolute inset-x-[22%] bottom-[12%] h-[7%] rounded-full bg-gold" />}
                </button>
              ))}
            </div>
          );
        }
        return (
          <div key={r} className={`flex ${solved >= 0 ? "opacity-30" : ""}`} style={{ gap }} role="row">
            {Array.from({ length: LENGTH }, (_, i) => (
              <Tile key={i} size={tile} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

const markName = (m: Mark) => (m === "right" ? "certa" : m === "place" ? "fora do lugar" : "não tem");

const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

/**
 * Teclado da tela. Com mais de um quadro, cada tecla é dividida em partes, uma por quadro, na mesma
 * posição dos quadros na tela (`cols`), com a cor da letra naquele quadro.
 */
export function Keyboard({
  marks,
  cols,
  disabled,
  onLetter,
  onBack,
  onEnter,
}: {
  marks: Record<string, Mark>[];
  cols: number;
  disabled: boolean;
  onLetter: (l: string) => void;
  onBack: () => void;
  onEnter: () => void;
}) {
  const key = "relative flex h-12 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-lg font-display text-base transition active:scale-95 sm:h-14 sm:text-lg";
  const letterKey = (l: string) => {
    const ms = marks.map((m) => m[l]);
    const one = ms.length === 1 ? ms[0] : undefined;
    const allAbsent = ms.every((m) => m === "absent");
    return (
      <button
        key={l}
        onClick={() => onLetter(l)}
        onMouseDown={noFocus}
        disabled={disabled}
        aria-label={l.toUpperCase()}
        className={`${key} ${allAbsent ? "text-white/35" : "text-white"} ${!one && !allAbsent ? "bg-white/15 hover:bg-white/25" : ""}`}
        style={one || allAbsent ? { backgroundColor: MARK_BG[one ?? "absent"] } : undefined}
      >
        {ms.length > 1 && !allAbsent && (
          <span className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} aria-hidden="true">
            {ms.map((m, i) => (
              <span key={i} style={{ backgroundColor: m ? MARK_BG[m] : "transparent" }} />
            ))}
          </span>
        )}
        <span className="relative uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{l}</span>
      </button>
    );
  };
  return (
    <div className="flex w-full max-w-[520px] flex-col gap-1.5 px-1.5 pb-2 sm:gap-2" aria-label="Teclado">
      <div className="flex gap-1.5 sm:gap-2">{[...ROWS[0]].map(letterKey)}</div>
      <div className="flex gap-1.5 sm:gap-2">
        {[...ROWS[1]].map(letterKey)}
        <button onClick={onBack} onMouseDown={noFocus} disabled={disabled} aria-label="Apagar" title="Apagar" className={`${key} bg-white/15 text-white hover:bg-white/25`}>
          <BackspaceIcon className="h-6 w-6" />
        </button>
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        {[...ROWS[2]].map(letterKey)}
        <button onClick={onEnter} onMouseDown={noFocus} disabled={disabled} aria-label="Enviar" title="Enviar" className={`${key} !flex-[2.2] bg-gold text-stone-900 hover:brightness-110`}>
          <EnterIcon className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
