"use client";

import { useState } from "react";
import { advise, cardValue, handValue, HARD, PAIRS, SOFT, type Card, type Move, type Rank } from "@mesa/blackjack";

export const MOVE_LABEL: Record<Move, string> = { hit: "PEDE", stand: "PARA", double: "DOBRA", split: "DIVIDE" };

/** Cor de cada jogada: a mesma nos botões da mesa, na dica e na tabela do "Como jogar". */
export const MOVE_STYLE: Record<Move, string> = {
  hit: "bg-emerald-600 [--sh:#065f46]",
  stand: "bg-red-600 [--sh:#7f1d1d]",
  double: "bg-gold text-stone-900 [--sh:#9a6b12]",
  split: "bg-sky-600 [--sh:#075985]",
};

const CELL: Record<string, { move: Move; cls: string; text: string }> = {
  H: { move: "hit", cls: "bg-emerald-600", text: "+" },
  S: { move: "stand", cls: "bg-red-600", text: "–" },
  D: { move: "double", cls: "bg-gold text-stone-900", text: "2×" },
  Ds: { move: "double", cls: "bg-gold text-stone-900", text: "2×" },
  P: { move: "split", cls: "bg-sky-600", text: "÷" },
};

const UPS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

/** Chance de estourar ao pedir mais uma carta (baralho infinito: o sapato de 6 baralhos chega perto). */
export function bustChance(cards: readonly Card[]): number {
  const { total, soft } = handValue(cards);
  if (soft) return 0;
  const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  return ranks.filter((r) => total + cardValue(r) > 21).length / ranks.length;
}

/** Painel da dica (hover na mão, na sua vez): a jogada da estratégia básica e o risco de estourar. */
export function TipPanel({ cards, up, canDouble, canSplit }: { cards: Card[]; up: Rank; canDouble: boolean; canSplit: boolean }) {
  const move = advise(cards, up, { canDouble, canSplit });
  const { total, soft } = handValue(cards);
  const bust = Math.round(bustChance(cards) * 100);
  return (
    <div className="banner flex w-56 flex-col gap-2 rounded-2xl bg-stone-950/95 p-3 font-display shadow-2xl ring-1 ring-white/10">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>
          {soft ? "MOLE " : ""}
          {total} <span className="text-white/30">×</span> {up === "A" ? "A" : cardValue(up)}
        </span>
        <span className="text-[10px] tracking-widest text-gold/70">ESTRATÉGIA</span>
      </div>
      <span className={`rounded-xl py-1.5 text-center text-lg ${MOVE_STYLE[move]}`}>{MOVE_LABEL[move]}</span>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/50">PEDIR ESTOURA</span>
        <span className={bust >= 50 ? "text-red-400" : bust > 0 ? "text-white" : "text-emerald-400"}>{bust}%</span>
      </div>
    </div>
  );
}

type Tab = "hard" | "soft" | "pairs";
const TABS: { id: Tab; label: string }[] = [
  { id: "hard", label: "DURA" },
  { id: "soft", label: "MOLE" },
  { id: "pairs", label: "PAR" },
];

/** Tabela da estratégia básica: toque numa casa para ver a jogada por extenso. */
export function StrategyChart() {
  const [tab, setTab] = useState<Tab>("hard");
  const [pick, setPick] = useState<{ row: string; col: number } | null>(null);
  const rows: [string, string[]][] =
    tab === "hard"
      ? Object.entries(HARD).map(([k, v]) => [k === "8" ? "≤8" : k === "17" ? "17+" : k, v])
      : tab === "soft"
        ? Object.entries(SOFT).map(([k, v]) => [`A+${Number(k) - 11}`, v])
        : ([
            ...Object.entries(PAIRS).map(([k, v]): [string, string[]] => [k === "1" ? "A+A" : `${k}+${k}`, v]),
            ["5+5", HARD[10]],
            ["10+10", HARD[17]],
          ] as [string, string[]][]).sort((a, b) => order(a[0]) - order(b[0]));
  const picked = pick ? rows.find((r) => r[0] === pick.row)?.[1][pick.col] : null;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center rounded-xl bg-black/30 p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setPick(null);
            }}
            className={`h-9 flex-1 rounded-lg font-display text-sm transition ${tab === t.id ? "bg-gold text-stone-900" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="mx-auto border-separate border-spacing-[2px] font-display text-[11px] sm:text-sm">
          <thead>
            <tr>
              <th className="pr-1 text-right text-[9px] text-white/40 sm:text-[10px]">VOCÊ \ BANCA</th>
              {UPS.map((u) => (
                <th key={u} className="w-6 text-center text-white/70 sm:w-8">
                  {u}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, codes]) => (
              <tr key={label}>
                <th className="whitespace-nowrap pr-1 text-right text-white/70">{label}</th>
                {codes.map((c, col) => {
                  const cell = CELL[c];
                  const on = pick?.row === label && pick.col === col;
                  return (
                    <td key={col} className="p-0">
                      <button
                        onClick={() => setPick({ row: label, col })}
                        aria-label={`${label} contra ${UPS[col]}: ${MOVE_LABEL[cell.move]}`}
                        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] sm:h-8 sm:w-8 sm:text-xs ${cell.cls} ${on ? "ring-2 ring-white" : "opacity-90 hover:opacity-100"}`}
                      >
                        {cell.text}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex min-h-10 items-center justify-center gap-2 font-display text-sm">
        {pick && picked ? (
          <>
            <span className="text-white/70">
              {pick.row} × {UPS[pick.col]}
            </span>
            <span className={`rounded-lg px-3 py-1 ${MOVE_STYLE[CELL[picked].move]}`}>{MOVE_LABEL[CELL[picked].move]}</span>
            {picked === "Ds" && <span className="text-xs text-white/50">(sem dobrar: PARA)</span>}
            {picked === "D" && <span className="text-xs text-white/50">(sem dobrar: PEDE)</span>}
          </>
        ) : (
          <span className="flex flex-wrap justify-center gap-2 text-[11px] text-white/60">
            {(["H", "S", "D", "P"] as const).map((c) => (
              <span key={c} className="flex items-center gap-1">
                <span className={`flex h-5 w-5 items-center justify-center rounded ${CELL[c].cls}`}>{CELL[c].text}</span>
                {MOVE_LABEL[CELL[c].move]}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

const order = (label: string) => (label.startsWith("A") ? 1 : Number(label.split("+")[0]));
