"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markOf, nextToFade, threats, type PlayerView, type Seat } from "@truco/jogo-da-velha";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { VELHA_PATH } from "@/lib/jogo-da-velha/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playDrawSound, playMarkSound } from "@/lib/jogo-da-velha/sound";
import { Board, MarkIcon, type Ink, type Piece } from "./Board";
import { HowToPlay } from "./HowToPlay";
import { GridIcon } from "./icons";

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const opp = (1 - me) as Seat;
  const ink = (s: Seat): Ink => (s === me ? "gold" : "red");
  const over = view.phase === "gameOver";
  // dicas de 3 em linha só contra a IA; entre pessoas ficaria injusto
  const vsAI = room.seats[opp].kind === "bot";

  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const [hover, setHover] = useState<number | null>(null);

  // só o lance feito com a mesa aberta é riscado animado (recarregar não repete)
  const seen = useRef({ game: view.gameNo, moves: view.moves.length });
  if (seen.current.game !== view.gameNo) seen.current = { game: view.gameNo, moves: 0 };
  const fresh = view.moves.length > seen.current.moves;

  useSounds(view);
  const showEnd = useEndDelay(view);

  const leave = () => {
    send({ t: "leave" });
    router.push(VELHA_PATH);
  };

  const place = (cell: number) => {
    if (!view.playable.includes(cell)) return;
    setHover(null);
    send({ t: "action", action: { type: "place", cell } });
  };

  // teclas 1 a 9 marcam as casas, linha a linha a partir de cima
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 9 && !help) place(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const last = view.moves.at(-1) ?? null;
  const fading = over ? null : nextToFade(view, view.turn);
  const pieces: Piece[] = [];
  view.board.forEach((owner, cell) => {
    if (owner === null) return;
    pieces.push({ cell, mark: markOf(view, owner), ink: ink(owner), draw: fresh && last?.cell === cell, fading: cell === fading });
  });
  if (last?.removed !== undefined && fresh) pieces.push({ cell: last.removed, mark: markOf(view, last.seat), ink: ink(last.seat), vanish: true });

  const ghost = hover !== null && view.playable.includes(hover) ? { cell: hover, mark: markOf(view, me) } : null;
  const markers =
    vsAI && tips && !over
      ? [...threats(view, me).map((cell) => ({ cell, ink: "gold" as const })), ...threats(view, opp).map((cell) => ({ cell, ink: "red" as const }))]
      : [];

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-3 py-2 font-display sm:gap-3 sm:px-4">
          <Score icon={<MarkIcon mark={markOf(view, me)} ink="gold" className="h-3 w-3" />} value={view.scores[me]} gold />
          <Times />
          <Score icon={<MarkIcon mark={markOf(view, opp)} ink="red" className="h-3 w-3" />} value={view.scores[opp]} />
          {view.draws > 0 && (
            <>
              <Times />
              <Score icon={<GridIcon className="h-3 w-3 text-white/60" />} value={view.draws} dim label="Velhas" />
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

      <section className="relative mx-auto mb-3 mt-8 w-[calc(100%-1.5rem)] max-w-[900px] flex-1 sm:mt-10 sm:w-[calc(100%-7rem)] lg:mt-11">
        <div className="felt absolute inset-0 rounded-[48px] sm:rounded-[120px]" />

        <Opponent room={room} seat={opp} mark={markOf(view, opp)} turn={view.phase === "playing" && view.turn === opp} />

        {/* o tabuleiro é quadrado: cabe na menor medida do feltro */}
        <div className="absolute inset-0 [container-type:size]">
          <div className="flex h-full items-center justify-center pb-6 pt-14 sm:pb-8 sm:pt-16">
            <div className="w-[min(calc(100cqw-3rem),calc(100cqh-6rem),480px)] sm:w-[min(calc(100cqw-6rem),calc(100cqh-8rem),480px)]">
              <Board pieces={pieces} winLine={view.winLine} winInk={view.winner === null ? "gold" : ink(view.winner)} ghost={ghost} markers={markers}>
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {view.board.map((_, cell) => (
                    <button
                      key={cell}
                      aria-label={`Casa ${cell + 1}`}
                      disabled={!view.playable.includes(cell)}
                      onMouseEnter={() => setHover(cell)}
                      onMouseLeave={() => setHover((h) => (h === cell ? null : h))}
                      onClick={() => place(cell)}
                      className="cursor-pointer rounded-2xl disabled:cursor-default [@media(hover:hover)]:enabled:hover:bg-white/5"
                    />
                  ))}
                </div>
              </Board>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 flex justify-center px-3 pb-3">
        <span className={`flex items-center gap-1.5 font-display text-xs transition-colors ${view.canPlay ? "text-gold" : "text-white/50"}`}>
          {view.canPlay && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
          <MarkIcon mark={markOf(view, me)} ink="gold" className="h-3.5 w-3.5" />
          {room.seats[me].name}
        </span>
      </section>

      {over && showEnd && (
        <GameEnd
          won={view.winner === me}
          draw={view.winner === null}
          badge={
            view.winner === null ? (
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-display text-sm text-white/80">
                <GridIcon className="h-4 w-4" />
                DEU VELHA!
              </span>
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
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="JOGO DA VELHA" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Times() {
  // espaçador do rótulo + altura da linha dos números, para o × alinhar com os placares
  return (
    <div className="flex flex-col items-center leading-none" aria-hidden="true">
      <span className="invisible h-3">×</span>
      <span className="flex h-[1em] items-center text-3xl">
        <span className="text-base text-white/30">×</span>
      </span>
    </div>
  );
}

function Score({ icon, value, gold, dim, label }: { icon: React.ReactNode; value: number; gold?: boolean; dim?: boolean; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 leading-none" title={label}>
      <span className="flex h-3 items-center">{icon}</span>
      <span className={`text-3xl ${gold ? "text-gold" : dim ? "text-white/60" : ""}`}>{value}</span>
    </div>
  );
}

/** Adversário sentado na borda de cima da mesa (meio avatar para fora). */
function Opponent({ room, seat, mark, turn }: { room: RoomInfo; seat: Seat; mark: "X" | "O"; turn: boolean }) {
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
        <span className="relative -mt-2 flex max-w-28 items-center gap-1 truncate rounded-full bg-stone-950/90 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-white/10 lg:text-xs">
          <MarkIcon mark={mark} ink="red" className="h-2.5 w-2.5 shrink-0" />
          {info.name}
        </span>
      </div>
    </div>
  );
}

/** Sons a partir das mudanças da visão: o risco de cada lance e o fim da partida. */
function useSounds(view: PlayerView) {
  const prev = useRef({ game: view.gameNo, moves: view.moves.length, phase: view.phase });
  useAudioUnlock();

  useEffect(() => {
    const p = prev.current;
    prev.current = { game: view.gameNo, moves: view.moves.length, phase: view.phase };
    if (view.gameNo !== p.game || view.moves.length <= p.moves) return;
    const last = view.moves.at(-1)!;
    playMarkSound(markOf(view, last.seat));
    if (view.phase === "gameOver" && p.phase !== "gameOver") {
      const end = view.winner === null ? playDrawSound : view.winner === view.seat ? playWinSound : playLoseSound;
      setTimeout(end, 750);
    }
  }, [view]);
}

/** Mostra a tela de fim só depois de a linha vencedora ser riscada. */
function useEndDelay(view: PlayerView) {
  const [show, setShow] = useState(view.phase === "gameOver");
  useEffect(() => {
    if (view.phase !== "gameOver") return setShow(false);
    const t = setTimeout(() => setShow(true), 1600);
    return () => clearTimeout(t);
  }, [view.phase, view.gameNo]);
  return show;
}
