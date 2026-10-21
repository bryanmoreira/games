"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playedMs, TICK_MS, TICK_RATE, unpack, type Game, type Key, type VersusView } from "@mesa/tijolada";
import type { RoomInfo } from "@mesa/truco";
import { send } from "@/lib/socket";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { formatMs } from "@/lib/stats/compute";
import { playCountdownSound, playDrawSound, playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { useTouchDevice } from "@/lib/useTouchDevice";
import { TIJOLADA_PATH } from "@/lib/tijolada/paths";
import { Board } from "./Board";
import { TouchPad, useKeyboard } from "./controls";
import { HowToPlay } from "./HowToPlay";
import { Fit, fmt, HoldBox, NextBox, Stats, TopStrip } from "./Panels";
import { useRunner } from "./useRunner";

/**
 * 1×1: a sua partida roda aqui (sem esperar o servidor) e cada comando vai com o passo em que valeu.
 * O servidor refaz as duas e manda o campo do adversário; se a sua divergir, a dele vale e troca aqui.
 */
export function VersusTable({ room, view }: { room: RoomInfo; view: VersusView }) {
  const router = useRouter();
  const [help, setHelp] = useState(false);
  const touch = useTouchDevice();
  const mine = useRef<Game | null>(null);
  const opp = useRef<Game | null>(null);
  const sync = useRef({ gameNo: -1, rev: -1, offset: Infinity });

  useAudioUnlock();

  const me = view.players.find((p) => p.seat === view.me) ?? null;
  const other = view.players.find((p) => p !== me) ?? null;
  // assistindo: o primeiro lugar no lugar do "meu" campo
  const left = me ?? view.players[0];
  const right = me ? other : view.players[1];

  // cada visão: acerta o relógio (passo do servidor = agora - offset), troca a partida se mudou e atualiza o adversário
  const receive = useCallback(
    (v: VersusView) => {
      const s = sync.current;
      if (v.gameNo !== s.gameNo) {
        s.gameNo = v.gameNo;
        s.rev = -1;
        s.offset = Infinity;
        mine.current = null;
      }
      s.offset = Math.min(s.offset, performance.now() - v.tick * TICK_MS);
      const l = v.players.find((p) => p.seat === v.me) ?? v.players[0];
      const r = v.players.find((p) => p !== l) ?? null;
      if (v.me === null || !mine.current || l.rev !== s.rev) {
        mine.current = unpack(l.game);
        s.rev = l.rev;
      }
      opp.current = r ? unpack(r.game) : null;
    },
    [],
  );
  useEffect(() => receive(view), [receive, view]);

  const target = useCallback(() => Math.floor((performance.now() - sync.current.offset) / TICK_MS), []);
  const countdown = () => {
    const t = target();
    return Number.isFinite(t) && t < 0 ? Math.ceil(-t / TICK_RATE) : 0;
  };
  const over = view.phase === "over";
  const n = countdown();
  const running = !!me && !over && Number.isFinite(sync.current.offset) && n === 0;
  const onInput = useCallback((key: Key, tick: number) => send({ t: "action", action: { tick, key } }), []);
  const extra = useCallback(() => `${countdown()}|${opp.current?.over}`, []); // eslint-disable-line react-hooks/exhaustive-deps
  const controls = useRunner({ game: mine, target, running: running && !!me, onInput: me ? onInput : undefined, extra });
  useKeyboard(controls, !!me && !over && !help);

  // bipes da contagem
  const lastCount = useRef(n);
  useEffect(() => {
    if (n !== lastCount.current && n > 0) playCountdownSound(false);
    if (lastCount.current > 0 && n === 0 && !over) playCountdownSound(true);
    lastCount.current = n;
  }, [n, over]);

  const showEnd = useEndDelay(over);
  const prevPhase = useRef(view.phase);
  useEffect(() => {
    if (prevPhase.current !== "over" && over && me) {
      setTimeout(view.winner === null ? playDrawSound : view.winner === me.seat ? playWinSound : playLoseSound, 600);
    }
    prevPhase.current = view.phase;
  }, [view.phase, over, me, view.winner]);

  const leave = () => {
    send({ t: "leave" });
    router.push(TIJOLADA_PATH);
  };

  const name = (seat: number | undefined) => (seat === undefined ? "" : room.seats[seat]?.name ?? "");
  const g = mine.current;
  const o = opp.current;
  const myServer = me ? unpack(me.game) : null;
  const elapsed = Math.max(0, view.tick) * TICK_MS;

  return (
    <main className="flex h-dvh flex-col items-center overflow-hidden">
      <header className="relative z-40 flex w-full items-center justify-between gap-2 px-2 py-2 sm:px-6">
        <span className="rounded-xl bg-black/35 px-3 py-1 font-display text-sm tabular-nums text-white/70 sm:text-base">
          {formatMs(view.endTick !== null ? view.endTick * TICK_MS : elapsed)}
        </span>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over && !!me} />
        </div>
      </header>

      <TopStrip game={g} />
      <section className="flex min-h-0 w-full max-w-3xl flex-1 justify-center gap-2 px-2 pb-2 sm:gap-4">
        <aside className="hidden w-28 shrink-0 flex-col gap-3 sm:flex">
          <HoldBox game={g} />
          <Stats game={g} />
        </aside>
        <Fit>
          {({ w, h }) => (
            <div className="relative" style={{ width: w, height: h }}>
              <Board game={mine} className="h-full w-full" />
              {n > 0 && (
                <span key={`count-${n}`} className="banner absolute inset-0 flex items-center justify-center font-display text-8xl text-gold drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">
                  {n}
                </span>
              )}
              {g?.over && !over && (
                <span className="absolute inset-x-0 top-1/3 flex justify-center">
                  <span className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" aria-label="Esperando" />
                </span>
              )}
              {!me && <Tag name={name(left?.seat)} />}
            </div>
          )}
        </Fit>
        <aside className="flex w-[3.75rem] shrink-0 flex-col gap-3 sm:w-40">
          <div className="hidden sm:block">
            <NextBox game={g} />
          </div>
          {right && (
            <div className="flex min-h-0 flex-1 flex-col items-center gap-1.5">
              <span className={`w-full truncate text-center font-display text-[10px] sm:text-sm ${room.seats[right.seat]?.connected === false ? "text-white/30" : "text-red-300"}`}>
                {name(right.seat)}
              </span>
              <Fit top>
                {({ w, h }) => (
                  <div style={{ width: w, height: h }}>
                    <Board game={opp} ghost={false} className="h-full w-full" />
                  </div>
                )}
              </Fit>
              <span className="font-display text-xs tabular-nums text-white/70 sm:text-base">{fmt(o?.score ?? 0)}</span>
              <span className="font-display text-[10px] text-white/45 sm:text-xs">{o?.lines ?? 0} L</span>
            </div>
          )}
        </aside>
      </section>

      {touch && me && !over && <TouchPad controls={controls} />}

      {over && showEnd && me && myServer && (
        <GameEnd
          won={view.winner === me.seat}
          draw={view.winner === null}
          onLeave={leave}
          onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
        >
          <EndStat label="TEMPO" value={formatMs(playedMs({ ...myServer, overTick: myServer.overTick ?? view.endTick }))} gold />
          <div className="flex gap-6">
            <EndStat label="LINHAS" value={myServer.lines} />
            <EndStat label="PONTOS" value={fmt(myServer.score)} />
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="TIJOLADA" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Tag({ name }: { name: string }) {
  return <span className="absolute -top-6 inset-x-0 truncate text-center font-display text-sm text-gold">{name}</span>;
}

/** A tela de fim aparece um pouco depois do último tijolo. */
function useEndDelay(over: boolean) {
  const [show, setShow] = useState(over);
  useEffect(() => {
    if (!over) return setShow(false);
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, [over]);
  return show;
}
