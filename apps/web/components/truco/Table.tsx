"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { teamOf, type Card, type Play, type PlayerView, type RoomInfo, type Seat, type Shout } from "@mesa/truco";
import { send } from "@/lib/socket";
import { TRUCO_PATH } from "@/lib/truco/paths";
import { CardBack, CardImg, DeckProvider } from "@/components/cards/Card";
import { DealAnimation, dealtTo, useDeal } from "./Deal";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { GameEnd } from "@/components/ui/GameEnd";
import { HowToPlay } from "./HowToPlay";
import { CardInfo } from "./CardInfo";
import { playCardSound, useAudioUnlock } from "@/lib/sound";
import { playTrucoSound } from "@/lib/truco/sound";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";

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

  const [leaving, setLeaving] = useState(false);
  const leave = () => {
    send({ t: "leave" });
    router.push(TRUCO_PATH);
  };

  const seatAt = (pos: Pos) => ((me + POS.indexOf(pos)) % 4) as Seat;
  const deal = useDeal(view);
  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const [hovered, setHovered] = useState<Card | null>(null);
  // some ao jogar a carta (o mouseleave não dispara quando ela sai da mão)
  const hoveredCard = hovered && view.myHand.some((c) => c?.id === hovered.id) ? hovered : null;
  useSounds(view);
  const visible = (seat: Seat) => Math.min(view.handCounts[seat], dealtTo(deal, view.dealer, seat));

  // cada um joga com o próprio baralho: a mão virada e a carta jogada usam o do dono; o resto (vira, monte), o meu
  return (
    <DeckProvider deck={room.seats[me]?.deck}>
      <main className="flex h-dvh flex-col overflow-hidden">
        <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
          <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-3 py-2 font-display sm:gap-3 sm:px-4">
            <div className="flex flex-col items-center leading-none">
              <span className="text-[10px] text-gold/80">NÓS</span>
              <span className="text-3xl text-gold">{us}</span>
            </div>
            {/* espaçador do rótulo + altura da linha dos números, para o × alinhar com os placares */}
            <div className="flex flex-col items-center leading-none" aria-hidden="true">
              <span className="invisible text-[10px]">×</span>
              <span className="flex h-[1em] items-center text-3xl">
                <span className="text-base text-white/30">×</span>
              </span>
            </div>
            <div className="flex flex-col items-center leading-none">
              <span className="text-[10px] text-white/60">ELES</span>
              <span className="text-3xl">{them}</span>
            </div>
          </div>

          <HandInfo view={view} />

          <div className="flex items-center gap-1 sm:gap-2">
            {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
            <HelpButton onClick={() => setHelp(true)} />
            <TipsButton on={tips} onClick={toggleTips} />
            <MuteButton />
            <ExitConfirm onExit={leave} ask={view.phase !== "gameOver"} onOpenChange={setLeaving} />
          </div>
          {tips && hoveredCard && !leaving && (
            <div className="pointer-events-none absolute right-2 top-full mt-1 sm:right-6 [@media(hover:none)]:hidden">
              <CardInfo card={hoveredCard} manilha={view.manilha} />
            </div>
          )}
        </header>

        <section className="relative mx-auto mb-3 mt-8 w-[calc(100%-1.5rem)] max-w-[1100px] flex-1 sm:mt-10 lg:mt-11 sm:w-[calc(100%-7rem)]">
          <div className="felt absolute inset-0 rounded-[48px] sm:rounded-[120px]" />

          {(["top", "left", "right"] as const).map((pos) => (
            <Opponent key={pos} pos={pos} seat={seatAt(pos)} room={room} view={view} count={visible(seatAt(pos))} />
          ))}

          {!deal && <Vira view={view} />}

          <div className="absolute left-1/2 top-[55%] h-[min(34vh,320px)] w-[44vw] sm:w-[min(62vw,360px)] -translate-x-1/2 -translate-y-1/2">
            {round.plays.map((p, i) => (
              <DeckProvider key={`${view.handNo}-${view.rounds.length}-${p.seat}`} deck={room.seats[p.seat]?.deck}>
                <PlayedCard
                  play={p}
                  pos={relPos(p.seat, me)}
                  order={i}
                  winning={view.phase !== "playing" && round.winningSeat === p.seat}
                  mine={p.seat === me}
                />
              </DeckProvider>
            ))}
          </div>

          <CenterStatus view={view} />

          {deal && <DealAnimation key={`deal-${deal.hand}`} deal={deal} dealer={view.dealer} me={me} />}

          {view.shout && (
            <ShoutBubble key={`shout-${view.shout.id}`} text={shoutText(view.shout)} pos={relPos(view.shout.seat, me)} />
          )}
        </section>

        <MyArea view={view} room={room} visible={visible(me)} dealing={!!deal} onHover={setHovered} />

        {view.phase === "gameOver" && <GameOver view={view} room={room} onLeave={leave} />}
        {help && (
          <HowToPlayModal game="TRUCO PAULISTA" onClose={() => setHelp(false)}>
            <HowToPlay />
          </HowToPlayModal>
        )}
      </main>
    </DeckProvider>
  );
}

function useSounds(view: PlayerView) {
  const plays = view.rounds.reduce((n, r) => n + r.plays.length, 0);
  const prev = useRef({ hand: view.handNo, plays, shout: view.shout?.id });

  useAudioUnlock();

  useEffect(() => {
    const p = prev.current;
    if (view.handNo === p.hand && plays > p.plays) playCardSound();
    if (view.shout && view.shout.id !== p.shout && view.shout.kind === "truco") playTrucoSound(view.shout.value);
    prev.current = { hand: view.handNo, plays, shout: view.shout?.id };
  }, [view.handNo, plays, view.shout]);
}

function HandInfo({ view }: { view: PlayerView }) {
  const myTeam = teamOf(view.seat);
  const current = view.rounds.length - 1;
  const raised = view.value > 1;
  const label =
    view.mode === "ferro" ? "FERRO" : view.mode === "mao11" ? "MÃO DE 11" : raised ? BET_NAME[view.value].slice(0, -1) : "VALE";

  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-2 py-1.5 sm:gap-3 sm:px-3">
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
      <div className="flex min-w-9 flex-col items-center leading-none sm:min-w-12">
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

// Assentos na borda da mesa; as cartas de cada um ficam viradas para o centro
const SEAT_POS: Record<Exclude<Pos, "bottom">, string> = {
  // centro do avatar sobre a borda (meio avatar: 24/28/32px)
  top: "left-1/2 top-0 -translate-x-1/2 -translate-y-6 flex-col sm:-translate-y-7 lg:-translate-y-8",
  left: "left-1 top-1/2 -translate-y-1/2 flex-row sm:left-0 sm:-translate-x-[30%]",
  right: "right-1 top-1/2 -translate-y-1/2 flex-row-reverse sm:right-0 sm:translate-x-[30%]",
};

function Opponent({ pos, seat, room, view, count }: { pos: Exclude<Pos, "bottom">; seat: Seat; room: RoomInfo; view: PlayerView; count: number }) {
  const info = room.seats[seat];
  const partner = teamOf(seat) === teamOf(view.seat);
  const turn =
    view.phase === "playing" && (view.bet ? teamOf(seat) !== view.bet.team : view.turn === seat);

  return (
    <div className={`absolute z-10 flex items-center gap-1.5 sm:gap-2 ${SEAT_POS[pos]}`}>
      <div className={`relative flex flex-col items-center ${info.connected ? "" : "opacity-40"}`}>
        <Framed frame={info?.frame}>
          <div
            className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-[3px] font-display text-xl shadow-lg shadow-black/40 sm:h-14 sm:w-14 lg:h-16 lg:w-16 lg:text-2xl ${
              partner ? "border-gold bg-gold text-stone-900" : "border-red-400/80 bg-stone-800 text-white"
            } ${turn ? "turn-glow" : ""}`}
          >
            <SeatFace seat={info} />
          </div>
        </Framed>
        <span className="relative -mt-2 max-w-24 truncate rounded-full bg-stone-950/90 px-2 py-0.5 text-[11px] font-semibold lg:text-xs ring-1 ring-white/10">
          {info.name}
        </span>
        {view.dealer === seat && <DealerChip className="absolute -right-1.5 -top-1" />}
      </div>
      <DeckProvider deck={info?.deck}>
        <Fan count={count} vertical={pos !== "top"} />
      </DeckProvider>
    </div>
  );
}

function DealerChip({ className = "" }: { className?: string }) {
  return (
    <span
      title="Deu as cartas"
      className={`flex h-5 w-5 items-center justify-center rounded-full bg-white font-display text-[10px] text-stone-900 shadow ring-2 ring-stone-900 ${className}`}
    >
      D
    </span>
  );
}

function Fan({ count, vertical }: { count: number; vertical: boolean }) {
  const angle = (i: number) => (i - (count - 1) / 2) * 12;
  if (vertical) {
    return (
      <div className="flex min-h-14 flex-col items-center justify-center">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="relative h-3.5 w-10 sm:h-4 sm:w-12 lg:h-5 lg:w-14">
            <div
              className="absolute left-1/2 top-1/2 w-6 sm:w-7 lg:w-9"
              style={{ transform: `translate(-50%, -50%) rotate(${90 + angle(i)}deg)` }}
            >
              <CardBack className="!border-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex min-h-10 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="-mx-1.5 w-6 origin-top sm:w-7 lg:-mx-2 lg:w-9" style={{ transform: `rotate(${-angle(i)}deg)` }}>
          <CardBack className="!border-2" />
        </div>
      ))}
    </div>
  );
}

function Vira({ view }: { view: PlayerView }) {
  return (
    <div
      className="absolute bottom-2 left-2 z-0 flex items-center gap-1.5 rounded-2xl bg-black/35 px-2 py-1.5 ring-1 ring-white/10 sm:bottom-6 sm:left-[9%] sm:gap-3 sm:px-3"
      aria-label={`Vira ${view.vira.rank}, manilha ${view.manilha}`}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="font-display text-[9px] tracking-widest text-white/60">VIRA</span>
        <div className="relative w-10 sm:w-14 lg:w-16">
          <div className="absolute inset-0 translate-x-1 translate-y-0.5 rotate-6">
            <CardBack className="!border-2" />
          </div>
          <div className="relative">
            <CardImg card={view.vira} />
          </div>
        </div>
      </div>

      <svg viewBox="0 0 24 24" className="mt-3 h-4 w-4 shrink-0 text-gold sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>

      <div className="flex flex-col items-center gap-1">
        <span className="font-display text-[9px] tracking-widest text-gold">MANILHA</span>
        <div className="flex aspect-[500/726] w-10 flex-col items-center justify-center gap-0.5 rounded-[7%/5%] bg-white text-stone-900 shadow ring-2 ring-gold sm:w-14 lg:w-16">
          <span className="font-display text-xl leading-none sm:text-3xl">{view.manilha}</span>
          <span className="flex gap-px text-[9px] leading-none sm:text-xs">
            <span className="text-red-600">♦</span>
            <span>♠</span>
            <span className="text-red-600">♥</span>
            <span>♣</span>
          </span>
        </div>
      </div>
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
      className={`played absolute w-[clamp(48px,min(12vw,12vh),100px)] ${p.cls} ${winning ? "[&>*]:outline-4 [&>*]:outline-offset-2 [&>*]:outline-gold" : ""}`}
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
  top: "left-1/2 top-[22%]",
  left: "left-[18%] top-[34%]",
  right: "left-[82%] top-[34%]",
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

function MyArea({
  view,
  room,
  visible,
  dealing,
  onHover,
}: {
  view: PlayerView;
  room: RoomInfo;
  visible: number;
  dealing: boolean;
  onHover: (card: Card | null) => void;
}) {
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
            onMouseEnter={() => onHover(c)}
            onMouseLeave={() => onHover(null)}
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
        {view.dealer === view.seat && <DealerChip className="ml-1" />}
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
  const myTeam = teamOf(view.seat);
  return (
    <GameEnd won={view.winner === myTeam} onLeave={onLeave} onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}>
      <p className="font-display text-3xl">
        <span className="text-gold">{view.scores[myTeam]}</span>
        <span className="mx-3 text-white/30">×</span>
        {view.scores[1 - myTeam]}
      </p>
    </GameEnd>
  );
}
