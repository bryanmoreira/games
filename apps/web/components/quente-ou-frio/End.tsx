"use client";

import { useEffect, useMemo, useState } from "react";
import { attempts, hintsUsed, shareText, status, type GameState } from "@mesa/quente-ou-frio";
import { DailyBadge } from "@/components/daily/common";
import { formatTime } from "@/components/sudoku/common";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { CheckIcon, EyeIcon, InfinityIcon, ShareIcon } from "@/components/ui/icons";
import { dayNumber, msToNextDay } from "@/lib/daily/challenge";
import type { Reveal } from "@/lib/quente-ou-frio/protocol";
import { loadPlayed } from "@/lib/quente-ou-frio/storage";
import { dayKey } from "@/lib/stats/achievements";
import { WordBar } from "./WordBar";

const SITE = "mesadejogos.com/quente-ou-frio";

/** Fim da partida: a palavra secreta, os números e as 100 palavras mais próximas. */
export function End({
  game,
  reveal,
  day,
  total,
  onLeave,
  onHide,
  onAgain,
}: {
  game: GameState;
  /** null enquanto a lista não chega do servidor */
  reveal: Reveal | null;
  day?: string;
  total: number;
  onLeave: () => void;
  onHide: () => void;
  onAgain: () => void;
}) {
  const won = status(game) === "won";
  const secret = reveal?.closest[0]?.word;
  const guessed = useMemo(() => new Set(game.moves.map((m) => m.word)), [game]);
  const stats = useMemo(() => {
    const ps = loadPlayed().filter((p) => !!p.day === !!day);
    return { games: ps.length, pct: ps.length ? Math.round((ps.filter((p) => p.won).length / ps.length) * 100) : 0 };
  }, [day]);

  const today = day === dayKey(new Date());
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!today) return;
    const tick = () => setLeft(msToNextDay());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [today]);

  const [copied, setCopied] = useState(false);
  const share = async () => {
    const text = `${shareText(game, day ? `Quente ou Frio #${dayNumber(day)}` : "Quente ou Frio")}\n\n${SITE}`;
    try {
      if (navigator.share && matchMedia("(hover: none)").matches) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  return (
    <GameEnd
      won={won}
      badge={
        day ? (
          <DailyBadge day={day} className="text-white/60" />
        ) : (
          <span className="flex items-center gap-1.5 font-display text-xs text-white/60">
            <InfinityIcon className="h-4 w-4 text-gold" />
            LIVRE
          </span>
        )
      }
      onLeave={onLeave}
      onAgain={onAgain}
      againLabel={day ? "Livre" : "De novo"}
      actions={
        <>
          <button
            onClick={onHide}
            aria-label="Ver os chutes"
            title="Ver os chutes"
            className="flex items-center rounded-xl bg-white/10 px-4 py-3 transition hover:bg-white/20 sm:px-5"
          >
            <EyeIcon />
          </button>
          <button
            onClick={share}
            aria-label="Compartilhar"
            title={copied ? "Copiado" : "Compartilhar"}
            className="flex items-center rounded-xl bg-emerald-600 px-4 py-3 shadow-[0_4px_0_#065f46] transition hover:brightness-110 active:translate-y-1 active:shadow-none sm:px-5"
          >
            {copied ? <CheckIcon className="h-5 w-5" /> : <ShareIcon />}
          </button>
        </>
      }
    >
      <div className="flex w-[min(20rem,80vw)] flex-col items-center gap-4">
        <span className={`font-display text-3xl uppercase tracking-wide ${won ? "text-emerald-300" : "text-red-300"} ${secret ? "" : "invisible"}`}>
          {secret ?? "…"}
        </span>

        <div className="flex gap-5">
          <EndStat label="TENTATIVAS" value={attempts(game)} gold={won} />
          <EndStat label="DICAS" value={hintsUsed(game)} />
          <EndStat label="JOGOS" value={stats.games} />
          <EndStat label="VITÓRIAS" value={`${stats.pct}%`} />
        </div>

        {/* as mais próximas: as que você chutou ficam acesas */}
        <div className="flex max-h-[30vh] w-full flex-col gap-1 overflow-y-auto rounded-xl bg-black/25 p-1.5 sm:max-h-56" aria-label="Palavras mais próximas">
          {reveal
            ? reveal.closest.slice(1).map((m) => (
                <div key={m.word} className={guessed.has(m.word) ? "" : "opacity-60"}>
                  <WordBar {...m} total={total} />
                </div>
              ))
            : Array.from({ length: 4 }, (_, i) => <div key={i} className="h-10 shrink-0 animate-pulse rounded-xl bg-white/5" />)}
        </div>

        {left !== null && (
          <span className="flex items-center gap-2 font-display text-xs text-white/50">
            PRÓXIMA
            <span className="tabular-nums text-sm text-white/80">{formatTime(left)}</span>
          </span>
        )}
      </div>
    </GameEnd>
  );
}
