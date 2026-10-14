"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  guess,
  isSolved,
  LENGTH,
  letterMarks,
  MAX_GUESSES,
  MODES,
  newGame,
  pickWords,
  plain,
  score,
  status,
  type GameState,
  type Mode,
} from "@truco/verbete";
import { DailyBadge } from "@/components/daily/common";
import { HelpButton, IconButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { BarsIcon, InfinityIcon } from "@/components/ui/icons";
import type { VerbeteDaily } from "@/lib/daily/challenge";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { dayKey } from "@/lib/stats/achievements";
import { reportSoloResult } from "@/lib/stats/report";
import { VERBETE_DAILY_PATH, VERBETE_FREE_PATH, VERBETE_PATH } from "@/lib/verbete/paths";
import { playEraseSound, playFlipSound, playInvalidSound, playKeySound, playSolveSound } from "@/lib/verbete/sound";
import { addPlayed, loadDailyGame, loadFreeGame, saveDailyGame, saveFreeGame } from "@/lib/verbete/storage";
import { Board, FLIP_MS, FLIP_STEP, Keyboard, REVEAL_MS } from "./Board";
import { End } from "./End";
import { HowToPlay } from "./HowToPlay";
import { ModeIcon, MODE_NAME } from "./Tile";

// três colunas: as pontas com a mesma largura, para o selo do meio ficar no centro da tela
const HEADER = "relative z-40 grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-2 py-2 sm:min-h-[64px] sm:gap-2 sm:px-6";
const EMPTY = () => Array<string>(LENGTH).fill("");

export interface DailyWords {
  day: string;
  data: VerbeteDaily;
}

/** Arranjo dos quadros: colunas × linhas. O Quarteto fica 4×1 ou 2×2, o que der casas maiores. */
function layoutFor(mode: Mode, w: number, h: number) {
  const rows = MAX_GUESSES[mode];
  // em casas: quadro = 5 casas + 4 vãos de 0,1; entre quadros 0,6 na horizontal e 0,5 na vertical
  const fit = (cols: number, lines: number) =>
    Math.min(w / (cols * 5.4 + (cols - 1) * 0.6), h / (lines * (rows * 1.1 - 0.1) + (lines - 1) * 0.5));
  const options = mode === 4 ? [[4, 1], [2, 2]] : [[mode, 1]];
  const [cols, lines] = options.reduce((a, b) => (fit(b[0], b[1]) > fit(a[0], a[1]) ? b : a));
  return { cols, lines, tile: Math.floor(Math.min(fit(cols, lines), mode === 1 ? 62 : 52)) };
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
  return [setEl, size] as const;
}


/** Partida do Verbete. `daily`: palavras do dia (salvas à parte por dia e modo); sem ele, modo livre. */
export function Table({ mode, daily }: { mode: Mode; daily?: DailyWords }) {
  const router = useRouter();
  const answers = daily?.data.words[`${mode}`];
  const home = daily ? VERBETE_DAILY_PATH : VERBETE_PATH;
  const save = (g: GameState) => (daily ? saveDailyGame(daily.day, g) : saveFreeGame(g));

  const [game, setGame] = useState<GameState | null>(null);
  const [input, setInput] = useState<string[]>(EMPTY);
  const [cursor, setCursor] = useState(0);
  /** chutes já mostrados no teclado (o último só entra depois de virar) */
  const [shown, setShown] = useState(0);
  const [reveal, setReveal] = useState<number | null>(null);
  const [jump, setJump] = useState<number | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const [popAt, setPopAt] = useState<{ i: number; key: number } | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [help, setHelp] = useState(false);
  const [setWrap, size] = useSize();
  const busy = useRef(false);
  const latest = useRef<GameState | null>(null);
  latest.current = game;
  useAudioUnlock();

  // carrega a partida salva; sem partida, começa a do dia (ou uma livre sorteada)
  useEffect(() => {
    let g = daily ? loadDailyGame(daily.day, mode, answers!) : loadFreeGame(mode);
    if (!g) {
      g = newGame(mode, answers ?? pickWords(mode));
      save(g);
    }
    setGame(g);
    setShown(g.guesses.length);
    setShowEnd(status(g) !== "playing");
  }, [mode, daily]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((x) => (x?.key === toast.key ? null : x)), 1400);
    return () => clearTimeout(t);
  }, [toast]);

  const refuse = (text: string) => {
    playInvalidSound();
    const key = Date.now();
    setShake(key);
    setToast({ text, key });
  };

  const finish = (g: GameState) => {
    const won = status(g) === "won";
    const data = { mode, answers: g.answers, guesses: g.guesses };
    reportSoloResult("verbete", data, daily && { day: daily.day, seed: daily.data.seed });
    addPlayed({ mode, won, attempts: g.guesses.length, ...(daily ? { day: daily.day, onTime: daily.day === dayKey(new Date()) } : {}) });
    setTimeout(won ? playWinSound : playLoseSound, won ? 450 : 150);
    setTimeout(() => setShowEnd(true), won ? 1300 : 900);
  };

  const submit = () => {
    const cur = latest.current;
    if (!cur || busy.current || status(cur) !== "playing") return;
    const word = input.join("");
    if (word.length < LENGTH) return refuse("SÓ 5 LETRAS");
    const r = guess(cur, word);
    if (!r.ok) return refuse(r.error === "unknown" ? "NÃO ACEITA" : "SÓ 5 LETRAS");
    const next = r.state;
    const row = next.guesses.length - 1;
    latest.current = next;
    busy.current = true;
    setGame(next);
    save(next);
    setInput(EMPTY());
    setCursor(0);
    setReveal(row);
    // som de cada casa no meio da virada: no quadro único, a marca dela; com vários, a melhor entre os quadros abertos
    const open = next.answers.map((a, b) => ({ a, b })).filter(({ b }) => !isSolved(cur, b));
    for (let i = 0; i < LENGTH; i++) {
      const marks = open.map(({ a }) => score(word, a)[i]);
      const mark = marks.includes("right") ? "right" : marks.includes("place") ? "place" : "absent";
      setTimeout(() => playFlipSound(mark), i * FLIP_STEP + FLIP_MS / 2);
    }
    setTimeout(() => {
      busy.current = false;
      setReveal(null);
      setShown(next.guesses.length);
      setJump(row);
      setTimeout(() => setJump((j) => (j === row ? null : j)), 1200);
      const solvedNow = next.answers.some((_, b) => isSolved(next, b) && !isSolved(cur, b));
      if (status(next) !== "playing") finish(next);
      else if (solvedNow) playSolveSound();
    }, REVEAL_MS + 60);
  };

  const type = (l: string) => {
    if (busy.current || !game || status(game) !== "playing" || cursor >= LENGTH) return;
    playKeySound();
    setInput((cur) => cur.map((x, i) => (i === cursor ? l.toUpperCase() : x)));
    setPopAt({ i: cursor, key: Date.now() });
    setCursor((c) => Math.min(LENGTH, c + 1));
  };

  const back = () => {
    if (busy.current || !game || status(game) !== "playing") return;
    // apaga a casa do cursor; vazia, apaga a de trás
    const at = cursor < LENGTH && input[cursor] ? cursor : cursor - 1;
    if (at < 0) return;
    playEraseSound();
    setInput((cur) => cur.map((x, i) => (i === at ? "" : x)));
    setCursor(at);
  };

  // teclado físico
  useEffect(() => {
    if (help) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === "Enter") {
        e.preventDefault();
        submit();
      } else if (k === "Backspace") {
        e.preventDefault();
        back();
      } else if (k === "Delete") {
        e.preventDefault();
        if (cursor < LENGTH && input[cursor]) setInput((cur) => cur.map((x, i) => (i === cursor ? "" : x)));
      } else if (k === "ArrowLeft") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (k === "ArrowRight") {
        e.preventDefault();
        setCursor((c) => Math.min(LENGTH - 1, c + 1));
      } else if (k === "Home") setCursor(0);
      else if (k === "End") setCursor(LENGTH - 1);
      else if (k.length === 1 && /^[a-z]$/.test(plain(k))) {
        e.preventDefault();
        type(plain(k));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const marks = useMemo(() => {
    if (!game) return [];
    const seen = { ...game, guesses: game.guesses.slice(0, shown) };
    return game.answers.map((_, b) => letterMarks(seen, b));
  }, [game, shown]);

  if (!game) {
    return (
      <main className="flex h-dvh flex-col overflow-hidden">
        <header className={HEADER} />
      </main>
    );
  }

  const st = status(game);
  const typing = st === "playing" && reveal === null;
  const layout = size ? layoutFor(mode, size.w, size.h) : null;
  const base = daily ? `${VERBETE_DAILY_PATH}/${daily.day}` : VERBETE_FREE_PATH;

  return (
    <main className="flex h-dvh touch-manipulation select-none flex-col overflow-hidden">
      <header className={HEADER}>
        <nav className="col-start-1 flex items-center gap-1 justify-self-start rounded-full bg-black/30 p-1" aria-label="Modo">
          {MODES.map((m) => (
            <Link
              key={m}
              href={`${base}?m=${m}`}
              replace
              aria-current={m === mode ? "page" : undefined}
              title={`${MODE_NAME[m]}: ${m} palavra${m > 1 ? "s" : ""}`}
              className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 font-display text-xs transition sm:h-8 sm:px-3 ${
                m === mode ? "bg-gold text-stone-900" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <ModeIcon mode={m} className="h-4 w-4" />
              <span className={m === mode ? "" : "hidden lg:inline"}>{MODE_NAME[m].toUpperCase()}</span>
            </Link>
          ))}
        </nav>

        {daily ? (
          <DailyBadge day={daily.day} className="col-start-2 hidden rounded-full bg-black/30 px-3 py-1.5 text-white/70 sm:flex" />
        ) : (
          <span className="col-start-2 hidden items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 font-display text-xs text-white/70 sm:flex" title="Livre">
            <InfinityIcon className="h-4 w-4 text-gold" />
            LIVRE
          </span>
        )}

        <div className="col-start-3 flex items-center gap-1 justify-self-end sm:gap-2">
          {st !== "playing" && !showEnd && (
            <IconButton label="Resultado" onClick={() => setShowEnd(true)} active>
              <BarsIcon />
            </IconButton>
          )}
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={() => router.push(home)} ask={st === "playing"} />
        </div>
      </header>

      <section className="relative flex min-h-0 flex-1 flex-col items-center px-2 pb-2 sm:px-4">
        {toast && (
          <div
            key={`toast-${toast.key}`}
            className="banner pointer-events-none absolute left-1/2 top-1 z-30 -translate-x-1/2 rounded-full bg-stone-950/90 px-4 py-1.5 font-display text-sm text-white shadow-xl ring-1 ring-white/15"
            role="status"
          >
            {toast.text}
          </div>
        )}
        <div ref={setWrap} className="flex min-h-0 w-full max-w-[1100px] flex-1 items-center justify-center py-2">
          {layout && (
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${layout.cols}, auto)`,
                columnGap: Math.round(layout.tile * 0.6),
                rowGap: Math.round(layout.tile * 0.5),
              }}
            >
              {game.answers.map((_, b) => (
                <Board
                  key={b}
                  game={game}
                  board={b}
                  tile={layout.tile}
                  input={input}
                  cursor={cursor}
                  typing={typing}
                  reveal={reveal}
                  shake={shake}
                  popAt={popAt}
                  jump={jump}
                  onCell={(i) => setCursor(i)}
                />
              ))}
            </div>
          )}
        </div>
        <Keyboard marks={marks} cols={layout?.cols ?? mode} disabled={!typing} onLetter={type} onBack={back} onEnter={submit} />
      </section>

      {showEnd && st !== "playing" && (
        <End
          game={game}
          daily={daily?.day}
          onLeave={() => router.push(home)}
          onHide={() => setShowEnd(false)}
          onAgain={(to) => {
            if (to) return router.push(to);
            const g = newGame(mode, pickWords(mode));
            save(g);
            latest.current = g;
            setGame(g);
            setShown(0);
            setInput(EMPTY());
            setCursor(0);
            setShowEnd(false);
          }}
        />
      )}

      {help && (
        <HowToPlayModal game="VERBETE" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}
