"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { teamOf, type Play, type PlayerView, type RoomInfo, type Seat, type Shout } from "@truco/game";
import { send } from "@/lib/socket";
import { CardBack, CardImg } from "./Card";

type Pos = "bottom" | "right" | "top" | "left";
const POS: Pos[] = ["bottom", "right", "top", "left"];
const BET_NAME: Record<number, string> = { 3: "TRUCO!", 6: "SEIS!", 9: "NOVE!", 12: "DOZE!" };

const relPos = (seat: Seat, me: Seat): Pos => POS[(seat - me + 4) % 4];

function shoutText(s: Shout) {
  switch (s.kind) {
    case "truco":
      return BET_NAME[s.value ?? 3];
    case "accept":
      return "QUERO!";
    case "mao11play":
      return "BORA!";
    default:
      return "CORRO!";
  }
}

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const myTeam = teamOf(me);
  const us = view.scores[myTeam];
  const them = view.scores[1 - myTeam];
  const round = view.rounds[view.rounds.length - 1];

  const leave = () => {
    if (view.phase !== "gameOver" && !confirm("Sair da partida?")) return;
    send({ t: "leave" });
    router.push("/");
  };

  const seatAt = (pos: Pos) => ((me + POS.indexOf(pos)) % 4) as Seat;

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-6">
        <div className="flex items-center gap-3 rounded-2xl bg-black/40 px-4 py-2 font-display">
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-gold/80">NÓS</span>
            <span className="text-3xl text-gold">{us}</span>
          </div>
          <span className="text-white/30">×</span>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[10px] text-white/60">ELES</span>
            <span className="text-3xl">{them}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RoundDots view={view} />
          <div
            className={`flex h-11 min-w-11 items-center justify-center rounded-full px-2 font-display text-xl ${
              view.value > 1 ? "bg-gold text-stone-900" : "bg-white/10"
            }`}
            title="Valor da mão"
          >
            {view.value}
          </div>
          {view.mode !== "normal" && (
            <span className="rounded-full bg-red-500/80 px-3 py-1 font-display text-xs">
              {view.mode === "ferro" ? "FERRO" : "MÃO DE 11"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <button onClick={leave} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20">
            ✕
          </button>
        </div>
      </header>

      <section className="relative mx-3 mb-2 mt-3 flex-1 sm:mx-10">
        <div className="felt absolute inset-0 rounded-[48px]" />

        {(["top", "left", "right"] as const).map((pos) => (
          <Opponent key={pos} pos={pos} seat={seatAt(pos)} room={room} view={view} />
        ))}

        <Vira view={view} />

        <div className="absolute left-1/2 top-1/2 h-[min(46vh,320px)] w-[min(62vw,360px)] -translate-x-1/2 -translate-y-1/2">
          {round.plays.map((p, i) => (
            <PlayedCard
              key={`${view.handNo}-${view.rounds.length}-${p.seat}`}
              play={p}
              pos={relPos(p.seat, me)}
              order={i}
              winning={view.phase !== "playing" && round.winningSeat === p.seat}
              mine={p.seat === me}
            />
          ))}
        </div>

        <CenterStatus view={view} />

        {view.shout && (
          <ShoutBubble key={view.shout.id} text={shoutText(view.shout)} pos={relPos(view.shout.seat, me)} />
        )}
      </section>

      <MyArea view={view} room={room} />

      {view.phase === "gameOver" && <GameOver view={view} room={room} onLeave={leave} />}
    </main>
  );
}

function RoundDots({ view }: { view: PlayerView }) {
  const myTeam = teamOf(view.seat);
  return (
    <div className="flex gap-1.5 rounded-full bg-black/30 px-2.5 py-2">
      {[0, 1, 2].map((i) => {
        const w = view.rounds[i]?.winner;
        const color =
          w === null || w === undefined
            ? "bg-white/15"
            : w === "tie"
              ? "bg-white/60"
              : w === myTeam
                ? "bg-gold"
                : "bg-red-500";
        return <span key={i} className={`h-3 w-3 rounded-full ${color}`} />;
      })}
    </div>
  );
}

const OPP_POS: Record<Exclude<Pos, "bottom">, string> = {
  top: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 flex-col-reverse",
  left: "left-3 top-1/2 -translate-y-1/2 flex-col sm:left-6",
  right: "right-3 top-1/2 -translate-y-1/2 flex-col sm:right-6",
};

function Opponent({ pos, seat, room, view }: { pos: Exclude<Pos, "bottom">; seat: Seat; room: RoomInfo; view: PlayerView }) {
  const info = room.seats[seat];
  const partner = teamOf(seat) === teamOf(view.seat);
  const turn = (view.phase === "playing" && !view.bet && view.turn === seat) || (view.bet && teamOf(seat) !== view.bet.team && view.phase === "playing");
  const count = view.handCounts[seat];

  return (
    <div className={`absolute z-10 flex items-center gap-1 ${OPP_POS[pos]}`}>
      <div className="flex h-10 justify-center sm:h-14">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="-mx-2 w-7 sm:w-10" style={{ transform: `rotate(${(i - (count - 1) / 2) * 10}deg)` }}>
            <CardBack className="!border-2" />
          </div>
        ))}
      </div>
      <div className={`flex flex-col items-center ${info.connected ? "" : "opacity-40"}`}>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full font-display text-lg sm:h-12 sm:w-12 ${
            partner ? "bg-gold text-stone-900" : "bg-stone-700 text-white"
          } ${turn ? "turn-glow" : ""}`}
        >
          {info.kind === "bot" ? "🤖" : info.name.slice(0, 1).toUpperCase()}
        </div>
        <span className="mt-0.5 max-w-20 truncate rounded bg-black/40 px-1.5 text-xs">{info.name}</span>
      </div>
    </div>
  );
}

function Vira({ view }: { view: PlayerView }) {
  return (
    <div className="absolute bottom-5 left-6 z-0 flex items-end gap-1 sm:bottom-8 sm:left-10">
      <div className="relative w-10 sm:w-16">
        <CardBack />
        <div className="absolute left-1/2 top-0 w-full -translate-y-2 translate-x-[-10%] rotate-12">
          <CardImg card={view.vira} />
        </div>
      </div>
      <span className="ml-3 rounded-full bg-black/40 px-2 py-0.5 font-display text-xs text-gold" title="Manilha">
        ★{view.manilha}
      </span>
    </div>
  );
}

const PLAY_POS: Record<Pos, { to: string; from: string; cls: string }> = {
  bottom: { cls: "left-1/2 bottom-0", to: "translate(-50%, 0) rotate(-3deg)", from: "translate(-50%, 80px)" },
  top: { cls: "left-1/2 top-0", to: "translate(-50%, 0) rotate(4deg)", from: "translate(-50%, -80px)" },
  left: { cls: "left-0 top-1/2", to: "translate(0, -50%) rotate(-8deg)", from: "translate(-80px, -50%)" },
  right: { cls: "right-0 top-1/2", to: "translate(0, -50%) rotate(8deg)", from: "translate(80px, -50%)" },
};

function PlayedCard({ play, pos, order, winning, mine }: { play: Play; pos: Pos; order: number; winning: boolean; mine: boolean }) {
  const p = PLAY_POS[pos];
  return (
    <div
      className={`played absolute w-[clamp(52px,12vw,84px)] ${p.cls} ${winning ? "[&>*]:outline-4 [&>*]:outline-offset-2 [&>*]:outline-gold" : ""}`}
      style={{ "--to": p.to, "--from": p.from, transform: p.to, zIndex: winning ? 20 : order } as React.CSSProperties}
    >
      {play.hidden && !mine ? (
        <CardBack />
      ) : (
        <CardImg card={play.card} className={play.hidden ? "opacity-60" : ""} />
      )}
    </div>
  );
}

function CenterStatus({ view }: { view: PlayerView }) {
  const myTeam = teamOf(view.seat);
  let content: React.ReactNode = null;

  if (view.phase === "handEnd" && view.result) {
    const r = view.result;
    if (r.winner === null) content = <span className="text-white">EMPATE</span>;
    else
      content = (
        <span className={r.winner === myTeam ? "text-gold" : "text-red-400"}>
          +{r.points} {r.winner === myTeam ? "NÓS" : "ELES"}
        </span>
      );
  } else if (view.bet && view.phase === "playing") {
    content = <span className="animate-pulse text-gold">{BET_NAME[view.bet.value]}</span>;
  } else if (view.phase === "mao11" && !view.mustDecideMao11) {
    content = <span className="animate-pulse text-white/80">⏳ 11</span>;
  }

  if (!content) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
      <div key={view.handNo + String(view.phase) + (view.bet?.value ?? "")} className="banner rounded-2xl bg-black/70 px-6 py-3 font-display text-3xl whitespace-nowrap sm:text-4xl">
        {content}
      </div>
    </div>
  );
}

const SHOUT_POS: Record<Pos, string> = {
  bottom: "left-1/2 bottom-4",
  top: "left-1/2 top-16",
  left: "left-[22%] top-[30%]",
  right: "left-[78%] top-[30%]",
};

function ShoutBubble({ text, pos }: { text: string; pos: Pos }) {
  return (
    <div className={`shout pointer-events-none absolute z-40 ${SHOUT_POS[pos]}`}>
      <div className="rounded-2xl border-4 border-stone-900 bg-gold px-4 py-1 font-display text-2xl text-stone-900 shadow-xl sm:text-3xl">
        {text}
      </div>
    </div>
  );
}

function MyArea({ view, room }: { view: PlayerView; room: RoomInfo }) {
  const [hide, setHide] = useState(false);
  const myInfo = room.seats[view.seat];
  const myTurn = view.canPlay || view.mustRespond || view.mustDecideMao11;

  useEffect(() => {
    if (!view.canPlay || !view.canHide) setHide(false);
  }, [view.canPlay, view.canHide]);

  const play = (index: number) => {
    if (!view.canPlay) return;
    send({ t: "action", action: { type: "play", index, hidden: hide } });
    setHide(false);
  };

  return (
    <section className="relative z-20 flex flex-col items-center gap-2 px-3 pb-3">
      <div className="flex min-h-12 flex-wrap items-center justify-center gap-2">
        {view.mustDecideMao11 && (
          <>
            <div className="flex gap-1 rounded-xl bg-black/40 p-1.5">
              {view.partnerHand?.map((c) => (
                <div key={c.id} className="w-10 sm:w-12">
                  <CardImg card={c} />
                </div>
              ))}
            </div>
            <ActionBtn color="green" onClick={() => send({ t: "action", action: { type: "mao11", play: true } })}>
              BORA
            </ActionBtn>
            <ActionBtn color="red" onClick={() => send({ t: "action", action: { type: "mao11", play: false } })}>
              CORRO
            </ActionBtn>
          </>
        )}
        {view.mustRespond && (
          <>
            <ActionBtn color="green" onClick={() => send({ t: "action", action: { type: "accept" } })}>
              QUERO
            </ActionBtn>
            {view.canRaise && view.bet && (
              <ActionBtn color="gold" onClick={() => send({ t: "action", action: { type: "raise" } })}>
                {BET_NAME[view.bet.value + 3]}
              </ActionBtn>
            )}
            <ActionBtn color="red" onClick={() => send({ t: "action", action: { type: "run" } })}>
              CORRO
            </ActionBtn>
          </>
        )}
        {view.canTruco && view.nextBet && (
          <ActionBtn color="gold" onClick={() => send({ t: "action", action: { type: "truco" } })}>
            {BET_NAME[view.nextBet]}
          </ActionBtn>
        )}
        {view.canPlay && view.canHide && view.mode !== "ferro" && (
          <button
            onClick={() => setHide((h) => !h)}
            className={`flex h-12 items-center gap-2 rounded-xl px-3 font-display text-sm transition ${
              hide ? "bg-white text-stone-900" : "bg-white/10 text-white/80 hover:bg-white/20"
            }`}
            title="Jogar coberta"
          >
            <span className="card-back inline-block w-5 !border" />
            {hide ? "✓" : ""}
          </button>
        )}
      </div>

      <div
        className={`flex min-h-[calc(clamp(72px,21vw,118px)*1.452+0.5rem)] min-w-24 items-end justify-center rounded-3xl px-4 pt-2 ${
          myTurn ? "turn-glow" : ""
        }`}
      >
        {view.myHand.map((c, i) => (
          <button
            key={`${view.handNo}-${c?.id ?? i}-${i}`}
            disabled={!view.canPlay}
            onClick={() => play(i)}
            className={`deal -mx-1 w-[clamp(72px,21vw,118px)] transition-transform duration-150 sm:mx-1 ${
              view.canPlay ? "cursor-pointer hover:-translate-y-4" : "cursor-default"
            } ${hide ? "opacity-80" : ""}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <CardImg card={c} />
          </button>
        ))}
      </div>
      <span className="font-display text-xs text-white/50">{myInfo.name}</span>
    </section>
  );
}

const BTN_COLORS = {
  gold: "bg-gold text-stone-900 shadow-[0_4px_0_#9a6b12]",
  green: "bg-emerald-500 text-white shadow-[0_4px_0_#047857]",
  red: "bg-red-500 text-white shadow-[0_4px_0_#991b1b]",
};

function ActionBtn({ color, onClick, children }: { color: keyof typeof BTN_COLORS; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`banner h-12 rounded-xl px-5 font-display text-lg transition active:translate-y-1 active:shadow-none ${BTN_COLORS[color]}`}
    >
      {children}
    </button>
  );
}

function GameOver({ view, room, onLeave }: { view: PlayerView; room: RoomInfo; onLeave: () => void }) {
  const won = view.winner === teamOf(view.seat);
  const myTeam = teamOf(view.seat);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="banner flex flex-col items-center gap-6 rounded-3xl bg-stone-900 px-10 py-8 ring-2 ring-gold/50">
        <span className="text-6xl">{won ? "🏆" : "💀"}</span>
        <h2 className={`font-display text-4xl ${won ? "text-gold" : "text-red-400"}`}>{won ? "VITÓRIA!" : "DERROTA"}</h2>
        <p className="font-display text-3xl">
          <span className="text-gold">{view.scores[myTeam]}</span>
          <span className="mx-3 text-white/30">×</span>
          {view.scores[1 - myTeam]}
        </p>
        <div className="flex gap-3">
          <button onClick={onLeave} className="rounded-xl bg-white/10 px-5 py-3 font-display hover:bg-white/20">
            ✕
          </button>
          {room.isHost && (
            <button
              onClick={() => send({ t: "restart" })}
              className="rounded-xl bg-gold px-6 py-3 font-display text-stone-900 shadow-[0_4px_0_#9a6b12]"
            >
              De novo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
