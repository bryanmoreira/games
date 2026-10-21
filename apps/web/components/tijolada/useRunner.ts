"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { input, step, type Game, type Key } from "@mesa/tijolada";
import { playClearSound, playHoldSound, playLevelSound, playLockSound, playMoveSound } from "@/lib/tijolada/sound";
import { Controls } from "./controls";

/** Passos que um quadro de tela pode alcançar de uma vez (volta de aba escondida no 1×1). */
const MAX_CATCH_UP = 600;

interface Options {
  /** A partida que roda no navegador (o canvas desenha daqui). */
  game: { current: Game | null };
  /** Até que passo a partida deve estar agora. */
  target: () => number;
  /** false: parada (pausa, contagem). */
  running: boolean;
  /** Comando que mudou a partida, com o passo em que valeu (o 1×1 manda ao servidor). */
  onInput?: (key: Key, tick: number) => void;
  /** Texto que muda quando a tela precisa redesenhar algo além da partida (ex.: contagem). */
  extra?: () => string;
}

/**
 * Roda a partida no ritmo do relógio, a cada quadro de tela: repete as teclas seguras, anda os passos,
 * toca os sons dos eventos e redesenha o React só quando placar, fila ou guardada mudam.
 */
export function useRunner({ game, target, running, onInput, extra }: Options) {
  const [, setVersion] = useState(0);
  const opts = useRef({ target, running, onInput, extra });
  opts.current = { target, running, onInput, extra };
  const hard = useRef(false);

  const controls = useMemo(
    () =>
      new Controls((k) => {
        const g = game.current;
        if (!g || g.over || !opts.current.running) return;
        const t = g.tick;
        if (!input(g, k)) return;
        opts.current.onInput?.(k, t);
        if (k === "left" || k === "right") playMoveSound();
        else if (k === "cw" || k === "ccw") playMoveSound(true);
        else if (k === "hold") playHoldSound();
        else if (k === "drop") hard.current = true;
      }),
    [game],
  );

  useEffect(() => {
    let raf = 0;
    let seen: { g: Game | null; locks: number; clear: number; level: number } = { g: null, locks: 0, clear: 0, level: 1 };
    let sig = "";
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const g = game.current;
      if (g && opts.current.running && !g.over) {
        const until = Math.min(opts.current.target(), g.tick + MAX_CATCH_UP);
        while (g.tick < until && !g.over) {
          controls.tick();
          step(g);
        }
      }
      if (g && seen.g === g) {
        if (g.locks > seen.locks) playLockSound(hard.current);
        if ((g.clear?.id ?? 0) > seen.clear) playClearSound(g.clear!.rows.length, g.clear!.b2b);
        if (g.level > seen.level) playLevelSound();
      }
      if (g && (seen.g !== g || g.locks !== seen.locks)) hard.current = false;
      seen = { g, locks: g?.locks ?? 0, clear: g?.clear?.id ?? 0, level: g?.level ?? 1 };
      const next = g ? `${g.score}|${g.lines}|${g.level}|${g.hold}|${g.held}|${g.locks}|${g.over}|${opts.current.extra?.() ?? ""}` : "";
      if (next !== sig) {
        sig = next;
        setVersion((v) => v + 1);
      }
    };
    frame();
    return () => cancelAnimationFrame(raf);
  }, [game, controls]);

  return controls;
}
