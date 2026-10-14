"use client";

import { useId } from "react";
import { BASE, HOME, HOME_CELLS, SAFE, startOf, TRACK_CELLS, cellOf, type Color } from "@truco/ludo";

/** Cores das peças (0 vermelho, 1 verde, 2 amarelo, 3 azul): base, brilho, sombra e casa clara do tabuleiro. */
export const LUDO_COLORS = [
  { base: "#e5484d", light: "#ffa19c", dark: "#9b1c1f", soft: "#f6c3c0", border: "border-[#e5484d]", name: "Vermelho" },
  { base: "#2fb36b", light: "#98ecb9", dark: "#12663a", soft: "#bfe9cf", border: "border-[#2fb36b]", name: "Verde" },
  { base: "#f0b429", light: "#ffe19a", dark: "#9a6b07", soft: "#fbe3a6", border: "border-[#f0b429]", name: "Amarelo" },
  { base: "#3e7bfa", light: "#a8c8ff", dark: "#1b3d99", soft: "#c4d6fd", border: "border-[#3e7bfa]", name: "Azul" },
] as const;

const N = 15;
type Point = readonly [number, number]; // [y, x] em casas, de 0 a 15

/** Gira um ponto 90° no sentido horário (k vezes) em volta do centro. */
const cw = (p: Point, k: number): Point => {
  let [y, x] = p;
  for (let i = 0; i < ((k % 4) + 4) % 4; i++) [y, x] = [x, N - y];
  return [y, x];
};

/** Centros dos 4 lugares da base de cada cor. */
const BASE_SLOTS: Point[][] = [0, 1, 2, 3].map((c) =>
  (
    [
      [2, 2],
      [2, 4],
      [4, 2],
      [4, 4],
    ] as Point[]
  ).map((p) => cw(p, c)),
);

/** Peças que chegaram: no triângulo da cor, no centro. */
const HOME_SLOTS: Point[][] = [0, 1, 2, 3].map((c) =>
  (
    [
      [7.2, 6.5],
      [7.8, 6.5],
      [7.2, 7.05],
      [7.8, 7.05],
    ] as Point[]
  ).map((p) => cw(p, c)),
);

/** Centro de uma peça no tabuleiro sem girar. */
export function pointOf(color: Color, piece: number, progress: number): Point {
  if (progress === BASE) return BASE_SLOTS[color][piece];
  if (progress === HOME) return HOME_SLOTS[color][piece];
  const [r, c] = cellOf(color, progress)!;
  return [r + 0.5, c + 0.5];
}

/** Quartos de volta (anti-horário) para a cor de quem joga ficar embaixo à esquerda. */
export const turnsFor = (myColor: Color | null) => ((myColor ?? 3) + 1) % 4;

/** Canto da tela de cada cor depois de girar: 0 em cima à esq., 1 em cima à dir., 2 embaixo à dir., 3 embaixo à esq. */
export const cornerOf = (color: Color, turns: number) => (((color - turns) % 4) + 4) % 4;

/** Peão em SVG: base, corpo e cabeça com brilho. */
export function Pawn({ color, className = "", dim }: { color: Color; className?: string; dim?: boolean }) {
  const id = useId();
  const c = LUDO_COLORS[color];
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" opacity={dim ? 0.35 : 1}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.5" stopColor={c.base} />
          <stop offset="1" stopColor={c.dark} />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="90" rx="30" ry="8" fill="rgba(0,0,0,0.3)" />
      <path d="M22 86 Q22 74 34 72 L40 50 Q50 44 60 50 L66 72 Q78 74 78 86 Z" fill={`url(#${id}-g)`} stroke={c.dark} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="50" cy="32" r="19" fill={`url(#${id}-g)`} stroke={c.dark} strokeWidth="3" />
      <ellipse cx="44" cy="25" rx="6" ry="4" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

const STAR = (() => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 ? 1.6 : 3.6;
    return `${(5 + r * Math.cos(a)).toFixed(2)},${(5 + r * Math.sin(a)).toFixed(2)}`;
  });
  return pts.join(" ");
})();

/** Desenho fixo do tabuleiro (unidade = 10 por casa), sem girar. */
function BoardArt() {
  const track = TRACK_CELLS.map(([r, c], i) => {
    const start = [0, 1, 2, 3].find((col) => startOf(col) === i);
    return (
      <g key={i} transform={`translate(${c * 10} ${r * 10})`}>
        <rect width="10" height="10" fill={start !== undefined ? LUDO_COLORS[start].base : "#fffdf7"} stroke="#cdbf9f" strokeWidth="0.5" />
        {SAFE.has(i) && start === undefined && <polygon points={STAR} fill="#c9b98f" />}
        {start !== undefined && <polygon points={STAR} fill="rgba(255,255,255,0.75)" />}
      </g>
    );
  });
  return (
    <>
      <rect width="150" height="150" fill="#fffdf7" />
      {[0, 1, 2, 3].map((color) => {
        const [y, x] = cw([0, 0], color);
        // canto da base (6×6): o ponto girado é um dos cantos do tabuleiro
        const bx = x === 0 ? 0 : 90;
        const by = y === 0 ? 0 : 90;
        const col = LUDO_COLORS[color];
        return (
          <g key={color}>
            <rect x={bx} y={by} width="60" height="60" fill={col.base} />
            <rect x={bx + 8} y={by + 8} width="44" height="44" rx="6" fill="#fffdf7" />
            {BASE_SLOTS[color].map(([sy, sx], i) => (
              <circle key={i} cx={sx * 10} cy={sy * 10} r="6.5" fill={col.soft} stroke={col.base} strokeWidth="1.2" />
            ))}
            {HOME_CELLS[color].map(([r, c], i) => (
              <rect key={i} x={c * 10} y={r * 10} width="10" height="10" fill={col.base} stroke="#cdbf9f" strokeWidth="0.5" />
            ))}
          </g>
        );
      })}
      {track}
      {/* centro: um triângulo por cor apontando para o meio */}
      <polygon points="60,60 60,90 75,75" fill={LUDO_COLORS[0].base} />
      <polygon points="60,60 90,60 75,75" fill={LUDO_COLORS[1].base} />
      <polygon points="90,60 90,90 75,75" fill={LUDO_COLORS[2].base} />
      <polygon points="60,90 90,90 75,75" fill={LUDO_COLORS[3].base} />
      <path d="M60 60 L90 90 M90 60 L60 90" stroke="rgba(0,0,0,0.15)" strokeWidth="0.6" />
      <rect x="0" y="0" width="150" height="150" fill="none" stroke="#cdbf9f" strokeWidth="1" />
    </>
  );
}

export interface UiPiece {
  color: Color;
  piece: number;
  progress: number;
  /** Tempo do deslize desta peça (ex.: capturada voltando à base); sem ele, `step`. */
  ms?: number;
}

/** Posição de cada peça na tela (em casas), com as peças que dividem casa encolhidas e espalhadas. */
function layout(pieces: UiPiece[], turns: number) {
  const groups = new Map<string, UiPiece[]>();
  for (const p of pieces) {
    if (p.progress === BASE || p.progress === HOME) continue;
    const key = pointOf(p.color, p.piece, p.progress).join();
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const OFF: Point[] = [
    [-0.2, -0.2],
    [0.2, 0.2],
    [-0.2, 0.2],
    [0.2, -0.2],
  ];
  return pieces.map((p) => {
    const at = pointOf(p.color, p.piece, p.progress);
    let size = p.progress === HOME ? 0.55 : p.progress === BASE ? 1.15 : 1;
    let [y, x] = at;
    const g = p.progress === BASE || p.progress === HOME ? null : groups.get(at.join())!;
    if (g && g.length > 1) {
      const i = g.indexOf(p) % 4;
      size = 0.7;
      y += OFF[i][0];
      x += OFF[i][1];
    }
    const [vy, vx] = cw([y, x], -turns);
    return { ...p, y: vy, x: vx, size };
  });
}

/**
 * Tabuleiro de Ludo 15×15 girado para a cor de quem joga ficar embaixo à esquerda. As peças são uma
 * camada por cima do desenho e deslizam de casa em casa (`step` ms por casa).
 */
export function Board({
  pieces,
  turns = 0,
  step = 150,
  movable,
  onPiece,
  onHover,
  target,
  className = "",
}: {
  pieces: UiPiece[];
  turns?: number;
  step?: number;
  /** Chave `cor:peça` das peças que podem mover. */
  movable?: Set<string>;
  onPiece?: (p: UiPiece) => void;
  onHover?: (p: UiPiece | null) => void;
  /** Destino da peça sob o mouse (marcado no tabuleiro). */
  target?: UiPiece | null;
  className?: string;
}) {
  const placed = layout(pieces, turns);
  const tgt = target ? cw(pointOf(target.color, target.piece, target.progress), -turns) : null;
  return (
    <div className={`relative aspect-square rounded-xl bg-[#5b3920] p-[2%] shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_0_rgba(255,255,255,0.15)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-md ring-2 ring-black/40">
        <svg viewBox="0 0 150 150" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <g transform={`rotate(${-90 * turns} 75 75)`}>
            <BoardArt />
          </g>
          {tgt && <circle cx={tgt[1] * 10} cy={tgt[0] * 10} r="4.2" fill="none" stroke="#1c1917" strokeWidth="1.2" strokeDasharray="2.2 1.6" opacity="0.7" />}
        </svg>
        {placed.map((p) => {
          const key = `${p.color}:${p.piece}`;
          const can = movable?.has(key);
          return (
            <button
              key={key}
              type="button"
              tabIndex={can ? 0 : -1}
              disabled={!can}
              onClick={() => can && onPiece?.(p)}
              onPointerEnter={() => can && onHover?.(p)}
              onPointerLeave={() => onHover?.(null)}
              aria-label={`${LUDO_COLORS[p.color].name} ${p.piece + 1}`}
              className={`absolute flex items-end justify-center rounded-full disabled:cursor-default ${can ? "ludo-movable z-20 cursor-pointer" : "z-10"}`}
              style={{
                width: `${(p.size / N) * 100}%`,
                height: `${(p.size / N) * 100}%`,
                left: `${((p.x - p.size / 2) / N) * 100}%`,
                top: `${((p.y - p.size / 2) / N) * 100}%`,
                transition: `left ${p.ms ?? step}ms ease-out, top ${p.ms ?? step}ms ease-out, width 200ms, height 200ms`,
              }}
            >
              <Pawn color={p.color} className="pointer-events-none h-[112%] w-[112%] -translate-y-[12%]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Tabuleiro parado para ilustrações (home, "Como jogar", prévia). */
export function StaticBoard({ pieces = [], turns = 0, className }: { pieces?: UiPiece[]; turns?: number; className?: string }) {
  return <Board pieces={pieces} turns={turns} className={className} />;
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

/** Face do dado em SVG. */
export function DieFace({ value, className = "", color }: { value: number; className?: string; color?: Color }) {
  const pip = color === undefined ? "#1c1917" : LUDO_COLORS[color].dark;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect x="4" y="8" width="92" height="88" rx="20" fill="rgba(0,0,0,0.35)" />
      <rect x="4" y="4" width="92" height="88" rx="20" fill="#fffdf7" stroke="#d6cbb5" strokeWidth="3" />
      {(PIPS[value] ?? []).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y - 2} r="9" fill={pip} />
      ))}
    </svg>
  );
}
