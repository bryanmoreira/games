"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyAction,
  cellsOf,
  colOf,
  gameFrom,
  hintable,
  lineCells,
  newGame,
  rowOf,
  snap,
  themeName,
  type Action,
  type GameState,
} from "@mesa/caca-palavras";
import { HelpButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HintIcon } from "@/components/ui/icons";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { DailyBadge } from "@/components/daily/common";
import { playWinSound, useAudioUnlock } from "@/lib/sound";
import { playFoundSound, playHintSound, playMissSound, playTickSound } from "@/lib/caca-palavras/sound";
import { isGame, loadGame, loadTheme, saveBest, saveGame } from "@/lib/caca-palavras/storage";
import { loadDaily, saveDaily } from "@/lib/daily/storage";
import type { DailyChallenge } from "@/lib/daily/challenge";
import { useSoloStart } from "@/lib/analytics";
import { reportSoloWin } from "@/lib/stats/report";
import { useClock } from "@/lib/useClock";
import { ShareResult } from "@/components/daily/ShareResult";
import { dayNumber } from "@/lib/daily/challenge";
import { CACA_DAILY_PATH, CACA_PATH } from "@/lib/caca-palavras/paths";
import { Capsule, colorOf, formatTime, LevelBars, LEVEL_LABEL } from "./common";
import { HowToPlay } from "./HowToPlay";

const HEADER = "relative z-40 flex min-h-12 items-center justify-between gap-1.5 px-2 py-2 sm:min-h-[72px] sm:gap-2 sm:px-6";
const INTRO_STEP = 18;
const WAVE_STEP = 35;

function useSize() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size] as const;
}

interface Line {
  from: number;
  to: number;
}

export type CacaChallenge = Extract<DailyChallenge, { game: "caca-palavras" }>;

/** `daily`: o desafio do dia (sempre a mesma grade, salva à parte por dia). */
export function Table({ daily }: { daily?: CacaChallenge }) {
  const router = useRouter();
  const home = daily ? CACA_DAILY_PATH : CACA_PATH;
  const save = (g: GameState) => (daily ? saveDaily("caca-palavras", daily.day, g) : saveGame(g));
  const [game, setGame] = useState<GameState | null>(null);
  useSoloStart("caca-palavras", game && `${daily?.day ?? "livre"}:${game.level}:${game.theme}:${game.seed}`, game, { diario: !!daily, nivel: game?.level });
  const [help, setHelp] = useState(false);
  const [visible, setVisible] = useState(true);
  const [intro, setIntro] = useState(false);
  // seleção que está sendo feita (arrastando, ou o mouse depois de tocar na primeira letra)
  const [sel, setSel] = useState<Line | null>(null);
  // primeira letra tocada, esperando a última
  const [anchor, setAnchor] = useState<number | null>(null);
  const [miss, setMiss] = useState<(Line & { key: number }) | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const [wave, setWave] = useState<number | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [record, setRecord] = useState(false);
  const [busy, setBusy] = useState(false);
  const [setWrap, size] = useSize();
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<(Line & { id: number }) | null>(null);
  useAudioUnlock();

  const running = !!game && !game.won && !help && visible && !intro;
  const clock = useClock(running);

  // carrega a partida salva; sem partida, volta para a página inicial do jogo
  useEffect(() => {
    let g = daily ? loadDaily("caca-palavras", daily.day, isGame) : loadGame();
    // primeira vez neste dia: começa a grade do desafio
    if (daily && (!g || g.seed !== daily.data.seed)) save((g = gameFrom(daily.data)));
    if (!g) {
      router.replace(CACA_PATH);
      return;
    }
    setGame(g);
    clock.reset(g.elapsed);
    setShowEnd(g.won);
    if (!g.found.length && !g.hints && !g.elapsed) setIntro(true);
  }, [router, clock, daily]);

  // as letras aparecem em onda no começo
  useEffect(() => {
    if (!intro || !game) return;
    const t = setTimeout(() => setIntro(false), game.size * 2 * INTRO_STEP + 350);
    return () => clearTimeout(t);
  }, [intro, game?.seed]);

  // salva o tempo ao esconder a aba ou sair
  const latest = useRef<GameState | null>(null);
  latest.current = game;
  useEffect(() => {
    const saveNow = () => latest.current && save({ ...latest.current, elapsed: clock.now() });
    const onVis = () => {
      if (document.hidden) saveNow();
      setVisible(!document.hidden);
    };
    setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", saveNow);
    return () => {
      saveNow();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", saveNow);
    };
  }, [clock, daily]);

  useEffect(() => {
    if (!miss) return;
    const t = setTimeout(() => setMiss((m) => (m?.key === miss.key ? null : m)), 650);
    return () => clearTimeout(t);
  }, [miss]);

  // lê o estado mais novo: duas seleções seguidas antes de renderizar não podem usar o mesmo estado
  const dispatch = (action: Action) => {
    const cur = latest.current;
    if (!cur) return false;
    const r = applyAction(cur, action);
    if (!r.ok) return false;
    const next = { ...r.state, elapsed: clock.now() };
    latest.current = next;
    setGame(next);
    save(next);
    const last = next.last!;
    if (last.type === "miss") {
      playMissSound();
      setMiss({ key: last.id, from: last.from, to: last.to });
    } else if (last.type === "hint") playHintSound();
    else {
      playFoundSound(next.words[last.word].word.length);
      setFresh(last.word);
      if (next.won) {
        setRecord(saveBest(next.level, next.elapsed));
        reportSoloWin(
          "caca-palavras",
          { level: next.level, theme: next.theme, timeMs: Math.round(next.elapsed), hints: next.hints, words: next.words.length },
          daily && { day: daily.day, seed: daily.data.seed },
          { nivel: next.level },
        );
        const [end] = cellsOf(next, next.words[last.word]).slice(-1);
        setWave(end);
        setTimeout(playWinSound, 350);
        setTimeout(() => setShowEnd(true), next.size * WAVE_STEP + 900);
      }
    }
    return true;
  };

  const startNew = () => {
    if (!game || busy) return;
    setBusy(true);
    // o desafio recomeça a mesma grade; a partida livre sorteia outra do mesmo nível e tema escolhido
    setTimeout(() => {
      const g = daily ? gameFrom(daily.data) : newGame(game.level, loadTheme());
      latest.current = g;
      save(g);
      setGame(g);
      clock.reset(0);
      setSel(null);
      setAnchor(null);
      setMiss(null);
      setFresh(null);
      setWave(null);
      setShowEnd(false);
      setRecord(false);
      setBusy(false);
      setIntro(true);
    }, 30);
  };

  // teclado: Esc solta a primeira letra, H pede dica
  useEffect(() => {
    if (!game || help) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "Escape") {
        setAnchor(null);
        setSel(null);
      } else if (e.key === "h" || e.key === "H") dispatch({ type: "hint" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!game) {
    return (
      <main className="flex h-dvh flex-col overflow-hidden">
        <header className={HEADER} />
      </main>
    );
  }

  const n = game.size;
  const disabled = game.won || intro;
  const boardPx = size ? Math.floor(Math.max(200, Math.min(size.w, size.h, 640))) : 0;
  const pad = Math.round(boardPx * 0.022);
  const cellPx = (boardPx - pad * 2) / n;

  /** Posição do ponteiro em casas (0 a n), a partir do canto da grade. */
  const pos = (e: React.PointerEvent) => {
    const r = boardRef.current!.getBoundingClientRect();
    return { r: ((e.clientY - r.top) / r.height) * n, c: ((e.clientX - r.left) / r.width) * n };
  };
  const cellAt = ({ r, c }: { r: number; c: number }) => (r < 0 || c < 0 || r >= n || c >= n ? -1 : Math.floor(r) * n + Math.floor(c));

  const onDown = (e: React.PointerEvent) => {
    if (disabled || drag.current) return;
    const i = cellAt(pos(e));
    if (i < 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { from: i, to: i, id: e.pointerId };
    setSel({ from: i, to: i });
    playTickSound(0);
  };

  const onMove = (e: React.PointerEvent) => {
    if (disabled) return;
    const p = pos(e);
    const d = drag.current;
    if (d) {
      if (d.id !== e.pointerId) return;
      const to = snap(n, d.from, p.r, p.c);
      if (to === d.to) return;
      d.to = to;
      setSel({ from: d.from, to });
      playTickSound(lineCells(n, d.from, to)!.length - 1);
    } else if (anchor !== null && e.pointerType === "mouse") {
      // com a primeira letra tocada, o mouse mostra até onde vai
      const to = snap(n, anchor, p.r, p.c);
      setSel((s) => (s?.from === anchor && s.to === to ? s : { from: anchor, to }));
    }
  };

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setSel(null);
    if (d.to !== d.from) {
      setAnchor(null);
      dispatch({ type: "select", from: d.from, to: d.to });
      return;
    }
    // toque: a primeira letra fica marcada e o próximo toque fecha a palavra
    if (anchor === null) setAnchor(d.from);
    else if (anchor === d.from) setAnchor(null);
    else if (lineCells(n, anchor, d.from)) {
      setAnchor(null);
      dispatch({ type: "select", from: anchor, to: d.from });
    } else setAnchor(d.from);
  };

  const onCancel = () => {
    drag.current = null;
    setSel(null);
  };

  const selCells = new Set(sel ? lineCells(n, sel.from, sel.to) : []);
  const hintCells = new Set(game.hinted.filter((w) => !game.found.includes(w)).map((w) => game.words[w].start));
  const canHint = !disabled && hintable(game).length > 0;

  return (
    <main className="flex h-dvh touch-manipulation select-none flex-col overflow-hidden">
      <header className={HEADER}>
        <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-3 py-1.5 font-display sm:gap-4 sm:px-4 sm:py-2">
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-gold/80">TEMPO</span>
            <span className="text-xl tabular-nums text-gold sm:text-2xl">{formatTime(clock.now())}</span>
          </div>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-white/60">PALAVRAS</span>
            <span key={`f-${game.found.length}`} className={`text-xl tabular-nums sm:text-2xl ${game.found.length ? "banner" : ""}`}>
              {game.found.length}
              <span className="text-sm text-white/50">/{game.words.length}</span>
            </span>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 font-display text-xs text-white/80">
          {daily ? (
            <DailyBadge day={daily.day} className="text-white/70" />
          ) : (
            <span title={LEVEL_LABEL[game.level]}>
              <LevelBars level={game.level} className="h-3.5 w-3.5 text-gold" />
            </span>
          )}
          {/* no celular o tema fica em cima da lista */}
          <span className="hidden truncate uppercase sm:inline">{themeName(game.theme)}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={() => router.push(home)} ask={!game.won} />
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col items-center gap-3 px-3 pb-4 sm:gap-4 lg:flex-row lg:justify-center lg:gap-10 lg:px-8">
        <div ref={setWrap} className="relative flex min-h-0 w-full flex-1 items-center justify-center lg:h-full lg:max-w-[640px]">
          {boardPx > 0 && (
            <div
              className="felt-blue rounded-2xl bg-[#5b3a1e] shadow-[0_0_0_2px_#3b2412,0_20px_50px_rgba(0,0,0,0.6)]"
              style={{ width: boardPx, height: boardPx, padding: pad }}
            >
              <div
                ref={boardRef}
                className="relative h-full w-full touch-none rounded-xl bg-felt"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onCancel}
                onPointerLeave={(e) => e.pointerType === "mouse" && !drag.current && setSel(null)}
                role="grid"
                aria-label="Grade de letras"
              >
                <svg viewBox={`0 0 ${n} ${n}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                  {game.found.map((w, order) => {
                    const cells = cellsOf(game, game.words[w]);
                    return (
                      <Capsule key={w} size={n} from={cells[0]} to={cells[cells.length - 1]} color={colorOf(order)} className={w === fresh ? "cp-draw" : ""} />
                    );
                  })}
                  {miss && <Capsule key={`miss-${miss.key}`} size={n} from={miss.from} to={miss.to} color="#ef4444" opacity={0.6} className="cp-miss" />}
                  {sel ? (
                    <Capsule size={n} from={sel.from} to={sel.to} color="#f2c14e" opacity={0.7} />
                  ) : (
                    anchor !== null && <Capsule size={n} from={anchor} to={anchor} color="#f2c14e" opacity={0.7} />
                  )}
                </svg>
                <div className="pointer-events-none relative grid h-full w-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gridTemplateRows: `repeat(${n}, 1fr)` }}>
                  {[...game.grid].map((l, i) => {
                    const r = rowOf(n, i);
                    const c = colOf(n, i);
                    const waveDelay = wave !== null ? (Math.abs(r - rowOf(n, wave)) + Math.abs(c - colOf(n, wave))) * WAVE_STEP : undefined;
                    return (
                      <span
                        key={i}
                        role="gridcell"
                        className={`flex items-center justify-center rounded-full font-display leading-none ${selCells.has(i) ? "text-stone-900" : "text-white/90"} ${
                          hintCells.has(i) ? "target-glow ring-2 ring-inset ring-gold" : ""
                        } ${waveDelay !== undefined ? "cell-wave" : ""}`}
                        style={{ fontSize: cellPx * 0.56, animationDelay: waveDelay !== undefined ? `${waveDelay}ms` : undefined }}
                      >
                        <span className={intro ? "cell-in" : ""} style={intro ? { animationDelay: `${(r + c) * INTRO_STEP}ms` } : undefined}>
                          {l}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex w-full max-w-[640px] shrink-0 items-start gap-2 lg:w-[240px] lg:flex-col lg:items-stretch lg:gap-4">
          <div className="flex flex-1 flex-col items-center gap-1.5 lg:flex-none lg:items-stretch">
            <span className="font-display text-[10px] uppercase tracking-[0.3em] text-white/50 sm:hidden">{themeName(game.theme)}</span>
            <ul className="flex flex-wrap justify-center gap-1 sm:gap-1.5 lg:flex-col lg:flex-nowrap" aria-label="Palavras">
              {game.words.map((w, i) => {
                const order = game.found.indexOf(i);
                const done = order >= 0;
                const hinted = !done && game.hinted.includes(i);
                return (
                  <li
                    key={w.word}
                    className={`rounded-full px-2 py-0.5 font-display text-[11px] tracking-wide sm:px-2.5 sm:py-1 sm:text-xs lg:rounded-lg lg:px-3 lg:py-1.5 lg:text-sm ${
                      done ? "text-white/55 line-through decoration-2" : hinted ? "bg-gold/10 text-gold ring-1 ring-gold/70" : "bg-white/10 text-white"
                    } ${i === fresh ? "cp-pop" : ""}`}
                    style={done ? { backgroundColor: `${colorOf(order)}40` } : undefined}
                  >
                    {w.word}
                  </li>
                );
              })}
            </ul>
          </div>
          <button
            onClick={() => dispatch({ type: "hint" })}
            disabled={!canHint}
            aria-label="Dica"
            title="Dica"
            className="flex h-11 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/85 transition enabled:hover:bg-white/20 enabled:hover:text-white disabled:opacity-30 sm:h-12 lg:h-14 lg:w-full"
          >
            <span className="relative">
              <HintIcon className="h-6 w-6" />
              {game.hints > 0 && (
                <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-display text-[9px] text-stone-900">
                  {game.hints}
                </span>
              )}
            </span>
          </button>
        </div>
      </section>

      {showEnd && game.won && (
        <GameEnd
          won
          badge={<Badge game={game} day={daily?.day} />}
          onLeave={() => router.push(home)}
          onAgain={startNew}
          busy={busy}
          actions={
            daily && (
              <ShareResult
                game="caca-palavras"
                path={CACA_DAILY_PATH}
                text={`Caça-palavras do dia #${dayNumber(daily.day)} ✅
⏱️ ${formatTime(game.elapsed)} · 🔤 ${game.words.length} palavras · 💡 ${game.hints} ${game.hints === 1 ? "dica" : "dicas"}`}
              />
            )
          }
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-6">
              <EndStat label="TEMPO" value={formatTime(game.elapsed)} gold />
              <EndStat label="PALAVRAS" value={game.words.length} />
              <EndStat label="DICAS" value={game.hints} />
            </div>
            {record && <span className="banner rounded-full bg-gold px-3 py-1 font-display text-[10px] text-stone-900">RECORDE</span>}
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="CAÇA-PALAVRAS" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

/** Selo da tela de fim: nível e tema, ou o dia no desafio. */
function Badge({ game, day }: { game: GameState; day?: string }) {
  return (
    <span className="flex items-center gap-2 font-display text-xs text-white/60">
      {day ? (
        <DailyBadge day={day} />
      ) : (
        <span className="flex items-center gap-1.5">
          <LevelBars level={game.level} className="h-3.5 w-3.5 text-gold" />
          {LEVEL_LABEL[game.level]}
        </span>
      )}
      <span className="uppercase">· {themeName(game.theme)}</span>
    </span>
  );
}
