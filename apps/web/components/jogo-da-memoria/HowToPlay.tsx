import { Section } from "@/components/ui/HowToSection";
import { Fruit } from "./Fruit";

export function HowToPlay() {
  return <div className="flex flex-col gap-5 text-sm leading-relaxed text-white/80">
    <Section n={1} title="15 pares de frutas">
      <p>São 30 cartas viradas para baixo, com duas de cada fruta. Encontre todos os pares no solo ou dispute quem encontra mais contra outro jogador.</p>
      <div className="flex justify-center gap-3">{[0,2,0,2].map((fruit,i) => <div key={i} className="flex h-20 w-16 items-center justify-center rounded-xl bg-[#faf2dd]"><Fruit fruit={fruit} className="h-14 w-14" /></div>)}</div>
    </Section>
    <Section n={2} title="Vire duas cartas">
      <p>Toque ou clique em uma carta e depois em outra. Cada dupla revelada conta uma tentativa. As frutas ficam à vista por um instante para todos memorizarem.</p>
      <p>Se forem iguais, você fica com o par e joga de novo. Se forem diferentes, elas viram para baixo e a vez passa. No solo, você continua tentando.</p>
    </Section>
    <Section n={3} title="Quem colhe mais?">
      <p>A partida acaba quando os 15 pares forem encontrados. Nas disputas de dois jogadores, vence quem tiver mais pares. Como há 15 pares, não há empate.</p>
      <p>No solo, busque menos tentativas e melhor tempo. O relógio começa na primeira carta e pausa ao ocultar a aba ou abrir a ajuda. Recarregar a página permite continuar.</p>
    </Section>
    <Section n={4} title="Jogue do seu jeito">
      <p>Jogue sozinho, enfrente uma IA ou crie uma sala e convide um amigo pelo link ou código. As disputas têm sempre dois jogadores.</p>
      <p>A IA joga sempre no fácil: só conhece frutas que já apareceram e lembra as últimas 4 posições. Não há prévia das cartas nem limite de tempo.</p>
    </Section>
  </div>;
}
