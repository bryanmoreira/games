"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyAction,
  bit,
  colOf,
  gameFrom,
  isGiven,
  isLocked,
  isWrong,
  MAX_MISTAKES,
  newGame,
  PEERS,
  remaining,
  rowOf,
  unitCells,
  type Action,
  type GameState,
  type HintReason,
} from "@mesa/sudoku";
import { HelpButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { EraseIcon, HintIcon, PencilIcon, UndoIcon } from "@/components/ui/icons";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playErrorSound, playHintSound, playNoteSound, playPlaceSound, playUnitSound } from "@/lib/sudoku/sound";
import { isGame, loadGame, saveBest, saveGame } from "@/lib/sudoku/storage";
import { loadDaily, saveDaily, trimOthers } from "@/lib/daily/storage";
import type { DailyChallenge } from "@/lib/daily/challenge";
import { DailyBadge } from "@/components/daily/common";
import { reportSoloWin } from "@/lib/stats/report";
import { useClock } from "@/lib/useClock";
import { SUDOKU_DAILY_PATH, SUDOKU_PATH } from "@/lib/sudoku/paths";
import { formatTime, LevelBars, LEVEL_LABEL, reasonLabel, TECHNIQUE_LABEL } from "./common";
import { HowToPlay } from "./HowToPlay";

const HEADER = "relative z-40 flex min-h-12 items-center justify-between gap-1.5 px-2 py-2 sm:min-h-[72px] sm:gap-2 sm:px-6";
const WAVE_STEP = 45;
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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

/** Atraso da onda de cada casa, a partir de `from`. */
function wave(cells: Iterable<number>, from: number): Map<number, number> {
  const m = new Map<number, number>();
  for (const i of cells) m.set(i, (Math.abs(rowOf(i) - rowOf(from)) + Math.abs(colOf(i) - colOf(from))) * WAVE_STEP);
  return m;
}

interface Fx {
  key: number;
  wave: Map<number, number>;
}

interface Flash {
  key: number;
  cell: number;
  value: number;
  reason: HintReason;
}

// ---------- mesa ----------

export type SudokuChallenge = Extract<DailyChallenge, { game: "sudoku" }>;

/** `daily`: o desafio do dia (sempre o mesmo puzzle, salvo à parte por dia). */
export function Table({ daily }: { daily?: SudokuChallenge }) {
  const router = useRouter();
  const home = daily ? SUDOKU_DAILY_PATH : SUDOKU_PATH;
  const fresh = (c: SudokuChallenge) => gameFrom(c.data.difficulty, c.data.seed, c.data);
  const save = (g: GameState) => (daily ? saveDaily("sudoku", daily.day, g) : saveGame(g));
  const [game, setGame] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [help, setHelp] = useState(false);
  const [visible, setVisible] = useState(true);
  const [intro, setIntro] = useState<number | null>(null);
  const [fx, setFx] = useState<Fx | null>(null);
  const [shake, setShake] = useState<{ key: number; cell: number } | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [record, setRecord] = useState(false);
  const [busy, setBusy] = useState(false);
  const [setWrap, size] = useSize();
  useAudioUnlock();

  const running = !!game && !game.won && !game.lost && !help && visible && intro === null;
  const clock = useClock(running);

  // carrega a partida salva; sem partida, volta para a página inicial do jogo
  useEffect(() => {
    let g = daily ? loadDaily("sudoku", daily.day, isGame) : loadGame();
    if (daily) {
      // primeira vez neste dia: começa o puzzle do desafio
      if (!g || g.seed !== daily.data.seed) save((g = fresh(daily)));
      trimOthers("sudoku", daily.day);
    }
    if (!g) {
      router.replace(SUDOKU_PATH);
      return;
    }
    setGame(g);
    clock.reset(g.elapsed);
    setShowEnd(g.won || g.lost);
    if (!g.last && !g.history.length && !g.elapsed) setIntro(Date.now());
  }, [router, clock, daily]);

  // as pistas aparecem em onda no começo
  useEffect(() => {
    if (intro === null) return;
    for (let i = 0; i < 6; i++) setTimeout(playNoteSound, 120 + i * 110);
    const t = setTimeout(() => setIntro(null), 17 * 28 + 400);
    return () => clearTimeout(t);
  }, [intro]);

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
    if (!fx) return;
    const t = setTimeout(() => setFx((f) => (f?.key === fx.key ? null : f)), Math.max(0, ...fx.wave.values()) + 700);
    return () => clearTimeout(t);
  }, [fx]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash((f) => (f?.key === flash.key ? null : f)), 2600);
    return () => clearTimeout(t);
  }, [flash]);

  // lê o estado mais novo: duas teclas seguidas antes de renderizar não podem usar o mesmo estado
  const dispatch = (action: Action) => {
    const cur = latest.current;
    if (!cur) return false;
    const r = applyAction(cur, action);
    if (!r.ok) return false;
    const next = { ...r.state, elapsed: clock.now() };
    latest.current = next;
    setGame(next);
    save(next);
    const last = next.last;
    if (!last || last.id === cur.last?.id) return true; // continuar depois dos 3 erros não repete a última jogada

    if (last.type === "set" && last.wrong) {
      playErrorSound();
      setShake({ key: last.id, cell: last.cell });
      if (next.lost) setTimeout(() => (playLoseSound(), setShowEnd(true)), 500);
    } else if (last.type === "set" || last.type === "hint") {
      if (last.type === "hint") {
        playHintSound();
        setSelected(last.cell);
        setFlash({ key: last.id, cell: last.cell, value: last.value, reason: last.reason! });
      } else playPlaceSound();
      if (next.won) {
        setFx({ key: last.id, wave: wave(Array.from({ length: 81 }, (_, i) => i), last.cell) });
        setRecord(saveBest(next.difficulty, next.elapsed));
        reportSoloWin(
          "sudoku",
          { difficulty: next.difficulty, timeMs: Math.round(next.elapsed), mistakes: next.mistakes, hints: next.hints },
          daily && { day: daily.day, seed: daily.data.seed },
        );
        setTimeout(playWinSound, 350);
        setTimeout(() => setShowEnd(true), 16 * WAVE_STEP + 900);
      } else if (last.completed.length) {
        setFx({ key: last.id, wave: wave(new Set(last.completed.flatMap(unitCells)), last.cell) });
        setTimeout(() => playUnitSound(last.completed.length), 90);
      }
    } else playNoteSound();
    return true;
  };

  const startNew = () => {
    if (!game || busy) return;
    setBusy(true);
    // deixa o botão mostrar que está gerando antes de travar no cálculo; o desafio recomeça o mesmo puzzle
    setTimeout(() => {
      const g = daily ? fresh(daily) : newGame(game.difficulty);
      latest.current = g;
      save(g);
      setGame(g);
      clock.reset(0);
      setSelected(null);
      setFocus(null);
      setFx(null);
      setFlash(null);
      setShowEnd(false);
      setRecord(false);
      setBusy(false);
      setIntro(Date.now());
    }, 30);
  };

  const revive = () => {
    if (dispatch({ type: "revive" })) setShowEnd(false);
  };

  const press = (d: number) => {
    if (!game) return;
    if (selected === null || isLocked(game, selected)) {
      setFocus((f) => (f === d && selected === null ? null : d));
      setSelected(null);
      return;
    }
    if (notesMode) dispatch({ type: "note", cell: selected, value: d });
    else dispatch({ type: "set", cell: selected, value: d });
  };

  const erase = () => selected !== null && dispatch({ type: "erase", cell: selected });

  // teclado
  useEffect(() => {
    if (!game || help) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey) return;
      const k = e.key;
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "z") {
        e.preventDefault();
        dispatch({ type: "undo" });
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      const d = /^Digit([1-9])$/.exec(e.code)?.[1] ?? /^Numpad([1-9])$/.exec(e.code)?.[1];
      if (d) {
        e.preventDefault();
        if (e.shiftKey && selected !== null) dispatch({ type: "note", cell: selected, value: Number(d) });
        else press(Number(d));
      } else if (k === "Backspace" || k === "Delete" || k === "0") {
        e.preventDefault();
        erase();
      } else if (k.startsWith("Arrow")) {
        e.preventDefault();
        const cur = selected ?? 40;
        const r = rowOf(cur);
        const c = colOf(cur);
        const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[k] ?? [0, 0];
        setSelected(selected === null ? 40 : ((r + dr + 9) % 9) * 9 + ((c + dc + 9) % 9));
      } else if (k === "n" || k === "N") setNotesMode((v) => !v);
      else if (k === "h" || k === "H") dispatch({ type: "hint" });
      else if (k === "Escape") setSelected(null);
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

  const over = game.won || game.lost;
  const boardPx = size ? Math.floor(Math.max(200, Math.min(size.w, size.h, 620))) : 0;
  const cellPx = boardPx / 9.4;
  const focusDigit = selected !== null ? game.values[selected] || null : focus;
  const peers = new Set(selected !== null ? PEERS[selected] : []);
  const hintUnit = new Set(flash?.reason.unit ? unitCells(flash.reason.unit) : []);
  const canErase = selected !== null && !isLocked(game, selected) && (!!game.values[selected] || !!game.notes[selected]);

  const cellClass = (i: number) => {
    const v = game.values[i];
    const bg =
      i === selected
        ? "bg-[#8a7424]"
        : isWrong(game, i)
          ? "bg-[#5a2a24]"
          : focusDigit && v === focusDigit
            ? "bg-[#55581f]"
            : hintUnit.has(i)
              ? "bg-[#1d7a4c] shadow-[inset_0_0_0_1px_rgba(242,193,78,0.55)]"
              : peers.has(i)
                ? "bg-[#17683f]"
                : "bg-felt";
    const text = isGiven(game, i) ? "text-white" : isWrong(game, i) ? "text-red-400" : "text-gold";
    return `${bg} ${text}`;
  };

  return (
    <main className="flex h-dvh touch-manipulation select-none flex-col overflow-hidden">
      <header className={HEADER}>
        <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-3 py-1.5 font-display sm:gap-4 sm:px-4 sm:py-2">
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-gold/80">TEMPO</span>
            <span className="text-xl tabular-nums text-gold sm:text-2xl">{formatTime(clock.now())}</span>
          </div>
          <div className="flex flex-col items-center gap-1 leading-none" title={`${game.mistakes} de ${MAX_MISTAKES} erros`}>
            <span className="text-[10px] text-white/60">ERROS</span>
            <span key={`m-${game.mistakes}`} className={`flex gap-1 py-1 ${game.mistakes ? "banner" : ""}`}>
              {Array.from({ length: MAX_MISTAKES }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3 ${i < game.mistakes ? "bg-red-400" : "bg-white/15"}`} />
              ))}
            </span>
          </div>
        </div>

        {daily ? (
          <DailyBadge day={daily.day} className="rounded-full bg-black/30 px-3 py-1.5 text-white/70" />
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 font-display text-xs text-white/70" title={LEVEL_LABEL[game.difficulty]}>
            <LevelBars level={game.difficulty} className="h-3.5 w-4 text-gold" />
            <span className="hidden sm:inline">{LEVEL_LABEL[game.difficulty]}</span>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={() => router.push(home)} ask={!game.won} />
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col items-center gap-3 px-3 pb-4 sm:gap-4 lg:flex-row lg:justify-center lg:gap-10 lg:px-8">
        <div ref={setWrap} className="relative flex min-h-0 w-full flex-1 items-center justify-center lg:h-full lg:max-w-[620px]">
          {boardPx > 0 && (
            <div
              className="relative grid grid-cols-3 rounded-2xl bg-[#5b3a1e] shadow-[0_0_0_2px_#3b2412,0_20px_50px_rgba(0,0,0,0.6)]"
              style={{ width: boardPx, height: boardPx, padding: boardPx * 0.014, gap: boardPx * 0.012 }}
              role="grid"
              aria-label="Tabuleiro"
            >
              {Array.from({ length: 9 }, (_, b) => (
                <div key={b} className="grid grid-cols-3 grid-rows-3 gap-px overflow-hidden rounded-[3px] bg-[#0a3a24]">
                  {Array.from({ length: 9 }, (_, k) => {
                    const i = (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3);
                    const v = game.values[i];
                    const delay = fx?.wave.get(i);
                    const introDelay = intro !== null && isGiven(game, i) ? (rowOf(i) + colOf(i)) * 28 : undefined;
                    return (
                      <button
                        key={k}
                        role="gridcell"
                        aria-label={`Linha ${rowOf(i) + 1}, coluna ${colOf(i) + 1}${v ? `: ${v}` : ""}`}
                        aria-selected={i === selected}
                        onClick={() => {
                          setSelected(i);
                          setFocus(null);
                        }}
                        className={`relative flex items-center justify-center font-display leading-none transition-colors duration-150 ${cellClass(i)} ${
                          flash?.cell === i ? "target-glow z-10" : ""
                        } ${delay !== undefined ? "cell-wave" : ""}`}
                        style={{ fontSize: cellPx * 0.58, animationDelay: delay !== undefined ? `${delay}ms` : undefined }}
                      >
                        {v ? (
                          <span
                            key={shake?.cell === i ? `s-${shake.key}` : "v"}
                            className={`${shake?.cell === i ? "shake" : ""} ${introDelay !== undefined ? "cell-in" : ""}`}
                            style={{ animationDelay: introDelay !== undefined ? `${introDelay}ms` : undefined }}
                          >
                            {v}
                          </span>
                        ) : game.notes[i] ? (
                          <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-[6%] font-sans font-semibold" style={{ fontSize: cellPx * 0.24 }}>
                            {DIGITS.map((d) => (
                              <span
                                key={d}
                                className={`flex items-center justify-center ${focusDigit === d && game.notes[i] & bit(d) ? "rounded-sm bg-gold text-stone-900" : "text-white/75"}`}
                              >
                                {game.notes[i] & bit(d) ? d : ""}
                              </span>
                            ))}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ))}

              {flash && (
                <div
                  key={`flash-${flash.key}`}
                  className="banner pointer-events-none absolute left-1/2 top-0 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-stone-950/90 py-1.5 pl-1.5 pr-3 font-display text-xs shadow-xl ring-1 ring-gold/50 sm:text-sm"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-stone-900 sm:h-7 sm:w-7">{flash.value}</span>
                  <span className="text-white/90">{reasonLabel(flash.reason)}</span>
                  {flash.reason.via.map((t) => (
                    <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gold">
                      {TECHNIQUE_LABEL[t]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Controls
          game={game}
          notesMode={notesMode}
          canErase={canErase}
          selectedNotes={selected !== null && !game.values[selected] ? game.notes[selected] : 0}
          onPress={press}
          onUndo={() => dispatch({ type: "undo" })}
          onErase={erase}
          onNotes={() => setNotesMode((v) => !v)}
          onHint={() => dispatch({ type: "hint" })}
          disabled={over || intro !== null}
        />
      </section>

      {showEnd && game.won && <Victory game={game} day={daily?.day} record={record} busy={busy} onAgain={startNew} onLeave={() => router.push(home)} />}
      {showEnd && game.lost && <GameOver game={game} day={daily?.day} busy={busy} onContinue={revive} onNew={startNew} onLeave={() => router.push(home)} />}
      {help && (
        <HowToPlayModal game="SUDOKU" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

// ---------- controles ----------

function Tool({ label, onClick, active, disabled, children }: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`flex h-11 flex-1 items-center justify-center rounded-2xl transition disabled:opacity-30 sm:h-12 lg:h-14 ${
        active ? "bg-gold text-stone-900 shadow-[0_3px_0_#9a6b12]" : "bg-white/10 text-white/85 enabled:hover:bg-white/20 enabled:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Controls({
  game,
  notesMode,
  canErase,
  selectedNotes,
  onPress,
  onUndo,
  onErase,
  onNotes,
  onHint,
  disabled,
}: {
  game: GameState;
  notesMode: boolean;
  canErase: boolean;
  selectedNotes: number;
  onPress: (d: number) => void;
  onUndo: () => void;
  onErase: () => void;
  onNotes: () => void;
  onHint: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex w-full max-w-[620px] shrink-0 flex-col gap-2 sm:gap-3 lg:w-[280px]">
      <div className="flex gap-2">
        <Tool label="Desfazer" onClick={onUndo} disabled={disabled || !game.history.length}>
          <UndoIcon className="h-6 w-6" />
        </Tool>
        <Tool label="Apagar" onClick={onErase} disabled={disabled || !canErase}>
          <EraseIcon className="h-6 w-6" />
        </Tool>
        <Tool label={notesMode ? "Anotações: ligadas" : "Anotações: desligadas"} onClick={onNotes} active={notesMode} disabled={disabled}>
          <PencilIcon className="h-6 w-6" />
        </Tool>
        <Tool label="Dica" onClick={onHint} disabled={disabled}>
          <span className="relative">
            <HintIcon className="h-6 w-6" />
            {game.hints > 0 && (
              <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-display text-[9px] text-stone-900">
                {game.hints}
              </span>
            )}
          </span>
        </Tool>
      </div>
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5 lg:grid-cols-3 lg:gap-2">
        {DIGITS.map((d) => {
          const left = remaining(game, d);
          const noted = !!(selectedNotes & bit(d));
          return (
            <button
              key={d}
              onClick={() => onPress(d)}
              disabled={disabled || left === 0}
              aria-label={notesMode ? `Anotar ${d}` : `${d}`}
              className={`flex h-14 flex-col items-center justify-center rounded-xl font-display leading-none transition disabled:pointer-events-none sm:h-16 lg:aspect-square lg:h-auto ${
                left === 0 ? "opacity-0" : disabled ? "opacity-40" : ""
              } ${
                notesMode
                  ? noted
                    ? "bg-gold/25 text-gold ring-2 ring-gold"
                    : "bg-white/5 text-gold ring-1 ring-gold/40 hover:bg-white/10"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <span className={notesMode ? "text-lg sm:text-xl lg:text-2xl" : "text-2xl sm:text-3xl lg:text-4xl"}>{d}</span>
              <span className="mt-1 text-[9px] text-white/45 sm:text-[10px]">{left}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- fim de jogo ----------

/** Selo da tela de fim: o nível, ou o dia no desafio. */
function Level({ game, day }: { game: GameState; day?: string }) {
  if (day) return <DailyBadge day={day} className="text-white/60" />;
  return (
    <span className="flex items-center gap-1.5 font-display text-xs text-white/60">
      <LevelBars level={game.difficulty} className="h-3.5 w-4 text-gold" />
      {LEVEL_LABEL[game.difficulty]}
    </span>
  );
}

function Victory({ game, day, record, busy, onAgain, onLeave }: { game: GameState; day?: string; record: boolean; busy: boolean; onAgain: () => void; onLeave: () => void }) {
  return (
    <GameEnd won badge={<Level game={game} day={day} />} onLeave={onLeave} onAgain={onAgain} busy={busy}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-6">
          <EndStat label="TEMPO" value={formatTime(game.elapsed)} gold />
          <EndStat label="ERROS" value={game.mistakes} />
          <EndStat label="DICAS" value={game.hints} />
        </div>
        {record && <span className="banner rounded-full bg-gold px-3 py-1 font-display text-[10px] text-stone-900">RECORDE</span>}
      </div>
    </GameEnd>
  );
}

function GameOver({ game, day, busy, onContinue, onNew, onLeave }: { game: GameState; day?: string; busy: boolean; onContinue: () => void; onNew: () => void; onLeave: () => void }) {
  return (
    <GameEnd
      won={false}
      badge={<Level game={game} day={day} />}
      onLeave={onLeave}
      onAgain={onNew}
      busy={busy}
      actions={
        <button
          onClick={onContinue}
          className="rounded-xl bg-emerald-600 px-4 py-3 font-display shadow-[0_4px_0_#065f46] sm:px-5 active:translate-y-1 active:shadow-none"
        >
          Continuar
        </button>
      }
    >
      <div className="flex flex-col items-center gap-2 font-display leading-none">
        <span className="flex gap-2">
          {Array.from({ length: MAX_MISTAKES }, (_, i) => (
            <span key={i} className="h-4 w-4 rounded-full bg-red-400" />
          ))}
        </span>
        <span className="text-sm text-red-400">{MAX_MISTAKES} ERROS</span>
      </div>
    </GameEnd>
  );
}
