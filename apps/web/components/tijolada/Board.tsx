"use client";

import { useEffect, useRef } from "react";
import { cellsOf, COLS, dropY, HIDDEN, ROWS, SHAPES, VISIBLE, type Game, type Kind } from "@mesa/tijolada";
import { BEVEL, bevelFacets, outline, toneColor } from "./blocks";
import { PieceSvg } from "./Art";
import { COLORS } from "./colors";

/**
 * Um bloco em relevo na casa (x, y), em pixel inteiro (sem borda borrada). O quadrado inteiro vai primeiro
 * na cor da face, para o antisserrilhado das diagonais não deixar fio escuro entre as bordas.
 */
function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  const x0 = Math.round(x * s);
  const y0 = Math.round(y * s);
  const x1 = Math.round((x + 1) * s);
  const y1 = Math.round((y + 1) * s);
  ctx.fillStyle = color;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (const f of bevelFacets(x0, y0, x1, y1, Math.max(2, Math.round(s * BEVEL)))) {
    ctx.fillStyle = toneColor(color, f.tone);
    ctx.beginPath();
    f.points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  }
}

/** Linhas que piscam depois de sumir. */
const FLASH_MS = 280;

/**
 * Campo em canvas, redesenhado a cada quadro de tela a partir de `game.current` (sem passar pelo React).
 * `ghost`: sombra de onde a peça cai.
 */
export function Board({ game, ghost = true, className = "" }: { game: { current: Game | null }; ghost?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0;
    let flash: { id: number; rows: number[]; at: number } | null = null;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.round(cv.clientWidth * dpr);
      cv.height = Math.round(cv.clientHeight * dpr);
    });
    ro.observe(cv);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const g = game.current;
      const W = cv.width;
      const H = cv.height;
      const s = W / COLS;
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let x = 1; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * s, 0);
        ctx.lineTo(x * s, H);
        ctx.stroke();
      }
      for (let y = 1; y < VISIBLE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * s);
        ctx.lineTo(W, y * s);
        ctx.stroke();
      }
      if (!g) return;
      for (let y = HIDDEN; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          const c = g.board[y * COLS + x];
          if (c) drawBlock(ctx, x, y - HIDDEN, s, COLORS[c]);
        }
      // acabou: o campo escurece por cima
      if (g.over) {
        ctx.fillStyle = "rgba(11,18,14,0.55)";
        ctx.fillRect(0, 0, W, H);
      }
      const p = g.piece;
      if (p && !g.over) {
        if (ghost) {
          const gy = dropY(g.board, p);
          ctx.strokeStyle = COLORS[p.kind];
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = Math.max(1.5, s * 0.08);
          ctx.lineCap = "square";
          ctx.beginPath();
          for (const [x1, y1, x2, y2] of outline(cellsOf({ ...p, y: gy }).map(([x, y]) => [x, y - HIDDEN]))) {
            ctx.moveTo(x1 * s, y1 * s);
            ctx.lineTo(x2 * s, y2 * s);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        for (const [x, y] of cellsOf(p)) if (y >= HIDDEN) drawBlock(ctx, x, y - HIDDEN, s, COLORS[p.kind]);
      }
      // linhas que sumiram piscam um instante
      if (g.clear && g.clear.id !== flash?.id) flash = { id: g.clear.id, rows: g.clear.rows, at: performance.now() };
      if (flash) {
        const t = (performance.now() - flash.at) / FLASH_MS;
        if (t < 1) {
          ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - t)})`;
          for (const y of flash.rows) ctx.fillRect(0, (y - HIDDEN) * s, W, s);
        }
      }
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [game, ghost]);

  return (
    <div className={`relative aspect-[1/2] rounded-md bg-[#0b120e] shadow-[0_0_0_4px_#5b3a1e,0_0_0_7px_#3b2512,0_10px_30px_rgba(0,0,0,0.5)] ${className}`}>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

/** Peça pequena (guardada e próximas), centrada na caixa. */
export function MiniPiece({ kind, dim, className = "" }: { kind: Kind | null; dim?: boolean; className?: string }) {
  if (!kind) return <div className={className} />;
  const cells = SHAPES[kind][0];
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX + 1;
  const h = Math.max(...ys) - minY + 1;
  const c = COLORS[kind];
  return (
    <svg viewBox={`${-(4 - w) / 2} ${-(2 - h) / 2} 4 2`} className={`${className} ${dim ? "opacity-30" : ""}`} aria-label={`Peça ${kind}`}>
      <PieceSvg cells={cells.map(([x, y]) => [x - minX, y - minY])} color={c} />
    </svg>
  );
}
