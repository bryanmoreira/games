"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { teamOf, type Card, type Play, type PlayerView, type RoomInfo, type Seat, type Shout } from "@truco/game";
import { send } from "@/lib/truco/socket";
import { CardBack, CardImg } from "./Card";
import { DealAnimation, dealtTo, useDeal } from "./Deal";
import { isMuted, playCardSound, playTrucoSound, setMuted, unlockAudio } from "@/lib/truco/sound";

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
    router.push("/truco");
  };

  const seatAt = (pos: Pos) => ((me + POS.indexOf(pos)) % 4) as Seat;
  const deal = useDeal(view);
  useSounds(view);
  const visible = (seat: Seat) => Math.min(view.handCounts[seat], dealtTo(deal, view.dealer, seat));

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex items-center gap-2 rounded-2xl bg-black/40 px-3 py-2 font-display sm:gap-3 sm:px-4">
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

        <HandInfo view={view} />

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <MuteButton />
          <button onClick={leave} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 sm:h-10 sm:w-10">
            ✕
          </button>
        </div>
      </header>

      <section className="relative mx-3 mb-2 mt-3 flex-1 sm:mx-10">
        <div className="felt absolute inset-0 rounded-[48px]" />

        {(["top", "left", "right"] as const).map((pos) => (
          <Opponent key={pos} pos={pos} seat={seatAt(pos)} room={room} view={view} count={visible(seatAt(pos))} />
        ))}

        {!deal && <Vira view={view} />}

        <div className="absolute left-1/2 top-[55%] h-[min(34vh,320px)] w-[min(62vw,360px)] -translate-x-1/2 -translate-y-1/2">
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

        {deal && <DealAnimation key={`deal-${deal.hand}`} deal={deal} dealer={view.dealer} me={me} />}

        {view.shout && (
          <ShoutBubble key={`shout-${view.shout.id}`} text={shoutText(view.shout)} pos={relPos(view.shout.seat, me)} />
        )}
      </section>

      <MyArea view={view} room={room} visible={visible(me)} dealing={!!deal} />

      {view.phase === "gameOver" && <GameOver view={view} room={room} onLeave={leave} />}
    </main>
  );
}

function useSounds(view: PlayerView) {
  const plays = view.rounds.reduce((n, r) => n + r.plays.length, 0);
  const prev = useRef({ hand: view.handNo, plays, shout: view.shout?.id });

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const p = prev.current;
    if (view.handNo === p.hand && plays > p.plays) playCardSound();
    if (view.shout && view.shout.id !== p.shout && view.shout.kind === "truco") playTrucoSound(view.shout.value);
    prev.current = { hand: view.handNo, plays, shout: view.shout?.id };
  }, [view.handNo, plays, view.shout]);
}

function MuteButton() {
  const [muted, setMutedState] = useState(false);
  useEffect(() => setMutedState(isMuted()), []);
  const toggle = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };
  return (
    <button onClick={toggle} className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 sm:h-10 sm:w-10" title={muted ? "Ativar som" : "Silenciar"}>
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

function HandInfo({ view }: { view: PlayerView }) {
  const myTeam = teamOf(view.seat);
  const current = view.rounds.length - 1;
  const raised = view.value > 1;
  const label =
    view.mode === "ferro" ? "FERRO" : view.mode === "mao11" ? "MÃO DE 11" : raised ? BET_NAME[view.value].slice(0, -1) : "VALE";

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-black/40 px-2 py-1.5 sm:gap-3 sm:px-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => {
          const w = view.rounds[i]?.winner;
          let cls = "border border-white/15";
          let mark = "";
          if (w === "tie") [cls, mark] = ["bg-white/70 text-stone-900", "="];
          else if (w === myTeam) [cls, mark] = ["bg-gold text-stone-900", "✓"];
          else if (w !== null && w !== undefined) [cls, mark] = ["bg-red-500 text-white", "✕"];
          else if (i === current) cls = "border-2 border-white/50";
          return (
            <span
              key={i}
              className={`flex h-7 w-5 items-center justify-center rounded-[5px] text-xs font-bold transition-colors sm:h-8 sm:w-6 ${cls}`}
            >
              {mark}
            </span>
          );
        })}
      </div>
      <div className="h-8 w-px bg-white/10" />
      <div className="flex min-w-12 flex-col items-center leading-none">
        <span className={`text-[9px] font-display tracking-wide ${raised || view.mode !== "normal" ? "text-gold" : "text-white/50"}`}>
          {label}
        </span>
        <span key={view.value} className={`banner font-display text-2xl ${raised ? "text-gold" : "text-white"}`}>
          {view.value}
        </span>
      </div>
    </div>
  );
}

const OPP_POS: Record<Exclude<Pos, "bottom">, string> = {
  top: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 flex-row-reverse gap-3",
  left: "left-3 top-1/2 -translate-y-1/2 flex-col sm:left-6",
  right: "right-3 top-1/2 -translate-y-1/2 flex-col sm:right-6",
};

function Opponent({ pos, seat, room, view, count }: { pos: Exclude<Pos, "bottom">; seat: Seat; room: RoomInfo; view: PlayerView; count: number }) {
  const info = room.seats[seat];
  const partner = teamOf(seat) === teamOf(view.seat);
  const turn = (view.phase === "playing" && !view.bet && view.turn === seat) || (view.bet && teamOf(seat) !== view.bet.team && view.phase === "playing");

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
      className={`played absolute w-[clamp(48px,min(12vw,12vh),84px)] ${p.cls} ${winning ? "[&>*]:outline-4 [&>*]:outline-offset-2 [&>*]:outline-gold" : ""}`}
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

function MyArea({ view, room, visible, dealing }: { view: PlayerView; room: RoomInfo; visible: number; dealing: boolean }) {
  const myInfo = room.seats[view.seat];
  const myTurn = view.canPlay || view.mustRespond || view.mustDecideMao11;
  const canCover = view.canPlay && view.canHide && view.mode !== "ferro";
  const [flipped, setFlipped] = useState<number | null>(null);

  useEffect(() => {
    if (!canCover) setFlipped(null);
  }, [canCover, view.handNo, view.rounds.length]);

  const play = (index: number) => {
    if (!view.canPlay) return;
    send({ t: "action", action: { type: "play", index, hidden: canCover && flipped === index } });
    setFlipped(null);
  };

  return (
    <section className="relative z-20 flex flex-col items-center gap-2 px-3 pb-3">
      <div className={`flex min-h-12 flex-wrap items-center justify-center gap-2 ${dealing ? "invisible" : ""}`}>
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
      </div>

      <div className="flex min-h-[calc(clamp(72px,21vw,118px)*1.452+1rem)] min-w-24 items-end justify-center px-4 pt-4">
        {view.myHand.slice(0, visible).map((c, i) => (
          <div
            key={`${view.handNo}-${c?.id ?? i}-${i}`}
            className={`deal group relative -mx-1 w-[clamp(72px,21vw,118px)] transition-transform duration-200 sm:mx-1 ${
              view.canPlay ? "-translate-y-2 hover:-translate-y-5" : ""
            }`}
          >
            <button
              disabled={!view.canPlay}
              onClick={() => play(i)}
              className={`block w-full ${view.canPlay ? "turn-card cursor-pointer" : "cursor-default"}`}
            >
              <FlipCard card={c} flipped={flipped === i} />
            </button>
            {canCover && (
              <button
                onClick={() => setFlipped((f) => (f === i ? null : i))}
                title={flipped === i ? "Desvirar" : "Virar"}
                aria-label={flipped === i ? "Desvirar carta" : "Virar carta"}
                className={`absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full shadow-lg ring-2 ring-gold transition hover:scale-110 ${
                  flipped === i
                    ? "bg-gold text-stone-900"
                    : "bg-stone-900 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                }`}
              >
                {flipped === i ? <span className="text-lg leading-none">↺</span> : <span className="card-back block w-3.5 !border" />}
              </button>
            )}
          </div>
        ))}
      </div>
      <span
        className={`flex items-center gap-1.5 font-display text-xs transition-colors ${myTurn ? "text-gold" : "text-white/50"}`}
      >
        {myTurn && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
        {myInfo.name}
      </span>
    </section>
  );
}

function FlipCard({ card, flipped }: { card: Card | null; flipped: boolean }) {
  return (
    <div className="[perspective:900px]">
      <div
        className={`relative transition-transform duration-500 ease-out [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        <div className="[backface-visibility:hidden]">
          <CardImg card={card} />
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardBack className="h-full" />
        </div>
      </div>
    </div>
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
