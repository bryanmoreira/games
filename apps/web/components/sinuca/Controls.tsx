"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ponto de batida na branca: toca ou arrasta na bola grande; o ponto vermelho é onde o taco bate.
 * Dois toques voltam para o centro.
 */
export function SpinBall({ value, onChange, disabled, size = 72 }: { value: { x: number; y: number }; onChange: (v: { x: number; y: number }) => void; disabled?: boolean; size?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const lastTap = useRef(0);

  const set = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    let x = ((e.clientX - r.left) / r.width) * 2 - 1;
    let y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    const l = Math.hypot(x, y);
    if (l > 1) {
      x /= l;
      y /= l;
    }
    onChange({ x, y });
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Efeito"
      aria-valuetext={`${Math.round(value.x * 100)} ${Math.round(value.y * 100)}`}
      className={`relative shrink-0 touch-none select-none rounded-full ${disabled ? "opacity-40" : "cursor-crosshair"}`}
      style={{ width: size, height: size, background: "radial-gradient(circle at 35% 30%, #ffffff 0%, #f1ede1 45%, #b9b4a6 100%)", boxShadow: "0 3px 8px rgba(0,0,0,0.5), inset 0 -3px 6px rgba(0,0,0,0.15)" }}
      onPointerDown={(e) => {
        if (disabled) return;
        const now = performance.now();
        if (now - lastTap.current < 300) {
          onChange({ x: 0, y: 0 });
          lastTap.current = 0;
          return;
        }
        lastTap.current = now;
        drag.current = true;
        (e.target as Element).setPointerCapture(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => drag.current && set(e)}
      onPointerUp={() => (drag.current = false)}
      onPointerCancel={() => (drag.current = false)}
    >
      <svg viewBox="-1 -1 2 2" className="pointer-events-none absolute inset-0 h-full w-full">
        <line x1="-0.75" y1="0" x2="0.75" y2="0" stroke="rgba(0,0,0,0.15)" strokeWidth="0.02" />
        <line x1="0" y1="-0.75" x2="0" y2="0.75" stroke="rgba(0,0,0,0.15)" strokeWidth="0.02" />
        <circle r="0.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.02" />
        <circle cx={value.x * 0.82} cy={-value.y * 0.82} r="0.16" fill="#d8231f" stroke="#fff" strokeWidth="0.05" />
      </svg>
    </div>
  );
}

/**
 * Força: aperta na barra e arrasta (para baixo, ou para a direita deitada); soltar bate. Voltar até o começo
 * cancela.
 */
export function PowerBar({
  vertical,
  disabled,
  onChange,
  onRelease,
}: {
  vertical: boolean;
  disabled?: boolean;
  onChange: (p: number | null) => void;
  onRelease: (p: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    if (disabled && start.current !== null) {
      start.current = null;
      setP(0);
      onChange(null);
    }
  }, [disabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e: React.PointerEvent) => (vertical ? e.clientY : e.clientX);
  const length = () => {
    const r = ref.current!.getBoundingClientRect();
    return (vertical ? r.height : r.width) * 0.9;
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Força"
      aria-valuenow={Math.round(p * 100)}
      className={`relative touch-none select-none overflow-hidden rounded-2xl bg-black/50 ring-1 ring-white/15 ${vertical ? "w-12" : "h-12"} ${disabled ? "opacity-40" : "cursor-grab active:cursor-grabbing"}`}
      style={vertical ? { flex: 1, minHeight: 120 } : { flex: 1, minWidth: 110 }}
      onPointerDown={(e) => {
        if (disabled) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        start.current = pos(e);
        setP(0);
        onChange(0);
      }}
      onPointerMove={(e) => {
        if (start.current === null) return;
        const v = Math.max(0, Math.min(1, (pos(e) - start.current) / length()));
        setP(v);
        onChange(v);
      }}
      onPointerUp={() => {
        if (start.current === null) return;
        start.current = null;
        const v = p;
        setP(0);
        onChange(null);
        if (v > 0.015) onRelease(v);
      }}
      onPointerCancel={() => {
        start.current = null;
        setP(0);
        onChange(null);
      }}
    >
      {/* escala */}
      <div
        className="absolute inset-0"
        style={{
          background: vertical
            ? "linear-gradient(to bottom, #2bb673 0%, #f2c14e 55%, #e0442f 100%)"
            : "linear-gradient(to right, #2bb673 0%, #f2c14e 55%, #e0442f 100%)",
          clipPath: vertical ? `inset(0 0 ${100 - p * 100}% 0)` : `inset(0 ${100 - p * 100}% 0 0)`,
        }}
      />
      {/* taco recuando */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={vertical ? "0 0 48 200" : "0 0 200 48"}
        preserveAspectRatio="none"
      >
        {vertical ? (
          <g transform={`translate(0 ${p * 160})`}>
            <rect x="21" y="6" width="6" height="3" fill="#3b82f6" />
            <rect x="20.5" y="9" width="7" height="6" fill="#f3f0e6" />
            <rect x="20" y="15" width="8" height="190" fill="#d9b27a" />
            <rect x="19" y="120" width="10" height="90" fill="#5b2f17" />
          </g>
        ) : (
          <g transform={`translate(${p * 160} 0)`}>
            <rect x="6" y="21" width="3" height="6" fill="#3b82f6" />
            <rect x="9" y="20.5" width="6" height="7" fill="#f3f0e6" />
            <rect x="15" y="20" width="190" height="8" fill="#d9b27a" />
            <rect x="120" y="19" width="90" height="10" fill="#5b2f17" />
          </g>
        )}
      </svg>
      {!disabled && p === 0 && (
        <svg className="pointer-events-none absolute inset-0 m-auto h-5 w-5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {vertical ? <path d="M6 9l6 6 6-6" /> : <path d="M9 6l6 6-6 6" />}
        </svg>
      )}
    </div>
  );
}

/** Ajuste fino da mira: segura para girar devagar. */
export function NudgeButton({ dir, onNudge, disabled }: { dir: 1 | -1; onNudge: (deg: number) => void; disabled?: boolean }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);
  const press = () => {
    if (disabled) return;
    let k = 0;
    const tick = () => {
      onNudge(dir * (k > 12 ? 0.5 : 0.1));
      k++;
      timer.current = setTimeout(tick, k === 1 ? 350 : 60);
    };
    tick();
  };
  return (
    <button
      aria-label={dir > 0 ? "Girar mira" : "Girar mira ao contrário"}
      title={dir > 0 ? "Girar mira" : "Girar mira ao contrário"}
      disabled={disabled}
      onPointerDown={press}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="flex h-10 w-10 shrink-0 touch-none select-none items-center justify-center rounded-full bg-white/10 text-white/80 transition enabled:hover:bg-white/20 enabled:hover:text-white disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir > 0 ? undefined : "scaleX(-1)" }}>
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v5h-5" />
      </svg>
    </button>
  );
}
