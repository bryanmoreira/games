import { barPct, heat, type Heat } from "@mesa/quente-ou-frio";
import { HintIcon } from "@/components/ui/icons";

export const HEAT_COLOR: Record<Heat, string> = { hot: "#22c55e", warm: "#f2b53c", cold: "#ef4466" };

/**
 * Uma palavra chutada: barra pelo calor (verde, amarelo, vermelho) com o comprimento pela posição, a palavra e o número.
 * `fresh`: o último chute (borda dourada); `flash`: a palavra repetida que acabou de ser chutada de novo.
 */
export function WordBar({
  word,
  rank,
  total,
  hint,
  fresh,
  flash,
  className = "",
}: {
  word: string;
  rank: number;
  total: number;
  hint?: boolean;
  fresh?: boolean;
  flash?: boolean;
  className?: string;
}) {
  const h = heat(rank);
  return (
    <div
      className={`relative flex h-10 shrink-0 items-center overflow-hidden rounded-xl bg-black/35 font-display ring-1 transition ${
        fresh ? "ring-2 ring-gold" : flash ? "qf-flash ring-2 ring-white" : "ring-white/5"
      } ${className}`}
      title={hint ? "Dica" : undefined}
    >
      <span
        className="qf-fill absolute inset-y-0 left-0 rounded-r-xl opacity-80"
        style={{ width: `${rank === 1 ? 100 : barPct(rank, total)}%`, backgroundColor: HEAT_COLOR[h] }}
      />
      <span className="relative flex min-w-0 flex-1 items-center gap-1.5 truncate px-3 text-[15px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">
        {hint && <HintIcon className="h-4 w-4 shrink-0 text-white/80" />}
        <span className="truncate">{word}</span>
      </span>
      <span className="relative px-3 text-[15px] tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">{rank.toLocaleString("pt-BR")}</span>
    </div>
  );
}

/** Chutes de exemplo do desenho do jogo (palavra secreta "praia"), do mais quente ao mais frio. */
export const ART_BARS: { heat: Heat; pct: number; word: string; rank: number }[] = [
  { heat: "hot", pct: 88, word: "areia", rank: 4 },
  { heat: "warm", pct: 36, word: "onda", rank: 872 },
  { heat: "cold", pct: 14, word: "livro", rank: 9312 },
];

/**
 * Três barras (a verde em cima, a vermelha embaixo): o desenho do jogo na página e no card da home.
 * `grow`: no hover do card, as barras enchem da mais fria à mais quente. Em `em`, para o tamanho vir do texto.
 */
export function MiniBars({ className = "", grow = false }: { className?: string; grow?: boolean }) {
  return (
    <div className={`flex w-[13em] flex-col gap-[0.4em] ${className}`} aria-hidden="true">
      {ART_BARS.map((b, i) => (
        <span key={b.word} className="relative flex h-[2.2em] items-center overflow-hidden rounded-[0.5em] bg-black/40 font-display ring-1 ring-white/10">
          <span
            className={`absolute inset-y-0 left-0 rounded-r-[0.5em] opacity-85 ${grow ? "hc-grow" : ""}`}
            style={{ width: `${b.pct}%`, backgroundColor: HEAT_COLOR[b.heat], "--d": ART_BARS.length - 1 - i } as React.CSSProperties}
          />
          <span className="relative flex-1 px-[0.6em] drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">{b.word}</span>
          <span className="relative px-[0.6em] tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]">{b.rank.toLocaleString("pt-BR")}</span>
        </span>
      ))}
    </div>
  );
}
