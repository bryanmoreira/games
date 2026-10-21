"use client";

import { boardMarks, LENGTH, MAX_GUESSES, status, type GameState } from "@mesa/verbete";
import { MARK_BG } from "@/components/verbete/Tile";

// Imagem do resultado para postar: as grades coloridas, sem as letras.

const T = 44; // casa
const GAP = 6;
const BOARD_GAP = 36;
const PAD = 48;
const TOP = 136;
const BOTTOM = 64;
const BOARD = LENGTH * T + (LENGTH - 1) * GAP;

/** Família de fonte de uma classe do site (as fontes vêm do next/font, com nome gerado). */
function family(className: string, fallback: string) {
  const el = document.createElement("span");
  el.className = className;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  document.body.appendChild(el);
  const f = getComputedStyle(el).fontFamily || fallback;
  el.remove();
  return f;
}

/** PNG com o título, as grades de cada palavra e o endereço do site. */
export async function shareImage(game: GameState, title: string, streak: number): Promise<Blob | null> {
  await document.fonts?.ready;
  const display = family("font-display", "sans-serif");
  const sans = family("font-sans", "sans-serif");
  const fonts = { title: `36px ${display}`, result: `26px ${display}`, site: `600 18px ${sans}` };
  const site = "mesadejogos.com/verbete";
  const won = status(game) === "won";
  const result = [`${won ? game.guesses.length : "X"}/${MAX_GUESSES[game.mode]}`, streak > 0 ? `🔥 ${streak}` : ""].filter(Boolean).join("  ·  ");

  const grids = boardMarks(game);
  const rows = Math.max(1, ...grids.map((g) => g.length));
  const boardsW = grids.length * BOARD + (grids.length - 1) * BOARD_GAP;

  // a largura cabe o que for maior: as grades, o título ou o resultado (o Verbete simples tem uma grade só)
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const measure = (font: string, text: string) => ((ctx.font = font), ctx.measureText(text).width);
  const w = Math.ceil(Math.max(boardsW, measure(fonts.title, title), measure(fonts.result, result), measure(fonts.site, site)) + PAD * 2);
  const h = TOP + rows * T + (rows - 1) * GAP + BOTTOM;
  const scale = 2;
  canvas.width = w * scale;
  canvas.height = h * scale;
  ctx.scale(scale, scale);

  // mesa de feltro com borda de madeira
  ctx.fillStyle = "#4a2e17";
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 32);
  ctx.fill();
  const felt = ctx.createLinearGradient(0, 0, w, h);
  felt.addColorStop(0, "#15603c");
  felt.addColorStop(1, "#0c3d26");
  ctx.fillStyle = felt;
  ctx.beginPath();
  ctx.roundRect(8, 8, w - 16, h - 16, 26);
  ctx.fill();

  // título e, embaixo, o resultado (3/6 · 🔥 2), centralizados
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2c14e";
  ctx.font = fonts.title;
  ctx.fillText(title, w / 2, 52);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = fonts.result;
  ctx.fillText(result, w / 2, 96);

  // grades, centralizadas
  const left = (w - boardsW) / 2;
  grids.forEach((grid, b) => {
    const x0 = left + b * (BOARD + BOARD_GAP);
    grid.forEach((marks, r) =>
      marks.forEach((m, i) => {
        ctx.fillStyle = MARK_BG[m];
        ctx.beginPath();
        ctx.roundRect(x0 + i * (T + GAP), TOP + r * (T + GAP), T, T, 7);
        ctx.fill();
      }),
    );
    // palavra que faltou: risco vermelho embaixo da grade
    if (!grid.length || grid[grid.length - 1].some((m) => m !== "right")) {
      ctx.fillStyle = "#f87171";
      ctx.beginPath();
      ctx.roundRect(x0, TOP + grid.length * (T + GAP), BOARD, 6, 3);
      ctx.fill();
    }
  });

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = fonts.site;
  ctx.fillText(site, w / 2, h - BOTTOM / 2);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
