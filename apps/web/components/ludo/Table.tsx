"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BASE, HOME, homeCount, placementOf, target, type MoveRecord, type PlayerView, type Seat } from "@mesa/ludo";
import type { RoomInfo } from "@mesa/truco";
import { send } from "@/lib/socket";
import { LUDO_PATH } from "@/lib/ludo/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playCaptureSound, playDiceSound, playExitSound, playHomeSound, playPassSound, playStepSound } from "@/lib/ludo/sound";
import { Board, cornerOf, DieFace, LUDO_COLORS, Pawn, turnsFor, type UiPiece } from "./Board";
import { HowToPlay } from "./HowToPlay";

/** Cada casa andada (o servidor espera o mesmo antes de a IA jogar). */
const STEP_MS = 150;
/** Peça capturada voltando à base. */
const CAPTURE_MS = 450;
/** Dado rolando. */
const ROLL_MS = 650;

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const myColor = view.myColor;
  const over = view.phase === "gameOver";
  const turns = turnsFor(myColor);

  const [help, setHelp] = useState(false);
  const [hover, setHover] = useState<UiPiece | null>(null);

  useAudioUnlock();
  const rolling = useRolling(view);
  const { shown, animating } = useShownPieces(view);
  usePassSound(view, rolling);
  useEndSounds(view, animating);
  const showEnd = useEndDelay(view, animating);

  const busy = rolling || animating || help;
  const canMove = view.canMove && !busy;
  const movable = new Set(canMove && myColor !== null ? view.movable.map((i) => `${myColor}:${i}`) : []);

  // um lance por rolagem: evita mandar duas vezes (clique + lance automático)
  const sent = useRef(-1);
  const move = (piece: number) => {
    if (!view.canMove || sent.current === view.rolls) return;
    sent.current = view.rolls;
    setHover(null);
    send({ t: "action", action: { type: "move", piece } });
  };
  const roll = () => {
    if (!view.canRoll || busy) return;
    send({ t: "action", action: { type: "roll" } });
  };

  // todas as peças que andam vão para o mesmo lugar (ex.: só a base): o lance sai sozinho
  useEffect(() => {
    if (!canMove || myColor === null) return;
    const froms = new Set(view.movable.map((i) => view.pieces[myColor][i]));
    if (froms.size !== 1) return;
    const t = setTimeout(() => move(view.movable[0]), 350);
    return () => clearTimeout(t);
  }, [canMove, view.rolls]); // eslint-disable-line react-hooks/exhaustive-deps

  // espaço ou Enter rolam o dado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        roll();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const leave = () => {
    send({ t: "leave" });
    router.push(LUDO_PATH);
  };

  const pieces: UiPiece[] = view.players.flatMap((p) => {
    const c = view.colorOf[p]!;
    return shown[c].map((progress, piece) => ({ color: c, piece, progress, ms: progress === BASE ? CAPTURE_MS : progress === 0 ? 300 : undefined }));
  });
  const to = hover && view.die !== null ? target(hover.progress, view.die) : null;
  const ghost = hover && to !== null ? { ...hover, progress: to } : null;

  // cada jogador no canto da sua cor (girado para a minha ficar embaixo à esquerda)
  const byCorner: (Seat | null)[] = [null, null, null, null];
  for (const p of view.players) byCorner[cornerOf(view.colorOf[p]!, turns)] = p;
  const plate = (corner: number) => {
    const seat = byCorner[corner];
    if (seat === null) return <div className="flex-1" />;
    return (
      <Plate
        view={view}
        room={room}
        seat={seat}
        right={corner === 1 || corner === 2}
        rolling={rolling && view.current === seat}
        onRoll={seat === me && view.canRoll && !busy ? roll : undefined}
      />
    );
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex items-center gap-2.5 rounded-2xl bg-black/40 px-3 py-1.5 font-display sm:gap-4 sm:px-4">
          {view.players.map((p) => (
            <Score key={p} color={view.colorOf[p]!} value={view.scores[p]} mine={p === me} />
          ))}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      {/* o tabuleiro é quadrado: cabe na menor medida, com uma faixa de jogadores em cima e outra embaixo */}
      <section className="relative flex-1 [container-type:size]">
        <div className="flex h-full items-center justify-center px-2 pb-2">
          <div className="flex w-[min(calc(100cqw-1rem),calc(100cqh-8.5rem),640px)] flex-col gap-2">
            <div className="flex h-14 items-end gap-2">
              {plate(0)}
              {plate(1)}
            </div>
            <Board pieces={pieces} turns={turns} step={STEP_MS} movable={movable} onPiece={(p) => move(p.piece)} onHover={setHover} target={ghost} />
            <div className="flex h-14 items-start gap-2">
              {plate(3)}
              {plate(2)}
            </div>
          </div>
        </div>
      </section>

      {over && showEnd && (
        <GameEnd
          won={view.winner === me}
          badge={
            view.winner !== me ? (
              <span className="rounded-full bg-white/10 px-3 py-1 font-display text-sm text-white/80">{placementOf(view, me)}º LUGAR</span>
            ) : undefined
          }
          onLeave={leave}
          onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
        >
          <div className="flex items-center gap-4 font-display">
            {view.players.map((p) => (
              <Score key={p} color={view.colorOf[p]!} value={view.scores[p]} mine={p === me} />
            ))}
          </div>
          {myColor !== null && (
            <div className="flex gap-6 font-display">
              <EndStat label="CHEGADA" value={`${homeCount(view, myColor)}/4`} gold />
              <EndStat label="CAPTURAS" value={view.stats[me].captures} />
              <EndStat label="PERDIDAS" value={view.stats[me].lost} />
            </div>
          )}
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="LUDO" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Score({ color, value, mine }: { color: number; value: number; mine: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 leading-none">
      <Pawn color={color} className="h-3.5 w-3.5" />
      <span className={`text-2xl sm:text-3xl ${mine ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

/** Jogador no canto da sua cor: rosto, nome, peças na chegada e o dado quando é a vez dele. */
function Plate({
  view,
  room,
  seat,
  right,
  rolling,
  onRoll,
}: {
  view: PlayerView;
  room: RoomInfo;
  seat: Seat;
  right: boolean;
  rolling: boolean;
  onRoll?: () => void;
}) {
  const info = room.seats[seat];
  const color = view.colorOf[seat]!;
  const turn = view.current === seat;
  const mine = seat === view.seat;
  const home = homeCount(view, color);
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${right ? "flex-row-reverse" : ""} ${info?.connected ? "" : "opacity-40"}`}>
      <Framed frame={info?.frame}>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] bg-stone-800 font-display text-lg text-white shadow-lg shadow-black/40 sm:h-12 sm:w-12 ${
            LUDO_COLORS[color].border
          } ${turn ? "turn-glow" : ""}`}
        >
          <SeatFace seat={info} />
        </div>
      </Framed>
      <div className={`flex min-w-0 flex-col gap-1 ${right ? "items-end" : ""}`}>
        <span className={`max-w-full truncate text-xs font-semibold sm:text-sm ${turn ? "text-gold" : mine ? "text-white" : "text-white/80"}`}>{info?.name}</span>
        <span className="flex gap-0.5" title="Na chegada">
          {[0, 1, 2, 3].map((i) => (
            <Pawn key={i} color={color} dim={i >= home} className="h-3.5 w-3.5" />
          ))}
        </span>
      </div>
      {turn && view.phase !== "gameOver" && <Die view={view} rolling={rolling} onRoll={onRoll} big={mine} />}
    </div>
  );
}

/** Dado da vez: parado esperando (o meu pulsa e é clicável), rolando ou mostrando o número. */
function Die({ view, rolling, onRoll, big }: { view: PlayerView; rolling: boolean; onRoll?: () => void; big: boolean }) {
  const [face, setFace] = useState(view.die ?? 6);
  useEffect(() => {
    if (!rolling) return;
    const t = setInterval(() => setFace(1 + Math.floor(Math.random() * 6)), 70);
    return () => clearInterval(t);
  }, [rolling]);

  const waiting = view.phase === "roll" && !rolling;
  const value = rolling ? face : waiting ? (view.die ?? 6) : (view.die ?? 6);
  const lost = view.phase === "pass" && !rolling;
  const size = big ? "h-12 w-12 sm:h-14 sm:w-14" : "h-9 w-9 sm:h-10 sm:w-10";
  const color = view.colorOf[view.current ?? 0] ?? undefined;

  if (onRoll) {
    return (
      <button onClick={onRoll} aria-label="Rolar o dado" title="Rolar" className={`ludo-die-ready ml-auto shrink-0 rounded-2xl ${size}`}>
        <DieFace value={value} color={color} className="h-full w-full" />
      </button>
    );
  }
  return (
    <div className={`relative shrink-0 ${size} ${waiting ? "opacity-40" : ""} ${rolling ? "ludo-rolling" : ""}`}>
      <DieFace value={value} color={color} className="h-full w-full" />
      {lost && (
        <svg viewBox="0 0 24 24" className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-red-500 p-0.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-label="Passou a vez">
          <path d="M7 7l10 10M17 7L7 17" />
        </svg>
      )}
    </div>
  );
}

/** Dado rolando por um instante a cada rolagem nova (recarregar não rola de novo). */
function useRolling(view: PlayerView) {
  const [rolling, setRolling] = useState(false);
  const seen = useRef({ game: view.gameNo, rolls: view.rolls });
  useEffect(() => {
    const p = seen.current;
    seen.current = { game: view.gameNo, rolls: view.rolls };
    if (view.gameNo !== p.game || view.rolls <= p.rolls) return;
    setRolling(true);
    playDiceSound();
    const t = setTimeout(() => setRolling(false), ROLL_MS);
    return () => clearTimeout(t);
  }, [view.gameNo, view.rolls]);
  return rolling;
}

/** Vez perdida: som grave depois de o dado parar. */
function usePassSound(view: PlayerView, rolling: boolean) {
  const played = useRef(-1);
  useEffect(() => {
    if (view.phase !== "pass" || rolling || played.current === view.rolls) return;
    played.current = view.rolls;
    if (view.passReason === "threeSixes" || view.die !== 6) playPassSound();
  }, [view.phase, view.rolls, view.passReason, view.die, rolling]);
}

const copy = (ps: number[][]) => ps.map((p) => [...p]);

/**
 * Posição das peças na tela acompanhando a visão. O lance novo anda casa por casa e as capturadas
 * voltam à base no fim; entrar, recarregar ou pular lances monta direto da visão.
 */
function useShownPieces(view: PlayerView) {
  const [shown, setShown] = useState(() => copy(view.pieces));
  const [animating, setAnimating] = useState(false);
  const seen = useRef({ game: view.gameNo, moves: view.moves.length });

  useEffect(() => {
    const p = seen.current;
    seen.current = { game: view.gameNo, moves: view.moves.length };
    const m: MoveRecord | undefined = view.moves.at(-1);
    if (view.gameNo !== p.game || view.moves.length !== p.moves + 1 || !m) {
      setShown(copy(view.pieces));
      setAnimating(false);
      return;
    }
    const path = m.from === BASE ? [0] : Array.from({ length: m.to - m.from }, (_, i) => m.from + 1 + i);
    const set = (ps: number[][], color: number, piece: number, v: number) => {
      const next = copy(ps);
      next[color][piece] = v;
      return next;
    };
    setAnimating(true);
    let done = false;
    const timers = path.map((prog, i) =>
      setTimeout(() => {
        setShown((s) => set(s, m.color, m.piece, prog));
        const last = i === path.length - 1;
        if (m.from === BASE) playExitSound();
        else if (last && prog === HOME) playHomeSound();
        else playStepSound();
      }, i * STEP_MS),
    );
    const end = path.length * STEP_MS;
    if (m.captured.length) {
      timers.push(
        setTimeout(() => {
          setShown((s) => m.captured.reduce((acc, c) => set(acc, c.color, c.piece, BASE), s));
          playCaptureSound();
        }, end),
      );
    }
    timers.push(
      setTimeout(
        () => {
          setShown(copy(view.pieces));
          setAnimating(false);
          done = true;
        },
        end + (m.captured.length ? CAPTURE_MS : 0) + 60,
      ),
    );
    return () => {
      timers.forEach(clearTimeout);
      // interrompido no meio (lance novo antes do fim): o próximo efeito monta da visão
      if (!done) seen.current = { game: -1, moves: -1 };
    };
  }, [view.gameNo, view.moves.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return { shown, animating };
}

/** Som de fim de partida, depois de a última peça chegar. */
function useEndSounds(view: PlayerView, animating: boolean) {
  const played = useRef(view.phase === "gameOver" ? view.gameNo : -1);
  useEffect(() => {
    if (view.phase !== "gameOver" || animating || played.current === view.gameNo) return;
    played.current = view.gameNo;
    setTimeout(view.winner === view.seat ? playWinSound : playLoseSound, 300);
  }, [view.phase, view.gameNo, view.winner, view.seat, animating]);
}

/** Mostra a tela de fim só um pouco depois do último lance. */
function useEndDelay(view: PlayerView, animating: boolean) {
  const [show, setShow] = useState(view.phase === "gameOver");
  useEffect(() => {
    if (view.phase !== "gameOver") return setShow(false);
    if (animating) return;
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [view.phase, view.gameNo, animating]);
  return show;
}
