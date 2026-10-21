"use client";

import { useEffect, useRef, useState } from "react";
import { canPlaceShip, fleetError, FLEET, middleCell, randomFleet, SIZE, turnShip, type PlayerView, type Ship } from "@mesa/batalha-naval";
import { send } from "@/lib/socket";
import { playClickSound, playReadySound } from "@/lib/batalha-naval/sound";
import { Icon } from "@/components/ui/buttons";
import { cellStyle, Sea, SeaShip } from "./Sea";

interface Drag {
  index: number;
  /** Casa do navio que está sob o dedo (0 = ponta). */
  grab: number;
  x: number;
  y: number;
  moved: boolean;
  ship: Ship;
}

/** Último giro, para animar: o navio parte de --bn-from e gira em volta da casa do eixo. */
interface Turn {
  index: number;
  from: string;
  origin: string;
}

const storeKey = (code: string, game: number) => `bn.fleet.${code}.${game}`;

function loadFleet(code: string, game: number): Ship[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storeKey(code, game)) ?? "null");
    if (!fleetError(saved)) return saved;
  } catch {}
  return randomFleet();
}

/** Deixa o navio inteiro dentro do mar. */
function clamp(ship: Ship, index: number): Ship {
  const len = FLEET[index].size;
  const maxCol = ship.dir === "h" ? SIZE - len : SIZE - 1;
  const maxRow = ship.dir === "v" ? SIZE - len : SIZE - 1;
  return { ...ship, col: Math.max(0, Math.min(maxCol, ship.col)), row: Math.max(0, Math.min(maxRow, ship.row)) };
}

/** Casa `k` do navio no mar. */
const cellOf = (ship: Ship, k: number) => (ship.dir === "h" ? { col: ship.col + k, row: ship.row } : { col: ship.col, row: ship.row + k });

const sameSpot = (a: Ship, b: Ship) => a.col === b.col && a.row === b.row && a.dir === b.dir;

/**
 * Montagem da frota: arrastar move; tocar, clique direito ou R giram (em volta do meio do navio, ou da casa
 * segura durante o arraste); dado sorteia; PRONTO confirma.
 */
export function Placement({ view, code }: { view: PlayerView; code: string }) {
  const [ships, setShips] = useState<Ship[]>(() => view.myFleet ?? loadFleet(code, view.gameNo));
  const [drag, setDrag] = useState<Drag | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  // giros de cada navio: muda a key só do desenho, para a animação recomeçar a cada giro
  const [spins, setSpins] = useState<number[]>(() => FLEET.map(() => 0));
  const [hover, setHover] = useState<number | null>(null);
  const sea = useRef<HTMLDivElement>(null);
  const locked = !view.canPlace;

  // frota salva na aba: recarregar no meio da montagem não perde o arranjo
  useEffect(() => {
    try {
      sessionStorage.setItem(storeKey(code, view.gameNo), JSON.stringify(ships));
    } catch {}
  }, [ships, code, view.gameNo]);

  const shown = view.myFleet ?? ships;

  const cellAt = (x: number, y: number) => {
    const r = sea.current!.getBoundingClientRect();
    return { col: Math.floor(((x - r.left) / r.width) * SIZE), row: Math.floor(((y - r.top) / r.height) * SIZE) };
  };

  const nope = (index: number) => {
    setShake(index);
    setTimeout(() => setShake((v) => (v === index ? null : v)), 400);
  };

  /** Gira o navio parado em volta da casa do meio; sem espaço por perto, ele só treme. */
  const rotate = (index: number) => {
    const before = ships[index];
    const ship = turnShip(ships, index);
    if (!ship) return nope(index);
    // origem da animação: a casa do eixo dentro do navio novo
    const at = ((middleCell(index) + 0.5) / FLEET[index].size) * 100;
    setSpins((n) => n.map((v, i) => (i === index ? v + 1 : v)));
    setTurn({
      index,
      from: before.dir === "h" ? "-90deg" : "90deg",
      origin: ship.dir === "h" ? `${at}% 50%` : `50% ${at}%`,
    });
    setShips(ships.map((s, i) => (i === index ? ship : s)));
    playClickSound();
  };

  /** Gira o navio que está sendo arrastado em volta da casa segura (continua sob o dedo/cursor). */
  const rotateDragged = () => {
    if (!drag) return;
    const s = drag.ship;
    const p = cellOf(s, drag.grab);
    const turned: Ship = s.dir === "h" ? { dir: "v", col: p.col, row: p.row - drag.grab } : { dir: "h", col: p.col - drag.grab, row: p.row };
    setDrag({ ...drag, moved: true, ship: clamp(turned, drag.index) });
    playClickSound();
  };

  const down = (e: React.PointerEvent, index: number) => {
    if (locked || e.button !== 0) return;
    // pegar o navio encerra a animação do giro (senão ela tocaria de novo ao soltar)
    setTurn(null);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // o ponteiro já foi solto: segue sem captura
    }
    const ship = ships[index];
    const at = cellAt(e.clientX, e.clientY);
    const grab = Math.max(0, Math.min(FLEET[index].size - 1, ship.dir === "h" ? at.col - ship.col : at.row - ship.row));
    setDrag({ index, grab, x: e.clientX, y: e.clientY, moved: false, ship });
  };

  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    // no toque o dedo treme: precisa andar mais para virar arraste em vez de giro
    const slop = e.pointerType === "mouse" ? 5 : 12;
    const moved = drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > slop;
    if (!moved) return;
    const at = cellAt(e.clientX, e.clientY);
    const s = drag.ship;
    const ship = clamp({ ...s, col: s.dir === "h" ? at.col - drag.grab : at.col, row: s.dir === "v" ? at.row - drag.grab : at.row }, drag.index);
    if (moved !== drag.moved || ship.col !== s.col || ship.row !== s.row) setDrag({ ...drag, moved, ship });
  };

  const up = () => {
    if (!drag) return;
    const { index } = drag;
    setDrag(null);
    if (!drag.moved) return rotate(index);
    if (sameSpot(drag.ship, ships[index])) return;
    if (!canPlaceShip(ships, index, drag.ship)) return nope(index);
    setTurn(null);
    setShips(ships.map((s, i) => (i === index ? drag.ship : s)));
    playClickSound();
  };

  // teclado: R gira o navio arrastado ou o que está sob o cursor
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      if (drag?.moved) rotateDragged();
      else if (hover !== null && !drag) rotate(hover);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const shuffle = () => {
    setTurn(null);
    setShips(randomFleet());
    playClickSound();
  };

  const ready = () => {
    if (fleetError(ships)) return;
    send({ t: "action", action: { type: "place", ships } });
    playReadySound();
  };

  // eixo do giro do navio sob o cursor (só com mouse, fora do arraste)
  const axis = !locked && hover !== null && !drag ? cellOf(ships[hover], middleCell(hover)) : null;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-3 pb-3 pt-12">
      <Sea ref={sea} className="bn-solo touch-none" onContextMenu={(e) => e.preventDefault()}>
        {shown.map((ship, i) => {
          const dragging = drag?.index === i && drag.moved;
          const bad = dragging && !canPlaceShip(ships, i, drag.ship);
          const turning = turn?.index === i && !dragging;
          return (
            // a key deste elemento não pode mudar durante o arraste: ele guarda a captura do ponteiro
            <div
              key={FLEET[i].id}
              onPointerDown={(e) => down(e, i)}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={() => setDrag(null)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!locked && !drag) rotate(i);
              }}
              className={locked ? "" : "cursor-grab active:cursor-grabbing"}
            >
              <SeaShip
                key={spins[i]}
                ship={dragging ? drag.ship : ship}
                index={i}
                tone={bad ? "bad" : "steel"}
                className={`${dragging ? "z-10 drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)]" : turning ? "bn-turn" : "transition-[left,top] duration-100"} ${
                  shake === i ? "shake" : ""
                } ${locked ? "" : "hover:brightness-110"}`}
                style={turning ? ({ "--bn-from": turn.from, transformOrigin: turn.origin } as React.CSSProperties) : undefined}
              />
            </div>
          );
        })}
        {axis && (
          <span
            className="pointer-events-none absolute z-20 flex items-center justify-center [@media(hover:none)]:hidden"
            style={cellStyle(axis.col, axis.row)}
          >
            <span className="flex h-[72%] w-[72%] items-center justify-center rounded-full bg-stone-950/75 text-gold ring-1 ring-gold/60">
              <RotateIcon className="h-[70%] w-[70%]" />
            </span>
          </span>
        )}
      </Sea>

      <div className="flex h-14 items-center gap-3">
        {locked ? (
          <span className="flex h-12 items-center gap-2 rounded-xl bg-emerald-600/30 px-5 font-display text-emerald-300 ring-1 ring-emerald-400/40">
            <Icon className="h-5 w-5">
              <path d="M20 6 9 17l-5-5" />
            </Icon>
            <span className="animate-pulse">⏳</span>
          </span>
        ) : (
          <>
            <button
              onClick={shuffle}
              aria-label="Sortear posições"
              title="Sortear posições"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 transition hover:bg-white/25"
            >
              <DiceIcon />
            </button>
            <button
              onClick={ready}
              className="h-12 rounded-xl bg-gold px-8 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none"
            >
              PRONTO
            </button>
          </>
        )}
      </div>
      {!locked && (
        <div className="-mt-2 flex items-center gap-4 font-display text-[10px] tracking-wider text-white/50">
          <span className="flex items-center gap-1">
            <MoveIcon /> ARRASTE
          </span>
          <span className="flex items-center gap-1">
            <RotateIcon />
            <span className="[@media(hover:none)]:hidden">CLIQUE</span>
            <span className="hidden [@media(hover:none)]:inline">TOQUE</span>
            <kbd className="ml-1 rounded border border-white/30 px-1 font-display text-[9px] leading-[1.4] [@media(hover:none)]:hidden">R</kbd>
          </span>
        </div>
      )}
    </div>
  );
}

export function DiceIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" strokeWidth={3} />
    </Icon>
  );
}

export function MoveIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 3v18M3 12h18" />
      <path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" />
    </Icon>
  );
}

export function RotateIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v4.5h-4.5" />
    </Icon>
  );
}
