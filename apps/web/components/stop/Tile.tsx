import { Icon } from "@/components/ui/buttons";

/** Peça de letra de madeira (logo, roleta e letra da rodada). `className` define o tamanho (e a fonte via `text-*`). */
export function Tile({ letter, className = "h-12 w-12 text-3xl", style }: { letter: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={`relative inline-flex shrink-0 select-none items-center justify-center rounded-[18%] bg-[linear-gradient(160deg,#fbe6b0,#e9bf6a_60%,#d9a548)] font-display leading-none text-[#5b3a1e] shadow-[0_0.08em_0_#9a6b12,0_0.14em_0.3em_rgba(0,0,0,0.45)] ring-1 ring-black/10 ${className}`}
      style={style}
    >
      {letter}
    </span>
  );
}

/** "STOP" em quatro peças levemente tortas. */
/** `hop`: as letras pulam uma a uma ao passar o mouse no card da home (.hc-hop). */
export function StopLogo({ className = "h-14 w-14 text-4xl", hop = false }: { className?: string; hop?: boolean }) {
  return (
    <div className="flex gap-[0.15em]">
      {"STOP".split("").map((l, i) => (
        <Tile key={i} letter={l} className={`${className} ${hop ? "hc-hop" : ""}`} style={{ transform: `rotate(${[-6, 4, -3, 7][i]}deg) translateY(${[0, -4, 2, -2][i]}%)`, "--d": i } as React.CSSProperties} />
      ))}
    </div>
  );
}


export function FlagIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </Icon>
  );
}

/** Pontos de uma resposta: 10 dourado, 5 branco, 0 apagado. */
export function Points({ value }: { value: number }) {
  return (
    <span
      className={`flex h-9 w-11 shrink-0 items-center justify-center rounded-xl font-display text-lg ${
        value === 10 ? "bg-gold text-stone-900" : value === 5 ? "bg-white/80 text-stone-900" : "bg-white/5 text-white/30"
      }`}
    >
      {value}
    </span>
  );
}
