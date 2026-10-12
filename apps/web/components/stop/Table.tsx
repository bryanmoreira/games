"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LETTERS, matchesLetter, REVIEW_MS, ROUND_END_MS, type PlayerView, type Seat } from "@truco/stop";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { STOP_PATH } from "@/lib/stop/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, XIcon } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { GameEnd } from "@/components/ui/GameEnd";
import { playCountdownSound, playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playLetterSound, playPointsSound, playStopSound, playTickSound, playVoteSound } from "@/lib/stop/sound";
import { Points, Tile } from "./Tile";
import { CheckIcon, ClockIcon } from "@/components/ui/icons";
import { useCountdown } from "@/lib/countdown";
import { HowToPlay } from "./HowToPlay";
import { SeatFace } from "@/components/ui/SeatFace";

const WRITE_DEBOUNCE = 300;

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const [help, setHelp] = useState(false);
  const over = view.phase === "gameOver";
  const left = useCountdown(room);

  useSounds(view, left);
  const shout = useShout(view);

  const leave = () => {
    send({ t: "leave" });
    router.push(STOP_PATH);
  };

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="relative z-40 flex items-center justify-between gap-2 px-2 py-2 sm:px-6">
        <div className="flex items-center gap-2 rounded-2xl bg-black/40 px-3 py-1.5 font-display leading-none sm:px-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-white/50">RODADA</span>
            <span className="text-xl">
              <span className="text-gold">{view.round}</span>
              <span className="text-white/40">/{view.settings.rounds}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <Players room={room} view={view} />

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-3 pb-3 sm:px-4">
        {view.phase === "letter" && <Roulette />}
        {view.phase === "writing" && <Writing key={`w-${view.gameNo}-${view.round}`} view={view} left={left} />}
        {view.phase === "review" && <Review room={room} view={view} left={left} />}
        {(view.phase === "roundEnd" || over) && <RoundEnd room={room} view={view} left={left} />}
      </div>

      {shout && <Shout key={`shout-${shout.id}`} room={room} stopper={shout.seat} />}

      {over && <End room={room} view={view} onLeave={leave} />}
      {help && (
        <HowToPlayModal game="STOP" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

/* ---------- jogadores ---------- */

function Players({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const cats = view.settings.categories.length;
  return (
    <div className="mx-auto flex w-full max-w-xl flex-wrap justify-center gap-x-1 gap-y-2 px-2 pb-3 sm:gap-x-3">
      {view.players.map((p) => {
        const me = p === view.seat;
        const away = view.away.includes(p);
        const ready = view.ready.includes(p);
        const progress = view.phase === "writing" ? view.progress[p] / cats : 0;
        return (
          <div key={p} className={`flex w-[3.6rem] flex-col items-center gap-1 sm:w-16 ${away ? "opacity-40" : ""}`}>
            <div className="relative h-11 w-11 sm:h-12 sm:w-12">
              <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="24" cy="24" r="21" fill="none" strokeWidth="4" className="stroke-white/10" />
                <circle
                  cx="24"
                  cy="24"
                  r="21"
                  fill="none"
                  strokeWidth="4"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${progress * 100} 100`}
                  className={`transition-[stroke-dasharray] duration-300 ${me ? "stroke-gold" : "stroke-emerald-400"} ${progress > 0 ? "" : "opacity-0"}`}
                />
              </svg>
              <span
                className={`absolute inset-[5px] flex items-center justify-center overflow-hidden rounded-full bg-stone-800 font-display text-lg ${
                  me ? "text-gold ring-2 ring-gold/70" : "text-white"
                }`}
              >
                <SeatFace seat={room.seats[p]} />
              </span>
              {ready && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-stone-900">
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
            </div>
            <span className={`max-w-full truncate text-[11px] font-semibold ${me ? "text-gold" : "text-white/80"}`}>{room.seats[p]?.name}</span>
            <span className="-mt-1 font-display text-[11px] text-white/50">{view.scores[p]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- letra ---------- */

/** Roleta enquanto o servidor sorteia; a letra só chega quando a escrita começa. */
function Roulette() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setI((n) => n + 1 + Math.floor(Math.random() * 5));
      playTickSound();
    }, 90);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <Tile letter={LETTERS[i % LETTERS.length]} className="h-32 w-32 text-7xl sm:h-40 sm:w-40 sm:text-8xl" />
    </div>
  );
}

/* ---------- escrita ---------- */

function Writing({ view, left }: { view: PlayerView; left: number | null }) {
  const letter = view.letter!;
  const [answers, setAnswers] = useState<string[]>(() => view.myAnswers.slice());
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const canStop = view.canWrite && answers.every((a) => matchesLetter(a, letter));

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const change = (cat: number, text: string) => {
    setAnswers((a) => a.map((x, i) => (i === cat ? text : x)));
    clearTimeout(timers.current[cat]);
    timers.current[cat] = setTimeout(() => send({ t: "action", action: { type: "write", cat, text } }), WRITE_DEBOUNCE);
  };

  const stop = () => {
    if (!canStop) return;
    Object.values(timers.current).forEach(clearTimeout);
    send({ t: "action", action: { type: "stop", answers } });
  };

  return (
    <>
      <div className="flex items-center justify-center gap-4 pb-4">
        <Tile letter={letter} className="banner h-20 w-20 text-5xl sm:h-24 sm:w-24 sm:text-6xl" />
        {left !== null && <Clock left={left} total={view.settings.time} />}
      </div>

      <div className="flex flex-col rounded-2xl bg-[#fbf6e9] px-4 py-2 text-stone-800 shadow-xl shadow-black/40">
        {view.categories.map((c, i) => {
          const a = answers[i] ?? "";
          const ok = matchesLetter(a, letter);
          const wrong = a.trim() !== "" && !ok;
          return (
            <label key={c.id} className="flex items-center gap-2 border-b border-stone-300/70 py-1.5 last:border-0">
              <span className="flex flex-1 flex-col">
                <span className="font-display text-[10px] tracking-wide text-stone-500">{c.name.toUpperCase()}</span>
                <input
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  value={a}
                  maxLength={40}
                  disabled={!view.canWrite}
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  enterKeyHint={i < view.categories.length - 1 ? "next" : "done"}
                  onChange={(e) => change(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const next = inputs.current[i + 1];
                    if (next) next.focus();
                    else if (canStop) stop();
                  }}
                  onFocus={(e) => e.currentTarget.scrollIntoView({ block: "nearest", behavior: "smooth" })}
                  placeholder={`${letter}...`}
                  className={`w-full bg-transparent text-lg font-semibold outline-none placeholder:text-stone-300 ${wrong ? "text-red-600" : ""}`}
                />
              </span>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${ok ? "bg-emerald-500 text-white" : wrong ? "bg-red-500 text-white" : ""}`}>
                {ok ? <CheckIcon className="h-4 w-4" /> : wrong ? <XIcon /> : null}
              </span>
            </label>
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-auto pt-4 pb-1">
        <button
          onClick={stop}
          disabled={!canStop}
          className="w-full rounded-2xl bg-red-500 py-4 font-display text-3xl tracking-wider text-white shadow-[0_5px_0_#991b1b] transition active:translate-y-1 active:shadow-none disabled:bg-stone-700 disabled:text-white/30 disabled:shadow-[0_5px_0_#292524]"
        >
          STOP!
        </button>
      </div>
    </>
  );
}

/** Relógio da rodada: barra que esvazia + m:ss (vermelho nos últimos 10 s). */
function Clock({ left, total }: { left: number; total: number }) {
  const s = Math.ceil(left / 1000);
  const low = s <= 10;
  return (
    <div className={`flex flex-col items-center gap-1 font-display ${low ? "text-red-400" : "text-white/80"}`}>
      <span className={`flex items-center gap-1 text-2xl ${low ? "animate-pulse" : ""}`}>
        <ClockIcon className="h-5 w-5" />
        {`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}
      </span>
      {total > 0 && (
        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
          <span className={`block h-full rounded-full ${low ? "bg-red-400" : "bg-gold"}`} style={{ width: `${Math.min(100, (left / (total * 1000)) * 100)}%` }} />
        </span>
      )}
    </div>
  );
}

/* ---------- correção ---------- */

function Review({ room, view, left }: { room: RoomInfo; view: PlayerView; left: number | null }) {
  const cat = view.review;
  const cats = view.categories.length;
  const letter = view.letter!;

  const vote = (target: Seat, against: boolean) => send({ t: "action", action: { type: "vote", target, against } });

  return (
    <>
      <div className="flex items-center gap-3 pb-3">
        <Tile letter={letter} className="h-12 w-12 text-3xl" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-1">
            {Array.from({ length: cats }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < cat ? "bg-gold/60" : i === cat ? "bg-gold" : "bg-white/10"}`} />
            ))}
          </div>
          <h2 key={`cat-${cat}`} className="banner mt-1.5 font-display text-xl leading-tight text-gold sm:text-2xl">
            {view.categories[cat].name.toUpperCase()}
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {view.players.map((p) => {
          const text = view.answers![p][cat]?.trim() ?? "";
          const valid = matchesLetter(text, letter);
          const annulled = view.annulled![p];
          const pts = view.points![p];
          const voters = view.votes![p];
          const mine = voters.includes(view.seat);
          const canVote = view.votable.includes(p);
          const me = p === view.seat;
          return (
            <div key={p} className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${me ? "bg-gold/10 ring-1 ring-gold/40" : "bg-white/5"}`}>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={`truncate text-[11px] font-semibold ${me ? "text-gold" : "text-white/50"}`}>{room.seats[p]?.name}</span>
                <span
                  className={`break-words text-lg font-semibold leading-snug ${
                    !text ? "text-white/25" : !valid || annulled ? "text-red-400/80 line-through decoration-2" : "text-white"
                  }`}
                >
                  {text || "—"}
                </span>
              </div>
              {voters.length > 0 && (
                <span className="flex items-center gap-0.5 font-display text-xs text-red-400" title="Votos contra">
                  <XIcon />
                  {voters.length}
                </span>
              )}
              <Points value={pts} />
              {canVote ? (
                <button
                  onClick={() => vote(p, !mine)}
                  aria-pressed={mine}
                  aria-label={mine ? "Tirar voto" : "Anular"}
                  title={mine ? "Tirar voto" : "Anular"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                    mine ? "bg-red-500 text-white shadow-[0_3px_0_#991b1b]" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <XIcon />
                </button>
              ) : (
                <span className="w-10 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <ReadyBar view={view} left={left} />
    </>
  );
}

/** PRONTO (todos prontos = avança) + quantos já confirmaram + tempo da fase. */
function ReadyBar({ view, left }: { view: PlayerView; left: number | null }) {
  const here = view.players.filter((p) => !view.away.includes(p));
  const done = here.filter((p) => view.ready.includes(p)).length;
  const total = view.phase === "review" ? REVIEW_MS : ROUND_END_MS;
  return (
    <div className="sticky bottom-0 mt-auto flex flex-col gap-2 pt-4 pb-1">
      {left !== null && (
        <span className="h-1 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full rounded-full bg-white/40 transition-[width] duration-300 ease-linear" style={{ width: `${Math.min(100, (left / total) * 100)}%` }} />
        </span>
      )}
      <button
        onClick={() => send({ t: "action", action: { type: "ready" } })}
        disabled={!view.canReady}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-3.5 font-display text-xl shadow-[0_4px_0_#065f46] transition active:translate-y-1 active:shadow-none disabled:bg-stone-700 disabled:text-white/50 disabled:shadow-[0_4px_0_#292524]"
      >
        {view.canReady ? "PRONTO" : <CheckIcon className="h-6 w-6" />}
        <span className="rounded-full bg-black/25 px-2 py-0.5 text-sm">
          {done}/{here.length}
        </span>
      </button>
    </div>
  );
}

/* ---------- placar da rodada ---------- */

function RoundEnd({ room, view, left }: { room: RoomInfo; view: PlayerView; left: number | null }) {
  const last = view.history.at(-1);
  if (!last) return null;
  const roundPts = (p: Seat) => last.points[p].reduce((a, b) => a + b, 0);
  const ranked = [...view.players].sort((a, b) => view.scores[b] - view.scores[a] || a - b);

  return (
    <>
      <div className="flex items-center justify-center gap-3 pb-4">
        <Tile letter={last.letter} className="h-12 w-12 text-3xl" />
        <span className="font-display text-2xl text-gold">PLACAR</span>
      </div>
      <div className="flex flex-col gap-2">
        {ranked.map((p, i) => {
          const me = p === view.seat;
          return (
            <div key={p} className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 font-display ${me ? "bg-gold/10 ring-1 ring-gold/40" : "bg-white/5"}`}>
              <span className="w-6 text-center text-white/40">{i + 1}º</span>
              <span className={`flex-1 truncate font-sans text-lg font-semibold ${me ? "text-gold" : ""}`}>{room.seats[p]?.name}</span>
              <span className="text-sm text-emerald-400">+{roundPts(p)}</span>
              <span className="w-14 text-right text-2xl">{view.scores[p]}</span>
            </div>
          );
        })}
      </div>
      {view.phase === "roundEnd" && <ReadyBar view={view} left={left} />}
    </>
  );
}

function End({ room, view, onLeave }: { room: RoomInfo; view: PlayerView; onLeave: () => void }) {
  const best = Math.max(...view.players.map((p) => view.scores[p]));
  const top = view.players.filter((p) => view.scores[p] === best);
  const ranked = [...view.players].sort((a, b) => view.scores[b] - view.scores[a] || a - b);
  // quem saiu não volta no "De novo": só dá para recomeçar com gente suficiente na sala
  const enough = room.canStart;
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 900);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;

  return (
    <GameEnd
      won={top.length === 1 && top[0] === view.seat}
      draw={top.length > 1 && top.includes(view.seat)}
      onLeave={onLeave}
      onAgain={room.isHost && enough ? () => send({ t: "restart" }) : undefined}
    >
      <ol className="flex w-64 max-w-full flex-col gap-1 font-display">
        {ranked.map((p, i) => (
          <li key={p} className={`flex items-center gap-3 rounded-xl px-3 py-1.5 ${p === view.seat ? "bg-gold/15 text-gold" : "text-white/80"}`}>
            <span className="w-6 text-white/40">{i + 1}º</span>
            <span className="flex-1 truncate font-sans font-semibold">{room.seats[p]?.name}</span>
            <span className="text-xl">{view.scores[p]}</span>
          </li>
        ))}
      </ol>
    </GameEnd>
  );
}

/* ---------- STOP! / TEMPO! ---------- */

function Shout({ room, stopper }: { room: RoomInfo; stopper: Seat | null }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="stop-shout flex flex-col items-center gap-2 rounded-3xl bg-red-500 px-10 py-5 shadow-[0_8px_0_#991b1b,0_20px_60px_rgba(0,0,0,0.6)]">
        {stopper === null ? (
          <span className="flex items-center gap-3 font-display text-5xl text-white">
            <ClockIcon className="h-10 w-10" />
            TEMPO!
          </span>
        ) : (
          <>
            <span className="font-display text-6xl tracking-wider text-white">STOP!</span>
            <span className="text-sm font-semibold text-white/90">{room.seats[stopper]?.name}</span>
          </>
        )}
      </div>
    </div>
  );
}

/** Mostra o STOP!/TEMPO! quando a escrita acaba (não ao entrar já na correção). */
function useShout(view: PlayerView) {
  const [shout, setShout] = useState<{ id: string; seat: Seat | null } | null>(null);
  const prev = useRef(view.phase);
  useEffect(() => {
    const was = prev.current;
    prev.current = view.phase;
    if (was !== "writing" || view.phase !== "review") return;
    setShout({ id: `${view.gameNo}-${view.round}`, seat: view.stoppedBy });
    const t = setTimeout(() => setShout(null), 1500);
    return () => clearTimeout(t);
  }, [view.phase, view.gameNo, view.round, view.stoppedBy]);
  return shout;
}

/* ---------- tempo e sons ---------- */

function useSounds(view: PlayerView, left: number | null) {
  useAudioUnlock();
  const prev = useRef({ phase: view.phase, votes: countVotes(view), sec: left === null ? null : Math.ceil(left / 1000) });

  useEffect(() => {
    const p = prev.current;
    const votes = countVotes(view);
    const sec = left === null ? null : Math.ceil(left / 1000);
    prev.current = { phase: view.phase, votes, sec };

    if (view.phase !== p.phase) {
      if (view.phase === "writing") playLetterSound();
      else if (view.phase === "review" && p.phase === "writing") playStopSound();
      else if (view.phase === "roundEnd") playPointsSound();
      else if (view.phase === "gameOver") {
        const best = Math.max(...view.players.map((s) => view.scores[s]));
        setTimeout(view.scores[view.seat] === best ? playWinSound : playLoseSound, 700);
      }
      return;
    }
    if (view.phase === "review" && votes !== p.votes) playVoteSound(votes > p.votes);
    if (view.phase === "writing" && sec !== null && p.sec !== null && sec < p.sec && sec <= 5) playCountdownSound(sec === 0);
  }, [view, left]);
}

const countVotes = (v: PlayerView) => (v.votes ? Object.values(v.votes).reduce((n, list) => n + list.length, 0) : 0);
