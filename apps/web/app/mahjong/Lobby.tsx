"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LAYOUT_IDS, layoutName, newGame, remaining, type GameState } from "@mesa/mahjong";
import { BackButton } from "@/components/BackButton";
import { AdSlot } from "@/components/AdSlot";
import { DailyButton } from "@/components/daily/DailyButton";
import { GameIntro } from "@/components/seo";
import { formatTime, LayoutThumb, MahjongArt } from "@/components/mahjong/common";
import { XIcon } from "@/components/ui/buttons";
import { loadBests, loadGame, loadLayout, saveGame, saveLayout, type Bests } from "@/lib/mahjong/storage";
import { MAHJONG_DAILY_PATH, MAHJONG_PATH, MAHJONG_PLAY_PATH } from "@/lib/mahjong/paths";

/** Dado de 5 pontos: o formato surpresa. */
function DiceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function MahjongHome() {
  const router = useRouter();
  // null = surpresa
  const [layout, setLayout] = useState<string | null>(null);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [bests, setBests] = useState<Bests>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLayout(loadLayout());
    setBests(loadBests());
    const g = loadGame();
    setSaved(g && !g.won ? g : null);
  }, []);

  const choose = (id: string | null) => {
    setLayout(id);
    saveLayout(id);
    setConfirming(false);
  };

  // com partida em andamento, pede confirmação na própria página (confirm() nativo pode ser bloqueado)
  const [confirming, setConfirming] = useState(false);
  const start = () => {
    if (busy) return;
    if (saved && saved.removed.length > 0 && !confirming) return setConfirming(true);
    setBusy(true);
    setTimeout(() => {
      saveGame(newGame(layout));
      router.push(MAHJONG_PLAY_PATH);
    }, 30);
  };

  const won = LAYOUT_IDS.filter((id) => bests[id] !== undefined).length;

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <MahjongArt className="text-[17px]" />
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-[44px] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-6xl">MAHJONG</span>
        <span className="mt-2 font-display text-sm tracking-[0.5em] text-white/70">PACIÊNCIA</span>
      </h1>
      <GameIntro slug="mahjong" />

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
            className="banner flex flex-1 items-center justify-center gap-3 rounded-xl bg-gold py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none"
            key={confirming ? "confirm" : "new"}
          >
            {busy ? (
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-current border-r-transparent" aria-label="Gerando" />
            ) : (
              <>
                {confirming ? "Começar outra" : "Novo jogo"}
                <span className="rounded-full bg-black/15 px-2.5 py-1 text-xs uppercase">{layout ? layoutName(layout) : "Surpresa"}</span>
              </>
            )}
          </button>
        </div>
        {saved && (
          <button
            onClick={() => router.push(MAHJONG_PLAY_PATH)}
            className="flex items-center justify-center gap-3 rounded-xl bg-emerald-600 py-3 font-display text-lg shadow-[0_4px_0_#065f46] transition active:translate-y-1 active:shadow-none"
          >
            Continuar
            <span className="flex items-center gap-2 rounded-full bg-black/25 px-2.5 py-1 text-xs uppercase tabular-nums">
              {layoutName(saved.layout)} · {remaining(saved)}
            </span>
          </button>
        )}
        <DailyButton game="mahjong" href={MAHJONG_DAILY_PATH} />
      </div>

      <section className="flex w-full flex-col gap-3" aria-label="Formato">
        <div className="flex items-baseline justify-between px-1 font-display text-xs">
          <span className="tracking-[0.3em] text-white/60">FORMATO</span>
          {won > 0 && (
            <span className="text-gold/80" title="Formatos vencidos">
              {won}/{LAYOUT_IDS.length}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Formato">
          {[null, ...LAYOUT_IDS].map((id) => {
            const on = layout === id;
            const best = id ? bests[id] : undefined;
            return (
              <button
                key={id ?? "surpresa"}
                role="radio"
                aria-checked={on}
                onClick={() => choose(id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-1.5 pb-2 pt-2.5 transition ${
                  on ? "bg-gold/15 text-white ring-2 ring-gold" : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {id ? <LayoutThumb id={id} className="h-11 w-full" /> : <DiceIcon className={`h-11 w-11 ${on ? "text-gold" : ""}`} />}
                <span className="font-display text-[10px] uppercase leading-tight">{id ? layoutName(id) : "Surpresa"}</span>
                <span className={`font-display text-[10px] tabular-nums leading-none ${best !== undefined ? "text-gold/80" : "text-transparent"}`} title="Melhor tempo">
                  {best !== undefined ? formatTime(best) : "--:--"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <Link
        href={`${MAHJONG_PATH}/como-jogar`}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
        Como jogar
      </Link>
      <AdSlot className="mt-6" />
    </main>
  );
}
