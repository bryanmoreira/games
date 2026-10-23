"use client";

import { arrangements, isWildCard, points, wildCount, type Card, type Meld, type PlayerView, type Rank, type Suit } from "@mesa/buraco";
import { SuitIcon } from "@/components/spider/SpiderCard";
import { BCard, MiniCard, posLabel } from "./Cards";

const RANK_NAME: Record<Rank, string> = {
  A: "Ás", "2": "Dois", "3": "Três", "4": "Quatro", "5": "Cinco", "6": "Seis", "7": "Sete", "8": "Oito", "9": "Nove", "10": "Dez",
  J: "Valete", Q: "Dama", K: "Rei", JK: "Coringa",
};
const SUIT_NAME: Record<Suit, string> = { diamonds: "ouros", spades: "espadas", hearts: "copas", clubs: "paus" };

/** A carta entra no jogo sem pôr um curinga novo nele. */
const fits = (m: Meld, c: Card) => {
  const a = arrangements(m.cards, m.suit, [c])[0];
  return !!a && wildCount(a.cards, m.suit) <= wildCount(m.cards, m.suit);
};

const range = (m: Meld) => `${posLabel(m.cards[0].as)}–${posLabel(m.cards[m.cards.length - 1].as)}`;

/** Duas cartas da mão que formam uma sequência com esta (sem curinga). */
function partners(card: Card, hand: Card[]): [Card, Card][] {
  const others = hand.filter((c) => c.id !== card.id && c.suit === card.suit && !isWildCard(c));
  const out: [Card, Card][] = [];
  for (let i = 0; i < others.length && out.length < 2; i++) {
    for (let j = i + 1; j < others.length && out.length < 2; j++) {
      const a = arrangements([], null, [card, others[i], others[j]])[0];
      if (a && wildCount(a.cards, a.suit) === 0) out.push([others[i], others[j]]);
    }
  }
  return out;
}

/** Painel de dicas de uma carta da mão: quanto vale, onde entra e o que evitar dar ao adversário. */
export function CardInfo({ card, view }: { card: Card; view: PlayerView }) {
  const wild = isWildCard(card);
  const mine = view.melds.filter((m) => m.team === view.team);
  const theirs = view.melds.filter((m) => m.team !== view.team);
  const into = wild ? [] : mine.filter((m) => fits(m, card));
  const danger = wild ? [] : theirs.filter((m) => fits(m, card));
  const pairs = wild ? [] : partners(card, view.myHand);

  return (
    <div key={card.id} className="banner pointer-events-none w-64 rounded-2xl bg-stone-950/90 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="w-10 shrink-0">
          <BCard card={card} />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-semibold">{card.suit ? `${RANK_NAME[card.rank]} de ${SUIT_NAME[card.suit]}` : "Coringa"}</span>
          {wild ? (
            <span className="mt-1 self-start rounded-full bg-gold px-2 py-0.5 font-display text-[10px] text-stone-900">★ CURINGA</span>
          ) : (
            <span className="text-xs text-white/50">carta comum</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Row label="VALE" tone="tie">
          <span className="font-display text-sm text-white">{points(card)}</span>
          <span className="text-[11px] text-white/50">na mesa · desconta se sobrar</span>
        </Row>
        {wild ? (
          <Row label="SERVE" tone="win">
            <span className="text-[11px] font-semibold text-white">no lugar de qualquer carta, um por jogo</span>
          </Row>
        ) : (
          <>
            <Row label="ENTRA" tone="win">
              {into.length ? (
                into.map((m) => (
                  <span key={m.id} className="flex h-6 items-center gap-0.5 rounded-md bg-white px-1.5 font-display text-xs text-stone-900">
                    <SuitIcon suit={m.suit} size={11} className={m.suit === "hearts" || m.suit === "diamonds" ? "text-[#d40000]" : ""} />
                    {range(m)}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-white/50">nenhum jogo seu</span>
              )}
            </Row>
            <Row label="JOGO" tone="win">
              {pairs.length ? (
                pairs.map(([a, b], i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <MiniCard card={card} width={20} />
                    <MiniCard card={a} width={20} />
                    <MiniCard card={b} width={20} />
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-white/50">nenhuma sequência pronta</span>
              )}
            </Row>
            {danger.length > 0 && (
              <Row label="CUIDADO" tone="lose">
                <span className="text-[11px] font-semibold text-white">entra nos jogos deles: não descarte</span>
              </Row>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const TONE = { win: "text-emerald-400", tie: "text-white/60", lose: "text-red-400" };

function Row({ label, tone, children }: { label: string; tone: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`w-14 shrink-0 pt-1 font-display text-[10px] ${TONE[tone]}`}>{label}</span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}
