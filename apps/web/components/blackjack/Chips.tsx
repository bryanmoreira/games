/** Fichas da mesa (só existem dentro da partida; não são as fichas da conta). */

export const CHIP_VALUES = [10, 25, 100, 500] as const;
export type ChipValue = (typeof CHIP_VALUES)[number];

const COLORS: Record<ChipValue, { bg: string; edge: string; text: string }> = {
  10: { bg: "#2563eb", edge: "#dbeafe", text: "#fff" },
  25: { bg: "#16a34a", edge: "#dcfce7", text: "#fff" },
  100: { bg: "#1c1917", edge: "#f2c14e", text: "#f2c14e" },
  500: { bg: "#7e22ce", edge: "#f3e8ff", text: "#fff" },
};

/** Ficha de cassino com o valor no meio. */
export function Chip({ value, className = "", label = true }: { value: ChipValue; className?: string; label?: boolean }) {
  const c = COLORS[value];
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <circle cx="32" cy="32" r="31" fill={c.bg} />
      <circle cx="32" cy="32" r="26.5" fill="none" stroke={c.edge} strokeWidth="8" strokeDasharray="10.4 10.4" />
      <circle cx="32" cy="32" r="19" fill={c.bg} stroke={c.edge} strokeOpacity="0.6" strokeWidth="2" />
      {label && (
        <text x="32" y="38.5" textAnchor="middle" fontFamily="var(--font-bungee), system-ui" fontSize={value >= 100 ? 15 : 18} fill={c.text}>
          {value}
        </text>
      )}
    </svg>
  );
}

/** Fichas que formam `amount` (as maiores primeiro), no máximo `max`. */
export function chipsFor(amount: number, max = 5): ChipValue[] {
  const out: ChipValue[] = [];
  let left = amount;
  for (const v of [...CHIP_VALUES].reverse()) {
    while (left >= v && out.length < max) {
      out.push(v);
      left -= v;
    }
  }
  // sobra de 5 (aposta em múltiplos de 5): uma ficha de 10 a mais só para aparecer
  if (left > 0 && out.length < max) out.push(10);
  return out;
}

/** Pilha de fichas de uma aposta, com o valor ao lado. */
export function BetStack({ amount, size = "h-5 w-5", className = "", text = "text-xs" }: { amount: number; size?: string; className?: string; text?: string }) {
  if (amount <= 0) return null;
  const chips = chipsFor(amount, 4);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={`Aposta ${amount}`}>
      <span className="grid">
        {chips.map((v, i) => (
          <span key={i} className="[grid-area:1/1]" style={{ transform: `translateY(${-i * 22}%)` }}>
            <Chip value={v} label={false} className={`${size} drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]`} />
          </span>
        ))}
      </span>
      <span className={`font-display leading-none ${text}`}>{amount}</span>
    </span>
  );
}

/** Números com ponto de milhar (1.250). */
export const fmt = (n: number) => n.toLocaleString("pt-BR");

/** Ganho com sinal (+150, −50). */
export const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : "0");
