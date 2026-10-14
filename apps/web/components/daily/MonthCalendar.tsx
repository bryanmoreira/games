"use client";

import { Fragment } from "react";
import { ChevronIcon } from "@/components/ui/icons";
import { DAILY_START } from "@/lib/daily/challenge";

const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export const monthOf = (day: string) => day.slice(0, 7);
function shiftMonth(month: string, n: number) {
  const d = new Date(`${month}-01T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

/** Mês do desafio diário: setas entre os meses, dias sem desafio apagados e `cell` desenha cada dia aberto. */
export function MonthCalendar({
  today,
  month,
  onMonth,
  cell,
}: {
  today: string;
  /** AAAA-MM */
  month: string;
  onMonth: (month: string) => void;
  cell: (day: string, n: number) => React.ReactNode;
}) {
  // grade do mês: começa no domingo
  const first = new Date(`${month}-01T12:00:00Z`);
  const blanks = first.getUTCDay();
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const cells = Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
  const canPrev = month > monthOf(DAILY_START);
  const canNext = month < monthOf(today);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onMonth(shiftMonth(month, -1))}
          disabled={!canPrev}
          aria-label="Mês anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-0"
        >
          <ChevronIcon left className="h-5 w-5" />
        </button>
        <span className="font-display text-sm capitalize text-white/80">{MONTH.format(first).replace(" de ", " ")}</span>
        <button
          onClick={() => onMonth(shiftMonth(month, 1))}
          disabled={!canNext}
          aria-label="Próximo mês"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-0"
        >
          <ChevronIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEK.map((w, i) => (
          <span key={i} className="font-display text-[10px] text-white/35">
            {w}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {cells.map((d) => {
          const n = Number(d.slice(8));
          if (d < DAILY_START || d > today) {
            return (
              <span key={d} className="flex aspect-square items-center justify-center rounded-lg font-display text-xs text-white/15">
                {n}
              </span>
            );
          }
          return <Fragment key={d}>{cell(d, n)}</Fragment>;
        })}
      </div>
    </div>
  );
}
