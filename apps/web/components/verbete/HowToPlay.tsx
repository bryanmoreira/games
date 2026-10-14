import type { Mark, Mode } from "@truco/verbete";
import { Section } from "@/components/ui/HowToSection";
import { BackspaceIcon, CalendarIcon, ChevronIcon, EnterIcon, InfinityIcon } from "@/components/ui/icons";
import { MARK_BG, ModeIcon, MODE_NAME, WordTiles } from "./Tile";

const R: Mark = "right";
const P: Mark = "place";
const A: Mark = "absent";

// marcas conferidas com `score` da engine
const COLORS: { mark: Mark; label: string }[] = [
  { mark: "right", label: "LUGAR CERTO" },
  { mark: "place", label: "OUTRO LUGAR" },
  { mark: "absent", label: "NÃO TEM" },
];

const MODES: { mode: Mode; tries: number }[] = [
  { mode: 1, tries: 6 },
  { mode: 2, tries: 7 },
  { mode: 4, tries: 9 },
];

function Legend({ mark, label }: { mark: Mark; label: string }) {
  return (
    <span className="flex items-center gap-2 font-display text-xs">
      <span className="h-4 w-4 rounded ring-1 ring-white/25" style={{ backgroundColor: MARK_BG[mark] }} />
      {label}
    </span>
  );
}

/** Tecla dividida do Dueto: metade do quadro da esquerda, metade do da direita. */
function SplitKey({ letter, marks }: { letter: string; marks: (Mark | null)[] }) {
  return (
    <span className="relative flex h-12 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/15 font-display text-lg">
      <span className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${marks.length === 4 ? 2 : marks.length}, 1fr)` }}>
        {marks.map((m, i) => (
          <span key={i} style={{ backgroundColor: m ? MARK_BG[m] : "transparent" }} />
        ))}
      </span>
      <span className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{letter}</span>
    </span>
  );
}

/** Regras do Verbete: página "Como jogar" e modal da partida. */
export function HowToPlay() {
  return (
    <div className="flex flex-col gap-4">
      <Section n={1} title="Objetivo">
        <p className="text-sm text-white/80">Descubra a palavra de 5 letras. Cada chute precisa ser uma palavra que existe.</p>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(({ mode, tries }) => (
            <div key={mode} className="flex flex-col items-center gap-1.5 rounded-2xl bg-black/25 p-3 font-display">
              <ModeIcon mode={mode} className="h-7 w-7 text-gold" />
              <span className="text-xs sm:text-sm">{MODE_NAME[mode].toUpperCase()}</span>
              <span className="text-[10px] text-white/60">
                {mode} PALAVRA{mode > 1 ? "S" : ""}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80">{tries} CHUTES</span>
            </div>
          ))}
        </div>
      </Section>

      <Section n={2} title="As cores">
        <div className="flex flex-col items-center gap-3">
          <WordTiles word="TEMPO" marks={[P, R, A, A, A]} tile="w-11 text-xl" />
          <WordTiles word="FESTA" marks={[R, R, R, R, R]} tile="w-11 text-xl" />
        </div>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {COLORS.map((c) => (
            <Legend key={c.mark} {...c} />
          ))}
        </div>
      </Section>

      <Section n={3} title="Letras repetidas">
        <p className="text-sm text-white/80">Uma letra pode aparecer mais de uma vez. Se você repetir uma letra que a palavra só tem uma vez, a sobra fica cinza.</p>
        <div className="flex flex-col items-center gap-3">
          <WordTiles word="TORRE" marks={[P, R, R, A, R]} tile="w-11 text-xl" />
          <WordTiles word="NORTE" marks={[R, R, R, R, R]} tile="w-11 text-xl" />
        </div>
      </Section>

      <Section n={4} title="Acentos">
        <p className="text-sm text-white/80">Não precisa digitar acento nem cedilha: eles entram sozinhos e não contam nas cores.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <WordTiles word="SUITE" tile="w-10 text-lg" />
          <ChevronIcon className="h-6 w-6 text-gold" />
          <WordTiles word="SUÍTE" marks={[R, R, R, R, R]} tile="w-10 text-lg" />
        </div>
      </Section>

      <Section n={5} title="Dueto e Quarteto">
        <p className="text-sm text-white/80">
          Cada chute vale para todas as palavras ao mesmo tempo. A palavra que você acertar para de receber chutes. No teclado, cada tecla mostra a cor de cada
          palavra, na mesma posição dos quadros.
        </p>
        <div className="flex items-center justify-center gap-6">
          <SplitKey letter="A" marks={[R, A]} />
          <SplitKey letter="E" marks={[P, null, R, A]} />
        </div>
      </Section>

      <Section n={6} title="Teclado">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-display text-xs text-white/80">
          <span className="flex items-center gap-2">
            <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-gold text-stone-900">
              <EnterIcon className="h-6 w-6" />
            </span>
            CHUTAR
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-10 w-12 items-center justify-center rounded-lg bg-white/15">
              <BackspaceIcon className="h-6 w-6" />
            </span>
            APAGAR
          </span>
        </div>
        <p className="text-center text-sm text-white/70">Toque numa casa da linha para escrever nela.</p>
      </Section>

      <Section n={7} title="Palavra do dia e livre">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl bg-black/25 p-3">
            <CalendarIcon className="h-6 w-6 shrink-0 text-gold" />
            <p className="text-sm text-white/80">Uma palavra por modo a cada dia, a mesma para todo mundo, trocando à meia-noite de Brasília. Os dias anteriores ficam no calendário.</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-black/25 p-3">
            <InfinityIcon className="h-6 w-6 shrink-0 text-gold" />
            <p className="text-sm text-white/80">No livre, as palavras são sorteadas e dá para jogar quantas vezes quiser.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
