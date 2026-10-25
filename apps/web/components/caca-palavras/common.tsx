import type { CSSProperties } from "react";
import type { Level } from "@mesa/caca-palavras";

export { formatTime } from "@/components/sudoku/common";

export const LEVEL_LABEL: Record<Level, string> = { easy: "FÁCIL", medium: "MÉDIO", hard: "DIFÍCIL" };

const LEVEL_N: Record<Level, number> = { easy: 1, medium: 2, hard: 3 };

/** Barrinhas de dificuldade (1 a 3 acesas). */
export function LevelBars({ level, className = "h-4 w-5" }: { level: Level; className?: string }) {
  const n = LEVEL_N[level];
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={i * 5.5 + 0.5} y={11 - i * 4.5} width={4} height={5 + i * 4.5} rx={1.3} fill="currentColor" opacity={i < n ? 1 : 0.25} />
      ))}
    </svg>
  );
}

/** Cores das palavras achadas, na ordem em que foram achadas. */
export const PALETTE = ["#f2c14e", "#4fc3f7", "#f48fb1", "#81c784", "#ffb74d", "#b39ddb", "#4dd0c1", "#ef9a9a"];
export const colorOf = (order: number) => PALETTE[order % PALETTE.length];

/** Cápsula de uma palavra sobre a grade (em casas: o centro da casa r, c é r + 0,5, c + 0,5). */
export function Capsule({
  size,
  from,
  to,
  color,
  className = "",
  width = 0.78,
  opacity = 0.55,
  style,
}: {
  size: number;
  from: number;
  to: number;
  color: string;
  className?: string;
  width?: number;
  opacity?: number;
  style?: CSSProperties;
}) {
  const x1 = (from % size) + 0.5;
  const y1 = Math.floor(from / size) + 0.5;
  const x2 = (to % size) + 0.5;
  const y2 = Math.floor(to / size) + 0.5;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      pathLength={1}
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth={width}
      strokeLinecap="round"
      className={className}
      style={style}
    />
  );
}

// grade de enfeite: CASA na 2ª linha, LUA descendo na 5ª coluna, SOL na diagonal (também na prévia de link)
export const ART = ["RQPTEM", "CASAOU", "BNOVLI", "TSMOUD", "PIOSAL", "OZELTS"];
export const ART_WORDS: { from: number; to: number; color: string }[] = [
  { from: 6, to: 9, color: "#f2c14e" },
  { from: 16, to: 28, color: "#4fc3f7" },
  { from: 19, to: 33, color: "#f48fb1" },
];

/**
 * Grade 6×6 de enfeite (página do jogo, card da home e login).
 * `sweep`: as cápsulas se desenham uma a uma ao passar o mouse no card da home (.hc-sweep); parado, ficam desenhadas.
 */
export function WordArt({ className = "", sweep = false }: { className?: string; sweep?: boolean }) {
  return (
    <div className={`felt-blue relative aspect-square shrink-0 rounded-[8%] bg-[#5b3a1e] shadow-[0_6px_20px_rgba(0,0,0,0.5)] ${className}`}>
      <div className="absolute inset-[4%] rounded-[6%] bg-felt">
        <svg viewBox="0 0 6 6" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {ART_WORDS.map((w, i) => (
            <Capsule key={i} size={6} {...w} width={0.74} opacity={0.6} className={sweep ? "hc-sweep" : ""} style={{ "--d": i } as CSSProperties} />
          ))}
        </svg>
        <div className="relative grid h-full w-full grid-cols-6 grid-rows-6">
          {[...ART.join("")].map((l, i) => (
            <span key={i} className="flex items-center justify-center font-display leading-none text-white/90 [font-size:inherit]">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
