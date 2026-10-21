import type { Mark, Mode } from "@mesa/verbete";

/** Cores das marcas: verde (lugar certo), amarelo (outro lugar), cinza (não tem). */
export const MARK_BG: Record<Mark, string> = { right: "#2a9d68", place: "#d39b26", absent: "#2a2f2c" };

export const MODE_NAME: Record<Mode, string> = { 1: "Verbete", 2: "Dueto", 4: "Quarteto" };

/** Casa com letra: vazia, digitada ou já marcada. */
export function Tile({
  letter,
  mark,
  size,
  className = "",
  style,
}: {
  letter?: string;
  mark?: Mark;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const bg = mark ? MARK_BG[mark] : undefined;
  return (
    <span
      className={`flex aspect-square items-center justify-center rounded-[12%] border-2 font-display uppercase leading-none ${
        mark ? (mark === "absent" ? "text-white/55" : "text-white") : letter ? "border-white/45 bg-white/[0.04]" : "border-white/15 bg-white/[0.04]"
      } ${className}`}
      style={{
        ...(size ? { width: size, height: size, fontSize: size * 0.55 } : {}),
        ...(bg ? ({ "--vb-bg": bg, backgroundColor: bg, borderColor: bg } as React.CSSProperties) : {}),
        ...style,
      }}
    >
      {letter}
    </span>
  );
}

/** Palavra em casas pequenas (ilustrações, tela de fim). */
export function WordTiles({ word, marks, className = "", tile = "w-8 text-base" }: { word: string; marks?: Mark[]; className?: string; tile?: string }) {
  return (
    <span className={`flex gap-1 ${className}`}>
      {[...word].map((l, i) => (
        <Tile key={i} letter={l} mark={marks?.[i]} className={tile} />
      ))}
    </span>
  );
}

// chutes até VERBO (marcas conferidas com `score`)
const ART: { word: string; marks: Mark[] }[] = [
  { word: "PORTA", marks: ["absent", "place", "right", "absent", "absent"] },
  { word: "SONHO", marks: ["absent", "absent", "absent", "absent", "right"] },
  { word: "VERSO", marks: ["right", "right", "right", "absent", "right"] },
  { word: "VERBO", marks: ["right", "right", "right", "right", "right"] },
];

/** Arte do jogo: algumas linhas marcadas (card da home e página do jogo). */
/** `flip`: as peças viram uma a uma ao passar o mouse no card da home (.hc-flip). */
export function MiniTiles({ className = "", rows = 3, flip = false }: { className?: string; rows?: number; flip?: boolean }) {
  return (
    <span className={`flex flex-col gap-[0.25em] ${className}`}>
      {ART.slice(ART.length - rows).map((r, i) => (
        <span key={i} className="flex gap-[0.25em]">
          {[...r.word].map((l, j) => (
            <span
              key={j}
              className={`flex h-[2em] w-[2em] items-center justify-center rounded-[0.3em] font-display leading-none ${r.marks[j] === "absent" ? "text-white/55" : "text-white"} ${flip ? "hc-flip" : ""}`}
              style={{ backgroundColor: MARK_BG[r.marks[j]], "--d": i * r.word.length + j } as React.CSSProperties}
            >
              {l}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

/** Ícone do modo: um, dois ou quatro quadrinhos. */
export function ModeIcon({ mode, className = "h-5 w-5" }: { mode: Mode; className?: string }) {
  const cells = mode === 1 ? [[6, 6, 12, 12]] : mode === 2 ? [[3, 7, 8, 10], [13, 7, 8, 10]] : [[3, 3, 8, 8], [13, 3, 8, 8], [3, 13, 8, 8], [13, 13, 8, 8]];
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
      {cells.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx={1.5} />
      ))}
    </svg>
  );
}
