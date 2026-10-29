"use client";

import { FLOWER, LAYOUT_IDS, layoutName, SEASON } from "@mesa/mahjong";
import { Section } from "@/components/ui/HowToSection";
import { CalendarIcon, EyeIcon, HintIcon, ShuffleIcon, UndoIcon } from "@/components/ui/icons";
import { LayoutThumb, TileFace } from "./common";

function Card({ title, children, caption, ok }: { title: string; children: React.ReactNode; caption: React.ReactNode; ok?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/30 p-4">
      <span className={`rounded-full px-2.5 py-0.5 font-display text-[10px] ${ok === undefined ? "bg-white/10 text-gold" : ok ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
        {title}
      </span>
      {children}
      <p className="max-w-xs text-center text-xs text-white/70">{caption}</p>
    </div>
  );
}

/** Peças lado a lado (e uma por cima, se `top`), com a do meio destacada. */
function Row({ n, mark, top, kinds }: { n: number; mark: number; top?: number; kinds: number[] }) {
  const w = 34;
  const h = w * (4 / 3);
  return (
    <div className="felt relative rounded-xl bg-felt p-3">
      <div className="relative" style={{ width: n * w + 6, height: h + 8 }}>
        {Array.from({ length: n }, (_, i) => (
          <TileFace key={i} kind={kinds[i]} w={w} className="!absolute" style={{ left: i * w, top: 6, ...(i === mark ? { boxShadow: "0 0 0 3px #f2c14e" } : {}) }} />
        ))}
        {top !== undefined && <TileFace kind={kinds[n]} w={w} className="!absolute" style={{ left: top * w + w / 2 - 3, top: 1, zIndex: 5 }} />}
      </div>
    </div>
  );
}

function Group({ label, kinds, note }: { label: string; kinds: number[]; note?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-black/30 p-3">
      <span className="font-display text-[11px] text-gold">{label}</span>
      <div className="flex flex-wrap gap-1 sm:gap-1.5">
        {kinds.map((k) => (
          <TileFace key={k} kind={k} w={26} />
        ))}
      </div>
      {note && <span className="text-[11px] text-white/60">{note}</span>}
    </div>
  );
}

const range = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i);

export function HowToPlay() {
  return (
    <div className="flex flex-col gap-4">
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex gap-2">
            <TileFace kind={31} w={44} />
            <TileFace kind={31} w={44} />
          </div>
          <p className="max-w-xs text-center text-sm text-white/75 sm:text-left">
            Tire todas as 144 peças da mesa, de duas em duas. Toque em duas peças iguais e livres para formar um par.
          </p>
        </div>
      </Section>

      <Section n={2} title="Peça livre">
        <div className="grid gap-2 sm:grid-cols-3">
          <Card title="LIVRE" ok caption="Nada por cima e um lado vazio (esquerdo ou direito).">
            <Row n={2} mark={0} kinds={[4, 12]} />
          </Card>
          <Card title="PRESA" ok={false} caption="Tem peça dos dois lados.">
            <Row n={3} mark={1} kinds={[4, 12, 22]} />
          </Card>
          <Card title="PRESA" ok={false} caption="Tem peça por cima, mesmo que só um pedaço.">
            <Row n={2} mark={0} top={0} kinds={[4, 12, 27]} />
          </Card>
        </div>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-white/60">
          <EyeIcon className="h-4 w-4 shrink-0" />
          No olho do topo, as peças presas ficam mais escuras.
        </p>
      </Section>

      <Section n={3} title="As peças">
        <div className="flex flex-col gap-2">
          <Group label="CARACTERES" kinds={range(0, 9)} />
          <Group label="CÍRCULOS" kinds={range(9, 9)} />
          <Group label="BAMBUS" kinds={range(18, 9)} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Group label="VENTOS" kinds={range(27, 4)} />
            <Group label="DRAGÕES" kinds={range(31, 3)} />
          </div>
          <p className="text-center text-xs text-white/60">Destas, cada peça tem 4 iguais na mesa e só forma par com a igual.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Group label="FLORES" kinds={range(FLOWER, 4)} note="Qualquer flor com qualquer flor." />
            <Group label="ESTAÇÕES" kinds={range(SEASON, 4)} note="Qualquer estação com qualquer estação." />
          </div>
        </div>
      </Section>

      <Section n={4} title="Ajuda">
        <div className="flex flex-col gap-2">
          {[
            { icon: <UndoIcon className="h-6 w-6" />, text: "Desfazer volta o último par. É de graça." },
            { icon: <HintIcon className="h-6 w-6" />, text: "A dica acende um par que leva à vitória. Custa +30 s no relógio." },
            { icon: <ShuffleIcon className="h-6 w-6" />, text: "Embaralhar troca as peças que sobraram de lugar, sempre com saída. Custa +30 s." },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
              <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/85">{t.icon}</span>
              <p className="text-sm text-white/75">{t.text}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-white/60">
          Toda mesa sorteada tem solução. Se acabarem os pares, embaralhe; se nem embaralhando tiver saída, desfaça.
        </p>
      </Section>

      <Section n={5} title="Formatos">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {LAYOUT_IDS.slice(0, 8).map((id) => (
            <div key={id} className="flex flex-col items-center gap-1 rounded-xl bg-black/30 p-2">
              <LayoutThumb id={id} className="h-12 w-full" />
              <span className="font-display text-[10px] uppercase text-white/70">{layoutName(id)}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-white/60">
          São {LAYOUT_IDS.length} formatos, todos com 144 peças. O melhor tempo de cada um fica guardado.
        </p>
      </Section>

      <Section n={6} title="Desafio do dia">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold ring-2 ring-gold/40">
            <CalendarIcon className="h-8 w-8" />
          </span>
          <p className="max-w-xs text-center text-sm text-white/75 sm:text-left">
            Uma mesa nova à meia-noite, a mesma para todos, num formato sorteado. Os dias anteriores ficam no calendário.
          </p>
        </div>
      </Section>

      <p className="text-center text-[11px] text-white/40">
        Peças:{" "}
        <a href="https://github.com/FluffyStuff/riichi-mahjong-tiles" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">
          riichi-mahjong-tiles
        </a>
        , de FluffyStuff, em domínio público.
      </p>
    </div>
  );
}
