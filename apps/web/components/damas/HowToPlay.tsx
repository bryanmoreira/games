"use client";

import { ENDGAME_LIMIT, QUIET_LIMIT, squareAt as sq } from "@truco/damas";
import { Section } from "@/components/ui/HowToSection";
import { PieceShape, StaticBoard, type Mark } from "./Board";
import { LEVEL_LABEL } from "./Settings";

type Marks = Partial<Record<number, Mark[]>>;
const marks = (list: [number, Mark][]): Marks => list.reduce<Marks>((m, [s, k]) => ((m[s] ??= []).push(k), m), {});

const MAN_MOVE = marks([
  [sq(5, 2), "selected"],
  [sq(4, 1), "target"],
  [sq(4, 3), "target"],
]);
const KING_MOVE = marks([
  [sq(5, 2), "selected"],
  ...[sq(4, 1), sq(3, 0), sq(4, 3), sq(3, 4), sq(2, 5), sq(1, 6), sq(0, 7), sq(6, 1), sq(7, 0), sq(6, 3), sq(7, 4)].map((s) => [s, "target"] as [number, Mark]),
]);
const CHAIN = marks([
  [sq(5, 4), "selected"],
  [sq(3, 2), "step"],
  [sq(1, 4), "target"],
]);
const MAJORITY = marks([
  [sq(5, 4), "selected"],
  [sq(3, 6), "step"],
  [sq(1, 4), "target"],
  [sq(3, 2), "threat"],
]);
const KING_CAPTURE = marks([
  [sq(7, 0), "selected"],
  ...[sq(4, 3), sq(3, 4), sq(2, 5), sq(1, 6), sq(0, 7)].map((s) => [s, "target"] as [number, Mark]),
]);

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-white/50" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

function Example({ label, rows, m }: { label: string; rows: string[]; m?: Marks }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <StaticBoard rows={rows} marks={m} className="w-full max-w-44" />
      <span className="font-display text-[10px] tracking-wider text-white/60">{label}</span>
    </div>
  );
}

/** Regras ilustradas das damas brasileiras (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-4 font-display">
            <Side p={1} name="Começa" />
            <span className="text-white/40">×</span>
            <Side p={-1} name="Responde" />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <span className="text-3xl text-gold">12</span>
            <span className="text-sm leading-tight text-white/70">
              peças
              <br />
              cada
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">
          Tabuleiro 8×8, só nas casas escuras. Vence quem <b className="text-white">capturar todas</b> as peças do outro ou deixá-lo{" "}
          <b className="text-white">sem lance</b>. As cores trocam a cada partida.
        </p>
      </Section>

      <Section n={2} title="Andar">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <Example label="PEDRA · 1 CASA" rows={["", "", "", "", "", "..w....."]} m={MAN_MOVE} />
          <Example label="DAMA · VÁRIAS" rows={["", "", "", "", "", "..W....."]} m={KING_MOVE} />
        </div>
      </Section>

      <Section n={3} title="Capturar">
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <Example label="EM SEQUÊNCIA" rows={["", "", "...b....", "", "...b....", "....w..."]} m={CHAIN} />
          <Example label="DAMA · DE LONGE" rows={["", "", "", "", "", "..b.....", "", "W......."]} m={KING_CAPTURE} />
        </div>
        <ul className="mx-auto flex max-w-md flex-col gap-1.5 text-sm text-white/70">
          <li>
            Capturar é <b className="text-white">obrigatório</b>, inclusive <b className="text-white">para trás</b>.
          </li>
          <li>As capturadas só saem no fim do lance: não dá para pular a mesma peça duas vezes.</li>
        </ul>
      </Section>

      <Section n={4} title="Lei da maioria">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <StaticBoard rows={["", "", ".....b..", "", "...b.b..", "....w..."]} marks={MAJORITY} className="w-40 sm:w-44" />
          <p className="max-w-60 text-center text-sm text-white/70 sm:text-left">
            Com mais de um jeito de capturar, é obrigatório o que leva <b className="text-white">mais peças</b>. Pedra e dama contam igual.
          </p>
        </div>
      </Section>

      <Section n={5} title="Dama">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          <StaticBoard rows={["", "..w....."]} marks={marks([[sq(1, 2), "selected"], [sq(0, 1), "target"]])} className="w-28 sm:w-36" />
          <Arrow />
          <StaticBoard rows={[".W......"]} marks={marks([[sq(0, 1), "last"], [sq(1, 2), "last"]])} className="w-28 sm:w-36" />
        </div>
        <p className="text-center text-sm text-white/70">
          A pedra que <b className="text-white">termina</b> o lance na última fileira vira dama. Se só passar por ela no meio de uma captura, continua pedra.
        </p>
      </Section>

      <Section n={6} title="Empate">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Draw big="3×" text="a mesma posição" />
          <Draw big={String(QUIET_LIMIT / 2)} text="lances de cada lado só com damas, sem captura" />
          <Draw big={String(ENDGAME_LIMIT / 2)} text="lances de cada lado em 2 damas contra 1 (e finais parecidos)" />
        </div>
      </Section>

      <Section n={7} title="Contra a IA">
        <div className="flex flex-wrap justify-center gap-2 font-display text-sm">
          {Object.values(LEVEL_LABEL).map((l) => (
            <span key={l} className="rounded-full bg-white/10 px-3 py-1">
              {l}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          Escolha o nível antes de jogar. Com as dicas ligadas, suas peças em perigo ganham um <b className="text-red-400">contorno vermelho</b>.
        </p>
      </Section>
    </>
  );
}

function Side({ p, name }: { p: number; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <PieceShape p={p} className="h-12 w-12" />
      <span className="text-[10px] tracking-wider text-white/60">{name.toUpperCase()}</span>
    </div>
  );
}

function Draw({ big, text }: { big: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
      <span className="font-display text-3xl text-gold">{big}</span>
      <span className="text-sm leading-tight text-white/70">{text}</span>
    </div>
  );
}
