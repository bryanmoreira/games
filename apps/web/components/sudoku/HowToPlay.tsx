"use client";

import { useState } from "react";
import { boxOf, colOf, MAX_MISTAKES, rowOf } from "@mesa/sudoku";
import { Section } from "@/components/ui/HowToSection";
import { EraseIcon, HintIcon, PencilIcon, UndoIcon } from "@/components/ui/icons";
import { SAMPLE } from "./common";
import { LevelList, Tricks } from "./Levels";

const ROW = "bg-[#2f6b8f]";
const COL = "bg-[#7a4f8f]";
const BOX = "bg-[#8f6a2a]";

/** Grade resolvida: tocar numa casa mostra a linha, a coluna e o bloco dela. */
function UnitsBoard() {
  const [sel, setSel] = useState(40);
  const tone = (i: number) => {
    if (i === sel) return "bg-gold text-stone-900";
    if (boxOf(i) === boxOf(sel)) return `${BOX} text-white`;
    if (rowOf(i) === rowOf(sel)) return `${ROW} text-white`;
    if (colOf(i) === colOf(sel)) return `${COL} text-white`;
    return "bg-felt text-white/50";
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid w-full max-w-[300px] grid-cols-3 gap-[3px] rounded-xl bg-[#5b3a1e] p-[4px]">
        {Array.from({ length: 9 }, (_, b) => (
          <div key={b} className="grid grid-cols-3 gap-px bg-[#0a3a24]">
            {Array.from({ length: 9 }, (_, k) => {
              const i = (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3);
              return (
                <button
                  key={k}
                  onClick={() => setSel(i)}
                  aria-label={`Casa ${rowOf(i) + 1}, ${colOf(i) + 1}`}
                  className={`flex aspect-square items-center justify-center font-display text-sm transition-colors ${tone(i)}`}
                >
                  {SAMPLE[i]}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 font-display text-xs">
        <span className={`rounded-full px-3 py-1 ${ROW}`}>LINHA</span>
        <span className={`rounded-full px-3 py-1 ${COL}`}>COLUNA</span>
        <span className={`rounded-full px-3 py-1 ${BOX}`}>BLOCO</span>
      </div>
    </div>
  );
}

function Cell({ children, className = "bg-felt", size = "h-12 w-12" }: { children?: React.ReactNode; className?: string; size?: string }) {
  return <span className={`flex shrink-0 items-center justify-center rounded-md font-display text-2xl ring-1 ring-black/30 ${size} ${className}`}>{children}</span>;
}

function Notes({ ds }: { ds: number[] }) {
  return (
    <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-1 font-sans text-[10px] font-semibold text-white/75">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <span key={d} className="flex items-center justify-center">
          {ds.includes(d) ? d : ""}
        </span>
      ))}
    </span>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

const TOOLS = [
  { icon: <UndoIcon className="h-6 w-6" />, label: "DESFAZER", text: "Volta a última jogada" },
  { icon: <EraseIcon className="h-6 w-6" />, label: "APAGAR", text: "Limpa a casa" },
  { icon: <PencilIcon className="h-6 w-6" />, label: "NOTAS", text: "Liga as anotações" },
  { icon: <HintIcon className="h-6 w-6" />, label: "DICA", text: "Coloca uma casa e diz o motivo" },
];

const KEYS: [string, string][] = [
  ["1–9", "Número"],
  ["Shift + 1–9", "Anotação"],
  ["N", "Liga/desliga notas"],
  ["Backspace / 0", "Apagar"],
  ["Setas", "Mover"],
  ["Ctrl + Z", "Desfazer"],
  ["H", "Dica"],
];

export function HowToPlay() {
  return (
    <>
      <Section n={1} title="Objetivo">
        <p className="text-sm text-white/80">
          Cada <b className="text-[#7fb6d8]">linha</b>, <b className="text-[#c39bd6]">coluna</b> e <b className="text-[#e0b46a]">bloco</b> tem os números de 1 a 9, sem repetir. Toque numa casa:
        </p>
        <UnitsBoard />
      </Section>

      <Section n={2} title="Jogada">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-black/30 p-4">
          <Cell className="bg-[#7a6a2a]" />
          <Arrow />
          <span className="flex h-12 w-10 flex-col items-center justify-center rounded-xl bg-white/10 font-display leading-none">
            <span className="text-2xl">7</span>
            <span className="mt-1 text-[9px] text-white/45">3</span>
          </span>
          <Arrow />
          <Cell className="bg-[#7a6a2a] text-gold">7</Cell>
        </div>
        <p className="text-center text-xs text-white/60">O número pequeno embaixo diz quantos ainda faltam.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-black/30 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold text-stone-900">
            <PencilIcon className="h-6 w-6" />
          </span>
          <Arrow />
          <Cell>
            <Notes ds={[2, 5, 8]} />
          </Cell>
        </div>
        <p className="text-center text-xs text-white/60">Com as notas ligadas, o número entra pequeno como lembrete. Ao acertar um número, ele sai das notas da linha, da coluna e do bloco.</p>
      </Section>

      <Section n={3} title="Erros">
        <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl bg-black/30 p-4">
          <Cell className="bg-[#5a2a24] text-red-400">4</Cell>
          <span className="flex gap-1.5">
            {Array.from({ length: MAX_MISTAKES }, (_, i) => (
              <span key={i} className={`h-3.5 w-3.5 rounded-full ${i < 1 ? "bg-red-400" : "bg-white/15"}`} />
            ))}
          </span>
        </div>
        <p className="text-center text-sm text-white/80">
          Número errado fica <b className="text-red-400">vermelho</b>. Com {MAX_MISTAKES} erros a partida para: continue ou comece outra. Número certo fica fixo.
        </p>
      </Section>

      <Section n={4} title="Ferramentas">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TOOLS.map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2 rounded-2xl bg-black/30 p-3 text-center">
              <span className="flex h-11 w-14 items-center justify-center rounded-2xl bg-white/10">{t.icon}</span>
              <span className="font-display text-xs text-gold">{t.label}</span>
              <span className="text-xs text-white/60">{t.text}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section n={5} title="Níveis">
        <p className="text-sm text-white/80">O nível não muda as regras: muda o quanto você precisa pensar para achar a próxima casa.</p>
        <LevelList />
      </Section>

      <Section n={6} title="Truques">
        <p className="text-sm text-white/80">Os jeitos de descobrir um número. Os mais fortes não colocam número: riscam notas até sobrar uma opção.</p>
        <Tricks />
      </Section>

      <div className="[@media(hover:none)]:hidden">
        <Section n={7} title="Teclado">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {KEYS.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-4 py-2">
                <kbd className="rounded-md bg-white/10 px-2 py-0.5 font-display text-xs text-gold">{k}</kbd>
                <span className="text-xs text-white/70">{v}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}
