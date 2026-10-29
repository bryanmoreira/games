"use client";

import { useState, type ReactNode } from "react";
import { GridIcon, PeopleIcon, PersonIcon } from "@/components/ui/icons";

export type Players = { min: number; max: number };
export type GameTile = { slug: string; players: Players; card: ReactNode };
type Mode = "all" | "solo" | "multi";

const isSolo = (p: Players) => p.min === 1;
const isMulti = (p: Players) => p.max > 1;

const MODES: { id: Mode; label: string; icon: ReactNode }[] = [
  { id: "all", label: "Todos", icon: <GridIcon className="h-4 w-4" /> },
  { id: "solo", label: "Solo", icon: <PersonIcon className="h-4 w-4" /> },
  { id: "multi", label: "Multiplayer", icon: <PeopleIcon className="h-4 w-4" /> },
];

export function GameGrid({ games }: { games: GameTile[] }) {
  const [mode, setMode] = useState<Mode>("all");
  /** null = qualquer quantidade */
  const [count, setCount] = useState<number | null>(null);
  const top = Math.max(...games.map((g) => g.players.max));

  const shown = games.filter(
    ({ players: p }) =>
      (mode === "all" || (mode === "solo" ? isSolo(p) : isMulti(p))) &&
      (mode !== "multi" || count === null || (p.min <= count && count <= p.max)),
  );

  const pick = (m: Mode) => {
    setMode(m);
    setCount(null);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <div role="group" aria-label="Modo de jogo" className="flex rounded-full bg-black/30 p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => pick(m.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs transition ${
                mode === m.id ? "bg-gold text-[#3b2606]" : "text-white/60 hover:text-white"
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {mode === "multi" && (
          <div role="group" aria-label="Quantidade de jogadores" className="flex items-center rounded-full bg-black/30 p-1 text-white/70">
            <StepBtn label="Menos jogadores" disabled={count === null} onClick={() => setCount(count === null || count <= 2 ? null : count - 1)}>
              <path d="M5 12h14" />
            </StepBtn>
            <span className="flex min-w-[4.5rem] items-center justify-center gap-1.5 font-display text-xs" aria-live="polite">
              <PeopleIcon className="h-4 w-4" />
              {count ?? "todos"}
            </span>
            <StepBtn label="Mais jogadores" disabled={count === top} onClick={() => setCount(count === null ? 2 : count + 1)}>
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </StepBtn>
          </div>
        )}
      </div>

      <div className="grid w-full grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((g) => (
          <div key={g.slug}>{g.card}</div>
        ))}
      </div>
    </div>
  );
}

function StepBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

/** Selo no canto do card: pessoa = dá para jogar sozinho; pessoas + número = quantos jogam juntos. */
export function PlayersBadge({ players: p }: { players: Players }) {
  const range = p.min === p.max ? `${p.min}` : `${p.min}–${p.max}`;
  // com o ícone de solo ao lado, o número do multiplayer começa em 2
  const lo = Math.max(p.min, 2);
  const multi = lo === p.max ? `${lo}` : `${lo}–${p.max}`;
  const label = [isSolo(p) && "Solo", isMulti(p) && "Multiplayer", `${range} ${p.max === 1 ? "jogador" : "jogadores"}`].filter(Boolean).join(" · ");
  return (
    <span
      title={label}
      className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/35 px-2.5 py-1.5 font-display text-[11px] leading-none text-white/80 ring-1 ring-white/10 backdrop-blur-sm"
    >
      <span className="sr-only">{label}</span>
      {isSolo(p) && <PersonIcon className="h-3.5 w-3.5" />}
      {isSolo(p) && isMulti(p) && <span aria-hidden="true" className="h-3 w-px bg-white/20" />}
      {isMulti(p) && (
        <span aria-hidden="true" className="flex items-center gap-1 text-gold">
          <PeopleIcon className="h-3.5 w-3.5" />
          {multi}
        </span>
      )}
    </span>
  );
}
