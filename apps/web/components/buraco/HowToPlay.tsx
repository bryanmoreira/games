"use client";

import type { Card, Rank, Suit } from "@mesa/buraco";
import { Section } from "@/components/ui/HowToSection";
import { CardBack } from "@/components/cards/Card";
import { BCard, MiniCard } from "./Cards";

const card = (rank: Rank, suit: Suit | null, n = 0): Card => ({ id: `${rank}${suit?.[0] ?? "j"}${n}`, rank, suit });

interface Ex {
  rank: Rank;
  suit: Suit | null;
  /** Posição que faz no jogo (curinga). */
  as?: number;
  wild?: boolean;
}

/** Jogo de exemplo, com as cartas inteiras sobrepostas. */
function Run({ cards, width = 44 }: { cards: Ex[]; width?: number }) {
  return (
    <div className="flex max-w-full items-start justify-center overflow-hidden px-1">
      {cards.map((c, i) => (
        <div key={i} className="shrink-0" style={{ width, marginLeft: i ? -width * 0.46 : 0 }}>
          <MiniCard card={card(c.rank, c.suit, i)} as={c.as} wild={c.wild} width={width} />
        </div>
      ))}
    </div>
  );
}

const H = (rank: Rank): Ex => ({ rank, suit: "hearts" });
const S = (rank: Rank): Ex => ({ rank, suit: "spades" });

function Tag({ label, value, hint, children }: { label: string; value: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-black/20 px-3 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display">{label}</span>
        <span className="font-display text-2xl text-gold">{value}</span>
      </div>
      {children}
      {hint && <p className="text-xs text-white/60">{hint}</p>}
    </div>
  );
}

/** Regras ilustradas do Buraco (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-end gap-1" aria-hidden="true">
            <div className="w-10 -rotate-6">
              <BCard card={card("5", "hearts")} />
            </div>
            <div className="w-10 -translate-y-1">
              <BCard card={card("6", "hearts")} />
            </div>
            <div className="w-10 rotate-6">
              <BCard card={card("7", "hearts")} />
            </div>
          </div>
          <p className="max-w-80 text-center text-sm text-white/70 sm:text-left">
            Em <b className="text-white">duplas</b> (parceiro na sua frente) ou no <b className="text-white">1×1</b>. São 108 cartas (dois
            baralhos com coringas) e cada um recebe 11. Baixe sequências, feche <b className="text-white">canastras</b> e bata: a dupla que
            chegar a <b className="text-gold">3000 pontos</b> vence.
          </p>
        </div>
      </Section>

      <Section n={2} title="A vez">
        <div className="grid grid-cols-3 gap-2 text-center font-display text-sm">
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3">
            <div className="w-9">
              <CardBack />
            </div>
            <span>COMPRAR</span>
            <span className="text-[11px] leading-tight text-white/50">do monte ou pegue o lixo</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3">
            <Run cards={[H("5"), H("6"), H("7")]} width={22} />
            <span>BAIXAR</span>
            <span className="text-[11px] leading-tight text-white/50">jogos novos ou nos seus</span>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/20 px-2 py-3">
            <div className="w-9">
              <BCard card={card("K", "clubs")} />
            </div>
            <span>DESCARTAR</span>
            <span className="text-[11px] leading-tight text-white/50">uma carta no lixo</span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">
          Toque nas cartas da mão para <b className="text-white">selecionar</b>, depois em <b className="text-white">BAIXAR</b> (jogo novo) ou
          no jogo da sua dupla (acrescentar). Para descartar, selecione uma carta e toque em <b className="text-white">DESCARTAR</b> (ou dê
          dois toques nela).
        </p>
      </Section>

      <Section n={3} title="Jogos">
        <Run cards={[H("5"), H("6"), H("7"), H("8")]} />
        <p className="text-center text-sm text-white/70">
          Um jogo é uma <b className="text-white">sequência de 3 ou mais cartas do mesmo naipe</b>. O ás vale 1 (antes do 2) ou fica depois
          do rei.
        </p>
        <div className="flex flex-col items-center gap-2">
          <Run cards={[S("A"), S("2"), S("3")]} />
          <Run cards={[S("Q"), S("K"), S("A")]} />
        </div>
      </Section>

      <Section n={4} title="Curingas">
        <div className="flex flex-col items-center gap-2">
          <Run cards={[H("5"), H("6"), { rank: "JK", suit: null, as: 7, wild: true }, H("8")]} />
          <Run cards={[H("3"), H("4"), { rank: "2", suit: "clubs", as: 5, wild: true }, H("6")]} />
        </div>
        <p className="text-center text-sm text-white/70">
          O <b className="text-white">coringa</b> e o <b className="text-white">2</b> trocam por qualquer carta, mas só{" "}
          <b className="text-white">um por jogo</b>. O 2 do mesmo naipe no seu lugar normal (entre o ás e o 3) é carta comum.
        </p>
        <Run cards={[H("A"), H("2"), H("3"), H("4")]} />
      </Section>

      <Section n={5} title="Canastras">
        <p className="text-center text-sm text-white/70">
          Um jogo com <b className="text-white">7 ou mais cartas</b> é uma canastra e rende bônus. Ela aceita mais cartas depois.
        </p>
        <div className="flex flex-col gap-2">
          <Tag label="LIMPA" value="200" hint="Sem curinga.">
            <Run cards={[H("3"), H("4"), H("5"), H("6"), H("7"), H("8"), H("9")]} width={36} />
          </Tag>
          <Tag label="SUJA" value="100" hint="Com um curinga.">
            <Run cards={[H("3"), H("4"), H("5"), { rank: "JK", suit: null, as: 6, wild: true }, H("7"), H("8"), H("9")]} width={36} />
          </Tag>
          <Tag label="REAL" value="500" hint="Limpa, com as 13 cartas, do ás ao rei.">
            <Run cards={["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map((r) => H(r as Rank))} width={30} />
          </Tag>
        </div>
      </Section>

      <Section n={6} title="Lixo">
        <p className="text-center text-sm text-white/70">
          No lugar de comprar, você pode <b className="text-white">pegar o lixo todo</b>, se a carta de cima entrar <b className="text-white">na
          hora</b> num jogo seu, ou com 2 ou mais cartas da sua mão num jogo novo. Um <b className="text-white">curinga no topo trava</b> o
          lixo: ninguém pega.
        </p>
      </Section>

      <Section n={7} title="Morto e batida">
        <p className="text-center text-sm text-white/70">
          Há dois <b className="text-white">mortos</b> de 11 cartas, um para cada dupla. Quem fica sem cartas na mão pega o morto da dupla e
          segue jogando. Para <b className="text-white">bater</b> (ficar sem cartas de novo) a dupla precisa já ter pego o morto e ter pelo
          menos <b className="text-white">uma canastra</b>. Sem canastra, não dá para ficar só com uma carta.
        </p>
        <p className="text-center text-sm text-white/70">
          Se o monte acabar e quem está na vez não puder pegar o lixo, a mão termina sem batida.
        </p>
      </Section>

      <Section n={8} title="Pontos">
        <div className="grid grid-cols-5 gap-1.5 text-center font-display">
          {[
            ["3 a 7", "5"],
            ["8 a K", "10"],
            ["Ás", "15"],
            ["2", "20"],
            ["Coringa", "50"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col items-center gap-1 rounded-xl bg-black/20 px-1 py-2">
              <span className="text-[10px] text-white/60">{k}</span>
              <span className="text-xl text-gold">{v}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          No fim da mão, cada dupla soma as cartas que baixou e os bônus das canastras, mais <b className="text-gold">100</b> de quem bateu.
          Desconta as cartas que sobraram nas mãos e <b className="text-red-300">100</b> se a dupla nunca pegou o morto.
        </p>
      </Section>
    </>
  );
}
