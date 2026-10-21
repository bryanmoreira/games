"use client";

import { applyAction, newGame, type GameState, type Seat } from "@mesa/connect4";
import { Section } from "@/components/ui/HowToSection";
import { Board, Disc, StaticBoard } from "./Board";

const WINS: { label: string; rows: string[]; win: [number, number][] }[] = [
  { label: "HORIZONTAL", rows: [".......", "..rr...", ".yyyyr."], win: [[1, 0], [2, 0], [3, 0], [4, 0]] },
  { label: "VERTICAL", rows: ["...y...", "...yr..", "...yr..", "...yr.."], win: [[3, 0], [3, 1], [3, 2], [3, 3]] },
  { label: "DIAGONAL", rows: ["....y..", "...yr..", "..yrr..", ".yrry.."], win: [[1, 0], [2, 1], [3, 2], [4, 3]] },
  { label: "DIAGONAL", rows: [".y.....", ".ry....", ".yry...", ".rryy.."], win: [[1, 3], [2, 2], [3, 1], [4, 0]] },
];

// partida real que enche o tabuleiro sem ninguém fazer 4
function drawnGame(): GameState {
  let s: GameState = { ...newGame(), turn: 0 as Seat, starter: 0 as Seat };
  for (const col of "355044234114302533122645021043016026565661") {
    const r = applyAction(s, { type: "drop", seat: s.turn, col: Number(col) });
    if (r.ok) s = r.state;
  }
  return s;
}
const DRAW = drawnGame();

/** Regras ilustradas do Connect 4 (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-4 font-display">
            <Player color="gold" name="Você" />
            <span className="text-white/40">×</span>
            <Player color="red" name="Adversário" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <span className="text-3xl text-gold">4</span>
            <span className="text-sm leading-tight text-white/70">
              em linha
              <br />
              vence
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">Um contra um. Cada um joga uma peça por vez.</p>
      </Section>

      <Section n={2} title="A peça cai">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <StaticBoard rows={["...y...", "...r...", "..yy...", "..rrr.y"]} padTop className="w-48 sm:w-56">
            <svg
              viewBox="0 0 24 24"
              className="absolute bottom-full h-[16.667%] w-[14.286%] text-gold"
              style={{ left: `${500 / 7}%` }}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 4v15" />
              <path d="m6 13 6 6 6-6" />
            </svg>
          </StaticBoard>
          <p className="max-w-56 text-center text-sm text-white/70 sm:text-left">
            Escolha a <b className="text-white">coluna</b>: a peça desce até a casa livre mais baixa. Coluna cheia não aceita
            peça.
          </p>
        </div>
      </Section>

      <Section n={3} title="Como vencer">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {WINS.map((w, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <StaticBoard rows={w.rows} win={w.win} className="w-full" />
              <span className="font-display text-[10px] tracking-wider text-white/60">
                {w.label} {i === 2 ? "↗" : i === 3 ? "↘" : ""}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section n={4} title="Empate">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <Board moves={DRAW.moves} color={(s) => (s === 0 ? "gold" : "red")} className="w-44 sm:w-52" />
          <p className="max-w-56 text-center text-sm text-white/70 sm:text-left">
            Tabuleiro <b className="text-white">cheio</b> sem 4 em linha: ninguém vence.
          </p>
        </div>
      </Section>

      <Section n={5} title="De novo">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <div className="flex flex-col items-center gap-0.5 leading-none">
              <Disc color="gold" className="h-3 w-3 text-[2px]" />
              <span className="text-3xl text-gold">2</span>
            </div>
            <span className="text-white/30">×</span>
            <div className="flex flex-col items-center gap-0.5 leading-none">
              <Disc color="red" className="h-3 w-3 text-[2px]" />
              <span className="text-3xl">1</span>
            </div>
          </div>
          <span className="rounded-xl bg-gold px-5 py-2 font-display text-stone-900 shadow-[0_4px_0_#9a6b12]">De novo</span>
        </div>
        <p className="text-center text-sm text-white/70">
          Na mesma sala o placar vai somando, e quem começa <b className="text-white">alterna</b> a cada partida.
        </p>
      </Section>

      <Section n={6} title="Dicas">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Hint color="gold" text="você fecha 4" />
          <Hint color="red" text="ele fecha 4" />
        </div>
        <p className="text-center text-sm text-white/70">
          Contra a IA, com a lâmpada ligada, o tabuleiro marca as casas que completam 4. Entre duas pessoas não há dicas. No
          teclado, as teclas{" "}
          <b className="text-white">1 a 7</b> soltam a peça.
        </p>
      </Section>
    </>
  );
}

function Player({ color, name }: { color: "gold" | "red"; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Disc color={color} className="h-12 w-12 text-[6px]" />
      <span className={`text-xs ${color === "gold" ? "text-gold" : "text-red-400"}`}>{name}</span>
    </div>
  );
}

function Hint({ color, text }: { color: "gold" | "red"; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-black/30 px-3 py-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a1630] ring-4 ring-[#2c5bc8]">
        <span className={`h-5 w-5 rounded-full border-[3px] border-dashed ${color === "gold" ? "border-gold/80" : "border-red-400/80"}`} />
      </span>
      <span className={`font-display text-xs ${color === "gold" ? "text-gold" : "text-red-400"}`}>{text}</span>
    </div>
  );
}
