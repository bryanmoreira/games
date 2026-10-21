"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TICK_RATE, type PlayerView, type Team } from "@mesa/futebol-de-botao";
import type { RoomInfo } from "@mesa/truco";
import { onFrame, send } from "@/lib/socket";
import { FUTEBOL_PATH } from "@/lib/futebol-de-botao/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playGoalSound, playKickSound, playPostSound, playWhistleSound } from "@/lib/futebol-de-botao/sound";
import { Field, FrameBuffer, rotationFor, TEAM_COLORS, type Rot } from "./Field";
import { TouchControls, useInput, useTouchDevice } from "./Controls";
import { HowToPlay } from "./HowToPlay";

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.players.find((p) => p.seat === view.me);
  const myTeam: Team | null = me ? me.team : null;
  const over = view.phase === "over";
  const [help, setHelp] = useState(false);
  const touch = useTouchDevice();

  useAudioUnlock();

  // quadros chegam direto no buffer do desenho, sem passar pelo React
  const frames = useMemo(() => new FrameBuffer(), []);
  useEffect(() => {
    frames.push(view);
    return onFrame<PlayerView>((v) => frames.push(v));
  }, [frames]); // eslint-disable-line react-hooks/exhaustive-deps

  const rot = useRef<Rot>(rotationFor(myTeam, false));
  const input = useInput(rot, !!me && !over && !help);
  const onRotate = useCallback(
    (r: Rot) => {
      rot.current = r;
      input.refresh();
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useGameSounds(view, myTeam);
  const goal = useGoalBanner(view);
  const showEnd = useEndDelay(view);

  const leave = () => {
    send({ t: "leave" });
    router.push(FUTEBOL_PATH);
  };

  const names = room.seats.map((s) => s.name);
  const myGoals = me ? view.goals.filter((g) => g.seat === me.seat && !g.own).length : 0;

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <Scoreboard view={view} />
        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <section className="relative flex-1">
        <Field frames={frames} view={view} names={names} onRotate={onRotate} />
        {goal && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span
              className="banner font-display text-7xl drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] sm:text-8xl"
              style={{ color: TEAM_COLORS[goal.team].fill, WebkitTextStroke: "2px white" }}
            >
              GOL!
            </span>
          </div>
        )}
        {touch && me && !over && <TouchControls onMove={input.setTouch} onKick={input.setKick} />}
      </section>

      {over && showEnd && (
        <GameEnd
          won={view.winner === myTeam}
          badge={view.golden ? <span className="rounded-full bg-gold/20 px-3 py-1 font-display text-sm text-gold">GOL DE OURO</span> : undefined}
          onLeave={leave}
          onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
        >
          <div className="flex items-center gap-4 font-display text-5xl">
            <span style={{ color: TEAM_COLORS[0].fill }}>{view.score[0]}</span>
            <span className="text-2xl text-white/40">×</span>
            <span style={{ color: TEAM_COLORS[1].fill }}>{view.score[1]}</span>
          </div>
          {me && (
            <div className="flex gap-6 font-display">
              <EndStat label="SEUS GOLS" value={myGoals} gold />
              <EndStat label="TEMPO" value={clock(view.tick / TICK_RATE)} />
            </div>
          )}
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="FUTEBOL DE BOTÃO" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

const clock = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Placar com a cor de cada time e o relógio (ou o gol de ouro). */
function Scoreboard({ view }: { view: PlayerView }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-3 py-1.5 font-display sm:gap-4 sm:px-4">
      <span className="h-3.5 w-3.5 rounded-full" style={{ background: TEAM_COLORS[0].fill }} />
      <span className="text-2xl sm:text-3xl">{view.score[0]}</span>
      <span className={`min-w-[3.2rem] text-center text-sm sm:text-base ${view.golden ? "text-gold" : "text-white/70"}`}>
        {view.golden ? "OURO" : clock(view.timeLeft / TICK_RATE)}
      </span>
      <span className="text-2xl sm:text-3xl">{view.score[1]}</span>
      <span className="h-3.5 w-3.5 rounded-full" style={{ background: TEAM_COLORS[1].fill }} />
    </div>
  );
}

/** Chute, trave, gol, apito e fim, uma vez cada (pelos contadores da visão). */
function useGameSounds(view: PlayerView, myTeam: Team | null) {
  const seen = useRef({ kicks: view.kicks, posts: view.posts, goals: view.goals.length, phase: view.phase });
  useEffect(() => {
    const p = seen.current;
    seen.current = { kicks: view.kicks, posts: view.posts, goals: view.goals.length, phase: view.phase };
    // partida nova
    if (view.goals.length < p.goals || view.kicks < p.kicks) return;
    if (view.kicks > p.kicks) playKickSound();
    if (view.posts > p.posts) playPostSound();
    if (view.goals.length > p.goals) playGoalSound(myTeam === null || view.goals.at(-1)!.team === myTeam);
    if (p.phase === "goal" && view.phase === "kickoff") playWhistleSound();
    if (p.phase !== "over" && view.phase === "over") {
      playWhistleSound(true);
      if (myTeam !== null) setTimeout(view.winner === myTeam ? playWinSound : playLoseSound, 900);
    }
  }, [view, myTeam]);
}

/** "GOL!" na cor de quem marcou, durante a comemoração. */
function useGoalBanner(view: PlayerView) {
  const last = view.goals.at(-1);
  return view.phase === "goal" && last ? last : null;
}

/** A tela de fim aparece um pouco depois do apito. */
function useEndDelay(view: PlayerView) {
  const [show, setShow] = useState(view.phase === "over");
  useEffect(() => {
    if (view.phase !== "over") return setShow(false);
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, [view.phase]);
  return show;
}
