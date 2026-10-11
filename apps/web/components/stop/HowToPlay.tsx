import { Section } from "@/components/ui/HowToSection";
import { XIcon } from "@/components/ui/buttons";
import { FlagIcon, Points, Tile } from "./Tile";
import { CheckIcon, ClockIcon, ListIcon } from "@/components/ui/icons";

const SHEET: { cat: string; text: string; ok: boolean }[] = [
  { cat: "NOME", text: "Bruno", ok: true },
  { cat: "ANIMAL", text: "Baleia", ok: true },
  { cat: "FRUTA", text: "Banana", ok: true },
  { cat: "COR", text: "Azul", ok: false },
];

const REVIEW: { name: string; text: string; pts: number; votes?: number; strike?: boolean }[] = [
  { name: "Ana", text: "Banana", pts: 5 },
  { name: "Leo", text: "banana", pts: 5 },
  { name: "Bia", text: "Bacuri", pts: 10 },
  { name: "Caio", text: "Batata", pts: 0, votes: 3, strike: true },
  { name: "Duda", text: "", pts: 0 },
];

/** Regras ilustradas do Stop (página "Como jogar" e janela dentro da partida). */
export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["A", "L", "B", "C", "D"].map((l, i) => (
            <span
              key={i}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 font-display ring-2 ${i === 0 ? "text-gold ring-gold/70" : "ring-white/20"}`}
            >
              {l}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          De <b className="text-white">2 a 8</b> jogadores online. Depois da última rodada, vence quem somar mais pontos.
        </p>
      </Section>

      <Section n={2} title="A letra">
        <div className="flex items-center justify-center gap-3">
          {["M", "R", "T"].map((l) => (
            <Tile key={l} letter={l} className="h-9 w-9 text-xl opacity-40" />
          ))}
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
          <Tile letter="B" className="h-16 w-16 text-4xl" />
        </div>
        <p className="text-center text-sm text-white/70">
          Cada rodada sorteia uma letra, sem repetir. Não saem <b className="text-white">K, W, X</b> nem <b className="text-white">Y</b>.
        </p>
      </Section>

      <Section n={3} title="Escreva">
        <div className="mx-auto flex w-full max-w-xs flex-col rounded-2xl bg-[#fbf6e9] px-4 py-1.5 text-stone-800">
          {SHEET.map((r) => (
            <div key={r.cat} className="flex items-center gap-2 border-b border-stone-300/70 py-1 last:border-0">
              <span className="flex flex-1 flex-col">
                <span className="font-display text-[10px] text-stone-500">{r.cat}</span>
                <span className={`font-semibold ${r.ok ? "" : "text-red-600"}`}>{r.text}</span>
              </span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${r.ok ? "bg-emerald-500" : "bg-red-500"}`}>
                {r.ok ? <CheckIcon className="h-4 w-4" /> : <XIcon />}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">Todos ao mesmo tempo: uma palavra por categoria, começando com a letra.</p>
      </Section>

      <Section n={4} title="STOP!">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="rounded-2xl bg-red-500 px-6 py-2 font-display text-2xl tracking-wider text-white shadow-[0_4px_0_#991b1b]">STOP!</span>
          <span className="font-display text-white/40">ou</span>
          <span className="flex items-center gap-1 font-display text-xl text-red-400">
            <ClockIcon className="h-5 w-5" />
            0:00
          </span>
        </div>
        <p className="text-center text-sm text-white/70">
          Quem preencher <b className="text-white">tudo</b> com a letra aperta STOP e todos travam na hora. Se a sala tiver tempo, a rodada também acaba quando ele zera.
        </p>
      </Section>

      <Section n={5} title="Correção">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-1.5">
          <span className="font-display text-gold">FRUTA</span>
          {REVIEW.map((r) => (
            <div key={r.name} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11px] font-semibold text-white/50">{r.name}</span>
                <span className={`truncate font-semibold ${!r.text ? "text-white/25" : r.strike ? "text-red-400/80 line-through decoration-2" : ""}`}>
                  {r.text || "—"}
                </span>
              </span>
              {r.votes && (
                <span className="flex items-center gap-0.5 font-display text-xs text-red-400">
                  <XIcon />
                  {r.votes}
                </span>
              )}
              <Points value={r.pts} />
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/70">
          Uma categoria por vez. Toque no{" "}
          <span className="inline-flex h-5 w-5 translate-y-1 items-center justify-center rounded-full bg-white/15 text-white [&_svg]:h-3 [&_svg]:w-3">
            <XIcon />
          </span>{" "}
          para votar contra uma resposta: com mais da metade dos outros
          contra, ela é anulada (empate mantém). Todos em <b className="text-white">PRONTO</b> passa para a próxima.
        </p>
        <p className="text-center text-sm text-white/70">
          Resposta de <b className="text-white">uma letra só</b> já chega com o{" "}
          <span className="inline-flex h-5 w-5 translate-y-1 items-center justify-center rounded-full bg-red-500 text-white [&_svg]:h-3 [&_svg]:w-3">
            <XIcon />
          </span>{" "}
          de todos; quem achar que vale tira o seu.
        </p>
      </Section>

      <Section n={6} title="Pontos">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-2">
            <Points value={10} />
            <span className="text-xs text-white/70">só você</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Points value={5} />
            <span className="text-xs text-white/70">repetida</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Points value={0} />
            <span className="text-xs text-white/70">vazia, anulada ou outra letra</span>
          </div>
        </div>
        <p className="text-center text-sm text-white/70">Acento e maiúscula não contam: &quot;Banana&quot; e &quot;banana&quot; são a mesma resposta.</p>
      </Section>

      <Section n={7} title="A sala">
        <div className="flex flex-wrap items-center justify-center gap-3 font-display text-sm">
          <Chip icon={<ListIcon className="h-4 w-4" />} label="CATEGORIAS" />
          <Chip icon={<FlagIcon className="h-4 w-4" />} label="3 · 5 · 10" />
          <Chip icon={<ClockIcon className="h-4 w-4" />} label="1 · 2 · 3 MIN" />
        </div>
        <p className="text-center text-sm text-white/70">Quem cria a sala escolhe as categorias (das prontas ou criando temas novos no <b className="text-white">+</b>), as rodadas e o tempo de cada rodada (ou sem limite).</p>
      </Section>
    </>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-stone-900">
      {icon}
      {label}
    </span>
  );
}
