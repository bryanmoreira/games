import { makeCard, RANKS, type Card } from "@truco/game";
import { CardBack, CardImg } from "./Card";
import { ViraPicker } from "./ViraPicker";

const ORDER_SUITS = ["clubs", "hearts", "spades", "diamonds"] as const;

// Exemplo de vaza com vira 7 (manilha Q)
const EXAMPLE: { who: string; card: Card; team: "nos" | "eles"; win?: boolean }[] = [
  { who: "Você", card: makeCard("3", "hearts"), team: "nos" },
  { who: "Adversário", card: makeCard("K", "spades"), team: "eles" },
  { who: "Parceiro", card: makeCard("Q", "diamonds"), team: "nos", win: true },
  { who: "Adversário", card: makeCard("2", "clubs"), team: "eles" },
];

type Pip = "w" | "l" | "t" | null;
const TIES: { pips: Pip[]; text: string; result: string }[] = [
  { pips: ["t", "w", null], text: "Empatou a 1ª", result: "quem ganhar a 2ª leva" },
  { pips: ["w", "t", null], text: "Ganhou a 1ª e empatou a 2ª", result: "leva" },
  { pips: ["w", "l", "t"], text: "Empatou a 3ª", result: "quem ganhou a 1ª leva" },
  { pips: ["t", "t", "t"], text: "Tudo empatado", result: "ninguém pontua" },
];

const BETS = [
  { v: 1, label: "VALE" },
  { v: 3, label: "TRUCO" },
  { v: 6, label: "SEIS" },
  { v: 9, label: "NOVE" },
  { v: 12, label: "DOZE" },
];

/** Regras ilustradas do Truco Paulista (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-3">
            <Team color="gold" names={["Você", "Parceiro"]} />
            <span className="font-display text-white/40">×</span>
            <Team color="red" names={["Adversário", "Adversário"]} />
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
            <span className="text-3xl text-gold">12</span>
            <span className="text-sm leading-tight text-white/70">
              pontos
              <br />
              para vencer
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">Duas duplas. Parceiros sentam de frente um para o outro.</p>
      </Section>

      <Section n={2} title="Força das cartas">
        <p className="text-sm text-white/70">Baralho de 40 cartas: sem 8, 9, 10 e coringas. O naipe não importa nas cartas comuns.</p>
        <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
          {RANKS.map((r, i) => (
            <CardImg key={r} card={makeCard(r, ORDER_SUITS[i % 4])} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>mais fraca</span>
          <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-gold" />
          <span className="text-gold">mais forte</span>
        </div>
      </Section>

      <Section n={3} title="Vira e manilhas">
        <p className="text-sm text-white/70">
          Depois de dar as cartas, uma carta é virada na mesa: a <b className="text-white">vira</b>. As cartas{" "}
          <b className="text-white">logo acima</b> dela viram <b className="text-gold">manilhas</b> e ganham de todas. Toque
          numa vira para ver:
        </p>
        <ViraPicker />
      </Section>

      <Section n={4} title="A mão">
        <p className="text-sm text-white/70">
          Cada um recebe 3 cartas. Na sua vez, jogue uma. A carta mais forte leva a <b className="text-white">vaza</b>. Quem
          fizer 2 vazas ganha a mão.
        </p>
        <div className="rounded-2xl bg-felt/60 p-3 sm:p-4">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {EXAMPLE.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-full max-w-24 ${p.win ? "-translate-y-2 [&>*]:outline-4 [&>*]:outline-offset-2 [&>*]:outline-gold" : ""}`}>
                  <CardImg card={p.card} />
                </div>
                <span className={`text-[11px] font-semibold sm:text-xs ${p.team === "nos" ? "text-gold" : "text-red-300"}`}>
                  {p.who}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-white/70">
            Vira 7 → a <b className="text-gold">dama de ouros</b> é manilha e leva a vaza.
          </p>
        </div>

        <h3 className="mt-2 font-display text-sm text-white/80">Empates</h3>
        <p className="-mt-2 text-xs text-white/50">Cartas iguais de duplas diferentes empatam a vaza.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIES.map((t, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-black/30 px-3 py-2">
              <div className="flex gap-1">
                {t.pips.map((p, j) => (
                  <PipBox key={j} pip={p} />
                ))}
              </div>
              <span className="text-xs leading-snug text-white/80">
                {t.text}: <b className="text-white">{t.result}</b>
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section n={5} title="Truco!">
        <p className="text-sm text-white/70">Na sua vez, peça truco para a mão valer mais. A outra dupla responde:</p>
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {BETS.map((b, i) => (
            <div key={b.v} className="flex items-center gap-1 sm:gap-2">
              {i > 0 && <span className="text-xs text-white/30 sm:text-base">→</span>}
              <div
                className={`flex min-w-11 flex-col items-center rounded-xl px-1.5 py-1.5 leading-none sm:min-w-14 sm:px-2.5 ${
                  i === 0 ? "bg-white/10" : "bg-gold/15 ring-1 ring-gold/40"
                }`}
              >
                <span className={`font-display text-[9px] ${i === 0 ? "text-white/60" : "text-gold"}`}>{b.label}</span>
                <span className={`font-display text-xl ${i === 0 ? "text-white" : "text-gold"}`}>{b.v}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Answer btn="QUERO" color="bg-emerald-500 shadow-[0_4px_0_#047857]">
            aceita: a mão passa a valer o novo valor
          </Answer>
          <Answer btn="CORRO" color="bg-red-500 shadow-[0_4px_0_#991b1b]">
            desiste: quem pediu ganha o valor anterior
          </Answer>
          <Answer btn="SEIS!" color="bg-gold text-stone-900 shadow-[0_4px_0_#9a6b12]">
            aumenta: agora quem pediu é que responde
          </Answer>
        </div>
      </Section>

      <Section n={6} title="Carta coberta">
        <div className="flex items-center justify-center gap-4">
          <div className="relative w-16 sm:w-20">
            <CardImg card={makeCard("4", "clubs")} />
            <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 ring-2 ring-gold">
              <span className="card-back block w-3 !border" />
            </span>
          </div>
          <span className="font-display text-2xl text-gold">→</span>
          <div className="w-16 sm:w-20">
            <CardBack />
          </div>
        </div>
        <p className="text-center text-sm text-white/70">
          A partir da 2ª vaza, você pode jogar uma carta virada para esconder seu jogo. Ela não vale nada.
        </p>
      </Section>

      <Section n={7} title="Mão de 11 e mão de ferro">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-2xl bg-black/30 p-4">
            <span className="self-start rounded-full bg-gold/20 px-3 py-1 font-display text-xs text-gold">MÃO DE 11</span>
            <p className="text-sm text-white/70">
              A dupla com 11 pontos vê as cartas do parceiro e decide: <b className="text-white">BORA</b> (a mão vale 3) ou{" "}
              <b className="text-white">CORRO</b> (adversário ganha 1). Não tem truco.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl bg-black/30 p-4">
            <span className="self-start rounded-full bg-red-500/20 px-3 py-1 font-display text-xs text-red-300">MÃO DE FERRO</span>
            <p className="text-sm text-white/70">
              11 a 11: ninguém vê as próprias cartas. Jogue às cegas. Vale 1 e não tem truco.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-6">
      <h2 className="flex items-center gap-3 font-display text-lg sm:text-xl">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm text-stone-900">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Team({ color, names }: { color: "gold" | "red"; names: string[] }) {
  return (
    <div className="flex gap-1.5">
      {names.map((n, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] font-display ${
              color === "gold" ? "border-gold bg-gold text-stone-900" : "border-red-400/80 bg-stone-800"
            }`}
          >
            {n[0]}
          </span>
          <span className="text-[10px] text-white/60">{n}</span>
        </div>
      ))}
    </div>
  );
}

function PipBox({ pip }: { pip: Pip }) {
  const cls =
    pip === "w"
      ? "bg-gold text-stone-900"
      : pip === "l"
        ? "bg-red-500 text-white"
        : pip === "t"
          ? "bg-white/70 text-stone-900"
          : "border border-white/15";
  return (
    <span className={`flex h-7 w-5 items-center justify-center rounded-[5px] text-xs font-bold ${cls}`}>
      {pip === "w" ? "✓" : pip === "l" ? "✕" : pip === "t" ? "=" : ""}
    </span>
  );
}

function Answer({ btn, color, children }: { btn: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-black/30 p-3 sm:flex-col sm:text-center">
      <span className={`shrink-0 rounded-lg px-3 py-1.5 font-display text-sm ${color}`}>{btn}</span>
      <span className="text-xs text-white/70">{children}</span>
    </div>
  );
}
