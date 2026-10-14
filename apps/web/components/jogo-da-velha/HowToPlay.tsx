"use client";

import { FADE_LIMIT, LEVELS } from "@truco/jogo-da-velha";
import { Section } from "@/components/ui/HowToSection";
import { Board, MarkIcon, StaticBoard, type Piece } from "./Board";
import { GridIcon } from "./icons";
import { LEVEL_LABEL } from "./Settings";

const WINS: { label: string; cells: string; win: number[] }[] = [
  { label: "LINHA", cells: "XXX.O..O.", win: [0, 1, 2] },
  { label: "COLUNA", cells: "OX..XO.X.", win: [1, 4, 7] },
  { label: "DIAGONAL", cells: "O.X.X.XO.", win: [2, 4, 6] },
];

// modo "some": X tem 3 peças e a mais antiga (apagada) sai quando ele jogar a 4ª
const BEFORE: Piece[] = [
  { cell: 0, mark: "X", ink: "gold", fading: true },
  { cell: 1, mark: "X", ink: "gold" },
  { cell: 6, mark: "X", ink: "gold" },
  { cell: 4, mark: "O", ink: "red" },
  { cell: 5, mark: "O", ink: "red" },
  { cell: 8, mark: "O", ink: "red" },
];
const AFTER: Piece[] = [...BEFORE.filter((p) => p.cell !== 0), { cell: 7, mark: "X", ink: "gold" }];

/** Regras ilustradas do Jogo da Velha (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-4 font-display">
            <Player mark="X" name="Começa" gold />
            <span className="text-white/40">×</span>
            <Player mark="O" name="Responde" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <span className="text-3xl text-gold">3</span>
            <span className="text-sm leading-tight text-white/70">
              em linha
              <br />
              vence
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">
          Um contra um, uma casa por vez. Quem começa joga de <b className="text-white">X</b>.
        </p>
      </Section>

      <Section n={2} title="Como vencer">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {WINS.map((w) => (
            <div key={w.label} className="flex flex-col items-center gap-2">
              <StaticBoard cells={w.cells} win={w.win} className="w-full max-w-36" />
              <span className="font-display text-[10px] tracking-wider text-white/60">{w.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section n={3} title="Deu velha">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <StaticBoard cells="XOXXOOOXX" className="w-32 sm:w-36" />
          <p className="max-w-56 text-center text-sm text-white/70 sm:text-left">
            Tabuleiro <b className="text-white">cheio</b> sem 3 em linha: ninguém vence.
          </p>
        </div>
      </Section>

      <Section n={4} title="Modo some">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <Board pieces={BEFORE} className="w-28 sm:w-36" />
          <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-white/50" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
          <Board pieces={AFTER} className="w-28 sm:w-36" />
        </div>
        <p className="text-center text-sm text-white/70">
          Cada um fica com <b className="text-white">3 peças</b>. Ao pôr a 4ª, a mais antiga (a apagada) some. Sem vencedor em {FADE_LIMIT}{" "}
          lances, dá velha.
        </p>
      </Section>

      <Section n={5} title="Contra a IA">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {LEVELS.map((lv) => (
            <span key={lv} className={`rounded-lg px-3 py-1.5 font-display text-xs ${lv === "hard" ? "bg-gold text-stone-900" : "bg-white/10 text-white/70"}`}>
              {LEVEL_LABEL[lv]}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          No <b className="text-white">Impossível</b> a IA não erra: no clássico, o melhor que dá é empatar.
        </p>
      </Section>

      <Section n={6} title="De novo">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <ScoreDemo icon={<MarkIcon mark="X" ink="gold" className="h-3 w-3" />} value={2} gold />
            <span className="text-white/30">×</span>
            <ScoreDemo icon={<MarkIcon mark="O" ink="red" className="h-3 w-3" />} value={1} />
            <span className="text-white/30">×</span>
            <ScoreDemo icon={<GridIcon className="h-3 w-3 text-white/60" />} value={3} dim />
          </div>
          <span className="rounded-xl bg-gold px-5 py-2 font-display text-stone-900 shadow-[0_4px_0_#9a6b12]">De novo</span>
        </div>
        <p className="text-center text-sm text-white/70">
          Na mesma sala o placar vai somando (com as velhas), e quem começa <b className="text-white">alterna</b> a cada partida.
        </p>
      </Section>

      <Section n={7} title="Dicas">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Hint color="gold" text="você fecha" />
          <Hint color="red" text="ele fecha" />
        </div>
        <p className="text-center text-sm text-white/70">
          Contra a IA, com a lâmpada ligada, o tabuleiro marca as casas que fecham a linha. Entre duas pessoas não há dicas. No teclado, as
          teclas <b className="text-white">1 a 9</b> marcam as casas, linha a linha.
        </p>
      </Section>
    </>
  );
}

function Player({ mark, name, gold }: { mark: "X" | "O"; name: string; gold?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <MarkIcon mark={mark} ink={gold ? "gold" : "red"} className="h-12 w-12" />
      <span className={`text-xs ${gold ? "text-gold" : "text-red-400"}`}>{name}</span>
    </div>
  );
}

function ScoreDemo({ icon, value, gold, dim }: { icon: React.ReactNode; value: number; gold?: boolean; dim?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 leading-none">
      <span className="flex h-3 items-center">{icon}</span>
      <span className={`text-3xl ${gold ? "text-gold" : dim ? "text-white/60" : ""}`}>{value}</span>
    </div>
  );
}

function Hint({ color, text }: { color: "gold" | "red"; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-black/30 px-3 py-2">
      <span className={`h-6 w-6 rounded-full border-[3px] border-dashed ${color === "gold" ? "border-gold/80" : "border-red-400/80"}`} />
      <span className={`font-display text-xs ${color === "gold" ? "text-gold" : "text-red-400"}`}>{text}</span>
    </div>
  );
}
