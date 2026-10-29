"use client";

import { kindName, type Kind, type Layout } from "@mesa/mahjong";
import { FACE, sideShadow, TILE_RATIO, tileSrc } from "./common";

/** Espessura da peça e deslocamento por andar, em frações da largura. */
const EDGE = 0.1;
const LIFT = 0.1;
const MAX_TILE = 72;

/** Largura da peça (px) para o formato caber em `w` × `h`. */
export function tileWidth(l: Layout, w: number, h: number) {
  const extra = EDGE + (l.depth - 1) * LIFT;
  return Math.min(MAX_TILE, w / (l.width / 2 + extra), h / ((l.height / 2) * TILE_RATIO + extra));
}

export function boardSize(l: Layout, tw: number) {
  const extra = (EDGE + (l.depth - 1) * LIFT) * tw;
  return { w: (l.width / 2) * tw + extra, h: (l.height / 2) * tw * TILE_RATIO + extra };
}

export interface BoardProps {
  layout: Layout;
  kinds: readonly Kind[];
  gone: readonly boolean[];
  free: ReadonlySet<number>;
  tw: number;
  selected: number | null;
  hint: readonly number[];
  /** peças saindo (animação), ainda desenhadas */
  leaving: ReadonlySet<number>;
  /** peças que acabaram de voltar (desfazer) */
  back: ReadonlySet<number>;
  /** peça presa tocada: treme (o id muda a cada toque) */
  shake: { slot: number; id: number } | null;
  /** muda a cada embaralhada, para as peças balançarem */
  shuffleKey: number;
  /** escurece as peças presas */
  showFree: boolean;
  disabled: boolean;
  onTile: (i: number) => void;
}

export function Board({ layout: l, kinds, gone, free, tw, selected, hint, leaving, back, shake, shuffleKey, showFree, disabled, onTile }: BoardProps) {
  const th = tw * TILE_RATIO;
  const e = Math.max(2, tw * EDGE);
  const dz = tw * LIFT;
  const top = (l.depth - 1) * dz;
  const { w, h } = boardSize(l, tw);
  return (
    <div className="relative isolate" style={{ width: w, height: h }} role="grid" aria-label="Mesa de peças">
      {l.slots.map((s, i) => {
        const out = leaving.has(i);
        if (gone[i] && !out) return null;
        const isFree = free.has(i);
        const sel = selected === i;
        const hinted = hint.includes(i);
        const anim = out ? "mj-out" : back.has(i) ? "mj-back" : shake?.slot === i ? "mj-shake" : shuffleKey ? "mj-shuffle" : "";
        return (
          <button
            key={`${i}-${anim === "mj-shake" ? shake!.id : anim === "mj-shuffle" ? shuffleKey : 0}`}
            type="button"
            role="gridcell"
            aria-label={kindName(kinds[i])}
            aria-selected={sel}
            disabled={disabled || out}
            onClick={() => onTile(i)}
            className={`mj-tile absolute p-0 ${anim} ${isFree && !disabled ? "mj-free" : ""}`}
            style={{
              left: (s.x / 2) * tw + top - s.z * dz,
              top: (s.y / 2) * th + top - s.z * dz,
              width: tw,
              height: th,
              zIndex: i + 1,
              borderRadius: tw * 0.13,
              background: sel ? "#fde9a8" : FACE,
              boxShadow: sideShadow(e, sel ? `0 0 0 ${Math.max(2, tw * 0.06)}px #f2c14e` : hinted ? `0 0 ${tw * 0.25}px ${tw * 0.06}px #f2c14e` : ""),
              filter: showFree && !isFree && !out ? "brightness(0.72) saturate(0.8)" : undefined,
              animationDelay: anim === "mj-shuffle" ? `${(i % 12) * 18}ms` : undefined,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={tileSrc(kinds[i])} alt="" draggable={false} className="pointer-events-none absolute inset-[5%] h-[90%] w-[90%] select-none" />
            {hinted && <span className="target-glow pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-inset ring-gold" />}
          </button>
        );
      })}
    </div>
  );
}
