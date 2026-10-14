"use client";

import { BASE, HOME } from "@truco/ludo";
import { Section } from "@/components/ui/HowToSection";
import { DieFace, Pawn, StaticBoard, type UiPiece } from "./Board";

const p = (color: number, piece: number, progress: number): UiPiece => ({ color, piece, progress });

// partida no meio: peças na base, no caminho, na reta final e na chegada
const SAMPLE: UiPiece[] = [
  p(0, 0, 9), p(0, 1, 30), p(0, 2, BASE), p(0, 3, 53),
  p(1, 0, 4), p(1, 1, HOME), p(1, 2, BASE), p(1, 3, BASE),
  p(2, 0, 20), p(2, 1, 21), p(2, 2, BASE), p(2, 3, BASE),
  p(3, 0, HOME), p(3, 1, HOME), p(3, 2, 44), p(3, 3, BASE),
];

function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="3" fill="#fffdf7" stroke="#cdbf9f" strokeWidth="1.5" />
      <polygon points="12,3.5 14.2,9.2 20.2,9.4 15.5,13.2 17.2,19 12,15.6 6.8,19 8.5,13.2 3.8,9.4 9.8,9.2" fill="#c9b98f" />
    </svg>
  );
}

/** Regras ilustradas do Ludo (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <StaticBoard pieces={SAMPLE} turns={0} className="w-full max-w-56" />
          <p className="max-w-64 text-center text-sm text-white/70 sm:text-left">
            De 2 a 4 jogadores, 4 peças cada. Dê a volta no tabuleiro e leve as <b className="text-white">4 peças ao centro</b> antes
            de todo mundo.
          </p>
        </div>
      </Section>

      <Section n={2} title="Sair da base">
        <div className="flex items-center justify-center gap-3">
          <DieFace value={1} className="h-12 w-12" />
          <span className="font-display text-white/40">ou</span>
          <DieFace value={6} className="h-12 w-12" />
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <Pawn color={0} className="h-12 w-12" />
        </div>
        <p className="text-center text-sm text-white/70">
          Toque no dado para rolar. A peça só sai da base com <b className="text-white">1 ou 6</b> e vai para a casa de saída da sua cor.
          Sem lance possível, a vez passa.
        </p>
      </Section>

      <Section n={3} title="O caminho">
        <p className="text-center text-sm text-white/70">
          As peças andam no <b className="text-white">sentido horário</b>. Depois de quase uma volta, entram na reta final da sua cor, onde
          ninguém captura. Para chegar ao centro, o dado tem de dar o <b className="text-white">número exato</b>.
        </p>
        <p className="text-center text-sm text-white/70">
          Com mais de uma peça para mover, as que podem andar piscam: toque na escolhida. Se todas vão para o mesmo lugar, o lance sai
          sozinho.
        </p>
      </Section>

      <Section n={4} title="Captura">
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-1">
            <Pawn color={3} className="h-11 w-11" />
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <Pawn color={2} dim className="h-11 w-11" />
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-10 w-10" />
            <span className="font-display text-xs text-white/60">SEGURA</span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">
          Parou numa casa com peça de outra cor? Ela <b className="text-white">volta para a base</b>. Nas casas de saída e nas estrelas não
          há captura. Peças juntas não bloqueiam ninguém.
        </p>
      </Section>

      <Section n={5} title="Jogue de novo">
        <div className="flex flex-wrap items-center justify-center gap-3 font-display text-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5">
            <DieFace value={6} className="h-6 w-6" />6
          </span>
          <span className="rounded-full bg-black/30 px-3 py-1.5">CAPTURA</span>
          <span className="rounded-full bg-black/30 px-3 py-1.5">CHEGADA</span>
        </div>
        <p className="text-center text-sm text-white/70">
          Tirou 6, capturou ou levou uma peça ao centro: rola de novo. Mas o <b className="text-white">3º seis seguido</b> perde a vez sem
          mover.
        </p>
      </Section>

      <Section n={6} title="2, 3 ou 4 jogadores">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5">
            <Pawn color={0} className="h-6 w-6" />
            <span className="mx-1 font-display text-xs text-white/40">×</span>
            <Pawn color={2} className="h-6 w-6" />
          </span>
        </div>
        <p className="text-center text-sm text-white/70">
          Com 2, as cores ficam em cantos opostos. Vence quem levar as 4 peças primeiro, e a partida acaba aí. Na mesma sala o placar
          vai somando e quem começa <b className="text-white">passa ao próximo</b>.
        </p>
      </Section>
    </>
  );
}
