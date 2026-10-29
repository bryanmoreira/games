"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LEVELS, newGame, THEMES, themeName, type GameState, type Level } from "@mesa/caca-palavras";
import { BackButton } from "@/components/BackButton";
import { AdSlot } from "@/components/AdSlot";
import { DailyButton } from "@/components/daily/DailyButton";
import { GameIntro } from "@/components/seo";
import { formatTime, LevelBars, LEVEL_LABEL, WordArt } from "@/components/caca-palavras/common";
import { XIcon } from "@/components/ui/buttons";
import { loadBests, loadGame, loadLevel, loadTheme, saveGame, saveLevel, saveTheme, type Bests } from "@/lib/caca-palavras/storage";
import { CACA_DAILY_PATH, CACA_PATH, CACA_PLAY_PATH } from "@/lib/caca-palavras/paths";

export default function CacaHome() {
  const router = useRouter();
  const [level, setLevel] = useState<Level>("easy");
  // null = surpresa
  const [theme, setTheme] = useState<string | null>(null);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [bests, setBests] = useState<Bests>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLevel(loadLevel());
    setTheme(loadTheme());
    setBests(loadBests());
    const g = loadGame();
    setSaved(g && !g.won ? g : null);
  }, []);

  const chooseLevel = (l: Level) => {
    setLevel(l);
    saveLevel(l);
  };
  const chooseTheme = (t: string | null) => {
    setTheme(t);
    saveTheme(t);
  };

  // com partida em andamento, pede confirmação na própria página (confirm() nativo pode ser bloqueado)
  const [confirming, setConfirming] = useState(false);
  const start = () => {
    if (busy) return;
    if (saved && saved.found.length > 0 && !confirming) return setConfirming(true);
    setBusy(true);
    setTimeout(() => {
      saveGame(newGame(level, theme));
      router.push(CACA_PLAY_PATH);
    }, 30);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <WordArt className="w-40 text-[17px]" />
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-[44px] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-6xl">CAÇA</span>
        <span className="mt-2 font-display text-sm tracking-[0.5em] text-white/70">PALAVRAS</span>
      </h1>
      <GameIntro slug="caca-palavras" />

      <div className="grid w-full grid-cols-3 gap-2" role="radiogroup" aria-label="Dificuldade">
        {LEVELS.map((l) => (
          <button
            key={l}
            role="radio"
            aria-checked={level === l}
            onClick={() => chooseLevel(l)}
            className={`flex flex-col items-center gap-2 rounded-xl py-3 transition ${
              level === l ? "bg-gold/15 text-white ring-2 ring-gold" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <LevelBars level={l} className={`h-5 w-5 ${level === l ? "text-gold" : ""}`} />
            <span className="font-display text-xs">{LEVEL_LABEL[l]}</span>
            <span className={`font-display text-[10px] tabular-nums ${bests[l] !== undefined ? "text-gold/80" : "text-transparent"}`} title="Melhor tempo">
              {bests[l] !== undefined ? formatTime(bests[l]!) : "--:--"}
            </span>
          </button>
        ))}
      </div>

      <div className="flex w-full flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Tema">
        {[null, ...THEMES.map((t) => t.id)].map((id) => (
          <button
            key={id ?? "surpresa"}
            role="radio"
            aria-checked={theme === id}
            onClick={() => chooseTheme(id)}
            className={`rounded-full px-3 py-1.5 font-display text-[11px] uppercase transition ${
              theme === id ? "bg-gold text-stone-900" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {id ? themeName(id) : "Surpresa"}
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
            onClick={() => router.push(CACA_PLAY_PATH)}
            className="flex items-center justify-center gap-3 rounded-xl bg-emerald-600 py-3 font-display text-lg shadow-[0_4px_0_#065f46] transition active:translate-y-1 active:shadow-none"
          >
            Continuar
            <span className="flex items-center gap-2 rounded-full bg-black/25 px-2.5 py-1 text-xs tabular-nums">
              <LevelBars level={saved.level} className="h-3.5 w-3.5" />
              {saved.found.length}/{saved.words.length}
            </span>
          </button>
        )}
        <DailyButton game="caca-palavras" href={CACA_DAILY_PATH} />
      </div>
      <Link
        href={`${CACA_PATH}/como-jogar`}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
        Como jogar
      </Link>
      <AdSlot className="mt-6" />
    </main>
  );
}
