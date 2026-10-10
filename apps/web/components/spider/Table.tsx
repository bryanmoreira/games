"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyAction,
  bestHint,
  canDeal,
  cardOf,
  isRun,
  newGame,
  scoreOf,
  SUIT_SETS,
  targetsFor,
  type Action,
  type GameState,
} from "@truco/spider";
import { HelpButton, IconButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { playCardSound, useAudioUnlock } from "@/lib/sound";
import { playCompleteSound, playDealSound, playWinSound } from "@/lib/spider/sound";
import { loadGame, saveGame } from "@/lib/spider/storage";
import { SPIDER_PATH } from "@/lib/spider/paths";
import { COMPACT_BELOW, SpiderCard, SuitIcon } from "./SpiderCard";
import { HowToPlay } from "./HowToPlay";
import { HintIcon, UndoIcon } from "@/components/ui/icons";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";

const RATIO = 726 / 500;
const MOVE_MS = 260;
const EASE = "cubic-bezier(.2,.8,.3,1)";

// ---------- layout ----------

interface Layout {
  cardW: number;
  cardH: number;
  gap: number;
  pad: number;
  left: number;
  /** topo da linha de baixo (monte e sequências completas) */
  bottomY: number;
  /** até onde as colunas podem descer */
  colsBottom: number;
}

function computeLayout(w: number, h: number): Layout {
  const pad = w < 640 ? 8 : 18;
  const gap = Math.max(3, Math.min(14, w * 0.012));
  const byWidth = (w - 2 * pad - 9 * gap) / 10;
  const byHeight = (h - 2 * pad - gap) / (RATIO * 4.2);
  const cardW = Math.max(20, Math.min(112, byWidth, byHeight));
  const cardH = cardW * RATIO;
  const bottomY = h - pad - cardH;
  return { cardW, cardH, gap, pad, left: (w - (10 * cardW + 9 * gap)) / 2, bottomY, colsBottom: bottomY - gap * 1.5 };
}

const colX = (L: Layout, c: number) => L.left + c * (L.cardW + L.gap);

/** Distância entre cartas da coluna; aperta quando a coluna não cabe. */
function steps(L: Layout, len: number, hidden: number): { down: number; up: number } {
  let down = Math.max(4, L.cardH * 0.1);
  let up = L.cardW < COMPACT_BELOW ? Math.max(L.cardH * 0.34, 15) : L.cardH * 0.26;
  const nUp = Math.max(0, len - 1 - hidden);
  const avail = L.colsBottom - L.pad - L.cardH;
  if (hidden * down + nUp * up > avail) {
    const downMin = 3;
    if (hidden * downMin + nUp * up <= avail) down = (avail - nUp * up) / hidden;
    else {
      down = downMin;
      up = nUp ? (avail - hidden * downMin) / nUp : up;
    }
  }
  return { down, up };
}

interface Pos {
  x: number;
  y: number;
  z: number;
  up: boolean;
  /** coluna e índice, se estiver na mesa */
  col: number;
  idx: number;
  where: "col" | "stock" | "done";
}

const stockX = (L: Layout) => colX(L, 9);
const pileStep = (L: Layout) => Math.min(L.cardW * 0.22, 14);

function positions(g: GameState, L: Layout, intro: boolean): Map<number, Pos> {
  const out = new Map<number, Pos>();
  const groups = g.stock.length / 10;
  g.stock.forEach((id, j) => {
    const grp = Math.floor(j / 10);
    out.set(id, { x: stockX(L) - (groups - 1 - grp) * pileStep(L), y: L.bottomY, z: 1 + j, up: false, col: -1, idx: j, where: "stock" });
  });
  g.done.forEach((run, r) =>
    run.forEach((id, i) =>
      out.set(id, { x: L.left + r * Math.min(L.cardW * 0.32, 20), y: L.bottomY, z: 100 + r * 13 + (13 - i), up: true, col: -1, idx: i, where: "done" }),
    ),
  );
  g.cols.forEach((col, c) => {
    const { down, up } = steps(L, col.length, g.hidden[c]);
    let y = L.pad;
    col.forEach((id, k) => {
      const p: Pos = intro
        ? { x: stockX(L), y: L.bottomY, z: 60 + k * 10 + c, up: false, col: c, idx: k, where: "col" }
        : { x: colX(L, c), y, z: 10 + k, up: k >= g.hidden[c], col: c, idx: k, where: "col" };
      out.set(id, p);
      y += k < g.hidden[c] ? down : up;
    });
  });
  return out;
}

/** Retângulo onde uma carta cairia na coluna (sobre a de cima, ou o espaço vazio). */
function dropRect(g: GameState, L: Layout, pos: Map<number, Pos>, c: number) {
  const col = g.cols[c];
  if (!col.length) return { x: colX(L, c), y: L.pad };
  const top = pos.get(col[col.length - 1])!;
  return { x: top.x, y: top.y };
}

function useSize() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [el, setEl, size] as const;
}

// ---------- animação ----------

interface Anim {
  key: number;
  /** cartas em movimento (ficam por cima enquanto voam) */
  moving: Set<number>;
  /** atraso de cada carta, em ms */
  delay: Map<number, number>;
  /** cartas que acabaram de virar para cima */
  flip: Set<number>;
  until: number;
}

/** Onde está cada carta: "s" monte, "d3" sequência 3, "c2:5u" coluna 2, índice 5, virada para cima. */
function locs(g: GameState): Map<number, string> {
  const m = new Map<number, string>();
  g.stock.forEach((id) => m.set(id, "s"));
  g.done.forEach((run, r) => run.forEach((id) => m.set(id, `d${r}`)));
  g.cols.forEach((col, c) => col.forEach((id, k) => m.set(id, `c${c}:${k}${k >= g.hidden[c] ? "u" : "d"}`)));
  return m;
}

const place = (loc: string) => loc.replace(/[ud]$/, "");
const faceUp = (loc: string) => loc.endsWith("u") || loc.startsWith("d");

let animKey = 0;

/** O que mudou entre duas posições: quem se move, com que atraso e quem vira para cima. */
function diff(prev: GameState, next: GameState, action: Action["type"]): Anim {
  const before = locs(prev);
  const moving = new Set<number>();
  const flip = new Set<number>();
  const delay = new Map<number, number>();
  for (const [id, loc] of locs(next)) {
    const old = before.get(id)!;
    if (place(old) !== place(loc)) moving.add(id);
    if (!faceUp(old) && faceUp(loc)) flip.add(id);
  }
  const dealt = action === "deal";
  // distribuição: uma carta por coluna, da esquerda para a direita
  if (dealt) next.cols.forEach((col, c) => moving.has(col[col.length - 1]) && delay.set(col[col.length - 1], c * 60));
  // sequência completa sai depois que a jogada pousa, do A ao K
  const landed = dealt ? 9 * 60 + MOVE_MS : MOVE_MS;
  const runs = next.done.slice(prev.done.length);
  runs.forEach((run) => run.forEach((id, i) => delay.set(id, landed + (12 - i) * 25)));
  // carta revelada vira depois que as de cima saem
  const revealAt = runs.length ? landed + 12 * 25 + MOVE_MS : MOVE_MS * 0.4;
  for (const id of flip) if (!moving.has(id)) delay.set(id, revealAt);
  return { key: ++animKey, moving, delay, flip, until: Math.max(0, ...delay.values()) + MOVE_MS * 1.5 + 150 };
}

// ---------- mesa ----------

const HEADER = "relative z-40 flex min-h-12 items-center justify-between gap-1.5 px-2 py-2 sm:min-h-[72px] sm:gap-2 sm:px-6";
const FELT =
  "felt relative isolate mx-auto mb-4 mt-1 w-[calc(100%-1.75rem)] max-w-[1200px] flex-1 touch-none select-none rounded-[28px] sm:mt-2 sm:rounded-[48px]";

export function Table() {
  const router = useRouter();
  const [game, setGame] = useState<GameState | null>(null);
  const [intro, setIntro] = useState(false);
  const [anim, setAnim] = useState<Anim | null>(null);
  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const [hover, setHover] = useState<number | null>(null);
  const [flash, setFlash] = useState<{ key: number; ids: number[]; targets: number[]; stock?: boolean; none?: boolean; warn?: boolean } | null>(null);
  const [dragging, setDragging] = useState<{ ids: number[]; targets: number[] } | null>(null);
  const [felt, feltRef, size] = useSize();
  const els = useRef(new Map<number, HTMLDivElement>());
  const drag = useRef<{ from: number; index: number; ids: number[]; sx: number; sy: number; base: { x: number; y: number }[]; active: boolean } | null>(null);
  useAudioUnlock();

  // carrega a partida salva; sem partida, volta para a página inicial do jogo
  useEffect(() => {
    const g = loadGame();
    if (!g) {
      router.replace(SPIDER_PATH);
      return;
    }
    setGame(g);
    if (g.moves === 0 && !g.history.length) setIntro(true);
  }, [router]);

  const L = useMemo(() => (size ? computeLayout(size.w, size.h) : null), [size]);

  // distribuição inicial: as cartas saem do monte uma a uma
  useEffect(() => {
    if (!intro || !L || !game) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const delay = new Map<number, number>();
        const flip = new Set<number>();
        game.cols.forEach((col, c) =>
          col.forEach((id, k) => {
            delay.set(id, (k * 10 + c) * 20);
            if (k >= game.hidden[c]) flip.add(id);
          }),
        );
        setAnim({ key: ++animKey, moving: new Set(delay.keys()), delay, flip, until: 54 * 20 + MOVE_MS * 1.5 + 150 });
        setIntro(false);
        playDealSound(18, 0.06);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [intro, L, game]);

  // fim da animação: tira os atrasos e o "por cima"
  useEffect(() => {
    if (!anim) return;
    const t = setTimeout(() => setAnim((a) => (a?.key === anim.key ? null : a)), anim.until);
    return () => clearTimeout(t);
  }, [anim]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash((f) => (f?.key === flash.key ? null : f)), flash.none || flash.warn ? 1400 : 1600);
    return () => clearTimeout(t);
  }, [flash]);

  const pos = useMemo(() => (game && L ? positions(game, L, intro) : null), [game, L, intro]);
  const hint = useMemo(() => (game ? bestHint(game) : null), [game]);

  if (!game || !L || !pos) {
    // mesmo layout da mesa, para medir o feltro antes de a partida carregar
    return (
      <main className="flex h-dvh flex-col overflow-hidden">
        <header className={HEADER} />
        <section ref={feltRef} className={FELT} />
      </main>
    );
  }

  const dispatch = (action: Action) => {
    const r = applyAction(game, action);
    if (!r.ok) return false;
    const next = r.state;
    setAnim(diff(game, next, action.type));
    setGame(next);
    setFlash(null);
    setHover(null);
    saveGame(next);
    const last = next.last!;
    if (last.type === "deal") playDealSound(10);
    else playCardSound();
    if (last.completed) setTimeout(playCompleteSound, last.type === "deal" ? 10 * 60 + MOVE_MS : MOVE_MS);
    if (next.won) setTimeout(playWinSound, 900);
    return true;
  };

  const deal = () => {
    if (canDeal(game)) dispatch({ type: "deal" });
    else if (game.stock.length) setFlash({ key: Date.now(), ids: [], targets: game.cols.flatMap((c, i) => (c.length ? [] : [i])), warn: true });
  };

  const showHint = () => {
    if (!hint) return setFlash({ key: Date.now(), ids: [], targets: [], none: true });
    if (hint.type === "deal") return setFlash({ key: Date.now(), ids: [], targets: [], stock: true });
    const { from, index, to } = hint.move;
    setFlash({ key: Date.now(), ids: game.cols[from].slice(index), targets: [to] });
  };

  const newSame = () => {
    const g = newGame(game.suits);
    saveGame(g);
    setAnim(null);
    setGame(g);
    setIntro(true);
  };

  // ----- arrastar -----

  const onPointerDown = (e: React.PointerEvent, id: number) => {
    const p = pos.get(id)!;
    if (p.where === "stock") return deal();
    if (p.where !== "col" || game.won || intro || !isRun(game, p.col, p.idx)) return;
    const ids = game.cols[p.col].slice(p.idx);
    drag.current = { from: p.col, index: p.idx, ids, sx: e.clientX, sy: e.clientY, base: ids.map((i) => pos.get(i)!), active: false };
    try {
      felt?.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.active) {
      if (Math.hypot(dx, dy) < 5) return;
      d.active = true;
      setDragging({ ids: d.ids, targets: targetsFor(game, d.from, d.index) });
      setHover(null);
    }
    d.ids.forEach((id, i) => {
      const el = els.current.get(id);
      if (!el) return;
      el.style.transition = "none";
      el.style.transform = `translate3d(${d.base[i].x + dx}px, ${d.base[i].y + dy}px, 0)`;
      el.style.zIndex = String(3000 + i);
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(null);
    // devolve o estilo do React; se a jogada valer, a nova posição anima a partir de onde soltou
    for (const id of d.ids) {
      const el = els.current.get(id);
      if (!el) continue;
      el.style.transition = el.dataset.tr ?? "";
      el.style.transform = el.dataset.t ?? "";
      el.style.zIndex = el.dataset.z ?? "";
    }
    const targets = targetsFor(game, d.from, d.index);
    if (!d.active) {
      // toque sem arrastar: mostra para onde o grupo pode ir (só com as dicas ligadas)
      if (tips) setFlash({ key: Date.now(), ids: d.ids, targets });
      return;
    }
    if (e.type === "pointercancel") return;
    const cx = d.base[0].x + (e.clientX - d.sx) + L.cardW / 2;
    const best = targets
      .map((c) => ({ c, dist: Math.abs(colX(L, c) + L.cardW / 2 - cx) }))
      .filter((t) => t.dist < L.cardW + L.gap)
      .sort((a, b) => a.dist - b.dist)[0];
    if (best) dispatch({ type: "move", from: d.from, index: d.index, to: best.c });
  };

  // ----- destaques -----

  const hovered = hover !== null && tips && !dragging ? pos.get(hover) : undefined;
  const hoverGroup = hovered && hovered.where === "col" && isRun(game, hovered.col, hovered.idx) ? game.cols[hovered.col].slice(hovered.idx) : null;
  const hoverTargets = hoverGroup ? targetsFor(game, hovered!.col, hovered!.idx) : [];
  const glow = new Set(dragging ? [] : (flash?.ids ?? hoverGroup ?? []));
  // destinos ao arrastar seguem o botão de dicas; o botão "Dica" mostra sempre
  const targets = dragging ? (tips ? dragging.targets : []) : flash ? flash.targets : hoverTargets;
  const warn = !!flash?.warn;

  const transition = (id: number) => {
    const delay = anim?.delay.get(id) ?? 0;
    return `transform ${MOVE_MS}ms ${EASE} ${delay}ms`;
  };

  const groups = game.stock.length / 10;
  const stuck = !hint && !game.won;

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className={HEADER}>
        <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-3 py-1.5 font-display sm:gap-4 sm:px-4 sm:py-2">
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-gold/80">PONTOS</span>
            <span className="text-2xl text-gold sm:text-3xl">{scoreOf(game)}</span>
          </div>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-white/60">JOGADAS</span>
            <span className="text-2xl sm:text-3xl">{game.moves}</span>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-white/70 md:flex" title={`${game.suits} naipe${game.suits > 1 ? "s" : ""}`}>
          {SUIT_SETS[game.suits].map((s) => (
            <SuitIcon key={s} suit={s} className={`h-4 w-4 ${s === "hearts" || s === "diamonds" ? "text-red-400" : ""}`} />
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <IconButton label="Desfazer" onClick={() => dispatch({ type: "undo" })} disabled={!game.history.length}>
            <UndoIcon />
          </IconButton>
          <IconButton label="Dica" onClick={showHint} disabled={game.won}>
            <HintIcon />
          </IconButton>
          <HelpButton onClick={() => setHelp(true)} />
          <TipsButton on={tips} onClick={toggleTips} />
          <MuteButton />
          <ExitConfirm onExit={() => router.push(SPIDER_PATH)} ask={!game.won} />
        </div>
      </header>

      <section
        ref={feltRef}
        className={FELT}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* lugares vazios das colunas, do monte e das sequências */}
        {game.cols.map((_, c) => (
          <div
            key={`slot-${c}`}
            className={`absolute rounded-[7%/5%] border-2 border-dashed transition-colors ${warn && targets.includes(c) ? "border-red-400 bg-red-500/20" : "border-white/15"}`}
            style={{ left: colX(L, c), top: L.pad, width: L.cardW, height: L.cardH }}
          />
        ))}
        <div
          className="absolute rounded-[7%/5%] border-2 border-dashed border-white/10"
          style={{ left: L.left, top: L.bottomY, width: L.cardW, height: L.cardH }}
        />
        <button
          onClick={deal}
          aria-label="Distribuir"
          title="Distribuir"
          className={`absolute rounded-[7%/5%] border-2 border-dashed border-white/10 ${groups ? "" : "pointer-events-none"} ${flash?.stock ? "target-glow" : ""}`}
          style={{ left: stockX(L) - Math.max(0, groups - 1) * pileStep(L), top: L.bottomY, width: L.cardW + Math.max(0, groups - 1) * pileStep(L), height: L.cardH }}
        />

        {[...pos.entries()].map(([id, p]) => {
          const card = cardOf(id, game.suits);
          const moving = anim?.moving.has(id);
          const z = moving ? 1000 + (p.where === "done" ? p.z : p.idx * 10 + Math.max(0, p.col)) : p.z;
          const t = `translate3d(${p.x}px, ${p.y}px, 0)`;
          const tr = transition(id);
          const flipping = anim?.flip.has(id) && p.up;
          const canGrab = p.where === "col" && p.up && !game.won && isRun(game, p.col, p.idx);
          return (
            <div
              key={id}
              ref={(el) => {
                if (el) els.current.set(id, el);
                else els.current.delete(id);
              }}
              data-t={t}
              data-z={z}
              data-tr={tr}
              className={`absolute left-0 top-0 ${glow.has(id) ? "hint-glow" : ""}`}
              style={{
                width: L.cardW,
                transform: t,
                zIndex: z,
                transition: tr,
                cursor: canGrab ? "grab" : p.where === "stock" ? "pointer" : "default",
              }}
              onPointerDown={(e) => onPointerDown(e, id)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(id)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setHover((h) => (h === id ? null : h))}
            >
              {flipping ? (
                <div key="flip" className="flip-in" style={{ animationDelay: `${(anim?.delay.get(id) ?? 0) + MOVE_MS * 0.5}ms` }}>
                  <div>
                    <SpiderCard card={card} up width={L.cardW} />
                  </div>
                  <div className="flip-back">
                    <SpiderCard card={card} up={false} width={L.cardW} />
                  </div>
                </div>
              ) : (
                <div key="still">
                  <SpiderCard card={card} up={p.up} width={L.cardW} />
                </div>
              )}
            </div>
          );
        })}

        {/* destinos possíveis */}
        {!warn &&
          targets.map((c) => {
            const r = dropRect(game, L, pos, c);
            return (
              <div
                key={`target-${c}`}
                className="target-glow pointer-events-none absolute rounded-[7%/5%]"
                style={{ left: r.x, top: r.y, width: L.cardW, height: L.cardH, zIndex: 2000 }}
              />
            );
          })}

        {flash?.none && (
          <div className="banner pointer-events-none absolute left-1/2 top-1/2 z-[2500] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-stone-950/85 px-5 py-3 font-display text-lg text-white/80 ring-1 ring-white/10">
            SEM JOGADAS
          </div>
        )}
      </section>

      {stuck && !flash && <StuckBar onUndo={() => dispatch({ type: "undo" })} canUndo={!!game.history.length} onNew={newSame} />}
      {game.won && !anim && <Victory game={game} onAgain={newSame} onLeave={() => router.push(SPIDER_PATH)} />}
      {help && (
        <HowToPlayModal game="PACIÊNCIA SPIDER" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function StuckBar({ onUndo, canUndo, onNew }: { onUndo: () => void; canUndo: boolean; onNew: () => void }) {
  return (
    <div className="banner fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-stone-950/90 py-2 pl-4 pr-2 font-display shadow-2xl ring-1 ring-white/10">
      <span className="text-sm text-white/70">SEM JOGADAS</span>
      <IconButton label="Desfazer" onClick={onUndo} disabled={!canUndo}>
        <UndoIcon />
      </IconButton>
      <button onClick={onNew} className="rounded-xl bg-gold px-4 py-2 text-sm text-stone-900 shadow-[0_3px_0_#9a6b12] active:translate-y-0.5 active:shadow-none">
        NOVO
      </button>
    </div>
  );
}

function Victory({ game, onAgain, onLeave }: { game: GameState; onAgain: () => void; onLeave: () => void }) {
  return (
    <GameEnd
      won
      badge={
        <span className="flex gap-1 text-white/60">
          {SUIT_SETS[game.suits].map((s) => (
            <SuitIcon key={s} suit={s} className={`h-4 w-4 ${s === "hearts" || s === "diamonds" ? "text-red-400" : ""}`} />
          ))}
        </span>
      }
      onLeave={onLeave}
      onAgain={onAgain}
    >
      <div className="flex gap-6">
        <EndStat label="PONTOS" value={scoreOf(game)} gold />
        <EndStat label="JOGADAS" value={game.moves} />
      </div>
    </GameEnd>
  );
}
