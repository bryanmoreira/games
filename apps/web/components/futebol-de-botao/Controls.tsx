"use client";

import { useEffect, useRef, useState } from "react";
import { send } from "@/lib/socket";
import { screenToField, type Rot } from "./Field";

const KEYS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};
const KICK_KEYS = new Set(["Space", "KeyX"]);
/** Entre dois envios do direcional (as setas mandam na hora). */
const THROTTLE_MS = 33;

/**
 * Entrada do jogador: setas/WASD + Espaço/X, e o direcional e o chute da tela. Tudo vira uma direção
 * na tela, girada para o campo, e só vai ao servidor quando muda.
 */
export function useInput(rot: React.RefObject<Rot>, enabled: boolean) {
  const st = useRef({ keys: new Set<string>(), keyKick: false, touch: { x: 0, y: 0 }, touchKick: false });
  const last = useRef({ key: "", at: 0, timer: 0 as unknown as ReturnType<typeof setTimeout> | 0 });

  const flush = (now = false) => {
    const s = st.current;
    let sx = s.touch.x;
    let sy = s.touch.y;
    for (const k of s.keys) {
      sx += KEYS[k][0];
      sy += KEYS[k][1];
    }
    const len = Math.hypot(sx, sy);
    if (len > 1) {
      sx /= len;
      sy /= len;
    }
    const f = screenToField(rot.current, sx, sy);
    const dx = Math.round(f.x * 20) / 20;
    const dy = Math.round(f.y * 20) / 20;
    const kick = s.keyKick || s.touchKick;
    const key = `${dx},${dy},${kick}`;
    const l = last.current;
    if (key === l.key) return;
    const wait = THROTTLE_MS - (performance.now() - l.at);
    if (!now && wait > 0) {
      if (!l.timer) l.timer = setTimeout(() => ((l.timer = 0), flush(true)), wait);
      return;
    }
    if (l.timer) clearTimeout(l.timer);
    l.timer = 0;
    l.key = key;
    l.at = performance.now();
    send({ t: "action", action: { type: "input", dx, dy, kick } });
  };

  const reset = () => {
    const s = st.current;
    s.keys.clear();
    s.keyKick = s.touchKick = false;
    s.touch = { x: 0, y: 0 };
    flush(true);
  };

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    const down = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (KEYS[e.code]) st.current.keys.add(e.code);
      else if (KICK_KEYS.has(e.code)) st.current.keyKick = true;
      else return;
      e.preventDefault();
      flush(true);
    };
    const up = (e: KeyboardEvent) => {
      if (KEYS[e.code]) st.current.keys.delete(e.code);
      else if (KICK_KEYS.has(e.code)) st.current.keyKick = false;
      else return;
      flush(true);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    /** Direção do direcional na tela (-1 a 1 em cada eixo). */
    setTouch(x: number, y: number) {
      st.current.touch = { x, y };
      flush();
    },
    setKick(on: boolean) {
      st.current.touchKick = on;
      flush(true);
    },
    /** A tela girou: a mesma direção na tela vira outra no campo. */
    refresh: () => flush(true),
  };
}

/** Raio do direcional, em px. */
const STICK = 52;

/**
 * Controles de toque por cima do campo: a metade esquerda é o direcional (aparece onde o dedo
 * encosta) e a direita é o chute (o botão fica no canto, mas qualquer toque ali chuta).
 */
export function TouchControls({ onMove, onKick }: { onMove: (x: number, y: number) => void; onKick: (on: boolean) => void }) {
  const [stick, setStick] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const [kicking, setKicking] = useState(false);
  const pointer = useRef<number | null>(null);
  // onde o dedo encostou (o estado só chega no próximo render; o movimento pode vir antes)
  const origin = useRef({ ox: 0, oy: 0 });
  const kickPointers = useRef(new Set<number>());

  const move = (e: React.PointerEvent) => {
    const s = origin.current;
    let x = e.clientX - s.ox;
    let y = e.clientY - s.oy;
    const len = Math.hypot(x, y);
    if (len > STICK) {
      x = (x / len) * STICK;
      y = (y / len) * STICK;
    }
    setStick({ ...s, x, y });
    const mag = Math.min(1, len / STICK);
    // zona morta pequena no centro
    if (mag < 0.2) onMove(0, 0);
    else onMove(x / STICK, y / STICK);
  };

  const kick = (e: React.PointerEvent, on: boolean) => {
    const set = kickPointers.current;
    if (on) set.add(e.pointerId);
    else set.delete(e.pointerId);
    const now = set.size > 0;
    setKicking(now);
    onKick(now);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex select-none" style={{ touchAction: "none" }}>
      <div
        className="pointer-events-auto relative h-full flex-1"
        onPointerDown={(e) => {
          if (pointer.current !== null) return;
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          origin.current = { ox: e.clientX, oy: e.clientY };
          setStick({ ox: e.clientX, oy: e.clientY, x: 0, y: 0 });
          onMove(0, 0);
        }}
        onPointerMove={(e) => {
          if (e.pointerId === pointer.current) move(e);
        }}
        onPointerUp={(e) => {
          if (e.pointerId !== pointer.current) return;
          pointer.current = null;
          setStick(null);
          onMove(0, 0);
        }}
        onPointerCancel={(e) => {
          if (e.pointerId !== pointer.current) return;
          pointer.current = null;
          setStick(null);
          onMove(0, 0);
        }}
      >
        {stick ? (
          <Stick left={stick.ox} top={stick.oy} x={stick.x} y={stick.y} fixed />
        ) : (
          <div className="absolute bottom-6 left-6 opacity-50">
            <Stick left={0} top={0} x={0} y={0} />
          </div>
        )}
      </div>
      <div
        className="pointer-events-auto relative h-full flex-1"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          kick(e, true);
        }}
        onPointerUp={(e) => kick(e, false)}
        onPointerCancel={(e) => kick(e, false)}
      >
        <div
          className={`absolute bottom-6 right-6 flex h-20 w-20 items-center justify-center rounded-full border-4 transition ${
            kicking ? "scale-95 border-white bg-white/40" : "border-white/60 bg-black/25"
          }`}
          aria-label="Chutar"
        >
          <BallIcon className="h-10 w-10 text-white" />
        </div>
      </div>
    </div>
  );
}

function Stick({ left, top, x, y, fixed }: { left: number; top: number; x: number; y: number; fixed?: boolean }) {
  const size = STICK * 2;
  return (
    <div
      className={`${fixed ? "fixed" : "relative"} rounded-full border-4 border-white/50 bg-black/25`}
      style={{ width: size, height: size, left: fixed ? left - STICK : undefined, top: fixed ? top - STICK : undefined }}
    >
      <div
        className="absolute h-12 w-12 rounded-full bg-white/70 shadow-lg"
        style={{ left: STICK - 24 + x, top: STICK - 24 + y }}
      />
    </div>
  );
}

/** Bola em traço (botão de chute). */
export function BallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5l3.5 2.5-1.3 4h-4.4l-1.3-4z" />
      <path d="M12 7.5V3.2M15.5 10l4-1.6M14.2 14l2.6 3.6M9.8 14l-2.6 3.6M8.5 10l-4-1.6" />
    </svg>
  );
}
