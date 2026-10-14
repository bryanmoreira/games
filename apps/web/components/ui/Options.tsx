"use client";

/** Linhas de opções do lobby (Stop, Codenames): rótulo com ícone e botões segmentados. */

export function Row({ icon, label, value, children }: { icon: React.ReactNode; label: string; value?: number; children: React.ReactNode }) {
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

export function Segmented<T extends string | number>({
  options,
  value,
  disabled,
  onPick,
  render,
}: {
  options: readonly T[];
  value: T;
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
