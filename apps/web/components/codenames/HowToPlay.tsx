import { TIME_OPTIONS, type Key } from "@truco/codenames";
import { Section } from "@/components/ui/HowToSection";
import { Icon } from "@/components/ui/buttons";
import { ClockIcon, InfinityIcon, ListIcon, TimeLabel } from "@/components/ui/icons";
import { AgentIcon, EyeIcon, TEAM, WordCard } from "./Board";

/** Como o mestre vê a mesa e como o agente vê (mesmas palavras). */
const MAP: { word: string; k: Key; revealed?: boolean }[] = [
  { word: "Praia", k: 0 },
  { word: "Gelo", k: 1 },
  { word: "Sol", k: 0, revealed: true },
  { word: "Banco", k: "neutral" },
  { word: "Pirata", k: "assassin" },
  { word: "Areia", k: 0 },
  { word: "Lobo", k: "neutral" },
  { word: "Neve", k: 1, revealed: true },
  { word: "Onda", k: 0 },
  { word: "Disco", k: 1 },
];

const OUTCOMES: { k: Key; word: string; result: React.ReactNode }[] = [
  { k: 0, word: "Onda", result: <span className="text-white">continua</span> },
  { k: "neutral", word: "Banco", result: "passa a vez" },
  { k: 1, word: "Gelo", result: "passa a vez" },
  { k: "assassin", word: "Pirata", result: <span className="text-red-400">perde o jogo</span> },
];

/** Regras ilustradas do Codenames (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="grid grid-cols-2 gap-3">
          {([0, 1] as const).map((team) => (
            <div key={team} className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 ${TEAM[team].border} ${TEAM[team].soft}`}>
              <span className={`font-display text-sm ${TEAM[team].text}`}>{TEAM[team].name}</span>
              <div className="flex items-center gap-3 text-xs text-white/70">
                <span className="flex flex-col items-center gap-1">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${TEAM[team].bg}`}>
                    <EyeIcon className="h-5 w-5" />
                  </span>
                  Mestre
                </span>
                <span className="flex flex-col items-center gap-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800 ring-2 ring-white/20">
                    <AgentIcon className="h-5 w-5" />
                  </span>
                  Agentes
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          Dois times, cada um com <b className="text-white">1 mestre</b> e de <b className="text-white">1 a 5 agentes</b>. Vence quem revelar
          primeiro todas as suas palavras.
        </p>
      </Section>

      <Section n={2} title="O mapa">
        <div className="grid gap-4 sm:grid-cols-2">
          {[true, false].map((master) => (
            <div key={String(master)} className="flex flex-col items-center gap-2">
              <span className="flex items-center gap-1.5 font-display text-xs text-white/60">
                {master ? <EyeIcon className="h-4 w-4" /> : <AgentIcon className="h-4 w-4" />}
                {master ? "MESTRE" : "AGENTE"}
              </span>
              <div className="grid w-full max-w-xs grid-cols-5 gap-1">
                {MAP.map((c) => (
                  <WordCard key={c.word} word={c.word} k={master || c.revealed ? c.k : null} revealed={!!c.revealed} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white/70">
          <Legend k={0} label="9 ou 8" />
          <Legend k={1} label="8 ou 9" />
          <Legend k="neutral" label="7 civis" />
          <Legend k="assassin" label="1 assassino" />
        </div>
        <p className="text-center text-sm text-white/70">
          25 palavras. Só os mestres veem a cor de cada uma. O time que começa tem <b className="text-white">9</b>, o outro <b className="text-white">8</b>.
        </p>
      </Section>

      <Section n={3} title="A dica">
        <div className="flex items-center justify-center gap-2">
          <span className={`flex h-11 items-center rounded-lg bg-[#f3ead3] px-3 font-display text-xl text-stone-800 ring-[3px] ${TEAM[0].ring}`}>VERÃO</span>
          <span className={`flex h-11 w-11 items-center justify-center rounded-lg font-display text-xl text-white ${TEAM[0].bg} ${TEAM[0].shadow}`}>3</span>
        </div>
        <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-1.5">
          {["Praia", "Areia", "Onda"].map((w) => (
            <WordCard key={w} word={w} k={0} revealed={false} />
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          Na vez do time, o mestre digita <b className="text-white">uma palavra</b> e um <b className="text-white">número</b>: quantas palavras ela liga.
          Não vale palavra que está na mesa.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-sm text-white/70">
          <span className="rounded-full bg-white/5 px-3 py-1">
            <b className="font-display text-white">3</b> = até <b className="text-white">4</b> toques
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">
            <b className="font-display text-white">0</b> ou <InfinityIcon className="h-4 w-4 text-white" /> = sem limite
          </span>
        </div>
      </Section>

      <Section n={4} title="Os toques">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OUTCOMES.map((o) => (
            <div key={o.word} className="flex flex-col items-center gap-1.5">
              <WordCard word={o.word} k={o.k} revealed />
              <span className="text-center text-xs font-semibold text-white/60">{o.result}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3">
          <span className="relative w-28">
            <WordCard word="Praia" k={null} revealed={false} selected marks={[{ initial: "A", team: 0, mine: true }]} />
            <span className="absolute right-[4%] top-[6%] flex h-6 w-6 items-center justify-center rounded-full bg-gold text-stone-900 shadow-[0_2px_0_#9a6b12]">
              <Icon className="h-4 w-4">
                <path d="m5 12 5 5 9-10" />
              </Icon>
            </span>
          </span>
          <span className="rounded-xl bg-white/15 px-4 py-2 font-display">PASSAR</span>
        </div>
        <p className="text-center text-sm text-white/70">
          Os agentes tocam nas palavras para marcar (várias, e todos veem). Para revelar, um toque no{" "}
          <b className="text-gold">✓</b> da palavra marcada: uma por vez. Depois do primeiro toque, dá para passar. Palavra do outro time conta
          para ele.
        </p>
      </Section>

      <Section n={5} title="Opções da sala">
        <div className="grid gap-3 sm:grid-cols-2">
          <OptionCard icon={<ListIcon className="h-4 w-4" />} label="PALAVRAS">
            <div className="flex flex-col gap-0.5 rounded-xl bg-black/30 px-3 py-2 text-sm font-semibold uppercase leading-relaxed text-white/80">
              {["Praia", "Pirata", "Neve"].map((w) => (
                <span key={w}>{w}</span>
              ))}
              <span className="text-white/30">…</span>
            </div>
            <p>
              Quem cria a sala cola a lista, <b className="text-white">uma por linha</b>. Menos de 25? Completa com a lista pronta.
            </p>
          </OptionCard>
          <OptionCard icon={<ClockIcon className="h-4 w-4" />} label="TEMPO">
            <div className="flex rounded-xl bg-black/30 p-1">
              {TIME_OPTIONS.map((t) => (
                <span
                  key={t}
                  className={`flex h-8 flex-1 items-center justify-center rounded-lg font-display text-xs ${t === 90 ? "bg-gold text-stone-900" : "text-white/50"}`}
                >
                  <TimeLabel seconds={t} className={t === 0 ? "h-4 w-4" : undefined} />
                </span>
              ))}
            </div>
            <p>
              Vale para o mestre dar a dica e, de novo, para os agentes. Acabou, <b className="text-white">a vez passa</b>.
            </p>
          </OptionCard>
        </div>
      </Section>
    </>
  );
}

function Legend({ k, label }: { k: Key; label: string }) {
  const color = k === 0 ? "bg-cn-red" : k === 1 ? "bg-cn-blue" : k === "neutral" ? "bg-[#cbb98c]" : "bg-stone-950 ring-1 ring-white/40";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 rounded ${color}`} />
      {label}
    </span>
  );
}

/** Uma opção do lobby: título com ícone, a miniatura do controle e a explicação. */
function OptionCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 text-sm text-white/70 ring-1 ring-white/10">
      <span className="flex items-center gap-2 font-display text-xs text-gold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15">{icon}</span>
        {label}
      </span>
      {children}
    </div>
  );
}
