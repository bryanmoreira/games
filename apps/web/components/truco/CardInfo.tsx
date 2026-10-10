"use client";

import { makeCard, RANKS, SUITS, type Card, type Rank, type Suit } from "@truco/game";
import { CardImg } from "@/components/cards/Card";

const RANK_NAME: Record<Rank, string> = {
  "4": "Quatro", "5": "Cinco", "6": "Seis", "7": "Sete", Q: "Dama", J: "Valete", K: "Rei", A: "Ás", "2": "Dois", "3": "Três",
};
const SUIT_NAME: Record<Suit, string> = { diamonds: "ouros", spades: "espadas", hearts: "copas", clubs: "paus" };
const MANILHA_NAME = ["Pica-fumo", "Espadilha", "Copas", "Zap"];

/** Painel com o que a carta vence, empata e perde, considerando a manilha da mão. */
export function CardInfo({ card, manilha }: { card: Card; manilha: Rank }) {
  const common = RANKS.filter((r) => r !== manilha);
  const isManilha = card.rank === manilha;
  const manilhas = SUITS.map((s) => makeCard(manilha, s));

  return (
    <div
      key={card.id}
      className="banner pointer-events-none w-64 rounded-2xl bg-stone-950/90 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 shrink-0">
          <CardImg card={card} />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-semibold">
            {RANK_NAME[card.rank]} de {SUIT_NAME[card.suit]}
          </span>
          {isManilha ? (
            <span className="mt-1 self-start rounded-full bg-gold px-2 py-0.5 font-display text-[10px] text-stone-900">
              ★ MANILHA · {MANILHA_NAME[SUITS.indexOf(card.suit)].toUpperCase()}
            </span>
          ) : (
            <span className="text-xs text-white/50">carta comum</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {isManilha ? (
          <ManilhaInfo suit={card.suit} manilhas={manilhas} />
        ) : (
          <CommonInfo rank={card.rank} common={common} manilhas={manilhas} />
        )}
      </div>
    </div>
  );
}

function CommonInfo({ rank, common, manilhas }: { rank: Rank; common: Rank[]; manilhas: Card[] }) {
  const i = common.indexOf(rank);
  const beats = common.slice(0, i);
  const loses = common.slice(i + 1);
  return (
    <>
      <Row label="VENCE" tone="win">
        {beats.length ? beats.map((r) => <Chip key={r}>{r}</Chip>) : <Empty>nenhuma — a mais fraca</Empty>}
      </Row>
      <Row label="EMPATA" tone="tie">
        <Chip>{rank}</Chip>
        <span className="text-[11px] text-white/50">de outro naipe</span>
      </Row>
      <Row label="PERDE" tone="lose">
        {loses.map((r) => (
          <Chip key={r}>{r}</Chip>
        ))}
        <MiniManilhas cards={manilhas} />
      </Row>
    </>
  );
}

function ManilhaInfo({ suit, manilhas }: { suit: Suit; manilhas: Card[] }) {
  const i = SUITS.indexOf(suit);
  const lower = manilhas.slice(0, i);
  const higher = manilhas.slice(i + 1);
  return (
    <>
      <Row label="VENCE" tone="win">
        <span className="text-[11px] font-semibold text-white">todas as cartas comuns</span>
        {lower.length > 0 && <MiniManilhas cards={lower} plus />}
      </Row>
      <Row label="PERDE" tone="lose">
        {higher.length ? <MiniManilhas cards={higher} /> : <span className="text-[11px] font-semibold text-gold">nenhuma — a mais forte do jogo</span>}
      </Row>
      <p className="text-[10px] leading-snug text-white/40">Manilhas: Pica-fumo ♦ &lt; Espadilha ♠ &lt; Copas ♥ &lt; Zap ♣</p>
    </>
  );
}

const TONE = {
  win: "text-emerald-400",
  tie: "text-white/60",
  lose: "text-red-400",
};

function Row({ label, tone, children }: { label: string; tone: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`w-12 shrink-0 pt-1 font-display text-[10px] ${TONE[tone]}`}>{label}</span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-white px-1 font-display text-xs text-stone-900">
      {children}
    </span>
  );
}

function MiniManilhas({ cards, plus }: { cards: Card[]; plus?: boolean }) {
  return (
    <span className="flex items-center gap-0.5">
      {plus && <span className="mr-0.5 text-[11px] text-white/50">+</span>}
      {cards.map((c) => (
        <span key={c.id} className="w-5">
          <CardImg card={c} className="!rounded-[3px] ring-1 ring-gold" />
        </span>
      ))}
      {!plus && cards.length === 4 && <span className="ml-1 text-[10px] text-gold">manilhas</span>}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] text-white/50">{children}</span>;
}
