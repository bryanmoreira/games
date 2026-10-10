"use client";

import { useState } from "react";
import {
  allCategories,
  cleanCustom,
  customId,
  MAX_CUSTOM,
  MAX_CUSTOM_NAME,
  MIN_CATEGORIES,
  normalize,
  ROUND_OPTIONS,
  TIME_OPTIONS,
  type Settings,
} from "@truco/stop";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { Icon } from "@/components/ui/buttons";
import { ClockIcon, FlagIcon, ListIcon, TimeLabel } from "./Tile";

/** Opções da partida no lobby: o host muda, os outros só veem. */
export function StopSettings({ room }: { room: RoomInfo }) {
  const s = room.settings as Settings;
  const host = room.isHost;
  const set = (patch: Partial<Settings>) => send({ t: "settings", settings: { ...s, ...patch } });

  const all = allCategories(s);
  const atMin = s.categories.length <= MIN_CATEGORIES;

  const toggle = (id: string) => {
    const on = s.categories.includes(id);
    if (on && atMin) return;
    set({ categories: on ? s.categories.filter((c) => c !== id) : [...s.categories, id] });
  };

  /** Tema novo já entra marcado; se o nome já existe, só marca o que existe. */
  const add = (raw: string) => {
    const name = cleanCustom(raw);
    if (!normalize(name)) return;
    const same = all.find((c) => normalize(c.name) === normalize(name));
    const id = same?.id ?? customId(name);
    const categories = s.categories.includes(id) ? s.categories : [...s.categories, id];
    set(same ? { categories } : { custom: [...s.custom, name], categories });
  };

  const remove = (name: string) => {
    const id = customId(name);
    if (s.categories.includes(id) && atMin) return;
    set({ custom: s.custom.filter((n) => n !== name), categories: s.categories.filter((c) => c !== id) });
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 sm:p-4">
      <Row icon={<ListIcon className="h-4 w-4" />} label="CATEGORIAS" value={s.categories.length}>
        <div className="flex flex-wrap gap-1.5">
          {all.map((c) => {
            const on = s.categories.includes(c.id);
            const custom = c.id.startsWith("c:");
            return (
              <span
                key={c.id}
                className={`flex items-center rounded-full text-sm font-semibold transition ${
                  on ? "bg-gold text-stone-900" : "bg-white/10 text-white/50"
                } ${custom ? "ring-2 ring-inset ring-white/25" : ""}`}
              >
                <button
                  disabled={!host}
                  aria-pressed={on}
                  onClick={() => toggle(c.id)}
                  className={`rounded-full py-1.5 ${custom && host ? "pl-3 pr-1" : "px-3"} ${
                    host ? (on ? "hover:brightness-110" : "hover:text-white") : "cursor-default"
                  }`}
                >
                  {c.name}
                </button>
                {custom && host && (
                  <button
                    onClick={() => remove(c.name)}
                    disabled={on && atMin}
                    aria-label={`Apagar ${c.name}`}
                    title="Apagar"
                    className="mr-1 flex h-6 w-6 items-center justify-center rounded-full opacity-60 transition hover:bg-black/15 hover:opacity-100 disabled:opacity-20"
                  >
                    <Icon className="h-3.5 w-3.5">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </Icon>
                  </button>
                )}
              </span>
            );
          })}
          {host && s.custom.length < MAX_CUSTOM && <AddTheme onAdd={add} />}
        </div>
      </Row>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <Row icon={<FlagIcon className="h-4 w-4" />} label="RODADAS">
          <Segmented options={ROUND_OPTIONS} value={s.rounds} disabled={!host} onPick={(rounds) => set({ rounds })} render={(n) => n} />
        </Row>
        <Row icon={<ClockIcon className="h-4 w-4" />} label="TEMPO">
          <Segmented
            options={TIME_OPTIONS}
            value={s.time}
            disabled={!host}
            onPick={(time) => set({ time })}
            render={(t) => <TimeLabel seconds={t} className={t === 0 ? "h-5 w-5" : undefined} />}
          />
        </Row>
      </div>
    </div>
  );
}

/** Chip "+" que vira campo para digitar temas novos (Enter cria, Esc fecha). */
function AddTheme({ onAdd }: { onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const close = () => {
    setOpen(false);
    setText("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Criar tema"
        title="Criar tema"
        className="flex h-8 w-10 items-center justify-center rounded-full border-2 border-dashed border-white/25 text-white/60 transition hover:border-white/50 hover:text-white"
      >
        <Icon className="h-4 w-4">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </Icon>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // continua aberto para criar vários seguidos
        if (text.trim()) onAdd(text);
        setText("");
      }}
      className="flex items-center rounded-full bg-white/10 ring-2 ring-gold/60"
    >
      <input
        autoFocus
        value={text}
        maxLength={MAX_CUSTOM_NAME}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && close()}
        onBlur={() => {
          if (text.trim()) onAdd(text);
          close();
        }}
        placeholder="Novo tema"
        className="w-36 bg-transparent py-1.5 pl-3 text-sm font-semibold outline-none placeholder:text-white/40"
      />
      <button
        type="submit"
        aria-label="Criar"
        title="Criar"
        onMouseDown={(e) => e.preventDefault()}
        className="mr-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-stone-900"
      >
        <Icon className="h-3.5 w-3.5">
          <path d="M20 6 9 17l-5-5" />
        </Icon>
      </button>
    </form>
  );
}

function Row({ icon, label, value, children }: { icon: React.ReactNode; label: string; value?: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 font-display text-xs text-white/50">
        {icon}
        {label}
        {value !== undefined && <span className="text-gold">{value}</span>}
      </span>
      {children}
    </div>
  );
}

function Segmented<T extends number>({
  options,
  value,
  disabled,
  onPick,
  render,
}: {
  options: readonly T[];
  value: number;
  disabled: boolean;
  onPick: (v: T) => void;
  render: (v: T) => React.ReactNode;
}) {
  return (
    <div className="flex rounded-xl bg-black/30 p-1">
      {options.map((o) => (
        <button
          key={o}
          disabled={disabled}
          aria-pressed={o === value}
          onClick={() => onPick(o)}
          className={`flex h-9 min-w-12 flex-1 items-center justify-center rounded-lg px-3 font-display text-sm transition ${
            o === value ? "bg-gold text-stone-900" : `text-white/50 ${disabled ? "cursor-default" : "hover:bg-white/10 hover:text-white"}`
          }`}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}
