import { HOT, WARM } from "@mesa/quente-ou-frio";
import { Section } from "@/components/ui/HowToSection";
import { CalendarIcon, HintIcon, InfinityIcon } from "@/components/ui/icons";
import { HEAT_COLOR, WordBar } from "./WordBar";

const TOTAL = 40_000;

// posições de exemplo para a palavra secreta "praia" (conferidas no vocabulário do jogo)
const EXAMPLE = [
  { word: "areia", rank: 4 },
  { word: "onda", rank: 872 },
  { word: "livro", rank: 9312 },
];

/** Regras do Quente ou Frio: página "Como jogar" e modal da partida. */
export function HowToPlay() {
  return (
    <div className="flex flex-col gap-4">
      <Section n={1} title="Objetivo">
        <p className="text-sm text-white/80">
          Descubra a palavra secreta. Chute quantas palavras quiser: cada uma ganha um número, que é a posição dela na lista das palavras mais
          parecidas com a secreta. A secreta é a nº 1.
        </p>
        <div className="flex flex-col gap-1.5">
          {EXAMPLE.map((m) => (
            <WordBar key={m.word} {...m} total={TOTAL} />
          ))}
        </div>
      </Section>

      <Section n={2} title="Quente ou frio">
        <p className="text-sm text-white/80">
          A proximidade vem do sentido e do assunto em que as palavras aparecem, não das letras. Ela foi calculada a partir de mais de um bilhão
          de palavras de textos em português.
        </p>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-display text-xs">
          {(
            [
              ["hot", `ATÉ ${HOT}`],
              ["warm", `ATÉ ${WARM.toLocaleString("pt-BR")}`],
              ["cold", "MAIS LONGE"],
            ] as const
          ).map(([h, label]) => (
            <span key={h} className="flex items-center gap-2">
              <span className="h-4 w-4 rounded" style={{ backgroundColor: HEAT_COLOR[h] }} />
              {label}
            </span>
          ))}
        </div>
      </Section>

      <Section n={3} title="Palavras aceitas">
        <p className="text-sm text-white/80">
          Acento, maiúscula, plural e verbo conjugado não contam: <b>Casas</b> vale como <b>casa</b> e <b>corri</b> como <b>correr</b>. Palavra que o jogo
          não conhece ou que você já chutou não gasta tentativa.
        </p>
      </Section>

      <Section n={4} title="Dica e desistir">
        <div className="flex flex-col gap-2 text-sm text-white/80">
          <p className="flex items-start gap-2">
            <HintIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            A dica revela uma palavra na metade da sua melhor posição (na 300, se ainda não chutou nada).
          </p>
          <p>Desistir mostra a palavra secreta e conta como derrota. No fim aparecem as 100 palavras mais próximas.</p>
        </div>
      </Section>

      <Section n={5} title="Do dia ou livre">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-black/25 p-3 text-center font-display">
            <CalendarIcon className="h-7 w-7 text-gold" />
            <span className="text-sm">DO DIA</span>
            <span className="text-[11px] text-white/60">A mesma para todos, troca à meia-noite</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-black/25 p-3 text-center font-display">
            <InfinityIcon className="h-7 w-7 text-gold" />
            <span className="text-sm">LIVRE</span>
            <span className="text-[11px] text-white/60">Palavra sorteada, quantas quiser</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
