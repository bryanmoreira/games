"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clueError, MAX_CLUE, OTHER_CARDS, roleOf, STARTER_CARDS, teamOf, type Key, type PlayerView, type Seat, type Team } from "@truco/codenames";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { CODENAMES_PATH } from "@/lib/codenames/paths";
import { useCountdown } from "@/lib/countdown";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, Icon, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { GameEnd } from "@/components/ui/GameEnd";
import { ClockIcon, InfinityIcon } from "@/components/ui/icons";
import { playCountdownSound, playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playClueSound, playRevealSound } from "@/lib/codenames/sound";
import { EyeIcon, SendIcon, SkullIcon, TEAM, WordCard, type Mark } from "./Board";
import { HowToPlay } from "./HowToPlay";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const [help, setHelp] = useState(false);
  const over = view.phase === "gameOver";
  const left = useCountdown(room);
  const timeout = useTimeoutShout(view);
  useSounds(view, left);

  const leave = () => {
    send({ t: "leave" });
    router.push(CODENAMES_PATH);
  };

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="relative z-40 flex items-center justify-between gap-2 px-2 py-2 sm:px-6">
        {view.spectator ? (
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-display text-xs text-white/70" title="Assistindo">
            <EyeIcon className="h-4 w-4" />
            ASSISTINDO
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over && !view.spectator} />
        </div>
      </header>

      <div className="cn-layout mx-auto w-full max-w-[1280px] flex-1 px-2 pb-3 sm:px-4">
        {([0, 1] as Team[]).map((team) => (
          <div key={team} className="flex flex-col gap-2" style={{ gridArea: team === 0 ? "red" : "blue" }}>
            <TeamPanel room={room} view={view} team={team} />
            {/* desktop: as palavras chutadas do time embaixo do painel dele */}
            <TeamHistory room={room} view={view} team={team} className="hidden lg:flex" />
          </div>
        ))}
        <div className={`${BOARD_WIDTH} [grid-area:status]`}>
          <Status view={view} left={left} />
        </div>
        <div className={`${BOARD_WIDTH} flex flex-col gap-2 [grid-area:board]`}>
          <Grid room={room} view={view} />
          <Actions view={view} />
          <History room={room} view={view} />
        </div>
      </div>

      {timeout && <TimeoutShout key={`timeout-${timeout.id}`} team={timeout.team} />}
      {over && !view.spectator && <End key={`end-${view.gameNo}`} room={room} view={view} onLeave={leave} />}
      {help && (
        <HowToPlayModal game="CODENAMES" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

/** Largura da mesa limitada pela altura da tela, para caber sem rolar. */
const BOARD_WIDTH = "mx-auto w-full max-w-[min(100%,calc((100dvh-22rem)*1.5))] lg:max-w-[min(100%,calc((100dvh-12rem)*1.5))]";

/* ---------- times ---------- */

/** Quem precisa agir agora (mestre na dica, agentes nos toques). */
const acting = (view: PlayerView, seat: Seat) =>
  view.phase !== "gameOver" && teamOf(seat) === view.turn && roleOf(seat) === (view.phase === "clue" ? "master" : "agent");

function TeamPanel({ room, view, team }: { room: RoomInfo; view: PlayerView; team: Team }) {
  const t = TEAM[team];
  const seats = view.players.filter((p) => teamOf(p) === team).sort((a, b) => Number(roleOf(a) === "agent") - Number(roleOf(b) === "agent") || a - b);
  const turn = view.turn === team && view.phase !== "gameOver";
  return (
    <section
      className={`flex flex-1 flex-col gap-2 rounded-2xl border-2 p-2 transition sm:p-3 lg:flex-none ${t.border} ${t.soft} ${turn ? `ring-2 ${t.ring}` : "opacity-80"}`}
    >
      <div className={`flex items-center justify-between gap-1 font-display leading-none ${t.text}`}>
        <span className="text-2xl sm:text-3xl lg:text-4xl">{view.left[team]}</span>
        <span className="truncate text-[10px] tracking-wider sm:text-xs">{t.name}</span>
      </div>
      <div className="flex flex-col gap-0.5 lg:gap-1">
        {seats.map((p) => (
          <Player key={p} name={room.seats[p]?.name ?? ""} image={room.seats[p]?.image} frame={room.seats[p]?.frame} team={team} master={roleOf(p) === "master"} me={p === view.seat} glow={acting(view, p)} away={!room.seats[p]?.connected} />
        ))}
      </div>
    </section>
  );
}

/** Uma linha por jogador: inicial, nome inteiro e o olho no mestre. */
function Player({ name, image, frame, team, master, me, glow, away }: { name: string; image?: string | null; frame?: string | null; team: Team; master: boolean; me: boolean; glow: boolean; away: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-1 py-0.5 lg:gap-2 lg:px-1.5 lg:py-1 ${master ? "bg-black/25" : ""} ${away ? "opacity-40" : ""}`} title={name}>
      <Framed frame={frame}>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-800 font-display text-[10px] ring-2 lg:h-7 lg:w-7 lg:text-xs ${TEAM[team].ring} ${
            glow ? "turn-glow" : ""
          } ${me ? "text-gold" : "text-white"}`}
        >
          <SeatFace seat={{ kind: "human", name, image }} />
        </span>
      </Framed>
      <span className={`min-w-0 flex-1 truncate text-xs font-semibold lg:text-sm ${me ? "text-gold" : "text-white/80"}`}>{name}</span>
      {master && <EyeIcon className={`h-4 w-4 shrink-0 ${TEAM[team].text}`} />}
    </div>
  );
}

/* ---------- dica e relógio ---------- */

function Status({ view, left }: { view: PlayerView; left: number | null }) {
  const t = TEAM[view.turn];
  const clue = view.clue;
  return (
    <div className="flex min-h-12 items-center justify-center gap-2 sm:min-h-14">
      {view.phase === "clue" && (
        <span key={`wait-${view.phaseNo}`} className={`banner flex items-center gap-2 rounded-full px-4 py-2 text-white ${t.bg}`} title="Mestre pensando na dica">
          <EyeIcon className="h-5 w-5" />
          <Dots />
        </span>
      )}
      {clue && (
        <span key={`clue-${view.phaseNo}`} className="banner flex items-center gap-2">
          <span className={`flex h-10 items-center rounded-lg bg-[#f3ead3] px-3 font-display text-lg uppercase text-stone-800 ring-[3px] sm:h-12 sm:text-2xl ${t.ring}`}>
            {clue.word}
          </span>
          <span className={`flex h-10 w-10 items-center justify-center rounded-lg font-display text-xl text-white sm:h-12 sm:w-12 sm:text-2xl ${t.bg} ${t.shadow}`}>
            {clue.number === null ? <InfinityIcon className="h-6 w-6" /> : clue.number}
          </span>
          {clue.number !== null && clue.number > 0 && (
            <span className="flex gap-1" title="Toques">
              {Array.from({ length: clue.number + 1 }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < clue.guesses.length ? "bg-white/15" : t.bg}`} />
              ))}
            </span>
          )}
        </span>
      )}
      {view.winner !== null && (
        <span className={`banner flex items-center gap-2 rounded-full px-4 py-2 font-display text-white ${TEAM[view.winner].bg}`}>
          <span aria-hidden="true">🏆</span>
          {TEAM[view.winner].name}
        </span>
      )}
      {left !== null && <Clock left={left} total={view.time} />}
    </div>
  );
}

function Dots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  );
}

function Clock({ left, total }: { left: number; total: number }) {
  const s = Math.ceil(left / 1000);
  const low = s <= 10;
  return (
    <span className={`relative ml-1 flex items-center gap-1 overflow-hidden rounded-full bg-black/40 px-3 py-1.5 font-display text-sm ${low ? "animate-pulse text-red-400" : "text-white/80"}`}>
      <ClockIcon className="h-4 w-4" />
      {`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`}
      <span className={`absolute bottom-0 left-0 h-0.5 ${low ? "bg-red-400" : "bg-gold"}`} style={{ width: `${Math.min(100, (left / (total * 1000)) * 100)}%` }} />
    </span>
  );
}

/* ---------- mesa ---------- */

function Grid({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const mine = view.marks[view.seat] ?? [];
  const marks: Record<number, Mark[]> = {};
  for (const [seat, list] of Object.entries(view.marks)) {
    const s = Number(seat);
    for (const index of list)
      (marks[index] ??= []).push({ initial: (room.seats[s]?.name || "?").slice(0, 1).toUpperCase(), team: teamOf(s), mine: s === view.seat });
  }

  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-2">
      {view.cards.map((c, i) => (
        <div key={`${view.gameNo}-${i}`} className="cn-deal @container relative" style={{ animationDelay: `${i * 25}ms` }}>
          <WordCard
            word={c.word}
            k={c.key}
            revealed={c.revealed}
            selected={mine.includes(i)}
            marks={marks[i]}
            flip={c.revealed && view.last?.index === i}
            onClick={view.canGuess && !c.revealed ? () => send({ t: "action", action: { type: "mark", index: i } }) : undefined}
          />
          {view.canGuess && !c.revealed && mine.includes(i) && <RevealButton word={c.word} onClick={() => send({ t: "action", action: { type: "guess", index: i } })} />}
        </div>
      ))}
    </div>
  );
}

/** Revelar a palavra marcada (uma por vez): botão no canto do cartão. */
function RevealButton({ word, onClick }: { word: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Revelar ${word}`}
      title="Revelar"
      className="banner absolute right-[4%] top-[6%] flex h-[min(24cqw,26px)] w-[min(24cqw,26px)] items-center justify-center rounded-full bg-gold text-stone-900 shadow-[0_2px_0_#9a6b12] ring-2 ring-stone-900/30 transition before:absolute before:-inset-2 before:content-[''] hover:brightness-110 active:translate-y-0.5 active:shadow-none"
    >
      <Icon className="h-[60%] w-[60%]">
        <path d="m5 12 5 5 9-10" />
      </Icon>
    </button>
  );
}

/* ---------- ações ---------- */

function Actions({ view }: { view: PlayerView }) {
  if (view.canClue) return <ClueForm key={`form-${view.phaseNo}`} view={view} />;
  if (!view.canGuess) return <div className="min-h-14" />;
  return (
    <div className="flex min-h-14 items-center justify-center gap-2">
      <button
        disabled={!view.canPass}
        onClick={() => send({ t: "action", action: { type: "pass" } })}
        className="h-12 rounded-xl bg-white/15 px-8 font-display text-lg transition hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15"
      >
        PASSAR
      </button>
    </div>
  );
}

/** Números da dica: 0 a 9 e ∞ (null). */
const NUMBERS: (number | null)[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, null];

function ClueForm({ view }: { view: PlayerView }) {
  const [word, setWord] = useState("");
  const [n, setN] = useState(2); // índice em NUMBERS
  const t = TEAM[view.team];
  const error = word.trim() ? clueError(view, word) : null;
  const ok = !!word.trim() && !error;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ok) send({ t: "action", action: { type: "clue", word: word.trim(), number: NUMBERS[n] } });
  };

  return (
    <form onSubmit={submit} className="relative flex min-h-14 items-center gap-2">
      {error && <span className="banner absolute -top-5 left-1 text-xs font-semibold text-red-300">{error}</span>}
      <input
        autoFocus
        value={word}
        maxLength={MAX_CLUE}
        onChange={(e) => setWord(e.target.value.replace(/\s/g, ""))}
        placeholder="DICA"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="send"
        aria-invalid={!!error}
        className={`h-12 w-0 min-w-0 flex-1 rounded-xl bg-[#f3ead3] px-3 font-display text-lg uppercase text-stone-800 outline-none ring-[3px] placeholder:text-stone-400 ${
          error ? "ring-red-400" : t.ring
        }`}
      />
      <div className="flex h-12 items-center rounded-xl bg-black/40">
        <StepButton label="Menos" disabled={n === 0} onClick={() => setN(n - 1)}>
          <path d="M5 12h14" />
        </StepButton>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg font-display text-xl text-white ${t.bg}`}>
          {NUMBERS[n] === null ? <InfinityIcon className="h-5 w-5" /> : NUMBERS[n]}
        </span>
        <StepButton label="Mais" disabled={n === NUMBERS.length - 1} onClick={() => setN(n + 1)}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </StepButton>
      </div>
      <button
        type="submit"
        disabled={!ok}
        aria-label="Dar dica"
        title="Dar dica"
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white transition active:translate-y-1 active:shadow-none disabled:bg-stone-700 disabled:text-white/30 disabled:shadow-none ${t.bg} ${t.shadow}`}
      >
        <SendIcon className="h-6 w-6" />
      </button>
    </form>
  );
}

function StepButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 w-9 items-center justify-center text-white/70 transition hover:text-white disabled:opacity-25 sm:w-10"
    >
      <Icon className="h-4 w-4">{children}</Icon>
    </button>
  );
}

/* ---------- histórico de dicas ---------- */

/** Celular: as dicas dos dois times embaixo da mesa (no desktop elas ficam sob os painéis). */
function History({ room, view }: { room: RoomInfo; view: PlayerView }) {
  if (view.clues.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 pt-1 lg:hidden">
      {([0, 1] as Team[]).map((team) => (
        <TeamHistory key={team} room={room} view={view} team={team} className="flex" />
      ))}
    </div>
  );
}

/** Dicas de um time e as palavras chutadas com cada uma. */
function TeamHistory({ room, view, team, className }: { room: RoomInfo; view: PlayerView; team: Team; className: string }) {
  const clues = view.clues.filter((c) => c.team === team);
  if (clues.length === 0) return null;
  return (
    <ol className={`flex-col gap-1 ${className}`}>
      {clues.map((c, i) => (
        <li key={i} className="flex flex-col gap-1 rounded-lg bg-white/5 px-2 py-1.5" title={room.seats[c.seat]?.name}>
          <span className="flex items-baseline gap-1.5">
            <span className={`break-all font-display text-xs uppercase ${TEAM[team].text}`}>{c.word}</span>
            <span className="font-display text-xs text-white/60">{c.number === null ? "∞" : c.number}</span>
          </span>
          {c.guesses.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {c.guesses.map((g) => (
                <GuessChip key={g} word={view.cards[g].word} k={view.cards[g].key} />
              ))}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Palavra chutada no histórico, com a cor do que ela era. */
function GuessChip({ word, k }: { word: string; k: Key | null }) {
  const look =
    k === 0 ? "bg-cn-red text-white" : k === 1 ? "bg-cn-blue text-white" : k === "assassin" ? "bg-stone-950 text-white ring-1 ring-white/40" : "bg-[#cbb98c] text-[#4a3c1d]";
  return (
    <span className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase leading-none ${look}`}>
      {k === "assassin" && <SkullIcon className="h-3 w-3" />}
      {word}
    </span>
  );
}

/* ---------- tempo esgotado ---------- */

function TimeoutShout({ team }: { team: Team }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <span className={`stop-shout flex items-center gap-3 rounded-3xl px-8 py-4 font-display text-4xl text-white ${TEAM[team].bg} ${TEAM[team].shadow}`}>
        <ClockIcon className="h-9 w-9" />
        TEMPO!
      </span>
    </div>
  );
}

/** Mostra "TEMPO!" quando a vez passa por tempo (não ao entrar na sala). */
function useTimeoutShout(view: PlayerView) {
  const [shout, setShout] = useState<{ id: number; team: Team } | null>(null);
  const prev = useRef(view.timeout?.id);
  useEffect(() => {
    const id = view.timeout?.id;
    if (id === prev.current) return;
    prev.current = id;
    if (!view.timeout) return;
    setShout({ id: view.timeout.id, team: view.timeout.team });
    const t = setTimeout(() => setShout(null), 1400);
    return () => clearTimeout(t);
  }, [view.timeout]);
  return shout;
}

/* ---------- fim ---------- */

function End({ room, view, onLeave }: { room: RoomInfo; view: PlayerView; onLeave: () => void }) {
  const [show, setShow] = useState(false);
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1600);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  const won = view.winner === view.team;

  // olhando o mapa: um botão para voltar ao resultado
  if (peek) {
    return (
      <button
        onClick={() => setPeek(false)}
        className="banner fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-stone-900 px-5 py-3 font-display text-lg ring-2 ring-gold/50"
      >
        <span aria-hidden="true">{won ? "🏆" : "💀"}</span>
        <span className={won ? "text-gold" : "text-red-400"}>{won ? "VITÓRIA!" : "DERROTA"}</span>
      </button>
    );
  }

  const total = (team: Team) => (team === view.starter ? STARTER_CARDS : OTHER_CARDS);
  return (
    <GameEnd
      won={won}
      badge={
        view.reason === "assassin" ? (
          <span className="flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-1 font-display text-xs text-white/80 ring-1 ring-white/20">
            <SkullIcon className="h-4 w-4" />
            ASSASSINO
          </span>
        ) : undefined
      }
      onLeave={onLeave}
      // de novo: todos voltam ao lobby (trocar de time, quem assistia senta) e o host começa
      onAgain={room.isHost ? () => send({ t: "lobby" }) : undefined}
      actions={
        <button
          onClick={() => setPeek(true)}
          aria-label="Ver mapa"
          title="Ver mapa"
          className="flex items-center rounded-xl bg-white/10 px-4 py-3 transition hover:bg-white/20 sm:px-5"
        >
          <EyeIcon />
        </button>
      }
    >
      <div className="flex gap-3">
        {([0, 1] as Team[]).map((team) => (
          <div
            key={team}
            className={`flex w-24 flex-col items-center gap-1 rounded-2xl border-2 py-2 font-display leading-none ${TEAM[team].border} ${TEAM[team].soft} ${
              view.winner === team ? `ring-2 ${TEAM[team].ring}` : ""
            }`}
          >
            <span className={`text-[10px] ${TEAM[team].text}`}>{TEAM[team].name}</span>
            <span className="text-3xl">
              {total(team) - view.left[team]}
              <span className="text-base text-white/40">/{total(team)}</span>
            </span>
          </div>
        ))}
      </div>
    </GameEnd>
  );
}

/* ---------- sons ---------- */

function useSounds(view: PlayerView, left: number | null) {
  useAudioUnlock();
  const sec = left === null ? null : Math.ceil(left / 1000);
  const prev = useRef({ game: view.gameNo, clues: view.clues.length, last: view.last?.id, phase: view.phase, sec });

  useEffect(() => {
    const p = prev.current;
    prev.current = { game: view.gameNo, clues: view.clues.length, last: view.last?.id, phase: view.phase, sec };
    if (view.gameNo !== p.game) return;

    if (view.last && view.last.id !== p.last) {
      const k = view.cards[view.last.index].key;
      const team = teamOf(view.last.seat);
      playRevealSound(k === "assassin" ? "assassin" : k === "neutral" ? "neutral" : k === team ? "hit" : "enemy");
    } else if (view.clues.length > p.clues) playClueSound();

    if (view.phase === "gameOver" && p.phase !== "gameOver" && !view.spectator) setTimeout(view.winner === view.team ? playWinSound : playLoseSound, 1600);
    if (view.phase !== "gameOver" && sec !== null && p.sec !== null && sec < p.sec && sec <= 5) playCountdownSound(sec === 0);
  }, [view, sec]);
}
