"use client";

import { useEffect, useMemo, useState } from "react";
import { accented, isSolved, MAX_GUESSES, MODES, solvedAt, status, type GameState, type Mode } from "@mesa/verbete";
import { DailyBadge } from "@/components/daily/common";
import { formatTime } from "@/components/sudoku/common";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { EyeIcon, InfinityIcon, ShareIcon } from "@/components/ui/icons";
import { dayNumber, msToNextDay } from "@/lib/daily/challenge";
import { dayKey, dayStreaks } from "@/lib/stats/achievements";
import { VERBETE_DAILY_PATH, VERBETE_FREE_PATH } from "@/lib/verbete/paths";
import { loadPlayed, localDays } from "@/lib/verbete/storage";

import { Share } from "./Share";
import { ModeIcon, MODE_NAME, Tile } from "./Tile";

/** Números do aparelho para este modo: da palavra do dia ou do livre. */
function useStats(mode: Mode, daily: boolean) {
  return useMemo(() => {
    const ps = loadPlayed().filter((p) => p.mode === mode && !!p.day === daily);
    const wins = ps.filter((p) => p.won);
    const dist = Array.from({ length: MAX_GUESSES[mode] }, (_, i) => wins.filter((p) => p.attempts === i + 1).length);
    const streak = dayStreaks(wins.filter((p) => p.onTime).map((p) => p.day!));
    return { games: ps.length, pct: ps.length ? Math.round((wins.length / ps.length) * 100) : 0, dist, streak };
  }, [mode, daily]);
}

/** Próximo passo depois de terminar: o próximo modo do mesmo dia que falta, ou o livre. */
function nextStep(mode: Mode, day?: string): { label: string; to?: string } {
  if (!day) return { label: "De novo" };
  const done = localDays();
  const order = [...MODES.slice(MODES.indexOf(mode) + 1), ...MODES.slice(0, MODES.indexOf(mode))];
  const m = order.find((x) => !["won", "lost"].includes(done[`${day}:${x}`]?.status ?? ""));
  return m ? { label: MODE_NAME[m], to: `${VERBETE_DAILY_PATH}/${day}?m=${m}` } : { label: "Livre", to: `${VERBETE_FREE_PATH}?m=${mode}` };
}

export function End({
  game,
  daily,
  onLeave,
  onHide,
  onAgain,
}: {
  game: GameState;
  daily?: string;
  onLeave: () => void;
  onHide: () => void;
  onAgain: (to?: string) => void;
}) {
  const mode = game.mode;
  const won = status(game) === "won";
  const stats = useStats(mode, !!daily);
  const [next, setNext] = useState<{ label: string; to?: string }>({ label: "De novo" });
  useEffect(() => setNext(nextStep(mode, daily)), [mode, daily]);

  const [sharing, setSharing] = useState(false);
  const title = daily ? `${MODE_NAME[mode]} #${dayNumber(daily)}` : `${MODE_NAME[mode]} livre`;

  const today = daily === dayKey(new Date());
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!today) return;
    const tick = () => setLeft(msToNextDay());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [today]);

  const max = Math.max(1, ...stats.dist);
  const mine = won ? game.guesses.length : null;

  return (
    <>
      <GameEnd
        won={won}
        badge={
          <span className="flex items-center gap-2 font-display text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <ModeIcon mode={mode} className="h-4 w-4 text-gold" />
              {MODE_NAME[mode].toUpperCase()}
            </span>
            {daily ? (
              <DailyBadge day={daily} />
            ) : (
              <span className="flex items-center gap-1.5">
                <InfinityIcon className="h-4 w-4 text-gold" />
                LIVRE
              </span>
            )}
          </span>
        }
        onLeave={onLeave}
        onAgain={() => onAgain(next.to)}
        againLabel={next.label}
        actions={
          <>
            <button
              onClick={onHide}
              aria-label="Ver as palavras"
              title="Ver as palavras"
              className="flex items-center rounded-xl bg-white/10 px-4 py-3 transition hover:bg-white/20 sm:px-5"
            >
              <EyeIcon />
            </button>
            <button
              onClick={() => setSharing(true)}
              aria-label="Compartilhar"
              title="Compartilhar"
              className="flex items-center rounded-xl bg-emerald-600 px-4 py-3 shadow-[0_4px_0_#065f46] transition hover:brightness-110 active:translate-y-1 active:shadow-none sm:px-5"
            >
              <ShareIcon />
            </button>
          </>
        }
      >
        <div className="flex w-full max-w-[18rem] flex-col items-center gap-5">
          {/* as palavras */}
          <div className={`grid gap-1.5 ${mode === 1 ? "" : "grid-cols-2 gap-x-3"}`}>
            {game.answers.map((a, b) => {
              const ok = isSolved(game, b);
              return (
                <span key={b} className="flex items-center gap-[3px]" title={ok ? `${solvedAt(game, b) + 1}ª tentativa` : "Não acertou"}>
                  {[...(accented(a) ?? a)].map((l, i) => (
                    <Tile
                      key={i}
                      letter={l.toUpperCase()}
                      mark={ok ? "right" : undefined}
                      className={`${mode === 1 ? "w-9 text-lg" : "w-6 text-xs"} ${ok ? "" : "!border-red-400/70 text-red-300"}`}
                    />
                  ))}
                </span>
              );
            })}
          </div>

          <div className="flex gap-5">
            <EndStat label="TENTATIVAS" value={`${won ? game.guesses.length : "X"}/${MAX_GUESSES[mode]}`} gold={won} />
            <EndStat label="JOGOS" value={stats.games} />
            <EndStat label="VITÓRIAS" value={`${stats.pct}%`} />
            {daily && <EndStat label="SEQUÊNCIA" value={stats.streak.current} />}
          </div>

          {/* vitórias por tentativa */}
          <div className="flex h-20 w-full items-end gap-1" aria-label="Vitórias por tentativa">
            {stats.dist.map((n, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1 font-display leading-none" title={`${n} na ${i + 1}ª`}>
                <span className={`text-[10px] ${mine === i + 1 ? "text-gold" : "text-white/50"}`}>{n}</span>
                <span
                  className={`w-full rounded-t ${mine === i + 1 ? "bg-gold" : "bg-white/20"}`}
                  style={{ height: `${Math.max(4, (n / max) * 100)}%`, maxHeight: "calc(100% - 28px)" }}
                />
                <span className="text-[10px] text-white/60">{i + 1}</span>
              </div>
            ))}
          </div>

          {left !== null && (
            <span className="flex items-center gap-2 font-display text-xs text-white/50">
              PRÓXIMA
              <span className="tabular-nums text-sm text-white/80">{formatTime(left)}</span>
            </span>
          )}
        </div>
      </GameEnd>
      {sharing && <Share game={game} title={title} streak={daily ? stats.streak.current : 0} onClose={() => setSharing(false)} />}
    </>
  );
}
