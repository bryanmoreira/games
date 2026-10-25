"use client";

import { MAX_BET, MIN_BET, START_CHIPS, type Rank, type Suit } from "@mesa/blackjack";
import { Section } from "@/components/ui/HowToSection";
import { CardBack, CardImg } from "@/components/cards/Card";
import { Chip, fmt } from "./Chips";
import { MOVE_LABEL, MOVE_STYLE, StrategyChart } from "./Strategy";

/** Cartas sobrepostas como numa mão de blackjack. */
function Cards({ cards, width = 44, back }: { cards: [Rank, Suit][]; width?: number; back?: boolean }) {
  return (
    <div className="flex shrink-0" aria-hidden="true">
      {cards.map(([rank, suit], i) => (
        <div key={i} className="shrink-0" style={{ width, marginLeft: i ? -width * 0.5 : 0 }}>
          <CardImg card={{ rank, suit }} />
        </div>
      ))}
      {back && (
        <div className="shrink-0" style={{ width, marginLeft: -width * 0.5 }}>
          <CardBack />
        </div>
      )}
    </div>
  );
}

function Badge({ children, gold, red }: { children: React.ReactNode; gold?: boolean; red?: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-display text-sm leading-none ring-1 ${
        gold ? "bg-gold text-stone-900 ring-gold" : red ? "bg-red-600 text-white ring-red-400" : "bg-black/60 text-white ring-white/15"
      }`}
    >
      {children}
    </span>
  );
}

function Pay({ label, value, hint, children }: { label: string; value: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3 text-center">
      {children}
      <span className="font-display text-sm">{label}</span>
      <span className="font-display text-2xl text-gold">{value}</span>
      <span className="text-[11px] leading-tight text-white/50">{hint}</span>
    </div>
  );
}

/** Regras ilustradas do Blackjack (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <Cards cards={[["A", "spades"], ["K", "hearts"]]} />
              <Badge gold>BJ</Badge>
            </div>
            <span className="font-display text-white/40">×</span>
            <div className="flex flex-col items-center gap-1">
              <Cards cards={[["9", "clubs"]]} back />
              <span className="font-display text-[10px] tracking-widest text-white/50">BANCA</span>
            </div>
          </div>
          <p className="max-w-80 text-center text-sm text-white/70 sm:text-left">
            Cada um joga contra a <b className="text-white">banca</b>: chegue mais perto de <b className="text-gold">21</b> que ela, sem passar.
            Todos começam com <b className="text-white">{fmt(START_CHIPS)} fichas</b> e jogam 5, 10 ou 20 mãos. Terminou com mais de{" "}
            {fmt(START_CHIPS)}, venceu.
          </p>
        </div>
      </Section>

      <Section n={2} title="Valor das cartas">
        <div className="grid grid-cols-3 gap-2 text-center font-display text-sm">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3">
            <Cards cards={[["2", "hearts"], ["6", "clubs"], ["9", "diamonds"]]} width={38} />
            <span>2 A 10</span>
            <span className="text-[11px] leading-tight text-white/50">o número</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3">
            <Cards cards={[["J", "spades"], ["Q", "hearts"], ["K", "clubs"]]} width={38} />
            <span className="text-gold">10</span>
            <span className="text-[11px] leading-tight text-white/50">valete, dama e rei</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3">
            <Cards cards={[["A", "diamonds"]]} width={38} />
            <span className="text-gold">1 OU 11</span>
            <span className="text-[11px] leading-tight text-white/50">o que for melhor</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <Cards cards={[["A", "hearts"], ["6", "spades"]]} width={30} />
            <Badge>7/17</Badge> mole: o ás ainda vale 11
          </span>
          <span className="flex items-center gap-2">
            <Cards cards={[["10", "clubs"], ["7", "hearts"], ["8", "diamonds"]]} width={30} />
            <Badge red>25</Badge> estourou
          </span>
        </div>
      </Section>

      <Section n={3} title="A mão">
        <ol className="grid gap-2 font-display text-sm sm:grid-cols-4">
          <li className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3 text-center">
            <span className="flex">
              <Chip value={25} className="h-9 w-9" />
              <Chip value={100} className="-ml-3 h-9 w-9" />
            </span>
            APOSTA
            <span className="text-[11px] leading-tight text-white/50">
              de {MIN_BET} a {MAX_BET}
            </span>
          </li>
          <li className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3 text-center">
            <Cards cards={[["8", "clubs"], ["3", "hearts"]]} width={32} />
            2 CARTAS
            <span className="text-[11px] leading-tight text-white/50">a banca mostra uma</span>
          </li>
          <li className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3 text-center">
            <span className={`rounded-lg px-3 py-1 ${MOVE_STYLE.hit}`}>{MOVE_LABEL.hit}</span>
            SUA VEZ
            <span className="text-[11px] leading-tight text-white/50">cada um na sua vez</span>
          </li>
          <li className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3 text-center">
            <Cards cards={[["10", "spades"], ["6", "diamonds"], ["A", "clubs"]]} width={28} />
            BANCA
            <span className="text-[11px] leading-tight text-white/50">compra até 17 (no 17 mole também)</span>
          </li>
        </ol>
      </Section>

      <Section n={4} title="Na sua vez">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {(
            [
              ["hit", "Mais uma carta. Pode pedir até parar ou estourar."],
              ["stand", "Fica com o que tem."],
              ["double", "Só com 2 cartas: dobra a aposta e recebe só mais uma."],
              ["split", "Par do mesmo valor: vira duas mãos, com uma aposta igual na outra. Uma vez por mão."],
            ] as const
          ).map(([m, text]) => (
            <div key={m} className="flex items-center gap-3 rounded-2xl bg-black/20 px-3 py-2">
              <span className={`w-20 shrink-0 rounded-lg py-1 text-center font-display ${MOVE_STYLE[m]}`}>{MOVE_LABEL[m]}</span>
              <span className="text-white/70">{text}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-white/50">Ases divididos recebem uma carta cada e param. 21 depois de dividir não é blackjack.</p>
      </Section>

      <Section n={5} title="Pagamentos">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Pay label="BLACKJACK" value="3:2" hint="ás + 10 nas 2 primeiras">
            <Cards cards={[["A", "hearts"], ["J", "spades"]]} width={32} />
          </Pay>
          <Pay label="VITÓRIA" value="1:1" hint="mais perto de 21, ou a banca estourou">
            <Cards cards={[["10", "hearts"], ["9", "clubs"]]} width={32} />
          </Pay>
          <Pay label="EMPATE" value="=" hint="a aposta volta">
            <Cards cards={[["K", "diamonds"], ["8", "spades"]]} width={32} />
          </Pay>
          <Pay label="SEGURO" value="2:1" hint="banca com ás: meia aposta contra o blackjack dela">
            <Cards cards={[["A", "clubs"]]} back width={32} />
          </Pay>
        </div>
      </Section>

      <Section n={6} title="Estratégia básica">
        <p className="text-center text-sm text-white/70">A melhor jogada para cada mão contra a carta da banca. Na partida, a lâmpada mostra a dica.</p>
        <StrategyChart />
      </Section>
    </>
  );
}
