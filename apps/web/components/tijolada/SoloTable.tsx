"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { newGame, pack, playedMs, TICK_MS, unpack, type Game, type PackedGame } from "@mesa/tijolada";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, Icon, IconButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { formatMs } from "@/lib/stats/compute";
import { reportSoloResult } from "@/lib/stats/report";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { useTouchDevice } from "@/lib/useTouchDevice";
import { TIJOLADA_PATH } from "@/lib/tijolada/paths";
import { Board } from "./Board";
import { TouchPad, useKeyboard } from "./controls";
import { HowToPlay } from "./HowToPlay";
import { Fit, fmt, HoldBox, NextBox, Stats, TopStrip } from "./Panels";
import { useRunner } from "./useRunner";
import { trackStart } from "@/lib/analytics";

const SAVE_KEY = "tijolada.solo";
const BEST_KEY = "tijolada.best";

function load(): Game | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const g = raw ? unpack(JSON.parse(raw) as PackedGame) : null;
    return g && !g.over && g.mode === "solo" ? g : null;
  } catch {
    return null;
  }
}

function save(g: Game | null) {
  try {
    if (g && !g.over) localStorage.setItem(SAVE_KEY, JSON.stringify(pack(g)));
    else localStorage.removeItem(SAVE_KEY);
  } catch {}
}

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

const fresh = () => newGame(Math.floor(Math.random() * 2 ** 31), "solo");

/** Partida de um jogador só: roda e fica salva no aparelho (recarregar continua, pausada). */
export function SoloTable() {
  const router = useRouter();
  const game = useRef<Game | null>(null);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [end, setEnd] = useState<{ best: number; record: boolean } | null>(null);
  const [, setGameNo] = useState(0);
  const touch = useTouchDevice();
  // relógio: passo e hora em que a partida voltou a correr
  const base = useRef({ tick: 0, at: 0 });

  useAudioUnlock();

  useEffect(() => {
    const saved = load();
    game.current = saved ?? fresh();
    if (!saved) trackStart("tijolada", { modo: "solo" });
    base.current = { tick: game.current.tick, at: performance.now() };
    setPaused(!!saved);
    setGameNo((n) => n + 1);
  }, []);

  const running = !paused && !help && !exiting && !end;
  const target = useCallback(() => base.current.tick + Math.floor((performance.now() - base.current.at) / TICK_MS), []);
  // o relógio do topo muda a cada segundo
  const seconds = useCallback(() => String(Math.floor((game.current?.tick ?? 0) * TICK_MS / 1000)), []);
  const controls = useRunner({ game, target, running, extra: seconds });

  // voltou a correr: o relógio parte de onde parou
  useEffect(() => {
    if (running && game.current) base.current = { tick: game.current.tick, at: performance.now() };
  }, [running]);

  // aba escondida: pausa e salva
  useEffect(() => {
    const vis = () => {
      if (document.hidden) {
        setPaused(true);
        save(game.current);
      }
    };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("pagehide", vis);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pagehide", vis);
    };
  }, []);

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  useKeyboard(controls, !help && !exiting && !end, togglePause);

  const g = game.current;
  // salva a cada peça travada
  useEffect(() => {
    if (g && !g.over) save(g);
  }, [g, g?.locks]);

  // fim: recorde, perfil e som (uma vez por partida)
  useEffect(() => {
    if (!g?.over || end) return;
    save(null);
    const best = readBest();
    const record = g.score > best;
    if (record) {
      try {
        localStorage.setItem(BEST_KEY, String(g.score));
      } catch {}
    }
    setEnd({ best: Math.max(best, g.score), record });
    (record ? playWinSound : playLoseSound)();
    reportSoloResult("tijolada", { score: g.score, lines: g.lines, level: g.level, tetras: g.tetras, timeMs: playedMs(g), pieces: g.pieces }, undefined, { resultado: "fim" });
  }, [g, g?.over, end]);

  const again = () => {
    game.current = fresh();
    trackStart("tijolada", { modo: "solo" });
    base.current = { tick: 0, at: performance.now() };
    setEnd(null);
    setPaused(false);
    setGameNo((n) => n + 1);
  };

  const leave = () => {
    save(game.current);
    router.push(TIJOLADA_PATH);
  };

  return (
    <main className="flex h-dvh flex-col items-center overflow-hidden">
      <header className="relative z-40 flex w-full items-center justify-between gap-2 px-2 py-2 sm:px-6">
        <span className="rounded-xl bg-black/35 px-3 py-1 font-display text-sm tabular-nums text-white/70 sm:text-base">{formatMs(g ? playedMs(g) : 0)}</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <IconButton label={paused ? "Continuar" : "Pausar"} onClick={togglePause} disabled={!!end}>
            <Icon>{paused ? <path d="M7 4.5v15l12-7.5-12-7.5Z" /> : <path d="M9 5v14M15 5v14" />}</Icon>
          </IconButton>
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!end} onOpenChange={setExiting} />
        </div>
      </header>

      <TopStrip game={g} />
      <section className="flex min-h-0 w-full max-w-2xl flex-1 justify-center gap-2 px-2 pb-2 sm:gap-4">
        <aside className="hidden w-28 shrink-0 flex-col gap-3 sm:flex">
          <HoldBox game={g} />
          <Stats game={g} />
        </aside>
        <Fit>
          {({ w, h }) => (
            <div className="relative" style={{ width: w, height: h }}>
              <Board game={game} className="h-full w-full" />
              {paused && !end && (
                <button
                  onClick={togglePause}
                  aria-label="Continuar"
                  title="Continuar"
                  className="absolute inset-0 flex items-center justify-center rounded-md bg-black/55 text-gold backdrop-blur-[2px]"
                >
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gold text-stone-900 shadow-[0_5px_0_#9a6b12]">
                    <Icon className="ml-1 h-10 w-10">
                      <path d="M7 4.5v15l12-7.5-12-7.5Z" />
                    </Icon>
                  </span>
                </button>
              )}
            </div>
          )}
        </Fit>
        <aside className="hidden w-28 shrink-0 flex-col gap-3 sm:flex">
          <NextBox game={g} />
        </aside>
      </section>

      {touch && <TouchPad controls={controls} />}

      {end && g && (
        <GameEnd
          won={end.record}
          badge={
            <span className="rounded-full bg-gold/20 px-3 py-1 font-display text-sm text-gold">
              {end.record ? "NOVO RECORDE" : `RECORDE ${fmt(end.best)}`}
            </span>
          }
          onLeave={leave}
          onAgain={again}
        >
          <EndStat label="PONTOS" value={fmt(g.score)} gold />
          <div className="flex gap-6">
            <EndStat label="LINHAS" value={g.lines} />
            <EndStat label="NÍVEL" value={g.level} />
            <EndStat label="TEMPO" value={formatMs(playedMs(g))} />
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="TIJOLADA" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}
