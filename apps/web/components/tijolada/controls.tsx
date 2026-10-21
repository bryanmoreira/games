"use client";

import { useEffect } from "react";
import type { Key } from "@mesa/tijolada";
import { Icon } from "@/components/ui/buttons";

/** Passos segurando para o lado antes de repetir, e o intervalo da repetição. */
const DAS = 10;
const ARR = 2;
/** Segurando para baixo: uma linha a cada tantos passos. */
const SOFT = 2;

type Side = "left" | "right";

/**
 * Teclas e botões viram comandos. Girar, cair e guardar valem uma vez por toque; lado e baixo
 * repetem enquanto seguram, contados nos passos do jogo (`tick`), para a repetição sair igual em
 * qualquer tela.
 */
export class Controls {
  private sides: Side[] = [];
  private sideTicks = 0;
  private downHeld = false;
  private downTicks = 0;

  constructor(private apply: (k: Key) => void) {}

  press(k: Key) {
    if (k === "left" || k === "right") {
      this.sides = [...this.sides.filter((s) => s !== k), k];
      this.sideTicks = 0;
    } else if (k === "down") {
      this.downHeld = true;
      this.downTicks = 0;
    }
    this.apply(k);
  }

  release(k: Key) {
    if (k === "left" || k === "right") {
      const was = this.sides.at(-1);
      this.sides = this.sides.filter((s) => s !== k);
      if (was === k) this.sideTicks = 0;
    } else if (k === "down") this.downHeld = false;
  }

  /** Antes de cada passo do jogo: repete o que está seguro. */
  tick() {
    const side = this.sides.at(-1);
    if (side && ++this.sideTicks >= DAS && (this.sideTicks - DAS) % ARR === 0) this.apply(side);
    if (this.downHeld && ++this.downTicks % SOFT === 0) this.apply("down");
  }

  clear() {
    this.sides = [];
    this.downHeld = false;
  }
}

const KEYMAP: Record<string, Key> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowDown: "down",
  KeyS: "down",
  Space: "drop",
  ArrowUp: "cw",
  KeyW: "cw",
  KeyX: "cw",
  KeyZ: "ccw",
  ControlLeft: "ccw",
  KeyC: "hold",
  ShiftLeft: "hold",
  ShiftRight: "hold",
};

/** Teclado ligado aos controles enquanto `on`. `onPause` é chamado no P e no Esc. */
export function useKeyboard(controls: Controls, on: boolean, onPause?: () => void) {
  useEffect(() => {
    if (!on) return;
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if ((e.code === "KeyP" || e.code === "Escape") && onPause) {
        e.preventDefault();
        if (!e.repeat) onPause();
        return;
      }
      const k = KEYMAP[e.code];
      if (!k) return;
      e.preventDefault();
      if (!e.repeat) controls.press(k);
    };
    const up = (e: KeyboardEvent) => {
      const k = KEYMAP[e.code];
      if (k) controls.release(k);
    };
    const blur = () => controls.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      controls.clear();
    };
  }, [controls, on, onPause]);
}

export const KEY_ICON: Record<Key, React.ReactNode> = {
  left: <path d="m15 18-6-6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  down: <path d="m6 9 6 6 6-6" />,
  drop: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  cw: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7L20 8.5" />
      <path d="M20 3.5v5h-5" />
    </>
  ),
  ccw: (
    <>
      <path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" />
      <path d="M4 3.5v5h5" />
    </>
  ),
  hold: (
    <>
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </>
  ),
};

export const KEY_LABEL: Record<Key, string> = {
  left: "Esquerda",
  right: "Direita",
  down: "Descer",
  drop: "Cair",
  cw: "Girar",
  ccw: "Girar ao contrário",
  hold: "Guardar",
};

function Pad({ k, controls, big, className = "" }: { k: Key; controls: Controls; big?: boolean; className?: string }) {
  return (
    <button
      aria-label={KEY_LABEL[k]}
      title={KEY_LABEL[k]}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        controls.press(k);
      }}
      onPointerUp={() => controls.release(k)}
      onPointerCancel={() => controls.release(k)}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex touch-none select-none items-center justify-center rounded-2xl text-white shadow-[0_4px_0_rgba(0,0,0,0.45)] active:translate-y-1 active:shadow-none ${
        big ? "bg-gold text-stone-900" : "bg-white/15 active:bg-white/25"
      } ${className}`}
    >
      <Icon className={big ? "h-8 w-8" : "h-7 w-7"}>{KEY_ICON[k]}</Icon>
    </button>
  );
}

/** Botões de toque embaixo do campo: lado e baixo à esquerda, guardar, girar e cair à direita. */
export function TouchPad({ controls }: { controls: Controls }) {
  return (
    <div className="flex w-full max-w-md justify-between gap-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="grid grid-cols-3 gap-2">
        <span />
        <Pad k="hold" controls={controls} className="h-12 w-14" />
        <span />
        <Pad k="left" controls={controls} className="h-14 w-14" />
        <Pad k="down" controls={controls} className="h-14 w-14" />
        <Pad k="right" controls={controls} className="h-14 w-14" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Pad k="ccw" controls={controls} className="h-12 w-14" />
        <Pad k="cw" controls={controls} className="h-12 w-14" />
        <Pad k="drop" controls={controls} big className="col-span-2 h-14" />
      </div>
    </div>
  );
}
