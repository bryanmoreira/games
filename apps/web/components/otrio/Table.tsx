"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { rivalThreats, sizeOf, slotOf, winningSlots, type Color, type PlayerView, type Seat, type Size } from "@truco/otrio";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { OTRIO_PATH } from "@/lib/otrio/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playRingSound } from "@/lib/otrio/sound";
import { Board, ColorMark, RING_COLORS, RingIcon, SIZE_NAMES, type Marker } from "./Board";
import { HowToPlay, WIN_NAMES } from "./HowToPlay";

const SIZES: Size[] = [0, 1, 2];

/** Cores de um lugar na partida, na ordem da rodada. */
const colorsOf = (view: PlayerView, seat: Seat): Color[] => view.order.filter((c) => view.owner[c] === seat);

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const over = view.phase === "gameOver";
  // os outros na ordem em que jogam depois de mim
  const i = view.players.indexOf(me);
  const others = [...view.players.slice(i + 1), ...view.players.slice(0, i)];
  // dicas de trinca só contra a IA; entre pessoas ficaria injusto
  const vsAI = others.every((s) => room.seats[s]?.kind === "bot");

  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const [size, setSize] = useState<Size>(0);
  const [hover, setHover] = useState<number | null>(null);

  // só encaixam animadas as peças jogadas depois de abrir a mesa (recarregar não repete)
  const seen = useRef({ game: view.gameNo, moves: view.moves.length });
  if (seen.current.game !== view.gameNo) seen.current = { game: view.gameNo, moves: 0 };
  const animateFrom = seen.current.moves;

  useSounds(view);
  const showEnd = useEndDelay(view);

  // tamanhos que dá para jogar agora; se o escolhido acabou, passa ao próximo que tiver
  const avail = new Set(view.placeable.map(sizeOf));
  const chosen = avail.has(size) ? size : (SIZES.find((s) => avail.has(s)) ?? null);
  const playable = new Set(chosen === null ? [] : view.placeable.filter((x) => sizeOf(x) === chosen).map((x) => Math.floor(x / 3)));

  const leave = () => {
    send({ t: "leave" });
    router.push(OTRIO_PATH);
  };

  const place = (cell: number) => {
    if (chosen === null || !playable.has(cell)) return;
    send({ t: "action", action: { type: "place", cell, size: chosen } });
  };

  // teclas 1, 2 e 3 escolhem o tamanho
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 3 && !help) setSize((n - 1) as Size);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [help]);

  const pieces = view.moves.map((m) => ({ slot: slotOf(m.cell, m.size), color: m.color }));
  const last = view.moves.at(-1);
  const markers: Marker[] =
    vsAI && tips && view.canPlay && view.color !== null
      ? [
          ...winningSlots(view, view.color).map((slot) => ({ slot, kind: "win" as const })),
          ...rivalThreats(view).map((slot) => ({ slot, kind: "block" as const })),
        ]
      : [];
  const ghost = hover !== null && chosen !== null && playable.has(hover) && view.color !== null ? { slot: slotOf(hover, chosen), color: view.color } : null;
  const turnSeat = view.color !== null ? view.owner[view.color] : null;

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex items-center gap-2.5 rounded-2xl bg-black/40 px-3 py-1.5 font-display sm:gap-4 sm:px-4">
          {view.players.map((p) => (
            <Score key={p} colors={colorsOf(view, p)} value={view.scores[p]} mine={p === me} />
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          {vsAI && <TipsButton label="Dicas" on={tips} onClick={toggleTips} />}
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <section className="relative mx-auto mb-2 mt-9 w-[calc(100%-1.5rem)] max-w-[1100px] flex-1 sm:mt-10 sm:w-[calc(100%-7rem)] lg:mt-11">
        <div className="felt absolute inset-0 rounded-[48px] sm:rounded-[120px]" />

        {others.map((seat, k) => (
          <Opponent key={seat} view={view} room={room} seat={seat} pos={POSITIONS[others.length - 1][k]} turn={turnSeat === seat} />
        ))}

        {/* o tabuleiro é quadrado: cabe na menor medida do feltro, longe dos adversários */}
        <div className="absolute inset-0 [container-type:size]">
          <div className="flex h-full items-center justify-center px-3 pb-3 pt-[4.5rem] sm:px-28 sm:pb-6 sm:pt-20">
            <div className="w-[min(calc(100cqw-1.5rem),calc(100cqh-5.5rem),560px)] sm:w-[min(calc(100cqw-14rem),calc(100cqh-6.5rem),560px)]">
              <Board
                pieces={pieces}
                animateFrom={animateFrom}
                win={view.win?.slots}
                last={last ? slotOf(last.cell, last.size) : null}
                markers={markers}
                ghost={ghost}
                playable={playable}
                onCell={place}
                onHover={setHover}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 flex flex-col items-center gap-1.5 px-3 pb-3">
        <span className={`flex items-center gap-1.5 font-display text-xs transition-colors ${view.canPlay ? "text-gold" : "text-white/50"}`}>
          {view.canPlay && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
          {room.seats[me]?.name}
        </span>
        <div className="flex gap-3 sm:gap-5">
          {view.myColors.map((c) => {
            const active = view.canPlay && view.color === c;
            return (
              <div key={c} className={`flex gap-1.5 rounded-2xl p-1.5 transition sm:gap-2 ${active ? "bg-black/35 ring-2 ring-gold/60" : "bg-black/20 opacity-50"}`}>
                {SIZES.map((s) => {
                  const left = view.stock[c][s];
                  const can = active && avail.has(s);
                  const on = can && chosen === s;
                  return (
                    <button
                      key={s}
                      disabled={!can}
                      onClick={() => setSize(s)}
                      aria-label={`Peça ${["pequena", "média", "grande"][s]}`}
                      aria-pressed={on}
                      className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition sm:h-14 sm:w-14 ${
                        on ? "bg-gold/20 ring-2 ring-gold" : "bg-white/5 enabled:hover:bg-white/15"
                      }`}
                    >
                      <RingIcon color={c} size={s} dim={left === 0} className="h-9 w-9 sm:h-11 sm:w-11" />
                      <span className="absolute bottom-0.5 right-1 font-display text-[10px] text-white/70">{left}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {over && showEnd && (
        <GameEnd
          won={view.winner === me}
          draw={view.winner === null}
          badge={
            view.win && view.winColor !== null ? (
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-display text-xs tracking-wider">
                <ColorMark color={view.winColor} className="h-4 w-4" />
                {WIN_NAMES[view.win.kind]}
              </span>
            ) : undefined
          }
          onLeave={leave}
          onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
        >
          <div className="flex items-center gap-4 font-display">
            {view.players.map((p) => (
              <Score key={p} colors={colorsOf(view, p)} value={view.scores[p]} mine={p === me} />
            ))}
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="OTRIO" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Score({ colors, value, mine }: { colors: Color[]; value: number; mine: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 leading-none">
      <span className="flex gap-0.5">
        {colors.map((c) => (
          <ColorMark key={c} color={c} className="h-3 w-3" />
        ))}
      </span>
      <span className={`text-2xl sm:text-3xl ${mine ? "text-gold" : ""}`}>{value}</span>
    </div>
  );
}

/**
 * Onde fica cada adversário na borda do feltro, pela quantidade deles e pela ordem de jogo
 * (o próximo a jogar fica à direita). No celular, todos em cima.
 */
const TOP = "top-0 -translate-x-1/2 -translate-y-6 sm:-translate-y-7 lg:-translate-y-8";
const POSITIONS: string[][] = [
  [`left-1/2 ${TOP}`],
  [`left-[72%] ${TOP} sm:left-auto sm:right-0 sm:top-1/2 sm:translate-x-1/2 sm:-translate-y-1/2`, `left-[28%] ${TOP} sm:left-0 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2`],
  [
    `left-[80%] ${TOP} sm:left-auto sm:right-0 sm:top-1/2 sm:translate-x-1/2 sm:-translate-y-1/2`,
    `left-1/2 ${TOP}`,
    `left-[20%] ${TOP} sm:left-0 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2`,
  ],
];

function Opponent({ view, room, seat, pos, turn }: { view: PlayerView; room: RoomInfo; seat: Seat; pos: string; turn: boolean }) {
  const info = room.seats[seat];
  const colors = colorsOf(view, seat);
  return (
    <div className={`absolute z-10 flex flex-col items-center ${pos}`}>
      <div className={`relative flex flex-col items-center ${info?.connected ? "" : "opacity-40"}`}>
        <div
          className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[3px] bg-stone-800 font-display text-lg text-white shadow-lg shadow-black/40 sm:h-14 sm:w-14 lg:h-16 lg:w-16 lg:text-2xl ${
            RING_COLORS[seat].border
          } ${turn ? "turn-glow" : ""}`}
        >
          <SeatFace seat={info} />
        </div>
        <span className="relative -mt-2 max-w-24 truncate rounded-full bg-stone-950/90 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-white/10 sm:max-w-28 lg:text-xs">
          {info?.name}
        </span>
        <div className="mt-1 flex flex-col gap-0.5">
          {colors.map((c) => (
            <span key={c} className={`flex items-center gap-1 rounded-full bg-black/30 px-1.5 py-px ${view.color === c ? "ring-1 ring-gold/70" : ""}`}>
              {SIZES.map((s) => (
                <span key={s} className="flex items-center gap-px font-display text-[10px] leading-none text-white/70" title={SIZE_NAMES[s]}>
                  <RingIcon color={c} size={s} dim={view.stock[c][s] === 0} className="h-3 w-3" />
                  {view.stock[c][s]}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Sons a partir das mudanças da visão: anel encaixando e fim de partida. */
function useSounds(view: PlayerView) {
  const prev = useRef({ game: view.gameNo, moves: view.moves.length, phase: view.phase });
  useAudioUnlock();

  useEffect(() => {
    const p = prev.current;
    prev.current = { game: view.gameNo, moves: view.moves.length, phase: view.phase };
    if (view.gameNo !== p.game || view.moves.length <= p.moves) return;
    const last = view.moves.at(-1)!;
    setTimeout(() => playRingSound(last.size), 200);
    if (view.phase === "gameOver" && p.phase !== "gameOver" && view.winner !== null) {
      setTimeout(view.winner === view.seat ? playWinSound : playLoseSound, 550);
    }
  }, [view.gameNo, view.moves, view.phase, view.winner, view.seat]);
}

/** Mostra a tela de fim só depois de a trinca piscar um pouco. */
function useEndDelay(view: PlayerView) {
  const [show, setShow] = useState(view.phase === "gameOver");
  useEffect(() => {
    if (view.phase !== "gameOver") return setShow(false);
    const t = setTimeout(() => setShow(true), 1800);
    return () => clearTimeout(t);
  }, [view.phase, view.gameNo]);
  return show;
}
