"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isRed, newGame, scoreOf, SUIT_SETS, type GameState, type SuitCount } from "@truco/spider";
import { BackButton } from "@/components/BackButton";
import { CardImg } from "@/components/cards/Card";
import { SuitIcon } from "@/components/spider/SpiderCard";
import { XIcon } from "@/components/ui/buttons";
import { loadGame, loadSuits, saveGame, saveSuits } from "@/lib/spider/storage";
import { SPIDER_PATH, SPIDER_PLAY_PATH } from "@/lib/spider/paths";

const CASCADE = [
  { rank: 13, suit: "spades" },
  { rank: 12, suit: "spades" },
  { rank: 11, suit: "spades" },
  { rank: 10, suit: "spades" },
];

const LEVELS: { n: SuitCount; label: string }[] = [
  { n: 1, label: "FÁCIL" },
  { n: 2, label: "MÉDIO" },
  { n: 4, label: "DIFÍCIL" },
];

function Suits({ n, className = "h-5 w-5" }: { n: SuitCount; className?: string }) {
  return (
    <span className="flex gap-0.5">
      {SUIT_SETS[n].map((s) => (
        <SuitIcon key={s} suit={s} className={`${className} ${isRed(s) ? "text-red-400" : ""}`} />
      ))}
    </span>
  );
}

export default function SpiderHome() {
  const router = useRouter();
  const [suits, setSuits] = useState<SuitCount>(1);
  const [saved, setSaved] = useState<GameState | null>(null);

  useEffect(() => {
    setSuits(loadSuits());
    const g = loadGame();
    setSaved(g && !g.won ? g : null);
  }, []);

  const choose = (n: SuitCount) => {
    setSuits(n);
    saveSuits(n);
  };

  // com partida em andamento, pede confirmação na própria página (confirm() nativo pode ser bloqueado)
  const [confirming, setConfirming] = useState(false);
  const start = () => {
    if (saved && saved.moves > 0 && !confirming) return setConfirming(true);
    saveGame(newGame(suits));
    router.push(SPIDER_PLAY_PATH);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <div className="relative h-44 w-20">
        {CASCADE.map((c, i) => (
          <div key={c.rank} className="absolute left-0 w-20" style={{ top: i * 22 }}>
            <CardImg card={c} />
          </div>
        ))}
      </div>
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-[44px] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c] sm:text-6xl">PACIÊNCIA</span>
        <span className="mt-2 font-display text-sm tracking-[0.5em] text-white/70">SPIDER</span>
      </h1>

      <div className="grid w-full grid-cols-3 gap-2" role="radiogroup" aria-label="Dificuldade">
        {LEVELS.map(({ n, label }) => (
          <button
            key={n}
            role="radio"
            aria-checked={suits === n}
            onClick={() => choose(n)}
            className={`flex flex-col items-center gap-2 rounded-xl py-3 transition ${
              suits === n ? "bg-gold/15 text-white ring-2 ring-gold" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Suits n={n} />
            <span className="font-display text-xs">{label}</span>
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
            className="banner flex-1 rounded-xl bg-gold py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none"
            key={confirming ? "confirm" : "new"}
          >
            {confirming ? "Começar outra" : "Novo jogo"}
          </button>
        </div>
        {saved && (
          <button
            onClick={() => router.push(SPIDER_PLAY_PATH)}
            className="flex items-center justify-center gap-3 rounded-xl bg-emerald-600 py-3 font-display text-lg shadow-[0_4px_0_#065f46] transition active:translate-y-1 active:shadow-none"
          >
            Continuar
            <span className="flex items-center gap-2 rounded-full bg-black/25 px-2.5 py-1 text-xs">
              <Suits n={saved.suits} className="h-3.5 w-3.5" />
              {scoreOf(saved)}
            </span>
          </button>
        )}
      </div>
      <Link
        href={`${SPIDER_PATH}/como-jogar`}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
        Como jogar
      </Link>
    </main>
  );
}
