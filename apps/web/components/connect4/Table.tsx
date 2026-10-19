"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { COLS, ROWS, threats, type PlayerView, type Seat } from "@truco/connect4";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { CONNECT4_PATH } from "@/lib/connect4/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { GameEnd } from "@/components/ui/GameEnd";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playDropSound } from "@/lib/connect4/sound";
import { Board, cellStyle, Disc, type DiscColor } from "./Board";
import { HowToPlay } from "./HowToPlay";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";

// Tempo até a peça bater no fundo (72% da animação de queda, ver .disc-fall)
const landMs = (row: number) => (0.22 + (ROWS - row) * 0.07) * 0.72 * 1000;

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const opp = (1 - me) as Seat;
  const color = (s: Seat): DiscColor => (s === me ? "gold" : "red");
  const over = view.phase === "gameOver";
  // dicas de 4 em linha só contra a IA; entre pessoas ficaria injusto
  const vsAI = room.seats[opp].kind === "bot";

  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const [hover, setHover] = useState<number | null>(null);

  // só caem animadas as peças jogadas depois de abrir a mesa (recarregar não repete a queda)
  const seen = useRef({ game: view.gameNo, moves: view.moves.length });
  if (seen.current.game !== view.gameNo) seen.current = { game: view.gameNo, moves: 0 };
  const animateFrom = seen.current.moves;

  useSounds(view);
  const showEnd = useEndDelay(view);

  const leave = () => {
    send({ t: "leave" });
    router.push(CONNECT4_PATH);
  };

  const drop = (col: number) => {
    if (!view.playable.includes(col)) return;
    send({ t: "action", action: { type: "drop", col } });
  };

  // teclas 1 a 7 soltam a peça na coluna
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= COLS && !help) drop(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const last = view.moves.at(-1) ?? null;
  const ghost = hover !== null && view.playable.includes(hover) ? hover : null;
  const markers =
    vsAI && tips && !over
      ? [
          ...threats(view.cols, me).map((c) => ({ ...c, color: "gold" as const })),
          ...threats(view.cols, opp).map((c) => ({ ...c, color: "red" as const })),
        ]
      : [];

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-3 py-2 font-display sm:gap-3 sm:px-4">
          <Score disc="gold" value={view.scores[me]} />
          {/* espaçador do rótulo + altura da linha dos números, para o × alinhar com os placares */}
          <div className="flex flex-col items-center leading-none" aria-hidden="true">
            <span className="invisible h-3">×</span>
            <span className="flex h-[1em] items-center text-3xl">
              <span className="text-base text-white/30">×</span>
            </span>
          </div>
          <Score disc="red" value={view.scores[opp]} />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          {vsAI && <TipsButton label="Dicas" on={tips} onClick={toggleTips} />}
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <section className="relative mx-auto mb-3 mt-8 w-[calc(100%-1.5rem)] max-w-[1100px] flex-1 sm:mt-10 sm:w-[calc(100%-7rem)] lg:mt-11">
        <div className="felt absolute inset-0 rounded-[48px] sm:rounded-[120px]" />

        <Opponent room={room} seat={opp} turn={view.phase === "playing" && view.turn === opp} />

        {/* o tabuleiro (com a linha da peça fantasma) é quase quadrado: cabe na menor medida do feltro */}
        <div className="absolute inset-0 [container-type:size]">
          <div className="flex h-full items-center justify-center pb-5 pt-11 sm:pb-7 sm:pt-14">
            <div className="w-[min(calc(100cqw-1.5rem),calc(100cqh-5.5rem),600px)] sm:w-[min(calc(100cqw-4rem),calc(100cqh-7rem),600px)]">
              <Board padTop moves={view.moves} color={color} animateFrom={animateFrom} winLine={view.winLine} last={last} markers={markers}>
                {ghost !== null && (
                  <>
                    <div className="pointer-events-none absolute [@media(hover:none)]:hidden" style={cellStyle(ghost, ROWS)}>
                      <Disc color="gold" className="absolute inset-[7%] animate-pulse opacity-90" />
                    </div>
                    <div className="pointer-events-none absolute [@media(hover:none)]:hidden" style={cellStyle(ghost, view.cols[ghost].length)}>
                      <div className="absolute inset-[6%] rounded-full ring-2 ring-gold/70" />
                    </div>
                  </>
                )}
                {Array.from({ length: COLS }, (_, c) => (
                  <button
                    key={c}
                    aria-label={`Coluna ${c + 1}`}
                    disabled={!view.playable.includes(c)}
                    onMouseEnter={() => setHover(c)}
                    onMouseLeave={() => setHover((h) => (h === c ? null : h))}
                    onClick={() => drop(c)}
                    className="absolute cursor-pointer disabled:cursor-default"
                    style={{ left: `${(c * 100) / COLS}%`, width: `${100 / COLS}%`, top: `${-100 / ROWS}%`, bottom: 0 }}
                  />
                ))}
              </Board>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 flex justify-center px-3 pb-3">
        <span className={`flex items-center gap-1.5 font-display text-xs transition-colors ${view.canPlay ? "text-gold" : "text-white/50"}`}>
          {view.canPlay && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
          <Disc color="gold" className="h-3.5 w-3.5 text-[2px]" />
          {room.seats[me].name}
        </span>
      </section>

      {over && showEnd && (
        <GameEnd
          won={view.winner === me}
          draw={view.winner === null}
          onLeave={leave}
          onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
        >
          <p className="font-display text-3xl">
            <span className="text-gold">{view.scores[me]}</span>
            <span className="mx-3 text-white/30">×</span>
            {view.scores[opp]}
          </p>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="CONNECT 4" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Score({ disc, value }: { disc: DiscColor; value: number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 leading-none">
      <Disc color={disc} className="h-3 w-3 text-[2px]" />
      <span className={`text-3xl ${disc === "gold" ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

/** Adversário sentado na borda de cima da mesa (meio avatar para fora). */
function Opponent({ room, seat, turn }: { room: RoomInfo; seat: Seat; turn: boolean }) {
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
          <Disc color="red" className="h-2.5 w-2.5 shrink-0 text-[2px]" />
          {info.name}
        </span>
      </div>
    </div>
  );
}

/** Sons a partir das mudanças da visão: peça batendo no fundo e fim de partida. */
function useSounds(view: PlayerView) {
  const prev = useRef({ game: view.gameNo, moves: view.moves.length, phase: view.phase });
  useAudioUnlock();

  useEffect(() => {
    const p = prev.current;
    prev.current = { game: view.gameNo, moves: view.moves.length, phase: view.phase };
    if (view.gameNo !== p.game || view.moves.length <= p.moves) return;
    const last = view.moves.at(-1)!;
    const land = landMs(last.row);
    setTimeout(() => playDropSound(ROWS - last.row), land);
    if (view.phase === "gameOver" && p.phase !== "gameOver" && view.winner !== null) {
      setTimeout(view.winner === view.seat ? playWinSound : playLoseSound, land + 250);
    }
  }, [view.gameNo, view.moves, view.phase, view.winner, view.seat]);
}

/** Mostra a tela de fim só depois de a linha vencedora piscar um pouco. */
function useEndDelay(view: PlayerView) {
  const [show, setShow] = useState(view.phase === "gameOver");
  useEffect(() => {
    if (view.phase !== "gameOver") return setShow(false);
    const t = setTimeout(() => setShow(true), 1800);
    return () => clearTimeout(t);
  }, [view.phase, view.gameNo]);
  return show;
}
