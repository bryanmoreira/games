import Link from "next/link";

// Peças comuns das páginas do admin (sem estado: servem a páginas de servidor).

export const TZ = "America/Sao_Paulo";
export const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: TZ });
export const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ });

/** "agora", "5 min", "3 h", "2 d", depois a data. */
export function ago(d: Date, now: Date): string {
  const min = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} h`;
  if (min < 60 * 24 * 30) return `${Math.floor(min / 1440)} d`;
  return dateFmt.format(d);
}

/** "16/10" de um AAAA-MM-DD. */
export const dayLabel = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

export const icon = (d: React.ReactNode, className = "h-3.5 w-3.5") => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

export const CARD = "rounded-2xl bg-white/[0.03] ring-1 ring-white/10";

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display text-2xl text-gold drop-shadow-[0_2px_0_#7a4e0c] sm:text-3xl">{children}</h1>;
}

export function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <span className="truncate font-display text-2xl tabular-nums text-gold" title={String(value)}>
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-white/50">{label}</span>
    </div>
  );
}

/** Barras por dia (SVG puro). Passar o mouse mostra dia e valor. */
export function DayBars({ title, days, values, color = "fill-gold" }: { title: string; days: string[]; values: number[]; color?: string }) {
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const W = 10;
  return (
    <section className={`${CARD} flex flex-col gap-3 p-4`}>
      <h2 className="flex items-baseline justify-between font-display text-sm text-white/80">
        {title.toUpperCase()}
        <span className="text-xs tabular-nums text-white/40">{total}</span>
      </h2>
      <div className="relative">
        <span className="absolute -top-1 right-0 text-[10px] tabular-nums text-white/30">{max}</span>
        <svg viewBox={`0 0 ${days.length * W} 100`} preserveAspectRatio="none" className="h-28 w-full" role="img" aria-label={title}>
          <line x1="0" y1="100" x2={days.length * W} y2="100" className="stroke-white/15" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {values.map((v, i) => {
            const h = (v / max) * 92;
            return (
              <g key={days[i]}>
                <title>{`${dayLabel(days[i])} · ${v}`}</title>
                <rect x={i * W} y="0" width={W} height="100" className="fill-transparent hover:fill-white/5" />
                {v > 0 && <rect x={i * W + 1.5} y={100 - h} width={W - 3} height={h} rx="1.5" className={`${color} pointer-events-none`} />}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] tabular-nums text-white/30">
        <span>{dayLabel(days[0])}</span>
        <span>hoje</span>
      </div>
    </section>
  );
}

/** Barrinha de 0–100%. */
export function Meter({ value, className = "bg-gold" }: { value: number | null; className?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      {value !== null && <div className={`h-full rounded-full ${className}`} style={{ width: `${value}%` }} />}
    </div>
  );
}

/** Abas de filtro como links (?d=…). */
export function Tabs<T extends string>({ items, active, href }: { items: [T, string][]; active: T; href: (v: T) => string }) {
  return (
    <nav className="flex w-fit gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
      {items.map(([v, label]) => (
        <Link
          key={v}
          href={href(v)}
          aria-current={v === active ? "page" : undefined}
          className={`rounded-full px-3 py-1 text-xs transition ${v === active ? "bg-gold font-medium text-[#2a1a04]" : "text-white/60 hover:text-white"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
