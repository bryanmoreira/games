"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyAction,
  clearable,
  freeSlots,
  gameFrom,
  getLayout,
  goneOf,
  layoutName,
  matches,
  moves,
  mulberry32,
  newGame,
  PENALTY_MS,
  randomSeed,
  remaining,
  type Action,
  type GameState,
} from "@mesa/mahjong";
import { HelpButton, IconButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { EyeIcon, HintIcon, ShuffleIcon, UndoIcon, ZoomInIcon, ZoomOutIcon } from "@/components/ui/icons";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { DailyBadge } from "@/components/daily/common";
import { playWinSound, useAudioUnlock } from "@/lib/sound";
import { playBlockedSound, playHintSound, playMissSound, playPairSound, playSelectSound, playShuffleTilesSound, playUndoSound } from "@/lib/mahjong/sound";
import { isGame, loadGame, loadLayout, saveBest, saveGame } from "@/lib/mahjong/storage";
import { loadDaily, saveDaily } from "@/lib/daily/storage";
import type { DailyChallenge } from "@/lib/daily/challenge";
import { reportSoloWin } from "@/lib/stats/report";
import { useClock } from "@/lib/useClock";
import { MAHJONG_DAILY_PATH, MAHJONG_PATH } from "@/lib/mahjong/paths";
import { Board, boardSize, tileWidth } from "./Board";
import { formatTime } from "./common";
import { HowToPlay } from "./HowToPlay";
import { usePanZoom } from "./usePanZoom";

const HEADER = "relative z-40 flex min-h-12 items-center justify-between gap-1.5 px-2 py-2 sm:min-h-[72px] sm:gap-2 sm:px-6";
const OUT_MS = 320;
const FREE_KEY = "mahjong.free";
/** Abaixo disso (px de largura da peça), aparece a lupa para ampliar. */
const SMALL_TILE = 34;

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

/** Destacar as peças livres (escurece as presas). Ligado de começo, fica salvo no aparelho. */
function useShowFree(): [boolean, () => void] {
  const [on, setOn] = useState(true);
  useEffect(() => {
    try {
      setOn(localStorage.getItem(FREE_KEY) !== "0");
    } catch {}
  }, []);
  const toggle = () =>
    setOn((v) => {
      try {
        localStorage.setItem(FREE_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });
  return [on, toggle];
}

export type MahjongChallenge = Extract<DailyChallenge, { game: "mahjong" }>;

/** `daily`: o desafio do dia (sempre a mesma mesa, salva à parte por dia). */
export function Table({ daily }: { daily?: MahjongChallenge }) {
  const router = useRouter();
  const home = daily ? MAHJONG_DAILY_PATH : MAHJONG_PATH;
  const save = (g: GameState) => (daily ? saveDaily("mahjong", daily.day, g) : saveGame(g));
  const [game, setGame] = useState<GameState | null>(null);
  const [help, setHelp] = useState(false);
  const [visible, setVisible] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<number[]>([]);
  const [leaving, setLeaving] = useState<Set<number>>(new Set());
  const [back, setBack] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState<{ slot: number; id: number } | null>(null);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [showEnd, setShowEnd] = useState(false);
  const [record, setRecord] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showFree, toggleFree] = useShowFree();
  const [setWrap, size] = useSize();
  const layoutOf = game ? getLayout(game.layout) : null;
  const twFit = size && layoutOf ? tileWidth(layoutOf, size.w, size.h) : 0;
  const board = twFit && layoutOf ? boardSize(layoutOf, twFit) : null;
  const pz = usePanZoom(size, board);
  useAudioUnlock();

  const running = !!game && !game.won && !help && visible;
  const clock = useClock(running);

  // carrega a partida salva; sem partida, volta para a página inicial do jogo
  useEffect(() => {
    let g = daily ? loadDaily("mahjong", daily.day, isGame) : loadGame();
    // primeira vez neste dia: começa a mesa do desafio
    if (daily && (!g || g.seed !== daily.data.seed)) save((g = gameFrom(daily.data)));
    if (!g) {
      router.replace(MAHJONG_PATH);
      return;
    }
    setGame(g);
    clock.reset(g.elapsed);
    setShowEnd(g.won);
  }, [router, clock, daily]);

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

  // o par que saiu fica na tela o tempo da animação
  useEffect(() => {
    if (!leaving.size) return;
    const t = setTimeout(() => setLeaving(new Set()), OUT_MS);
    return () => clearTimeout(t);
  }, [leaving]);
  useEffect(() => {
    if (!back.size) return;
    const t = setTimeout(() => setBack(new Set()), 300);
    return () => clearTimeout(t);
  }, [back]);
  useEffect(() => {
    if (!penalty) return;
    const t = setTimeout(() => setPenalty(0), 1200);
    return () => clearTimeout(t);
  }, [penalty]);

  const layout = game ? getLayout(game.layout) : null;
  const gone = useMemo(() => (game ? goneOf(game) : []), [game]);
  const free = useMemo(() => new Set(game && layout ? freeSlots(layout, gone) : []), [game, layout, gone]);
  const pairs = useMemo(() => (game && layout ? moves(game, layout, gone).length : 0), [game, layout, gone]);
  // sem par: embaralhar só ajuda se ainda der para limpar a mesa com algum arranjo; senão, é desfazer
  const stuck = !!game && !game.won && pairs === 0;
  const dead = useMemo(() => stuck && !!layout && !clearable(layout, gone, mulberry32(game!.seed)), [stuck, layout, gone, game]);

  // lê o estado mais novo: dois toques seguidos antes de renderizar não podem usar o mesmo estado
  const dispatch = (action: Action) => {
    const cur = latest.current;
    if (!cur) return false;
    const r = applyAction(cur, action);
    if (!r.ok) return false;
    let elapsed = clock.now();
    if (action.type === "hint" || action.type === "shuffle") {
      elapsed += PENALTY_MS;
      clock.reset(elapsed);
      setPenalty((p) => p + 1);
    }
    const next = { ...r.state, elapsed };
    latest.current = next;
    setGame(next);
    save(next);
    const last = next.last!;
    if (last.type === "pair") {
      setSelected(null);
      setHint([]);
      setLeaving(new Set([last.a, last.b]));
      playPairSound();
      if (next.won) {
        setRecord(saveBest(next.layout, next.elapsed));
        reportSoloWin(
          "mahjong",
          { layout: next.layout, timeMs: Math.round(next.elapsed), hints: next.hints, shuffles: next.shuffles, undos: next.undos },
          daily && { day: daily.day, seed: daily.data.seed },
        );
        setTimeout(playWinSound, 350);
        setTimeout(() => setShowEnd(true), 900);
      }
    } else if (last.type === "undo") {
      setSelected(null);
      setHint([]);
      setBack(new Set([last.a, last.b]));
      playUndoSound();
    } else if (last.type === "hint") {
      setSelected(null);
      setHint([last.a, last.b]);
      playHintSound();
    } else {
      setSelected(null);
      setHint([]);
      setShuffleKey((k) => k + 1);
      playShuffleTilesSound();
    }
    return true;
  };

  const onTile = (i: number) => {
    const g = latest.current;
    if (!g || g.won) return;
    if (!free.has(i)) {
      setShake((s) => ({ slot: i, id: (s?.id ?? 0) + 1 }));
      playBlockedSound();
      return;
    }
    if (selected === null) {
      setSelected(i);
      playSelectSound();
    } else if (selected === i) setSelected(null);
    else if (matches(g.kinds[selected], g.kinds[i])) dispatch({ type: "pair", a: selected, b: i });
    else {
      setSelected(i);
      playMissSound();
    }
  };

  const startNew = () => {
    if (!game || busy) return;
    setBusy(true);
    // o desafio recomeça a mesma mesa; a partida livre sorteia outra do formato escolhido
    setTimeout(() => {
      const g = daily ? gameFrom(daily.data) : newGame(loadLayout());
      latest.current = g;
      save(g);
      setGame(g);
      clock.reset(0);
      setSelected(null);
      setHint([]);
      setLeaving(new Set());
      setBack(new Set());
      setShowEnd(false);
      setRecord(false);
      setBusy(false);
    }, 30);
  };

  // teclado: Esc solta a peça, H dica, Z desfaz, E embaralha
  useEffect(() => {
    if (!game || help) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey) return;
      const k = e.key.toLowerCase();
      if (e.ctrlKey) {
        if (k === "z") dispatch({ type: "undo" });
        return;
      }
      if (k === "escape") setSelected(null);
      else if (k === "h") dispatch({ type: "hint" });
      else if (k === "z") dispatch({ type: "undo" });
      else if (k === "e") dispatch({ type: "shuffle", seed: randomSeed() });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!game || !layout) {
    return (
      <main className="flex h-dvh flex-col overflow-hidden">
        <header className={HEADER} />
      </main>
    );
  }

  const tw = twFit;
  const left = remaining(game);

  return (
    <main className="flex h-dvh touch-manipulation select-none flex-col overflow-hidden">
      <header className={HEADER}>
        <div className="relative flex items-center gap-3 rounded-2xl bg-black/40 px-3 py-1.5 font-display sm:gap-4 sm:px-4 sm:py-2">
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-gold/80">TEMPO</span>
            <span className="text-xl tabular-nums text-gold sm:text-2xl">{formatTime(clock.now())}</span>
          </div>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-white/60">PEÇAS</span>
            <span className="text-xl tabular-nums sm:text-2xl">{left}</span>
          </div>
          <div className="flex flex-col items-center leading-none" title="Pares livres">
            <span className="text-[10px] text-white/60">PARES</span>
            <span className={`text-xl tabular-nums sm:text-2xl ${stuck ? "text-red-400" : ""}`}>{pairs}</span>
          </div>
          {penalty > 0 && (
            <span key={penalty} className="banner absolute -bottom-6 left-3 rounded-full bg-red-500/90 px-2 py-0.5 font-display text-[10px] text-white">
              +{PENALTY_MS / 1000}s
            </span>
          )}
        </div>

        {/* no celular não cabe: o formato aparece na tela de fim */}
        <div className="hidden min-w-0 items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 font-display text-xs text-white/80 sm:flex">
          {daily && <DailyBadge day={daily.day} className="text-white/70" />}
          <span className="truncate uppercase">{layoutName(game.layout)}</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <IconButton label={`Destacar peças livres: ${showFree ? "ligado" : "desligado"}`} onClick={toggleFree} active={showFree} className={showFree ? "" : "!text-white/50"}>
            <EyeIcon className="h-5 w-5" />
          </IconButton>
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={() => router.push(home)} ask={!game.won && game.removed.length > 0} />
        </div>
      </header>

      <section className="relative min-h-0 flex-1 overflow-hidden px-2 pb-2 sm:px-6">
        <div
          ref={(el) => {
            setWrap(el);
            pz.bind(el);
          }}
          className={`flex h-full w-full touch-none items-center justify-center ${pz.zoom > 1.01 ? "cursor-grab active:cursor-grabbing" : ""}`}
          {...pz.handlers}
        >
        {board && (
          <div style={{ width: board.w, height: board.h, transform: pz.transform }}>
            <Board
              layout={layout}
              kinds={game.kinds}
              gone={gone}
              free={free}
              tw={tw}
              selected={selected}
              hint={hint}
              leaving={leaving}
              back={back}
              shake={shake}
              shuffleKey={shuffleKey}
              showFree={showFree}
              disabled={game.won}
              onTile={onTile}
            />
          </div>
        )}
        </div>
        {/* peças pequenas (celular): lupa para ampliar; ampliado, lupa para ver tudo */}
        {(pz.zoom > 1.01 || (tw > 0 && tw < SMALL_TILE)) && (
          <button
            onClick={pz.zoom > 1.01 ? pz.reset : pz.zoomIn}
            aria-label={pz.zoom > 1.01 ? "Ver a mesa inteira" : "Ampliar"}
            title={pz.zoom > 1.01 ? "Ver a mesa inteira" : "Ampliar"}
            className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/85 transition hover:bg-black/80 hover:text-white"
          >
            {pz.zoom > 1.01 ? <ZoomOutIcon className="h-5 w-5" /> : <ZoomInIcon className="h-5 w-5" />}
          </button>
        )}
      </section>

      <footer className="relative flex shrink-0 items-center justify-center gap-2 px-3 pb-4 sm:gap-3 sm:pb-6">
        <ToolButton label="Desfazer" onClick={() => dispatch({ type: "undo" })} disabled={!game.removed.length || game.won} glow={dead}>
          <UndoIcon className="h-6 w-6" />
        </ToolButton>
        <ToolButton label="Dica" onClick={() => dispatch({ type: "hint" })} disabled={stuck || game.won} count={game.hints}>
          <HintIcon className="h-6 w-6" />
        </ToolButton>
        <ToolButton label="Embaralhar" onClick={() => dispatch({ type: "shuffle", seed: randomSeed() })} disabled={game.won || !left} glow={stuck && !dead} count={game.shuffles}>
          <ShuffleIcon className="h-6 w-6" />
        </ToolButton>
        {stuck && <span className="banner pointer-events-none absolute -top-9 rounded-full bg-red-500/90 px-3 py-1 font-display text-xs text-white">SEM PARES</span>}
      </footer>

      {showEnd && game.won && (
        <GameEnd won badge={<Badge game={game} day={daily?.day} />} onLeave={() => router.push(home)} onAgain={startNew} busy={busy}>
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-6">
              <EndStat label="TEMPO" value={formatTime(game.elapsed)} gold />
              <EndStat label="DICAS" value={game.hints} />
              <EndStat label="EMBARALHOU" value={game.shuffles} />
            </div>
            {record && <span className="banner rounded-full bg-gold px-3 py-1 font-display text-[10px] text-stone-900">RECORDE</span>}
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="MAHJONG" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  glow,
  count,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  glow?: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`relative flex h-12 w-16 items-center justify-center rounded-2xl transition disabled:opacity-30 sm:h-14 sm:w-20 ${
        glow ? "target-glow bg-gold text-stone-900 ring-2 ring-gold" : "bg-white/10 text-white/85 enabled:hover:bg-white/20 enabled:hover:text-white"
      }`}
    >
      {children}
      {!!count && (
        <span className="absolute right-2 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-display text-[9px] text-stone-900">{count}</span>
      )}
    </button>
  );
}

/** Selo da tela de fim: o formato, ou o dia no desafio. */
function Badge({ game, day }: { game: GameState; day?: string }) {
  return (
    <span className="flex items-center gap-2 font-display text-xs text-white/60">
      {day && <DailyBadge day={day} />}
      <span className="uppercase">
        {day ? "· " : ""}
        {layoutName(game.layout)}
      </span>
    </span>
  );
}
