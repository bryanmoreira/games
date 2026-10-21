"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { handPips, sameTile, teamOf, type HandResult, type PlayerView, type Seat, type Side, type Tile, type Win } from "@mesa/domino";
import type { RoomInfo } from "@mesa/truco";
import { send } from "@/lib/socket";
import { DOMINO_PATH } from "@/lib/domino/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playBatidaSound, playClosedSound, playDrawSound, playPassSound, playShuffleSound, playTileSound } from "@/lib/domino/sound";
import { Board } from "./Board";
import { Domino } from "./Tile";
import { HowToPlay } from "./HowToPlay";

type Pos = "bottom" | "right" | "top" | "left";
const POS: Pos[] = ["bottom", "right", "top", "left"];

export const WIN_NAME: Record<Win, string> = { simples: "BATEU", carroca: "CARROÇA", laelo: "LÁ-E-LÔ", cruzada: "CRUZADA" };

const byValue = (x: Tile, y: Tile) => x[0] - y[0] || x[1] - y[1];

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const myTeam = teamOf(me);
  const duo = view.mode === "duplas";
  const posOf = (seat: Seat): Pos => (duo ? POS[(seat - me + 4) % 4] : seat === me ? "bottom" : "top");
  const others = view.players.filter((p) => p !== me);

  const [help, setHelp] = useState(false);
  const [pick, setPick] = useState<Tile | null>(null);
  const passes = useEvents(view);
  useEndSounds(view);
  useAudioUnlock();

  // a escolha some quando a vez passa ou a mesa muda
  const playCount = view.events.length;
  useEffect(() => setPick(null), [playCount, view.handNo, view.canPlay]);

  const leave = () => {
    send({ t: "leave" });
    router.push(DOMINO_PATH);
  };

  const play = (tile: Tile, side?: Side) => {
    setPick(null);
    send({ t: "action", action: { type: "play", tile, ...(side ? { side } : {}) } });
  };
  const choose = (tile: Tile) => {
    const o = view.options.find((x) => sameTile(x.tile, tile));
    if (!o) return;
    if (o.sides.length === 1 || !view.board.first) return play(tile, o.sides[0]);
    setPick((p) => (p && sameTile(p, tile) ? null : tile));
  };
  const pickSides = pick ? (view.options.find((o) => sameTile(o.tile, pick))?.sides ?? []) : [];

  const over = view.phase === "gameOver";
  const name = (seat: Seat) => room.seats[seat]?.name ?? "";

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <Score view={view} us={duo ? "NÓS" : "VOCÊ"} them={duo ? "ELES" : (name(others[0]) || "ELE").slice(0, 7).toUpperCase()} />
        <HandInfo view={view} />
        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <section className="relative mx-auto mb-2 mt-9 w-[calc(100%-1.5rem)] max-w-[1100px] flex-1 sm:mt-11 sm:w-[calc(100%-7rem)]">
        <div className="felt absolute inset-0 rounded-[40px] sm:rounded-[100px]" />

        {others.map((seat) => (
          <Opponent
            key={seat}
            pos={posOf(seat) as Exclude<Pos, "bottom">}
            seat={seat}
            room={room}
            view={view}
            passKey={passes[seat]}
          />
        ))}

        <Board
          board={view.board}
          pick={pick}
          sides={pickSides}
          onSide={(side) => pick && play(pick, side)}
          className={`absolute inset-x-3 bottom-3 top-12 sm:top-16 ${duo ? "sm:inset-x-24" : "sm:inset-x-10"}`}
        />

        {view.mode === "1x1" && <Stock view={view} />}
        {view.phase === "handEnd" && view.result && <CenterStatus result={view.result} myTeam={myTeam} />}
        {passes[me] !== undefined && <PassBubble key={passes[me]} pos="bottom" />}
      </section>

      <MyArea view={view} name={name(me)} pick={pick} onTile={choose} onDraw={() => send({ t: "action", action: { type: "draw" } })} />

      {over && (
        <GameEnd won={view.winner === myTeam} onLeave={leave} onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}>
          <p className="font-display text-3xl">
            <span className="text-gold">{view.scores[myTeam]}</span>
            <span className="mx-3 text-white/30">×</span>
            {view.scores[1 - myTeam]}
          </p>
          <div className="flex gap-6 font-display">
            <EndStat label="MÃOS" value={view.handNo} />
            <EndStat label="MODO" value={duo ? "DUPLAS" : "1×1"} gold />
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="DOMINÓ" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Score({ view, us, them }: { view: PlayerView; us: string; them: string }) {
  const myTeam = teamOf(view.seat);
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-3 py-2 font-display sm:gap-3 sm:px-4">
      <div className="flex flex-col items-center leading-none">
        <span className="text-[10px] text-gold/80">{us}</span>
        <span className="text-3xl text-gold">{view.scores[myTeam]}</span>
      </div>
      <div className="flex flex-col items-center leading-none" aria-hidden="true">
        <span className="invisible text-[10px]">×</span>
        <span className="flex h-[1em] items-center text-3xl">
          <span className="text-base text-white/30">×</span>
        </span>
      </div>
      <div className="flex flex-col items-center leading-none">
        <span className="max-w-16 truncate text-[10px] text-white/60">{them}</span>
        <span className="text-3xl">{view.scores[1 - myTeam]}</span>
      </div>
    </div>
  );
}

/** Mão valendo o dobro e a meta da partida. */
function HandInfo({ view }: { view: PlayerView }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-black/40 px-3 py-1.5 font-display">
      <div className="flex flex-col items-center leading-none">
        <span className="text-[9px] tracking-wide text-white/50">ATÉ</span>
        <span className="text-2xl">6</span>
      </div>
      {view.doubled && (
        <>
          <div className="h-8 w-px bg-white/10" />
          <div className="banner flex flex-col items-center leading-none" title="Esta mão vale o dobro">
            <span className="text-[9px] tracking-wide text-gold">VALE</span>
            <span className="text-2xl text-gold">×2</span>
          </div>
        </>
      )}
    </div>
  );
}

// Assentos na borda da mesa (centro do avatar sobre a borda)
const SEAT_POS: Record<Exclude<Pos, "bottom">, string> = {
  top: "left-1/2 top-0 -translate-x-1/2 -translate-y-6 flex-col sm:-translate-y-7",
  left: "left-1 top-1/2 -translate-y-1/2 flex-col sm:left-0 sm:-translate-x-[30%]",
  right: "right-1 top-1/2 -translate-y-1/2 flex-col sm:right-0 sm:translate-x-[30%]",
};

function Opponent({ pos, seat, room, view, passKey }: { pos: Exclude<Pos, "bottom">; seat: Seat; room: RoomInfo; view: PlayerView; passKey?: number }) {
  const info = room.seats[seat];
  const partner = teamOf(seat) === teamOf(view.seat);
  const turn = view.phase === "playing" && view.turn === seat;
  const tiles = view.revealed?.[seat];
  const count = view.handCounts[seat];
  const side = pos !== "top";

  return (
    <div className={`absolute z-10 flex items-center gap-1 ${SEAT_POS[pos]}`}>
      <div className={`relative flex flex-col items-center ${info?.connected ? "" : "opacity-40"}`}>
        <Framed frame={info?.frame}>
          <div
            className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[3px] font-display text-lg shadow-lg shadow-black/40 sm:h-14 sm:w-14 sm:text-xl ${
              partner ? "border-gold bg-gold text-stone-900" : "border-red-400/80 bg-stone-800 text-white"
            } ${turn ? "turn-glow" : ""}`}
          >
            <SeatFace seat={info} />
          </div>
        </Framed>
        <span className="relative -mt-2 max-w-20 truncate rounded-full bg-stone-950/90 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-white/10">
          {info?.name}
        </span>
        {passKey !== undefined && <PassBubble key={passKey} pos={pos} />}
      </div>
      {/* peças dos lados ficam em duas colunas para não passar da mesa */}
      <div className={`flex ${side ? "grid max-w-12 grid-cols-2 gap-0.5" : "gap-0.5"}`}>
        {tiles
          ? [...tiles].sort(byValue).map((t) => <Domino key={t.join()} a={t[0]} b={t[1]} className="banner w-3.5 sm:w-4" />)
          : Array.from({ length: count }, (_, i) => <Domino key={i} a={0} b={0} back className="w-2.5 sm:w-3" />)}
      </div>
    </div>
  );
}

const BUBBLE_POS: Record<Pos, string> = {
  bottom: "left-1/2 bottom-3",
  top: "left-1/2 top-full mt-1",
  left: "left-[120%] top-1/2",
  right: "right-[20%] top-1/2",
};

/** "PASSO" de quem ficou sem peça. */
function PassBubble({ pos }: { pos: Pos }) {
  return (
    <div className={`shout pointer-events-none absolute z-40 ${BUBBLE_POS[pos]}`}>
      <div className="whitespace-nowrap rounded-2xl border-4 border-stone-900 bg-white px-3 py-0.5 font-display text-lg text-stone-900 shadow-xl sm:text-2xl">
        PASSO
      </div>
    </div>
  );
}

/** Monte do 1×1: pilha de peças viradas com a contagem; brilha quando preciso comprar. */
function Stock({ view }: { view: PlayerView }) {
  const n = view.stockCount;
  return (
    <button
      onClick={() => view.canDraw && send({ t: "action", action: { type: "draw" } })}
      disabled={!view.canDraw}
      title="Comprar"
      aria-label={`Monte: ${n} peças`}
      className={`absolute bottom-3 left-3 z-20 flex items-end gap-1.5 rounded-xl p-1.5 transition sm:bottom-5 sm:left-6 ${
        view.canDraw ? "turn-glow cursor-pointer bg-black/30" : "cursor-default"
      } ${n === 0 ? "opacity-30" : ""}`}
    >
      <span className="relative h-10 w-8 sm:h-12 sm:w-9">
        {[0, 1, 2].map((i) => (
          <span key={i} className="absolute" style={{ left: i * 3, top: -i * 3 }}>
            <Domino a={0} b={0} back className="w-5 sm:w-6" />
          </span>
        ))}
      </span>
      <span className="font-display text-xl leading-none">{n}</span>
    </button>
  );
}

function CenterStatus({ result, myTeam }: { result: HandResult; myTeam: number }) {
  const ours = result.team === myTeam;
  const title = result.kind === "fechado" ? "FECHOU" : WIN_NAME[result.win!];
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
      <div className="banner flex flex-col items-center gap-1 rounded-2xl bg-black/75 px-6 py-3 font-display whitespace-nowrap">
        <span className="text-sm tracking-widest text-white/70">{title}</span>
        {result.team === null ? (
          <span className="text-3xl text-white sm:text-4xl">EMPATE</span>
        ) : (
          <span className={`text-3xl sm:text-4xl ${ours ? "text-gold" : "text-red-400"}`}>
            +{result.points} {ours ? "NÓS" : "ELES"}
          </span>
        )}
        {result.kind === "fechado" && (
          <span className="text-base text-white/80">
            <span className="text-gold">{result.pips[myTeam]}</span>
            <span className="mx-2 text-white/30">×</span>
            {result.pips[1 - myTeam]}
          </span>
        )}
        {result.team === null && <span className="text-sm text-gold">PRÓXIMA ×2</span>}
      </div>
    </div>
  );
}

function MyArea({
  view,
  name,
  pick,
  onTile,
  onDraw,
}: {
  view: PlayerView;
  name: string;
  pick: Tile | null;
  onTile: (t: Tile) => void;
  onDraw: () => void;
}) {
  const myTurn = view.phase === "playing" && view.turn === view.seat;
  const hand = [...view.myHand].sort(byValue);
  const can = (t: Tile) => view.options.some((o) => sameTile(o.tile, t));
  // mão grande (compras no 1×1): peças menores
  const size = hand.length > 10 ? "w-[clamp(24px,6.5vw,40px)]" : "w-[clamp(34px,10vw,54px)]";

  return (
    <section className="relative z-20 flex flex-col items-center gap-1.5 px-2 pb-3">
      <div className="flex min-h-[calc(clamp(34px,10vw,54px)*1.85+0.75rem)] max-w-full flex-wrap items-end justify-center gap-1 pt-3 sm:gap-1.5">
        {hand.map((t, i) => {
          const ok = can(t);
          const picked = pick !== null && sameTile(pick, t);
          return (
            <button
              key={`${view.handNo}-${t.join()}`}
              disabled={!ok}
              onClick={() => onTile(t)}
              aria-label={`Peça ${t[0]} e ${t[1]}`}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`deal ${size} transition-transform duration-200 ${
                picked ? "-translate-y-4 [&>svg]:drop-shadow-[0_0_8px_#f2c14e]" : ok ? "turn-card -translate-y-1 cursor-pointer hover:-translate-y-3" : ""
              } ${myTurn && !ok ? "opacity-45" : ""}`}
            >
              <Domino a={t[0]} b={t[1]} />
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1.5 font-display text-xs transition-colors ${myTurn ? "text-gold" : "text-white/50"}`}>
          {myTurn && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
          {name}
          {view.phase === "handEnd" && <span className="text-white/50">· {handPips(view.myHand)}</span>}
        </span>
        {view.canDraw && (
          <button
            onClick={onDraw}
            className="banner rounded-xl bg-gold px-4 py-1.5 font-display text-stone-900 shadow-[0_3px_0_#9a6b12] transition active:translate-y-0.5 active:shadow-none"
          >
            COMPRAR
          </button>
        )}
      </div>
    </section>
  );
}

/**
 * Sons dos lances novos e o "PASSO" de cada um que passou. Devolve, por lugar, a chave do último passe
 * (muda a cada passe para o balão aparecer de novo). Recarregar não toca nada.
 */
function useEvents(view: PlayerView) {
  const seen = useRef({ hand: view.handNo, game: view.gameNo, n: view.events.length });
  const [passes, setPasses] = useState<Record<number, number>>({});

  useEffect(() => {
    const p = seen.current;
    seen.current = { hand: view.handNo, game: view.gameNo, n: view.events.length };
    if (p.hand !== view.handNo || p.game !== view.gameNo) {
      setPasses({});
      if (view.phase === "playing") playShuffleSound();
      return;
    }
    const added = view.events.slice(p.n);
    if (!added.length) return;
    const ending = view.phase !== "playing" && view.result;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let delay = 0;
    added.forEach((e, i) => {
      const last = i === added.length - 1;
      if (e.kind === "play") {
        timers.push(setTimeout(() => (last && ending ? undefined : playTileSound()), delay));
        delay += 120;
      } else if (e.kind === "pass") {
        const key = p.n + i;
        // um passe depois do outro, no ritmo que o servidor espera
        timers.push(
          setTimeout(() => {
            setPasses((m) => ({ ...m, [e.seat]: key }));
            playPassSound();
          }, delay),
        );
        delay += 900;
      } else {
        timers.push(setTimeout(playDrawSound, delay));
        delay += 150;
      }
    });
    if (ending) {
      const r = view.result!;
      timers.push(setTimeout(() => (r.kind === "batida" ? playBatidaSound(r.points) : playClosedSound()), 150));
    }
    return () => timers.forEach(clearTimeout);
  }, [view.events.length, view.handNo, view.gameNo]); // eslint-disable-line react-hooks/exhaustive-deps

  return passes;
}

/** Vitória ou derrota quando a partida acaba. */
function useEndSounds(view: PlayerView) {
  const played = useRef(view.phase === "gameOver" ? view.gameNo : -1);
  useEffect(() => {
    if (view.phase !== "gameOver" || played.current === view.gameNo) return;
    played.current = view.gameNo;
    setTimeout(view.winner === teamOf(view.seat) ? playWinSound : playLoseSound, 300);
  }, [view.phase, view.gameNo, view.winner, view.seat]);
}
