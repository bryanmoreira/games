"use client";

import type { Board as BoardState, Tile } from "@mesa/domino";
import { Section } from "@/components/ui/HowToSection";
import { Board } from "./Board";
import { Domino } from "./Tile";

/** Mesa de exemplo: saiu a sena e cada ponta já tem peças. */
const SAMPLE: BoardState = {
  first: { tile: [6, 6], inner: 6, outer: 6, seat: 0, n: 0 },
  right: [
    { tile: [3, 6], inner: 6, outer: 3, seat: 1, n: 1 },
    { tile: [3, 3], inner: 3, outer: 3, seat: 2, n: 3 },
    { tile: [1, 3], inner: 3, outer: 1, seat: 0, n: 4 },
  ],
  left: [
    { tile: [4, 6], inner: 6, outer: 4, seat: 3, n: 2 },
    { tile: [2, 4], inner: 4, outer: 2, seat: 1, n: 5 },
  ],
};

function Piece({ t, flat }: { t: Tile; flat?: boolean }) {
  return <Domino a={t[0]} b={t[1]} flat={flat} className={flat ? "w-16" : "w-8"} />;
}

/** Linha da tabela de pontos: peça de exemplo, nome e quanto vale. */
function Points({ ends, tile, name, value }: { ends: [number, number]; tile: Tile; name: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-black/20 px-3 py-2">
      <div className="flex w-36 items-center justify-center gap-1.5 sm:w-40">
        <span className="font-display text-white/40">{ends[0]}</span>
        <Piece t={tile} />
        <span className="font-display text-white/40">{ends[1]}</span>
      </div>
      <span className="flex-1 font-display">{name}</span>
      <span className="font-display text-2xl text-gold">{value}</span>
    </div>
  );
}

/** Regras ilustradas do Dominó (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex gap-1">
            {([[0, 4], [2, 5], [6, 6], [1, 3]] as Tile[]).map((t) => (
              <Piece key={t.join()} t={t} />
            ))}
          </div>
          <p className="max-w-72 text-center text-sm text-white/70 sm:text-left">
            Em <b className="text-white">duplas</b> (parceiro na sua frente) ou no <b className="text-white">1×1</b>. São 28 peças e cada
            um recebe 7. Livre-se de todas antes dos outros: a dupla que chegar a <b className="text-white">6 pontos</b> vence.
          </p>
        </div>
      </Section>

      <Section n={2} title="A saída">
        <div className="flex justify-center">
          <Piece t={[6, 6]} />
        </div>
        <p className="text-center text-sm text-white/70">
          Na primeira mão, quem tem a <b className="text-white">carroça de sena</b> (6-6) começa com ela. No 1×1, se ninguém tiver, sai a
          maior carroça. Nas mãos seguintes, começa quem bateu (ou fechou) a anterior, com a peça que quiser.
        </p>
      </Section>

      <Section n={3} title="Jogando">
        <Board board={SAMPLE} className="relative mx-auto h-36 w-full max-w-md" />
        <p className="text-center text-sm text-white/70">
          Na sua vez, encaixe uma peça numa das <b className="text-white">duas pontas</b> com o mesmo número. A carroça (peça dupla) entra
          atravessada. Se a peça servir dos dois lados, toque na ponta que quiser.
        </p>
      </Section>

      <Section n={4} title="Sem peça">
        <p className="text-center text-sm text-white/70">
          Nas duplas, quem não tem peça que encaixe <b className="text-white">passa</b> a vez. No 1×1, <b className="text-white">compra</b>{" "}
          do monte até achar uma; com o monte vazio, passa.
        </p>
      </Section>

      <Section n={5} title="Batida">
        <p className="text-center text-sm text-white/70">
          Quem joga a última peça <b className="text-white">bate</b> e a dupla marca pontos conforme essa peça:
        </p>
        <div className="flex flex-col gap-2">
          <Points ends={[5, 3]} tile={[2, 3]} name="SIMPLES" value={1} />
          <Points ends={[4, 1]} tile={[4, 4]} name="CARROÇA" value={2} />
          <Points ends={[2, 5]} tile={[2, 5]} name="LÁ-E-LÔ" value={3} />
          <Points ends={[3, 3]} tile={[3, 3]} name="CRUZADA" value={4} />
        </div>
        <p className="text-center text-sm text-white/70">
          <b className="text-white">Lá-e-lô</b>: a última peça tem os números das duas pontas e entraria dos dois lados.{" "}
          <b className="text-white">Cruzada</b>: a última é uma carroça e as duas pontas têm o número dela.
        </p>
      </Section>

      <Section n={6} title="Jogo fechado">
        <p className="text-center text-sm text-white/70">
          Se ninguém consegue jogar (e o monte acabou), o jogo <b className="text-white">fecha</b>. Cada dupla soma os pontos das peças
          que sobraram na mão: a que tiver <b className="text-white">menos</b> marca 1. Empate: ninguém marca e a próxima mão vale{" "}
          <b className="text-gold">×2</b>.
        </p>
      </Section>
    </>
  );
}
