"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIFFICULTIES, newGame, type Difficulty, type GameState } from "@truco/sudoku";
import { BackButton } from "@/components/BackButton";
import { DailyButton } from "@/components/daily/DailyButton";
import { GameIntro } from "@/components/seo";
import { formatTime, LevelBars, LEVEL_LABEL, MiniBoard } from "@/components/sudoku/common";
import { XIcon } from "@/components/ui/buttons";
import { loadBests, loadGame, loadLevel, saveGame, saveLevel, type Bests } from "@/lib/sudoku/storage";
import { SUDOKU_DAILY_PATH, SUDOKU_PATH, SUDOKU_PLAY_PATH } from "@/lib/sudoku/paths";

export default function SudokuHome() {
  const router = useRouter();
  const [level, setLevel] = useState<Difficulty>("easy");
  const [saved, setSaved] = useState<GameState | null>(null);
  const [bests, setBests] = useState<Bests>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLevel(loadLevel());
    setBests(loadBests());
    const g = loadGame();
    setSaved(g && !g.won ? g : null);
  }, []);

  const choose = (d: Difficulty) => {
    setLevel(d);
    saveLevel(d);
  };

  // com partida em andamento, pede confirmação na própria página (confirm() nativo pode ser bloqueado)
  const [confirming, setConfirming] = useState(false);
  const start = () => {
    if (busy) return;
    if (saved && saved.history.length > 0 && !confirming) return setConfirming(true);
    setBusy(true);
    // o Expert pode levar quase 1 s para gerar: deixa o botão mostrar antes
    setTimeout(() => {
      saveGame(newGame(level));
      router.push(SUDOKU_PLAY_PATH);
    }, 30);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <MiniBoard className="w-40 text-[11px]" />
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-[44px] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-6xl">SUDOKU</span>
        <span className="mt-2 font-display text-sm tracking-[0.5em] text-white/70">9 × 9</span>
      </h1>
      <GameIntro slug="sudoku" />

      <div className="grid w-full grid-cols-4 gap-2" role="radiogroup" aria-label="Dificuldade">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            role="radio"
            aria-checked={level === d}
            onClick={() => choose(d)}
            className={`flex flex-col items-center gap-2 rounded-xl py-3 transition ${
              level === d ? "bg-gold/15 text-white ring-2 ring-gold" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LevelBars level={d} className={`h-5 w-6 ${level === d ? "text-gold" : ""}`} />
            <span className="font-display text-[10px] sm:text-xs">{LEVEL_LABEL[d]}</span>
            <span className={`font-display text-[10px] tabular-nums ${bests[d] !== undefined ? "text-gold/80" : "text-transparent"}`} title="Melhor tempo">
              {bests[d] !== undefined ? formatTime(bests[d]!) : "--:--"}
            </span>
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex gap-2">
          {confirming && (
            <button
              onClick={() => setConfirming(false)}
              aria-label="Cancelar"
              title="Cancelar"
              className="flex w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <XIcon />
            </button>
          )}
          <button
            onClick={start}
            disabled={busy}
            className="banner flex flex-1 items-center justify-center rounded-xl bg-gold py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none"
            key={confirming ? "confirm" : "new"}
          >
            {busy ? (
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-current border-r-transparent" aria-label="Gerando" />
            ) : confirming ? (
              "Começar outra"
            ) : (
              "Novo jogo"
            )}
          </button>
        </div>
        {saved && (
          <button
            onClick={() => router.push(SUDOKU_PLAY_PATH)}
            className="flex items-center justify-center gap-3 rounded-xl bg-emerald-600 py-3 font-display text-lg shadow-[0_4px_0_#065f46] transition active:translate-y-1 active:shadow-none"
          >
            Continuar
            <span className="flex items-center gap-2 rounded-full bg-black/25 px-2.5 py-1 text-xs tabular-nums">
              <LevelBars level={saved.difficulty} className="h-3.5 w-4" />
              {formatTime(saved.elapsed)}
            </span>
          </button>
        )}
        <DailyButton game="sudoku" href={SUDOKU_DAILY_PATH} />
      </div>
      <Link
        href={`${SUDOKU_PATH}/como-jogar`}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
        Como jogar
      </Link>
    </main>
  );
}
