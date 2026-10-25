"use client";

import { DIRS, LEVEL_CONF, LEVELS, THEMES } from "@mesa/caca-palavras";
import { Section } from "@/components/ui/HowToSection";
import { CalendarIcon, HintIcon } from "@/components/ui/icons";
import { Capsule, LevelBars, LEVEL_LABEL, WordArt } from "./common";

/** Seta de uma das 8 direções (0 = →, em sentido horário). */
function Arrow({ dir, on }: { dir: number; on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${on ? "text-gold" : "text-white/15"}`} aria-hidden="true" style={{ rotate: `${dir * 45}deg` }}>
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Rosa das 8 direções, acesas as do nível. */
function Compass({ dirs }: { dirs: readonly number[] }) {
  // posição de cada seta na grade 3×3 em volta do centro
  const at = (d: number) => {
    const [dr, dc] = DIRS[d];
    return (dr + 1) * 3 + dc + 1;
  };
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: 9 }, (_, k) => {
        const d = DIRS.findIndex((_, i) => at(i) === k);
        return <span key={k} className="flex h-5 w-5 items-center justify-center">{d >= 0 ? <Arrow dir={d} on={dirs.includes(d)} /> : <span className="h-1.5 w-1.5 rounded-full bg-white/30" />}</span>;
      })}
    </div>
  );
}

/** Uma linha de letras com a cápsula de seleção por cima. */
function Row({ letters, from, to, color = "#f2c14e", dots = [] }: { letters: string; from?: number; to?: number; color?: string; dots?: number[] }) {
  const n = letters.length;
  return (
    <div className="felt-blue relative h-9 rounded-lg bg-felt" style={{ width: n * 36 }}>
      <svg viewBox={`0 0 ${n} 1`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        {from !== undefined && to !== undefined && <Capsule size={n} from={from} to={to} color={color} opacity={0.7} width={0.8} />}
        {dots.map((d) => (
          <Capsule key={d} size={n} from={d} to={d} color={color} opacity={0.7} width={0.8} />
        ))}
      </svg>
      <div className="relative grid h-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {[...letters].map((l, i) => (
          <span key={i} className="flex items-center justify-center font-display text-lg leading-none text-white/90">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function Card({ title, children, caption }: { title: string; children: React.ReactNode; caption: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/30 p-4">
      <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-display text-[10px] text-gold">{title}</span>
      {children}
      <p className="max-w-xs text-center text-xs text-white/70">{caption}</p>
    </div>
  );
}

export function HowToPlay() {
  return (
    <div className="flex flex-col gap-4">
      <Section n={1} title="Objetivo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <WordArt className="w-40 text-[15px]" />
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <div className="flex gap-1.5">
              {["CASA", "LUA", "SOL"].map((w, i) => (
                <span key={w} className="rounded-full px-2.5 py-1 font-display text-xs text-white/55 line-through decoration-2" style={{ backgroundColor: `${["#f2c14e", "#4fc3f7", "#f48fb1"][i]}40` }}>
                  {w}
                </span>
              ))}
            </div>
            <p className="max-w-xs text-center text-sm text-white/75 sm:text-left">
              Ache na grade todas as palavras da lista. Elas ficam em linha reta e cada uma aparece uma vez só.
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-white/60">Tudo sem acento: Ç vira C (LIMÃO aparece como LIMAO).</p>
      </Section>

      <Section n={2} title="Marcar uma palavra">
        <div className="grid gap-2 sm:grid-cols-2">
          <Card title="ARRASTE" caption="Da primeira à última letra. A seleção segue a linha mais perto do dedo.">
            <Row letters="RCASAT" from={1} to={4} />
          </Card>
          <Card title="TOQUE E TOQUE" caption="Toque na primeira letra e depois na última. Tocar de novo na primeira solta.">
            <Row letters="RCASAT" dots={[1, 4]} />
          </Card>
          <Card title="ACHOU" caption="A palavra ganha uma cor e sai riscada da lista.">
            <Row letters="RCASAT" from={1} to={4} color="#4fc3f7" />
          </Card>
          <Card title="ERROU" caption="Se não é palavra da lista, fica vermelho e some. Não tem castigo.">
            <Row letters="RCASAT" from={2} to={5} color="#ef4444" />
          </Card>
        </div>
        <p className="text-center text-xs text-white/60">Pode marcar de trás pra frente também: LUA e AUL dão no mesmo.</p>
      </Section>

      <Section n={3} title="Níveis">
        <div className="flex flex-col gap-2">
          {LEVELS.map((l) => {
            const c = LEVEL_CONF[l];
            return (
              <div key={l} className="flex items-center gap-3 rounded-2xl bg-black/30 px-4 py-3">
                <LevelBars level={l} className="h-5 w-5 shrink-0 text-gold" />
                <span className="w-16 font-display text-sm">{LEVEL_LABEL[l]}</span>
                <span className="flex flex-1 flex-col font-display text-[11px] leading-tight text-white/70">
                  <span>
                    {c.size} × {c.size}
                  </span>
                  <span>{c.words} PALAVRAS</span>
                </span>
                <Compass dirs={c.dirs} />
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-white/60">As setas acesas são as direções em que as palavras podem estar.</p>
      </Section>

      <Section n={4} title="Dica e tempo">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/85">
              <HintIcon className="h-6 w-6" />
            </span>
            <span className="felt-blue flex h-10 w-10 items-center justify-center rounded-full bg-felt font-display text-lg ring-2 ring-inset ring-gold target-glow">L</span>
          </div>
          <p className="max-w-xs text-center text-sm text-white/75 sm:text-left">
            A dica acende a primeira letra de uma palavra que falta. O relógio para quando você sai da aba, e o melhor tempo de cada nível fica guardado.
          </p>
        </div>
      </Section>

      <Section n={5} title="Desafio do dia">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-gold ring-2 ring-gold/40">
            <CalendarIcon className="h-8 w-8" />
          </span>
          <p className="max-w-xs text-center text-sm text-white/75 sm:text-left">
            Uma grade nova à meia-noite, a mesma para todos, sempre no difícil e com o tema do dia. Os dias anteriores ficam no calendário.
          </p>
        </div>
      </Section>

      <Section n={6} title="Temas">
        <div className="flex flex-wrap justify-center gap-1.5">
          {THEMES.map((t) => (
            <span key={t.id} className="rounded-full bg-white/10 px-2.5 py-1 font-display text-[11px] uppercase text-white/85">
              {t.name}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-white/60">Escolha um tema antes de começar, ou deixe na surpresa.</p>
      </Section>
    </div>
  );
}
