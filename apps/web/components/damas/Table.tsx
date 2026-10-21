"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { legalMoves, piecesOf as countOf, sideOfSeat, type EndReason, type MoveRecord, type PlayerView, type Seat } from "@mesa/damas";
import type { RoomInfo } from "@mesa/truco";
import { send } from "@/lib/socket";
import { DAMAS_PATH } from "@/lib/damas/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";
import { playDrawSound, playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playCaptureSound, playKingSound, playStepSound } from "@/lib/damas/sound";
import { Board, PieceShape, piecesOf, type Mark, type UiPiece } from "./Board";
import { HowToPlay } from "./HowToPlay";
import { DrawIcon } from "./icons";

/** Cada trecho do caminho da peça (o servidor espera o mesmo antes de a IA jogar). */
const STEP_MS = 320;

const END_LABEL: Record<Exclude<EndReason, "noMoves">, string> = { repeat: "REPETIÇÃO", quiet: "SÓ DAMAS", endgame: "FINAL DE DAMAS" };

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const opp = (1 - me) as Seat;
  const mySide = sideOfSeat(view, me);
  const over = view.phase === "gameOver";
  // dicas de peça ameaçada só contra a IA; entre pessoas ficaria injusto
  const vsAI = room.seats[opp].kind === "bot";
  const flip = mySide < 0;

  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const [sel, setSel] = useState<{ from: number; path: number[] } | null>(null);

  useAudioUnlock();
  const { pieces, animating } = useAnimatedPieces(view, (move, i) => {
    if (move.captured[i] !== undefined) playCaptureSound();
    else playStepSound();
    if (i === move.path.length - 1 && move.promoted) setTimeout(playKingSound, 150);
  });
  useEndSounds(view, animating);
  const showEnd = useEndDelay(view, animating);

  const interactive = view.canPlay && !animating && !help;
  const movable = new Set(interactive ? view.legal.map((m) => m.from) : []);
  const candidates = sel ? view.legal.filter((m) => m.from === sel.from && sel.path.every((sq, i) => m.path[i] === sq)) : [];
  const targets = new Set(candidates.flatMap((m) => (m.path.length > (sel?.path.length ?? 0) ? [m.path[sel!.path.length]] : [])));

  // lance novo ou vez do outro: desfaz a seleção; uma peça só para mover já vem escolhida
  useEffect(() => {
    if (!interactive) return setSel(null);
    const froms = [...new Set(view.legal.map((m) => m.from))];
    setSel(froms.length === 1 ? { from: froms[0], path: [] } : null);
  }, [interactive, view.moves.length, view.gameNo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSel(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const leave = () => {
    send({ t: "leave" });
    router.push(DAMAS_PATH);
  };

  const click = (sq: number) => {
    if (!interactive) return;
    if (sel && targets.has(sq)) {
      const path = [...sel.path, sq];
      const rest = candidates.filter((m) => m.path[sel.path.length] === sq);
      // um caminho só a partir daqui: completa o lance
      if (rest.length === 1) {
        setSel(null);
        send({ t: "action", action: { type: "move", from: rest[0].from, path: rest[0].path } });
      } else setSel({ from: sel.from, path });
      return;
    }
    if (movable.has(sq)) return setSel(sel?.from === sq && !sel.path.length ? null : { from: sq, path: [] });
    setSel(null);
  };

  // marcas nas casas
  const marks: Partial<Record<number, Mark[]>> = {};
  const add = (sq: number, m: Mark) => (marks[sq] ??= []).push(m);
  const last = view.moves.at(-1);
  if (last && !animating && !sel) [last.from, ...last.path].forEach((sq) => add(sq, "last"));
  for (const sq of movable) if (sq !== sel?.from) add(sq, "movable");
  if (sel) {
    add(sel.from, "selected");
    sel.path.forEach((sq) => add(sq, "step"));
    targets.forEach((sq) => add(sq, "target"));
  }
  if (vsAI && tips && interactive) {
    const danger = legalMoves(view.board, -mySide).flatMap((m) => m.captured);
    new Set(danger).forEach((sq) => add(sq, "threat"));
  }

  const myColor = mySide; // 1 brancas, -1 pretas: a peça do ícone
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-3 py-2 font-display sm:gap-3 sm:px-4">
          <Score icon={<PieceShape p={myColor} className="h-3.5 w-3.5" />} value={view.scores[me]} gold />
          <Times />
          <Score icon={<PieceShape p={-myColor} className="h-3.5 w-3.5" />} value={view.scores[opp]} />
          {view.draws > 0 && (
            <>
              <Times />
              <Score icon={<DrawIcon className="h-3 w-3 text-white/60" />} value={view.draws} dim label="Empates" />
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          {vsAI && <TipsButton label="Dicas" on={tips} onClick={toggleTips} />}
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <section className="relative mx-auto mb-2 mt-8 w-[calc(100%-1rem)] max-w-[900px] flex-1 sm:mt-10 sm:w-[calc(100%-7rem)] lg:mt-11">
        <div className="felt absolute inset-0 rounded-[40px] sm:rounded-[120px]" />

        <Opponent room={room} seat={opp} side={-mySide} pieces={countOf(view, opp)} turn={view.phase === "playing" && view.turn === opp} />

        {/* o tabuleiro é quadrado: cabe na menor medida do feltro */}
        <div className="absolute inset-0 [container-type:size]">
          <div className="flex h-full items-center justify-center pb-3 pt-12 sm:pb-8 sm:pt-16">
            <div className="w-[min(calc(100cqw-1rem),calc(100cqh-4rem),620px)] sm:w-[min(calc(100cqw-6rem),calc(100cqh-6rem),620px)]">
              <Board pieces={pieces} flip={flip} marks={marks} step={STEP_MS}>
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                  {Array.from({ length: 64 }, (_, i) => {
                    const sq = flip ? 63 - i : i;
                    const active = movable.has(sq) || targets.has(sq) || (sel !== null && interactive);
                    return (
                      <button
                        key={i}
                        aria-label={`Casa ${sq}`}
                        tabIndex={movable.has(sq) || targets.has(sq) ? 0 : -1}
                        disabled={!active}
                        onClick={() => click(sq)}
                        className={`disabled:cursor-default ${movable.has(sq) || targets.has(sq) ? "cursor-pointer" : "cursor-default"}`}
                      />
                    );
                  })}
                </div>
              </Board>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 flex justify-center px-3 pb-3">
        <span className={`flex items-center gap-1.5 font-display text-xs transition-colors ${view.canPlay ? "text-gold" : "text-white/50"}`}>
          {view.canPlay && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
          {room.seats[me].name}
          <Count side={mySide} n={countOf(view, me)} />
        </span>
      </section>

      {over && showEnd && (
        <GameEnd
          won={view.winner === me}
          draw={view.winner === null}
          badge={
            view.winner === null && view.end && view.end !== "noMoves" ? (
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-display text-sm text-white/80">{END_LABEL[view.end]}</span>
            ) : undefined
          }
          onLeave={leave}
          onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
        >
          <p className="flex items-center font-display text-3xl">
            <span className="text-gold">{view.scores[me]}</span>
            <span className="mx-3 text-white/30">×</span>
            {view.scores[opp]}
          </p>
          <div className="flex gap-6 font-display">
            <EndStat label="CAPTURAS" value={view.stats[me].captured} gold />
            <EndStat label="DAMAS" value={view.stats[me].kings} />
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="DAMAS" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

/** Peças que sobraram: mini peça + número. */
function Count({ side, n }: { side: number; n: number }) {
  return (
    <span className="flex items-center gap-0.5 rounded-full bg-black/40 py-0.5 pl-0.5 pr-1.5 text-[11px] text-white/80" title="Peças">
      <PieceShape p={side} className="h-3.5 w-3.5" />
      {n}
    </span>
  );
}

function Times() {
  // espaçador do rótulo + altura da linha dos números, para o × alinhar com os placares
  return (
    <div className="flex flex-col items-center leading-none" aria-hidden="true">
      <span className="invisible h-3.5">×</span>
      <span className="flex h-[1em] items-center text-3xl">
        <span className="text-base text-white/30">×</span>
      </span>
    </div>
  );
}

function Score({ icon, value, gold, dim, label }: { icon: React.ReactNode; value: number; gold?: boolean; dim?: boolean; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 leading-none" title={label}>
      <span className="flex h-3.5 items-center">{icon}</span>
      <span className={`text-3xl ${gold ? "text-gold" : dim ? "text-white/60" : ""}`}>{value}</span>
    </div>
  );
}

/** Adversário sentado na borda de cima da mesa (meio avatar para fora). */
function Opponent({ room, seat, side, pieces, turn }: { room: RoomInfo; seat: Seat; side: number; pieces: number; turn: boolean }) {
  const info = room.seats[seat];
  return (
    <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-6 flex-col items-center sm:-translate-y-7 lg:-translate-y-8">
      <div className={`relative flex flex-col items-center ${info.connected ? "" : "opacity-40"}`}>
        <Framed frame={info?.frame}>
          <div
            className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-[3px] border-red-400/80 bg-stone-800 font-display text-xl text-white shadow-lg shadow-black/40 sm:h-14 sm:w-14 lg:h-16 lg:w-16 lg:text-2xl ${
              turn ? "turn-glow" : ""
            }`}
          >
            <SeatFace seat={info} />
          </div>
        </Framed>
        <span className="relative -mt-2 flex max-w-36 items-center gap-1 truncate rounded-full bg-stone-950/90 py-0.5 pl-2 pr-0.5 text-[11px] font-semibold ring-1 ring-white/10 lg:text-xs">
          <span className="truncate">{info.name}</span>
          <Count side={side} n={pieces} />
        </span>
      </div>
    </div>
  );
}

/**
 * Peças da tela acompanhando a visão. O lance novo anda casa por casa (as capturadas saem quando a peça
 * passa por cima); entrar, recarregar ou pular lances monta direto do tabuleiro.
 */
function useAnimatedPieces(view: PlayerView, onStep: (move: MoveRecord, i: number) => void) {
  const gen = useRef(0);
  const [pieces, setPieces] = useState<UiPiece[]>(() => piecesOf(view.board));
  // montar do zero (partida nova, reconexão): ids novos, sem deslizar das posições antigas
  const rebuild = () => piecesOf(view.board, ++gen.current);
  const [animating, setAnimating] = useState(false);
  const seen = useRef({ game: view.gameNo, moves: view.moves.length });
  const live = useRef(pieces);
  live.current = pieces;
  const stepRef = useRef(onStep);
  stepRef.current = onStep;

  useEffect(() => {
    const p = seen.current;
    seen.current = { game: view.gameNo, moves: view.moves.length };
    const move = view.moves.at(-1);
    const mover = move && live.current.find((x) => x.sq === move.from && !x.out);
    if (view.gameNo !== p.game || view.moves.length !== p.moves + 1 || !move || !mover) {
      setPieces(rebuild());
      setAnimating(false);
      return;
    }
    setAnimating(true);
    let done = false;
    const timers = move.path.map((sq, i) =>
      setTimeout(() => {
        const victim = move.captured[i];
        setPieces((ps) => ps.map((x) => (x.id === mover.id ? { ...x, sq } : !x.out && x.sq === victim && x.id !== mover.id ? { ...x, out: true } : x)));
        stepRef.current(move, i);
      }, i * STEP_MS),
    );
    // no fim: tira as capturadas e aplica a promoção (o tabuleiro da visão manda)
    timers.push(
      setTimeout(
        () => {
          setPieces((ps) => {
            const next = ps.filter((x) => !x.out).map((x) => (view.board[x.sq] !== x.p ? { ...x, p: view.board[x.sq] } : x));
            const ok = next.length === view.board.filter(Boolean).length && next.every((x) => view.board[x.sq] !== 0);
            return ok ? next : rebuild();
          });
          setAnimating(false);
          done = true;
        },
        (move.path.length - 1) * STEP_MS + STEP_MS + 150,
      ),
    );
    return () => {
      timers.forEach(clearTimeout);
      // interrompido no meio (lance novo chegou antes): o próximo efeito monta do tabuleiro
      if (!done) seen.current = { game: -1, moves: -1 };
    };
  }, [view.gameNo, view.moves.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return { pieces, animating };
}

/** Som de fim de partida, depois de a última peça pousar. */
function useEndSounds(view: PlayerView, animating: boolean) {
  const played = useRef(view.phase === "gameOver" ? view.gameNo : -1);
  useEffect(() => {
    if (view.phase !== "gameOver" || animating || played.current === view.gameNo) return;
    played.current = view.gameNo;
    const end = view.winner === null ? playDrawSound : view.winner === view.seat ? playWinSound : playLoseSound;
    setTimeout(end, 250);
  }, [view.phase, view.gameNo, view.winner, view.seat, animating]);
}

/** Mostra a tela de fim só um pouco depois do último lance. */
function useEndDelay(view: PlayerView, animating: boolean) {
  const [show, setShow] = useState(view.phase === "gameOver");
  useEffect(() => {
    if (view.phase !== "gameOver") return setShow(false);
    if (animating) return;
    const t = setTimeout(() => setShow(true), 1100);
    return () => clearTimeout(t);
  }, [view.phase, view.gameNo, animating]);
  return show;
}
