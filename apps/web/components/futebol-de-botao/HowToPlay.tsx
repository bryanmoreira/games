"use client";

import { Section } from "@/components/ui/HowToSection";
import { BallIcon } from "./Controls";
import { FieldArt, TEAM_COLORS } from "./Field";

function Key({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <span
      className={`flex h-10 items-center justify-center rounded-lg border-2 border-white/30 bg-white/10 font-display text-sm shadow-[0_3px_0_rgba(255,255,255,0.15)] ${wide ? "px-5" : "w-10"}`}
    >
      {children}
    </span>
  );
}

const Arrow = ({ rotate }: { rotate: number }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" style={{ transform: `rotate(${rotate}deg)` }} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

/** Regras ilustradas do Futebol de Botão (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <FieldArt className="mx-auto w-full max-w-md" />
        <p className="text-center text-sm text-white/70">
          Futebol em tempo real, de <b className="text-white">1×1 a 3×3</b>. Cada jogador é um botão. Empurre e chute a bola para o gol
          do outro time: o <b style={{ color: TEAM_COLORS[0].fill }}>vermelho</b> ataca para a direita e o{" "}
          <b style={{ color: TEAM_COLORS[1].fill }}>azul</b>, para a esquerda. Na tela, o seu time sempre ataca para a frente.
        </p>
      </Section>

      <Section n={2} title="Controles">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <Key>
              <Arrow rotate={0} />
            </Key>
            <div className="flex gap-1">
              <Key>
                <Arrow rotate={-90} />
              </Key>
              <Key>
                <Arrow rotate={180} />
              </Key>
              <Key>
                <Arrow rotate={90} />
              </Key>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Key wide>ESPAÇO</Key>
            <span className="font-display text-xs text-white/50">ou X</span>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/60 bg-black/25">
            <BallIcon className="h-8 w-8" />
          </span>
        </div>
        <p className="text-center text-sm text-white/70">
          Setas (ou WASD) para andar e <b className="text-white">Espaço</b> ou <b className="text-white">X</b> para chutar. No celular, arraste o
          dedo na metade esquerda da tela para andar e toque na direita para chutar.
        </p>
      </Section>

      <Section n={3} title="O chute">
        <p className="text-center text-sm text-white/70">
          Segurando o chute, o botão ganha uma <b className="text-white">borda branca</b>, anda um pouco mais devagar e chuta assim que
          encosta na bola. Para chutar de novo, solte e aperte outra vez. Sem chutar, o botão só empurra a bola.
        </p>
      </Section>

      <Section n={4} title="Saída de bola">
        <p className="text-center text-sm text-white/70">
          A bola começa no centro. Até alguém tocar nela, cada time fica no seu campo, e quem não está com a saída fica fora do círculo
          central. O vermelho começa; depois de cada gol, a saída é de quem sofreu.
        </p>
      </Section>

      <Section n={5} title="Fim de jogo">
        <p className="text-center text-sm text-white/70">
          Vence quem fizer <b className="text-white">3 gols</b> ou estiver na frente quando acabarem os <b className="text-white">3 minutos</b>.
          Empatou no fim do tempo? <b className="text-gold">Gol de ouro</b>: o próximo gol decide.
        </p>
      </Section>
    </>
  );
}
