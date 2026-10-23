"use client";

import { useEffect, useRef, useState } from "react";
import type { Card } from "@mesa/buraco";
import { BCard } from "./Cards";

const RATIO = 726 / 500;

/**
 * Minha mão: as cartas se sobrepõem numa fila e, se não couberem, numa segunda e terceira (cada fila cobre
 * a metade de baixo da anterior, o canto com o valor continua à vista). Tocar seleciona a carta.
 */
export function Hand({
  cards,
  selected,
  onToggle,
  onDouble,
  onHover,
  active,
  deal,
  dealKey,
}: {
  cards: Card[];
  selected: string[];
  onToggle: (id: string) => void;
  /** Clique duplo na carta (descartar), quando dá. */
  onDouble?: (id: string) => void;
  /** Mouse sobre a carta (dicas). */
  onHover?: (c: Card | null) => void;
  /** É a minha vez: as cartas brilham. */
  active: boolean;
  /** Anima a chegada das cartas (distribuição). */
  deal: boolean;
  dealKey: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = cards.length;
  const cw = Math.round(Math.min(76, Math.max(46, w / 6.4)));
  const minStride = cw * 0.4;
  let rows = 1;
  while (rows < 3 && (Math.ceil(n / rows) - 1) * minStride + cw > w) rows++;
  const perRow = Math.max(1, Math.ceil(n / rows));
  const stride = perRow > 1 ? Math.min(cw * 0.85, (w - cw) / (perRow - 1)) : 0;
  const ch = cw * RATIO;
  const rowStep = ch * 0.5;
  const height = ch + (rows - 1) * rowStep + 14;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[900px]" style={{ height: n ? height : ch * 0.6 }}>
      {cards.map((c, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const inRow = Math.min(perRow, n - row * perRow);
        const rowW = (inRow - 1) * stride + cw;
        const left = (w - rowW) / 2 + col * stride;
        const on = selected.includes(c.id);
        return (
          <button
            key={`${dealKey}-${c.id}`}
            onClick={() => onToggle(c.id)}
            onDoubleClick={() => onDouble?.(c.id)}
            onMouseEnter={() => onHover?.(c)}
            onMouseLeave={() => onHover?.(null)}
            data-id={c.id}
            aria-pressed={on}
            aria-label={c.rank === "JK" ? "Coringa" : `${c.rank} de ${c.suit}`}
            className={`absolute top-3 transition-transform duration-150 ${deal ? "deal" : ""} ${on ? "z-[60] -translate-y-3" : active ? "turn-card [@media(hover:hover)]:hover:-translate-y-2" : ""}`}
            style={{ left, top: 12 + row * rowStep, width: cw, zIndex: on ? 60 : row * 20 + col, animationDelay: deal ? `${i * 45}ms` : undefined }}
          >
            <span className={`block rounded-[7%/5%] ${on ? "shadow-[0_0_0_3px_#f2c14e,0_0_14px_#f2c14e]" : ""}`}>
              <BCard card={c} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
