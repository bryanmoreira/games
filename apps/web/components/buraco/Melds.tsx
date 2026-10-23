"use client";

import { canastraKind, isWildIn, type Meld } from "@mesa/buraco";
import { MiniCard } from "./Cards";

const BADGE = {
  limpa: { label: "LIMPA", cls: "bg-gold text-stone-900" },
  suja: { label: "SUJA", cls: "bg-white/90 text-stone-900" },
  real: { label: "REAL", cls: "bg-fuchsia-400 text-stone-900" },
} as const;

/**
 * Um jogo na mesa: as cartas em fila, se apertando (só o canto aparece) quando falta lugar.
 * `onClick`: o jogo é da minha dupla e recebe cartas; `ready`: a seleção atual entra aqui.
 */
export function MeldStrip({
  meld,
  width,
  mine,
  ready,
  onClick,
  fresh,
}: {
  meld: Meld;
  width: number;
  mine: boolean;
  ready?: boolean;
  onClick?: () => void;
  fresh?: boolean;
}) {
  const kind = canastraKind(meld);
  const last = meld.cards.length - 1;
  const body = (
    <span
      className={`relative flex max-w-full items-start rounded-lg p-0.5 ring-1 ${mine ? "bg-gold/10 ring-gold/30" : "bg-red-400/10 ring-red-400/30"} ${
        ready ? "turn-glow !ring-0" : ""
      } ${fresh ? "banner" : ""}`}
    >
      {meld.cards.map((mc, i) => (
        <span
          key={mc.card.id}
          className={`block overflow-hidden ${i === 0 ? "rounded-l-[8%]" : ""} ${i === last ? "shrink-0 rounded-r-[8%]" : "border-r border-black/15"}`}
          style={{ flex: i === last ? "0 0 auto" : "0 1 auto", width, minWidth: width * 0.42 }}
        >
          <MiniCard card={mc.card} as={mc.as} wild={isWildIn(mc, meld.suit)} width={width} />
        </span>
      ))}
      {kind && (
        <span className={`absolute -right-1 -top-2 rounded-full px-1.5 py-[1px] font-display text-[9px] leading-tight shadow ${BADGE[kind].cls}`}>
          {BADGE[kind].label}
        </span>
      )}
    </span>
  );
  if (!onClick) return <div className="max-w-full pt-1.5">{body}</div>;
  return (
    <button onClick={onClick} data-meld={meld.id} className="max-w-full pt-1.5 text-left" aria-label="Jogo da dupla">
      {body}
    </button>
  );
}
