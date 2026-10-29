"use client";

import { SHOT_MS } from "@mesa/sinuca";
import { Section } from "@/components/ui/HowToSection";
import { BallArt, MiniBall } from "./MiniBall";

const SOLIDS = [1, 2, 3, 4, 5, 6, 7];
const STRIPES = [9, 10, 11, 12, 13, 14, 15];

function Balls({ nums, size = 22 }: { nums: number[]; size?: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {nums.map((n) => (
        <MiniBall key={n} n={n} size={size} />
      ))}
    </div>
  );
}

/** Ponto de batida na branca, com a seta do que a branca faz depois de bater na bola. */
function SpinExample({ x, y, label, path }: { x: number; y: number; label: string; path: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <svg viewBox="-1 -1 2 2" className="h-12 w-12">
          <circle r="0.96" fill="#f3efe4" />
          <circle cx={x * 0.82} cy={-y * 0.82} r="0.17" fill="#d8231f" stroke="#fff" strokeWidth="0.05" />
        </svg>
        <svg viewBox="0 0 80 50" className="h-12 w-20" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="40" cy="25" r="6" fill="#f4c20d" />
          <path d={path} stroke="rgba(190,225,255,0.9)" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="28" cy="25" r="6" fill="none" stroke="#fff" strokeWidth="1.5" />
          <path d="M4 25h17" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>
      <span className="font-display text-[10px] tracking-wider text-white/60">{label}</span>
    </div>
  );
}

/** Regras ilustradas da bola 8 (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-3 font-display text-xs text-white/70">
          <div className="flex flex-col items-center gap-1.5">
            <Balls nums={SOLIDS} />
            <span>LISAS</span>
          </div>
          <span className="text-white/40">×</span>
          <div className="flex flex-col items-center gap-1.5">
            <Balls nums={STRIPES} />
            <span>LISTRADAS</span>
          </div>
        </div>
        <p className="text-white/80">
          Cada lado (você sozinho ou a dupla) fica com um grupo: lisas (1 a 7) ou listradas (9 a 15). Encaçape todas as suas e depois a <b>8</b>,
          na caçapa que você cantar. Quem encaçapar a 8 primeiro, do jeito certo, ganha.
        </p>
      </Section>

      <Section n={2} title="Quebra">
        <p className="text-white/80">
          A partida começa com o triângulo montado e a branca na <b>cozinha</b> (a faixa atrás da linha da cabeceira). Quem quebra põe a branca
          onde quiser dentro dela. A quebra vale se alguma bola cair ou se pelo menos 4 bolas baterem na tabela; se não, é falta.
        </p>
        <p className="text-white/80">
          Depois da quebra a mesa fica <b>aberta</b>: o primeiro a encaçapar uma bola numa tacada válida fica com o grupo dela, e o adversário
          com o outro. A 8 que cai na quebra volta para a marca e quem quebrou continua.
        </p>
      </Section>

      <Section n={3} title="Sua vez">
        <p className="text-white/80">
          A branca tem que tocar <b>primeiro numa bola sua</b> (com a mesa aberta, em qualquer uma menos a 8). Depois do toque, alguma bola
          precisa cair ou bater numa tabela. Encaçapou uma sua? Joga de novo. Errou? Passa a vez.
        </p>
        <p className="text-white/80">No 2×2, a vez gira entre os quatro e os times se alternam.</p>
      </Section>

      <Section n={4} title="Faltas">
        <ul className="grid gap-2 text-white/80 sm:grid-cols-2">
          <li>• Branca na caçapa</li>
          <li>• Não tocar em nenhuma bola</li>
          <li>• Tocar primeiro na bola errada</li>
          <li>• Nada cair nem bater na tabela depois do toque</li>
          <li>• Com a branca na cozinha, tocar primeiro numa bola que também está nela</li>
          <li>• Estourar o tempo ({SHOT_MS / 1000} s por tacada, se a sala usar relógio)</li>
        </ul>
        <p className="text-white/80">
          Depois de uma falta, o adversário joga com <b>bola na mão</b>: arrasta a branca para qualquer lugar da mesa antes de bater.
        </p>
      </Section>

      <Section n={5} title="A 8">
        <div className="flex justify-center">
          <BallArt n={8} className="h-12 w-12" />
        </div>
        <p className="text-white/80">
          Quando acabarem as suas, a vez é na 8: toque na caçapa para <b>cantar</b> onde ela vai cair. Você perde se encaçapar a 8 antes da hora,
          em outra caçapa ou junto com uma falta (como a branca caindo também).
        </p>
      </Section>

      <Section n={6} title="Tacada">
        <ul className="flex flex-col gap-2 text-white/80">
          <li>
            <b>Mira:</b> toque ou arraste na mesa. A linha mostra a bola fantasma (onde a branca encosta), o rumo da bola atingida e o da branca.
            Os botões de girar e as setas do teclado ajustam a mira bem de leve.
          </li>
          <li>
            <b>Efeito:</b> toque na bola branca do canto para escolher onde o taco bate. Dois toques voltam para o centro.
          </li>
          <li>
            <b>Força:</b> aperte na barra e arraste; quanto mais longe, mais forte. Soltar bate; voltar até o começo cancela.
          </li>
        </ul>
        <div className="flex flex-wrap justify-center gap-5">
          <SpinExample x={0} y={0} label="CENTRO: PARA" path="M28 25h0" />
          <SpinExample x={0} y={0.8} label="ALTO: SEGUE" path="M28 25 C 40 25, 50 24, 70 22" />
          <SpinExample x={0} y={-0.8} label="BAIXO: VOLTA" path="M28 25 C 22 25, 16 26, 8 28" />
        </div>
        <p className="text-white/80">
          O efeito de lado muda o ângulo em que a branca sai da tabela e desvia a branca um pouquinho para o outro lado. Tudo segue a física de
          uma mesa de verdade: atrito do pano, giro da bola e o leve desvio da bola atingida no corte.
        </p>
      </Section>
    </>
  );
}
