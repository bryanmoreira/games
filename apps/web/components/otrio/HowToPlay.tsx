"use client";

import type { WinKind } from "@mesa/otrio";
import { Section } from "@/components/ui/HowToSection";
import { ColorMark, RingIcon, StaticBoard } from "./Board";

export const WIN_NAMES: Record<WinKind, string> = { line: "LINHA", stair: "ESCADA", stack: "ALVO" };

const WINS: { kind: WinKind; cells: string[]; win: number[]; text: string }[] = [
  { kind: "line", cells: [".r.", ".r.", ".r.", "", "b..", "", "..g", "", ""], win: [1, 4, 7], text: "3 do mesmo tamanho" },
  { kind: "stair", cells: ["r..", "", ".b.", "..g", ".r.", "", "", "", "..r"], win: [0, 13, 26], text: "pequena → média → grande" },
  { kind: "stack", cells: ["b..", "", "", "", "rrr", ".g.", "", "", ""], win: [12, 13, 14], text: "3 tamanhos na casa" },
];

/** Regras ilustradas do Otrio (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((c) => (
              <ColorMark key={c} color={c} className="h-10 w-10" />
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <span className="text-3xl text-gold">3</span>
            <span className="text-sm leading-tight text-white/70">
              da sua cor
              <br />
              vencem
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">
          De 2 a 4 jogadores, uma cor cada. Cada cor tem <b className="text-white">9 peças</b>: 3 pequenas, 3 médias e 3 grandes.
        </p>
      </Section>

      <Section n={2} title="Encaixe">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-end gap-2">
            {([0, 1, 2] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <RingIcon color={1} size={s} className="h-12 w-12" />
                <span className="font-display text-[10px] text-white/60">×3</span>
              </div>
            ))}
          </div>
          <p className="max-w-60 text-center text-sm text-white/70 sm:text-left">
            Escolha o <b className="text-white">tamanho</b> e toque numa casa. Cada casa tem um encaixe de cada tamanho, e as
            peças não saem mais do lugar.
          </p>
        </div>
      </Section>

      <Section n={3} title="Como vencer">
        <div className="grid grid-cols-3 gap-3">
          {WINS.map((w) => (
            <div key={w.kind} className="flex flex-col items-center gap-1.5">
              <StaticBoard cells={w.cells} win={w.win} className="w-full max-w-40" />
              <span className="font-display text-xs tracking-wider text-gold">{WIN_NAMES[w.kind]}</span>
              <span className="text-center text-[11px] leading-tight text-white/60">{w.text}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">Em linha vale na horizontal, na vertical e na diagonal. A escada vale nos dois sentidos.</p>
      </Section>

      <Section n={4} title="2 ou 3 jogadores">
        <div className="flex flex-wrap items-center justify-center gap-3 font-display text-xs">
          <span className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5">
            <ColorMark color={0} className="h-5 w-5" />
            <ColorMark color={2} className="h-5 w-5" />
            <span className="mx-1 text-white/40">×</span>
            <ColorMark color={1} className="h-5 w-5" />
            <ColorMark color={3} className="h-5 w-5" />
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5">
            <ColorMark color={0} className="h-5 w-5" />
            <ColorMark color={1} className="h-5 w-5" />
            <ColorMark color={2} className="h-5 w-5" />
          </span>
        </div>
        <p className="text-center text-sm text-white/70">
          Com <b className="text-white">2</b>, cada um joga com duas cores, alternando: a sua 1ª, a dele, a sua 2ª, a dele. A trinca
          tem de ser de uma cor só. Com <b className="text-white">3</b>, a 4ª cor fica de fora.
        </p>
      </Section>

      <Section n={5} title="Passe e empate">
        <p className="text-center text-sm text-white/70">
          Sem peça que caiba num encaixe livre, a cor <b className="text-white">passa a vez</b>. Se ninguém mais consegue jogar,
          dá <b className="text-white">empate</b>.
        </p>
      </Section>

      <Section n={6} title="De novo">
        <p className="text-center text-sm text-white/70">
          Na mesma sala o placar vai somando, e quem começa <b className="text-white">passa ao próximo</b> a cada partida.
        </p>
      </Section>

      <Section n={7} title="Dicas">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Hint color="#f2c14e" text="você fecha" cls="text-gold" />
          <Hint color="#ff8a80" text="bloqueie" cls="text-red-300" />
        </div>
        <p className="text-center text-sm text-white/70">
          Contra a IA, com a lâmpada ligada, o tabuleiro marca os encaixes que fecham uma trinca. Entre pessoas não há dicas. No
          teclado, as teclas <b className="text-white">1, 2 e 3</b> escolhem o tamanho.
        </p>
      </Section>
    </>
  );
}

function Hint({ color, text, cls }: { color: string; text: string; cls: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-black/30 px-3 py-2">
      <svg viewBox="0 0 40 40" className="h-9 w-9 rounded-lg bg-[#7c4b22]" aria-hidden="true">
        <circle cx="20" cy="20" r="12" fill="none" stroke={color} strokeWidth="3" strokeDasharray="5 4" />
      </svg>
      <span className={`font-display text-xs ${cls}`}>{text}</span>
    </div>
  );
}
