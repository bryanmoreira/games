"use client";

import { useEffect, useRef, useState } from "react";
import { NEXT_SHOWN, type Game } from "@mesa/tijolada";
import { MiniPiece } from "./Board";

/** Caixinha com rótulo pequeno (guardada, próximas). */
function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-black/35 px-1.5 py-2 ring-1 ring-white/10">
      <span className="font-display text-[9px] tracking-wider text-white/50 sm:text-[11px]">{label}</span>
      {children}
    </div>
  );
}

export function HoldBox({ game }: { game: Game | null }) {
  return (
    <Box label="GUARDA">
      <MiniPiece kind={game?.hold ?? null} dim={game?.held} className="aspect-[2/1] w-full" />
    </Box>
  );
}

/** `row`: as próximas lado a lado (faixa de cima no celular). */
export function NextBox({ game, row }: { game: Game | null; row?: boolean }) {
  return (
    <Box label="PRÓXIMAS">
      <div className={row ? "flex gap-1.5" : "flex w-full flex-col items-center gap-1"}>
        {Array.from({ length: NEXT_SHOWN }, (_, i) => (
          <MiniPiece key={i} kind={game?.queue[i] ?? null} className={`aspect-[2/1] ${row ? "w-9" : "w-full"} ${i ? "opacity-70" : ""}`} />
        ))}
      </div>
    </Box>
  );
}

/** Número do jogo com rótulo pequeno em cima. */
export function Stat({ label, value, gold }: { label: string; value: React.ReactNode; gold?: boolean }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <span className="font-display text-[9px] tracking-wider text-white/50 sm:text-[11px]">{label}</span>
      <span className={`mt-1 font-display text-base tabular-nums sm:text-2xl ${gold ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

export const fmt = (n: number) => n.toLocaleString("pt-BR");

/** Pontos, linhas e nível. */
export function Stats({ game }: { game: Game | null }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-black/35 py-2.5 ring-1 ring-white/10">
      <Stat label="PONTOS" value={fmt(game?.score ?? 0)} gold />
      <Stat label="LINHAS" value={game?.lines ?? 0} />
      <Stat label="NÍVEL" value={game?.level ?? 1} />
    </div>
  );
}

/** Celular: guardada, placar e próximas numa faixa acima do campo (o campo fica com a largura toda). */
export function TopStrip({ game }: { game: Game | null }) {
  return (
    <div className="flex w-full items-stretch gap-2 px-2 pb-2 sm:hidden">
      <div className="w-14 shrink-0">
        <HoldBox game={game} />
      </div>
      <div className="flex flex-1 items-center justify-around rounded-xl bg-black/35 ring-1 ring-white/10">
        <Stat label="PONTOS" value={fmt(game?.score ?? 0)} gold />
        <Stat label="LINHAS" value={game?.lines ?? 0} />
        <Stat label="NÍVEL" value={game?.level ?? 1} />
      </div>
      <NextBox game={game} row />
    </div>
  );
}

/**
 * Ocupa o espaço que sobrar e entrega o maior tamanho de campo (1 de largura × 2 de altura) que cabe nele.
 * `top`: encosta em cima em vez de centralizar.
 */
export function Fit({ top, children }: { top?: boolean; children: (size: { w: number; h: number }) => React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(() => {
      const w = Math.floor(Math.min(el.clientWidth, el.clientHeight / 2));
      setSize({ w, h: w * 2 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={`flex min-h-0 min-w-0 flex-1 justify-center ${top ? "w-full items-start" : "items-center"}`}>
      {size && size.w > 0 && children(size)}
    </div>
  );
}
