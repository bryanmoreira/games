"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DEAL_MS, PAIRS, type PlayerView } from "@mesa/jogo-da-memoria";
import type { RoomInfo } from "@mesa/truco";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { GameEnd, EndStat } from "@/components/ui/GameEnd";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";
import { playCardSound, playDrawSound, playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { send } from "@/lib/socket";
import { MEMORIA_PATH } from "@/lib/jogo-da-memoria/paths";
import { playPairSound } from "@/lib/jogo-da-memoria/sound";
import { Board } from "./Board";
import { HowToPlay } from "./HowToPlay";

const format = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;

export function Table({ view, room, timeMs = 0, onFlip, onAgain, onHelpChange }: {
  view: PlayerView; room?: RoomInfo; timeMs?: number;
  onFlip?: (index: number) => void; onAgain?: () => void; onHelpChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const [showEnd, setShowEnd] = useState(false);
  const [dealing, setDealing] = useState(view.flips === 0);
  const over = view.phase === "gameOver";
  const solo = !room;
  const me = view.seat;
  const myStats = view.stats[me];
  const won = view.winners.length === 1 && view.winners[0] === me;
  const draw = view.winners.length > 1 && view.winners.includes(me);
  const total = view.stats.reduce((n, st) => n + st.pairs, 0);
  const previous = useRef({ flips: view.flips, total, phase: view.phase, game: view.gameNo });
  useAudioUnlock();

  useEffect(() => {
    setDealing(view.flips === 0);
    const t = setTimeout(() => setDealing(false), DEAL_MS);
    return () => clearTimeout(t);
    // O início é identificado pela partida, não por cada carta virada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.gameNo]);

  useEffect(() => {
    const p = previous.current;
    previous.current = { flips: view.flips, total, phase: view.phase, game: view.gameNo };
    if (p.game !== view.gameNo) return;
    if (view.flips > p.flips) playCardSound();
    if (total > p.total) playPairSound();
    if (over && p.phase !== "gameOver") {
      const t = setTimeout(draw ? playDrawSound : won ? playWinSound : playLoseSound, 400);
      return () => clearTimeout(t);
    }
  }, [view.flips, total, view.phase, view.gameNo, over, won, draw]);

  useEffect(() => {
    setShowEnd(false);
    if (!over) return;
    const t = setTimeout(() => setShowEnd(true), 1000);
    return () => clearTimeout(t);
  }, [over, view.gameNo]);

  const leave = () => { if (room) send({ t: "leave" }); router.push(MEMORIA_PATH); };
  const changeHelp = (value: boolean) => { setHelp(value); onHelpChange?.(value); };
  const others = view.players.filter(p => p !== me);
  const turnName = room?.seats[view.turn]?.name ?? "Você";
  const status = over ? "Colheita completa" : dealing ? "Embaralhando" : view.phase === "reveal" ? view.cards[view.open[0]] === view.cards[view.open[1]] ? "Encontrou um par!" : "Memorize as frutas" : view.canPlay ? view.open.length ? "Escolha outra carta" : "Sua vez" : `Vez de ${turnName}`;

  return <main className="flex h-dvh min-h-[480px] flex-col overflow-hidden">
    <header className="relative z-40 flex items-center justify-between gap-2 px-3 py-3 sm:px-6">
      <div className="flex items-center gap-3 rounded-2xl bg-black/30 px-3 py-2 font-display leading-none sm:gap-5">
        <div className="flex flex-col gap-1"><span className="text-[9px] text-white/50">PARES</span><span className="text-lg text-gold sm:text-2xl">{total}<span className="text-xs text-white/40"> / {PAIRS}</span></span></div>
        {solo && <><div className="flex flex-col gap-1"><span className="text-[9px] text-white/50">TENTATIVAS</span><span className="text-lg sm:text-2xl">{myStats.attempts}</span></div><div className="flex flex-col gap-1"><span className="text-[9px] text-white/50">TEMPO</span><span className="text-lg tabular-nums sm:text-2xl">{format(timeMs)}</span></div></>}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <HelpButton onClick={() => changeHelp(true)} /><TipsButton label="Dicas das cartas" on={tips} onClick={toggleTips} /><MuteButton /><ExitConfirm onExit={leave} ask={!over} />
      </div>
    </header>
    <section className={`mm-table relative mx-auto mb-3 flex w-[calc(100%-1.5rem)] max-w-[1000px] flex-1 items-center justify-center ${solo ? "mt-1" : "mt-8"}`}>
      <div className="felt absolute inset-0 rounded-[36px] sm:rounded-[80px]" />
      {room && others.map((p,i) => <div key={p} className={`mm-opponent mm-opponent-${others.length}-${i}`}><Player room={room} view={view} seat={p} /></div>)}
      <div className={`relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 px-3 py-5 ${solo ? "" : "pt-16 sm:px-24 sm:pt-12"}`}>
        <Board view={view} dealing={dealing} tips={tips} onFlip={index => { if (onFlip) onFlip(index); else send({ t: "action", action: { type: "flip", index } }); }} />
        <p role="status" aria-live="polite" className={`min-h-4 text-center font-display text-[11px] sm:text-sm ${view.canPlay ? "text-gold" : "text-white/60"}`}>{status}</p>
      </div>
    </section>
    {room && <footer className="flex min-h-14 items-center justify-center gap-3 pb-3">{me >= 0 ? <Player room={room} view={view} seat={me} compact /> : <span className="font-display text-xs text-white/50">Assistindo</span>}</footer>}
    {room && <span className="sr-only">Sala {room.code}</span>}
    {showEnd && over && me >= 0 && <GameEnd won={won} draw={draw} onLeave={leave} onAgain={onAgain ?? (room?.isHost ? () => send({ t: "restart" }) : undefined)} badge={<span className="font-display text-xs text-white/60">15 PARES</span>}>
      {solo ? <div className="flex gap-6"><EndStat label="TEMPO" value={format(timeMs)} /><EndStat label="TENTATIVAS" value={myStats.attempts} gold /><EndStat label="ERROS" value={myStats.mistakes} /></div> : <div className="flex max-w-72 flex-wrap justify-center gap-5">{view.players.map(p => <div key={p} className="max-w-24"><EndStat label={room?.seats[p]?.name ?? "Jogador"} value={view.stats[p].pairs} gold={p === me} /></div>)}</div>}
    </GameEnd>}
    {help && <HowToPlayModal game="JOGO DA MEMÓRIA" onClose={() => changeHelp(false)}><HowToPlay /></HowToPlayModal>}
  </main>;
}

function Player({ room, view, seat, compact = false }: { room: RoomInfo; view: PlayerView; seat: number; compact?: boolean }) {
  const info = room.seats[seat];
  const active = view.turn === seat && view.phase !== "gameOver";
  return <div className={`flex items-center gap-2 ${compact ? "" : "flex-col gap-0"}`}>
    <Framed frame={info?.frame}><div className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-[3px] bg-stone-800 font-display ${seat === view.seat ? "border-gold" : "border-red-300/70"} ${active ? "turn-glow" : ""} ${info?.connected ? "" : "opacity-50"}`}><SeatFace seat={info} /></div></Framed>
    <div className={`flex items-center gap-1.5 rounded-full bg-stone-950/90 px-2 py-1 text-[10px] sm:text-xs ${active ? "text-gold" : "text-white/70"}`}><span className="max-w-16 truncate sm:max-w-20">{info?.name}</span><span className="font-display">{view.stats[seat].pairs}</span></div>
  </div>;
}
