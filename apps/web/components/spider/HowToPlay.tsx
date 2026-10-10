import { isRed, SUIT_SETS, type Card, type Suit, type SuitCount } from "@truco/spider";
import { CardBack } from "@/components/cards/Card";
import { Section } from "@/components/ui/HowToSection";
import { HintIcon, UndoIcon } from "./icons";
import { SpiderCard, SuitIcon } from "./SpiderCard";

const c = (rank: number, suit: Suit): Card => ({ id: rank * 10 + suit.length, rank, suit });
const RUN = Array.from({ length: 13 }, (_, i) => c(13 - i, "spades"));
const W = 64;

/** Cartas empilhadas como numa coluna da mesa. `off` = cartas apagadas (não se movem). */
function MiniColumn({ cards, off = 0, down = 0 }: { cards: Card[]; off?: number; down?: number }) {
  const step = W * 1.452 * 0.3;
  return (
    <div className="relative shrink-0" style={{ width: W, height: W * 1.452 + (down + cards.length - 1) * step }}>
      {Array.from({ length: down }, (_, i) => (
        <div key={`d${i}`} className="absolute left-0" style={{ top: i * step * 0.5, width: W }}>
          <CardBack />
        </div>
      ))}
      {cards.map((card, i) => (
        <div
          key={i}
          className={`absolute left-0 ${i < off ? "brightness-50" : ""}`}
          style={{ top: down * step * 0.5 + i * step, width: W }}
        >
          <SpiderCard card={card} up width={W} />
        </div>
      ))}
    </div>
  );
}

function Mark({ ok }: { ok: boolean }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm ${
        ok ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
      }`}
      aria-label={ok ? "pode" : "não pode"}
    >
      {ok ? "✓" : "✕"}
    </span>
  );
}

function Example({ ok, children, caption }: { ok: boolean; children: React.ReactNode; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/30 p-3">
      <div className="flex items-end gap-3">{children}</div>
      <div className="flex items-center gap-2">
        <Mark ok={ok} />
        <span className="text-xs text-white/70">{caption}</span>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 self-center text-gold" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

const LEVELS: { n: SuitCount; label: string }[] = [
  { n: 1, label: "FÁCIL" },
  { n: 2, label: "MÉDIO" },
  { n: 4, label: "DIFÍCIL" },
];

/** Regras ilustradas da Paciência Spider (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex">
            {RUN.map((card, i) => (
              <div key={i} className="w-[34px] shrink-0" style={{ marginLeft: i ? -13 : 0 }}>
                <SpiderCard card={card} up width={34} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <span className="text-3xl text-gold">8</span>
            <span className="text-sm leading-tight text-white/70">
              sequências
              <br />
              para vencer
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">
          Monte sequências do <b>Rei ao Ás</b> do <b>mesmo naipe</b>. Cada uma completa sai sozinha da mesa.
        </p>
      </Section>

      <Section n={2} title="Mover cartas">
        <p className="text-sm text-white/70">
          Arraste uma carta para cima de outra <b>um ponto maior</b>, de qualquer naipe.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Example ok caption="7 sobre 8">
            <MiniColumn cards={[c(8, "spades"), c(7, "hearts")]} />
          </Example>
          <Example ok={false} caption="6 sobre 8">
            <MiniColumn cards={[c(8, "spades"), c(6, "hearts")]} />
          </Example>
        </div>
        <p className="text-sm text-white/70">
          Várias cartas só andam juntas se estiverem em ordem e forem <b>do mesmo naipe</b>.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Example ok caption="mesmo naipe: as 3 andam">
            <MiniColumn cards={[c(9, "spades"), c(8, "spades"), c(7, "spades")]} />
          </Example>
          <Example ok={false} caption="naipes misturados: só 8 e 7">
            <MiniColumn cards={[c(9, "spades"), c(8, "hearts"), c(7, "hearts")]} off={1} />
          </Example>
        </div>
      </Section>

      <Section n={3} title="Colunas">
        <div className="flex flex-wrap justify-center gap-3">
          <Example ok caption="carta virada aparece">
            <MiniColumn cards={[c(5, "hearts")]} down={3} />
          </Example>
          <Example ok caption="coluna vazia aceita qualquer carta">
            <div className="rounded-[7%/5%] border-2 border-dashed border-white/30" style={{ width: W, height: W * 1.452 }} />
            <Arrow />
            <MiniColumn cards={[c(13, "spades")]} />
          </Example>
        </div>
        <p className="text-sm text-white/70">Ao tirar as cartas de cima, a carta virada para baixo se revela.</p>
      </Section>

      <Section n={4} title="Monte">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <div className="relative h-[93px]" style={{ width: W + 4 * 10 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="absolute top-0" style={{ left: i * 10, width: W }}>
                <CardBack />
              </div>
            ))}
          </div>
          <span className="rotate-90 sm:rotate-0">
            <Arrow />
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="w-5 sm:w-7">
                <CardBack className="!border" />
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-white/70">
          Toque no monte para dar <b>uma carta para cada coluna</b> (5 vezes na partida). Não dá com coluna vazia.
        </p>
      </Section>

      <Section n={5} title="Pontos">
        <div className="flex flex-wrap justify-center gap-2 font-display">
          <Score value="500" label="no começo" tone="text-white" />
          <Score value="-1" label="por jogada" tone="text-red-400" />
          <Score value="+100" label="por sequência" tone="text-gold" />
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
              <UndoIcon />
            </span>
            desfaz (conta jogada)
          </span>
          <span className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
              <HintIcon />
            </span>
            mostra uma jogada
          </span>
        </div>
      </Section>

      <Section n={6} title="Dificuldade">
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map(({ n, label }) => (
            <div key={n} className="flex flex-col items-center gap-2 rounded-2xl bg-black/30 p-3">
              <div className="flex gap-0.5">
                {SUIT_SETS[n].map((s) => (
                  <SuitIcon key={s} suit={s} className={`h-5 w-5 ${isRed(s) ? "text-red-400" : "text-white"}`} />
                ))}
              </div>
              <span className="font-display text-xs text-white/80">{label}</span>
              <span className="text-[11px] text-white/50">
                {n} naipe{n > 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function Score({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="flex min-w-24 flex-col items-center rounded-2xl bg-black/40 px-4 py-2 leading-none">
      <span className={`text-2xl ${tone}`}>{value}</span>
      <span className="mt-1 font-sans text-[11px] text-white/60">{label}</span>
    </div>
  );
}
