"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  arrangements,
  canastraKind,
  plan,
  wildChoices,
  type Card,
  type ClientAction,
  type Ctx,
  type Meld,
  type PlayerView,
  type Seat,
} from "@mesa/buraco";
import type { RoomInfo } from "@mesa/truco";
import { clearError, send, useRoom } from "@/lib/socket";
import { BURACO_PATH } from "@/lib/buraco/paths";
import { CardBack } from "@/components/cards/Card";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";
import { playCardSound, playDrawSound, playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playBatidaSound, playCanastraSound, playMortoSound, playShuffleSound } from "@/lib/buraco/sound";
import { BCard, posLabel } from "./Cards";
import { CardInfo } from "./CardInfo";
import { Hand } from "./Hand";
import { HandEnd } from "./HandEnd";
import { MeldStrip } from "./Melds";
import { HowToPlay } from "./HowToPlay";

type Pos = "bottom" | "right" | "top" | "left";
const POS: Pos[] = ["bottom", "right", "top", "left"];
/** O servidor espera isto antes de a IA jogar na mão nova (BURACO_DEAL_MS); a animação cabe com folga. */
const DEAL_UI_MS = 2000;
/** O servidor passa para a mão seguinte depois disto (BURACO_HAND_END_MS). */
const HAND_END_MS = 10000;

const teamOf = (seat: Seat) => seat % 2;

/** Largura das cartas dos jogos na mesa, pela largura da tela. */
function useMeldWidth() {
  const [w, setW] = useState(30);
  useEffect(() => {
    const on = () => setW(window.innerWidth < 420 ? 28 : window.innerWidth < 768 ? 34 : 40);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

interface Pending {
  kind: "meld" | "add" | "take";
  ids: string[];
  meldId: string | null;
  choices: number[];
}

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const { error } = useRoom();
  const me = view.seat;
  const myTeam = (view.team ?? teamOf(me)) as 0 | 1;
  const duo = view.mode === "duplas";
  const posOf = (seat: Seat): Pos => (duo ? POS[(seat - me + 4) % 4] : seat === me ? "bottom" : "top");
  const others = view.players.filter((p) => p !== me);
  const name = (seat: Seat) => room.seats[seat]?.name ?? "";
  const mw = useMeldWidth();

  const [help, setHelp] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [tips, toggleTips] = useTips();
  const [hovered, setHovered] = useState<string | null>(null);
  const dealing = useDeal(view);
  useBuracoEvents(view);
  useEndSounds(view);
  useAudioUnlock();

  const myTurn = view.phase === "playing" && view.turn === me;
  const drawing = myTurn && view.step === "draw";
  const playing = myTurn && view.step === "play";
  const over = view.phase === "gameOver";
  // a carta sai da mão (jogada): o painel some mesmo sem o mouse sair
  const hoveredCard = hovered ? (view.myHand.find((c) => c.id === hovered) ?? null) : null;

  // a seleção some quando a mesa muda (lance feito, vez passou, mão nova)
  useEffect(() => {
    setSel([]);
    setPending(null);
  }, [view.eventNo, view.handNo, view.turn]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  };
  useEffect(() => {
    if (!error) return;
    flash(error);
    clearError();
  }, [error]);

  const ctx: Ctx = { hand: view.myHand, team: myTeam, melds: view.melds, mortoTaken: view.mortoTaken[myTeam], pile: view.pile };
  const selCards = view.myHand.filter((c) => sel.includes(c.id));
  const top = view.pile[view.pile.length - 1];

  const options = (kind: "meld" | "add" | "take", ids: string[], meldId: string | null) => {
    const target = meldId ? view.melds.find((m) => m.id === meldId) : null;
    const cards = view.myHand.filter((c) => ids.includes(c.id));
    const incoming = kind === "take" && top ? [top, ...cards] : cards;
    return arrangements(target?.cards ?? [], target?.suit ?? null, incoming);
  };
  const ok = (kind: "meld" | "add" | "take", ids: string[], meldId: string | null) => plan(ctx, kind, ids, meldId).ok;

  const action = (a: ClientAction) => {
    setSel([]);
    setPending(null);
    send({ t: "action", action: a });
  };
  const build = (kind: "meld" | "add" | "take", ids: string[], meldId: string | null, wildAt?: number): ClientAction => {
    const w = wildAt === undefined ? {} : { wildAt };
    if (kind === "meld") return { type: "meld", cards: ids, ...w };
    if (kind === "add") return { type: "add", meld: meldId!, cards: ids, ...w };
    return { type: "take", cards: ids, meld: meldId, ...w };
  };
  /** Confere o lance; se o curinga pode ficar em mais de um lugar, pergunta antes de mandar. */
  const run = (kind: "meld" | "add" | "take", ids: string[], meldId: string | null) => {
    const r = plan(ctx, kind, ids, meldId);
    if (!r.ok) return flash(r.error);
    const choices = wildChoices(options(kind, ids, meldId));
    if (choices.length > 1) return setPending({ kind, ids, meldId, choices });
    action(build(kind, ids, meldId));
  };

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const draw = () => drawing && view.canDraw && action({ type: "draw" });
  const takePile = () => {
    if (!drawing || !view.canTake) return;
    if (sel.length > 0) return run("take", sel, null);
    // sem seleção: o jeito que gasta menos da mão e menos curingas
    const wilds = (o: PlayerView["takeOptions"][number]) => o.cards.filter((id) => view.myHand.some((c) => c.id === id && (c.rank === "JK" || c.rank === "2"))).length;
    const o = [...view.takeOptions].sort((a, b) => wilds(a) - wilds(b) || (a.meld ? 0 : 1) - (b.meld ? 0 : 1) || a.cards.length - b.cards.length)[0];
    if (o) run("take", o.cards, o.meld);
  };
  const discard = (id: string) => playing && action({ type: "discard", card: id });
  const onMeld = (m: Meld) => {
    if (sel.length === 0 && !drawing) return flash("Escolha cartas da mão");
    if (drawing) return view.canTake && run("take", sel, m.id);
    if (playing) run("add", sel, m.id);
  };

  const leave = () => {
    send({ t: "leave" });
    router.push(BURACO_PATH);
  };

  const mine = view.melds.filter((m) => m.team === myTeam);
  const theirs = view.melds.filter((m) => m.team !== myTeam);
  const canMeldNow = playing && sel.length >= 3 && ok("meld", sel, null);

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1 px-1.5 py-2 sm:gap-2 sm:px-6">
        <Score view={view} myTeam={myTeam} us={duo ? "NÓS" : "VOCÊ"} them={duo ? "ELES" : (name(others[0]) || "ELE").slice(0, 7).toUpperCase()} />
        <HandInfo view={view} />
        <div className="flex items-center gap-0.5 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <TipsButton on={tips} onClick={toggleTips} />
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
        {tips && hoveredCard && !over && (
          <div className="absolute right-2 top-full z-50 mt-1 sm:right-6 [@media(hover:none)]:hidden">
            <CardInfo card={hoveredCard} view={view} />
          </div>
        )}
      </header>

      <section className="relative mx-auto mb-2 mt-9 w-[calc(100%-1.5rem)] max-w-[1100px] flex-1 sm:mt-11 sm:w-[calc(100%-7rem)]">
        <div className="felt absolute inset-0 rounded-[32px] sm:rounded-[100px]" />

        {others.map((seat) => (
          <Opponent key={seat} pos={posOf(seat) as Exclude<Pos, "bottom">} seat={seat} room={room} view={view} dealing={dealing} partner={teamOf(seat) === myTeam} />
        ))}

        <div className="absolute inset-x-2 bottom-2 top-[62px] flex flex-col gap-1.5 sm:inset-x-24 sm:top-10">
          <MeldArea melds={theirs} mw={mw} mine={false} fresh={view.events} />
          <div className="flex shrink-0 items-center justify-center gap-4 sm:gap-8">
            <Mortos view={view} myTeam={myTeam} />
            <Stock view={view} active={drawing && view.canDraw} onClick={draw} />
            <Pile view={view} active={drawing && view.canTake} onClick={takePile} />
          </div>
          <MeldArea
            melds={mine}
            mw={mw}
            mine
            fresh={view.events}
            onMeld={onMeld}
            ready={(m) => (playing && sel.length > 0 && ok("add", sel, m.id)) || (drawing && view.canTake && sel.length > 0 && ok("take", sel, m.id))}
          />
        </div>

        {toast && (
          <div className="banner pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-2xl bg-black/80 px-4 py-2 font-display text-sm text-white">
            {toast}
          </div>
        )}
        {pending && (
          <div className="banner absolute left-1/2 top-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-2xl bg-stone-950/95 px-4 py-3 ring-1 ring-gold/40">
            <span className="font-display text-xs tracking-widest text-white/70">CORINGA VALE</span>
            <div className="flex items-center gap-2">
              {pending.choices.map((c) => (
                <button
                  key={c}
                  onClick={() => action(build(pending.kind, pending.ids, pending.meldId, c))}
                  className="h-11 min-w-11 rounded-xl bg-gold px-3 font-display text-xl text-stone-900 shadow-[0_3px_0_#9a6b12] active:translate-y-0.5 active:shadow-none"
                >
                  {posLabel(c)}
                </button>
              ))}
              <button onClick={() => setPending(null)} aria-label="Cancelar" className="h-11 w-11 rounded-xl bg-white/10 font-display text-lg text-white/80 hover:bg-white/20">
                ✕
              </button>
            </div>
          </div>
        )}
        {dealing && <DealAnimation view={view} me={me} />}
      </section>

      <MyArea
        view={view}
        name={name(me)}
        turnName={name(view.turn)}
        sel={sel}
        dealing={dealing}
        canMeldNow={canMeldNow}
        onToggle={toggle}
        onHover={(c) => setHovered(c?.id ?? null)}
        onDraw={draw}
        onTake={takePile}
        onMeld={() => run("meld", sel, null)}
        onDiscard={() => sel.length === 1 && discard(sel[0])}
        onDiscardCard={discard}
        onClear={() => setSel([])}
      />

      {view.phase === "handEnd" && view.result && (
        <HandEnd
          result={view.result}
          myTeam={myTeam}
          scores={view.scores}
          target={view.target}
          duo={duo}
          nextMs={HAND_END_MS}
          who={view.result.seat !== null ? name(view.result.seat) : ""}
        />
      )}
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
        <HowToPlayModal game="BURACO" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

function Score({ view, myTeam, us, them }: { view: PlayerView; myTeam: 0 | 1; us: string; them: string }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-black/40 px-2 py-1.5 font-display sm:gap-3 sm:px-4 sm:py-2">
      <div className="flex flex-col items-center leading-none">
        <span className="text-[10px] text-gold/80">{us}</span>
        <span className="text-xl text-gold sm:text-3xl">{view.scores[myTeam]}</span>
      </div>
      <div className="flex flex-col items-center leading-none" aria-hidden="true">
        <span className="invisible text-[10px]">×</span>
        <span className="flex h-[1em] items-center text-xl sm:text-3xl">
          <span className="text-sm text-white/30 sm:text-base">×</span>
        </span>
      </div>
      <div className="flex flex-col items-center leading-none">
        <span className="max-w-16 truncate text-[10px] text-white/60">{them}</span>
        <span className="text-xl sm:text-3xl">{view.scores[1 - myTeam]}</span>
      </div>
    </div>
  );
}

/** Mão em andamento e a meta da partida. */
function HandInfo({ view }: { view: PlayerView }) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-2 py-1.5 font-display sm:gap-3 sm:px-3">
      <div className="flex flex-col items-center leading-none">
        <span className="text-[9px] tracking-wide text-white/50">MÃO</span>
        <span className="text-lg sm:text-2xl">{view.handNo}</span>
      </div>
      <div className="h-6 w-px bg-white/10 sm:h-7" />
      <div className="flex flex-col items-center leading-none">
        <span className="text-[9px] tracking-wide text-white/50">ATÉ</span>
        <span className="text-lg sm:text-2xl">{view.target}</span>
      </div>
    </div>
  );
}

// Assentos na borda da mesa. No celular os três ficam em cima, lado a lado; a partir de `sm`, nos lados.
const SEAT_POS: Record<Exclude<Pos, "bottom">, string> = {
  top: "left-1/2 top-0 -translate-x-1/2 -translate-y-6 sm:-translate-y-7",
  left: "left-[6%] top-0 -translate-y-6 sm:left-0 sm:top-1/2 sm:-translate-x-[30%] sm:-translate-y-1/2",
  right: "right-[6%] top-0 -translate-y-6 sm:right-0 sm:top-1/2 sm:translate-x-[30%] sm:-translate-y-1/2",
};

function Opponent({
  pos,
  seat,
  room,
  view,
  dealing,
  partner,
}: {
  pos: Exclude<Pos, "bottom">;
  seat: Seat;
  room: RoomInfo;
  view: PlayerView;
  dealing: boolean;
  partner: boolean;
}) {
  const info = room.seats[seat];
  const turn = view.phase === "playing" && view.turn === seat;
  const count = view.handCounts[seat];
  return (
    <div className={`absolute z-10 flex flex-col items-center ${SEAT_POS[pos]} ${info?.connected ? "" : "opacity-40"}`}>
      <div className="relative">
        <Framed frame={info?.frame}>
          <div
            className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[3px] font-display text-lg shadow-lg shadow-black/40 sm:h-14 sm:w-14 sm:text-xl ${
              partner ? "border-gold bg-gold text-stone-900" : "border-red-400/80 bg-stone-800 text-white"
            } ${turn ? "turn-glow" : ""}`}
          >
            <SeatFace seat={info} />
          </div>
        </Framed>
        {view.dealer === seat && <DealerChip className="-right-1 -top-1" />}
      </div>
      <span className="relative -mt-2 max-w-20 truncate rounded-full bg-stone-950/90 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-white/10">{info?.name}</span>
      <span className="mt-0.5 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 font-display text-xs leading-none" aria-label={`${count} cartas`}>
        <span className="block w-2.5">
          <CardBack />
        </span>
        {dealing ? "·" : count}
      </span>
    </div>
  );
}

function DealerChip({ className = "" }: { className?: string }) {
  return (
    <span
      title="Deu as cartas"
      className={`absolute flex h-5 w-5 items-center justify-center rounded-full bg-white font-display text-[11px] leading-none text-stone-900 shadow ${className}`}
    >
      D
    </span>
  );
}

/** Maior largura de carta (até `max`) com que os jogos cabem na área; abaixo do mínimo, a área rola. */
function fitWidth(melds: Meld[], w: number, h: number, max: number): number {
  for (let mw = max; mw > 22; mw -= 2) {
    const rowH = mw * 1.4 + 10;
    let x = 0;
    let rows = 1;
    for (const m of melds) {
      const iw = Math.min(w, mw + (m.cards.length - 1) * mw * 0.5 + 4);
      if (x > 0 && x + iw > w) {
        rows++;
        x = 0;
      }
      x += iw + 8;
    }
    if (rows * rowH + (rows - 1) * 4 <= h) return mw;
  }
  return 22;
}

/** Jogos de uma dupla: cada um numa fila, quebrando linha quando falta espaço; as cartas encolhem até caber. */
function MeldArea({
  melds,
  mw: maxW,
  mine,
  fresh,
  onMeld,
  ready,
}: {
  melds: Meld[];
  mw: number;
  mine: boolean;
  fresh: PlayerView["events"];
  onMeld?: (m: Meld) => void;
  ready?: (m: Meld) => boolean;
}) {
  const lastIds = new Set(fresh.slice(-2).flatMap((e) => (e.kind === "meld" || e.kind === "add" ? [e.meld] : [])));
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 300, h: 120 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth - 8, h: el.clientHeight - 4 }));
    ro.observe(el);
    setBox({ w: el.clientWidth - 8, h: el.clientHeight - 4 });
    return () => ro.disconnect();
  }, []);
  const mw = fitWidth(melds, box.w, box.h, maxW);
  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl px-1 pb-1" aria-label={mine ? "Jogos da dupla" : "Jogos dos adversários"}>
      <div className="flex flex-wrap content-start gap-x-2 gap-y-1">
        {melds.map((m) => (
          <MeldStrip key={m.id} meld={m} width={mw} mine={mine} ready={ready?.(m)} onClick={onMeld ? () => onMeld(m) : undefined} fresh={lastIds.has(m.id)} />
        ))}
      </div>
    </div>
  );
}

/** Mortos: um para cada dupla; some (fica tracejado) quando a dupla pega o dela. */
function Mortos({ view, myTeam }: { view: PlayerView; myTeam: 0 | 1 }) {
  const slot = (taken: boolean, cls: string, label: string) => (
    <span
      title={label}
      aria-label={`${label}: ${taken ? "pego" : "na mesa"}`}
      className={`relative block h-9 w-7 rounded-md sm:h-11 sm:w-8 ${taken ? `border-2 border-dashed ${cls} opacity-70` : ""}`}
    >
      {!taken && (
        <>
          <span className="absolute inset-0 translate-x-[3px] translate-y-[3px]">
            <CardBack className="!rounded-md" />
          </span>
          <span className="absolute inset-0">
            <CardBack className="!rounded-md" />
          </span>
          <span className={`absolute -bottom-1.5 left-1/2 h-1.5 w-5 -translate-x-1/2 rounded-full ${cls.includes("gold") ? "bg-gold" : "bg-red-400"}`} />
        </>
      )}
    </span>
  );
  return (
    <div className="flex items-end gap-2" role="group" aria-label="Mortos">
      {slot(view.mortoTaken[myTeam], "border-gold", "Nosso morto")}
      {slot(view.mortoTaken[1 - myTeam], "border-red-400", "Morto deles")}
    </div>
  );
}

/** Monte de compra. */
function Stock({ view, active, onClick }: { view: PlayerView; active: boolean; onClick: () => void }) {
  const n = view.stockCount;
  return (
    <button
      onClick={onClick}
      disabled={!active}
      title="Comprar"
      aria-label={`Monte: ${n} cartas`}
      className={`flex items-end gap-1.5 rounded-xl p-1.5 transition ${active ? "turn-glow cursor-pointer bg-black/30" : "cursor-default"} ${n === 0 ? "opacity-30" : ""}`}
    >
      <span className="relative block w-9 sm:w-11" style={{ aspectRatio: "500 / 726" }}>
        {[2, 1, 0].map((i) => (
          <span key={i} className="absolute inset-0" style={{ transform: `translate(${i * 2}px, ${-i * 2}px)` }}>
            <CardBack />
          </span>
        ))}
      </span>
      <span className="font-display text-lg leading-none">{n}</span>
    </button>
  );
}

/** Lixo: as três cartas de cima à vista; tocar pega (quando dá). */
function Pile({ view, active, onClick }: { view: PlayerView; active: boolean; onClick: () => void }) {
  const cards = view.pile.slice(-3);
  const n = view.pile.length;
  return (
    <button
      onClick={onClick}
      disabled={!active}
      title="Pegar o lixo"
      aria-label={`Lixo: ${n} cartas`}
      className={`flex items-end gap-1.5 rounded-xl p-1.5 transition ${active ? "turn-glow cursor-pointer bg-black/30" : "cursor-default"} ${n === 0 ? "opacity-30" : ""}`}
    >
      <span className="relative block w-9 sm:w-11" style={{ aspectRatio: "500 / 726" }}>
        {n === 0 && <span className="absolute inset-0 rounded-md border-2 border-dashed border-white/30" />}
        {cards.map((c, i) => (
          <span
            key={`${view.handNo}-${c.id}`}
            className={`absolute inset-0 ${i === cards.length - 1 ? "banner" : ""}`}
            style={{ transform: `translate(${(i - (cards.length - 1)) * 7}px, 0) rotate(${(i - (cards.length - 1)) * -4}deg)` }}
          >
            <BCard card={c} />
          </span>
        ))}
      </span>
      <span className="font-display text-lg leading-none">{n}</span>
    </button>
  );
}

function MyArea({
  view,
  name,
  turnName,
  sel,
  dealing,
  canMeldNow,
  onToggle,
  onHover,
  onDraw,
  onTake,
  onMeld,
  onDiscard,
  onDiscardCard,
  onClear,
}: {
  view: PlayerView;
  name: string;
  turnName: string;
  sel: string[];
  dealing: boolean;
  canMeldNow: boolean;
  onToggle: (id: string) => void;
  onHover: (c: Card | null) => void;
  onDraw: () => void;
  onTake: () => void;
  onMeld: () => void;
  onDiscard: () => void;
  onDiscardCard: (id: string) => void;
  onClear: () => void;
}) {
  const myTurn = view.phase === "playing" && view.turn === view.seat;
  const drawing = myTurn && view.step === "draw";
  const playing = myTurn && view.step === "play";
  const btn = "banner rounded-xl px-3 py-1.5 font-display text-sm shadow-[0_3px_0_var(--sh)] transition active:translate-y-0.5 active:shadow-none disabled:opacity-40 sm:px-4 sm:text-base";
  return (
    <section className="relative z-20 flex flex-col items-center gap-1 px-2 pb-2">
      <div className="flex min-h-10 flex-wrap items-center justify-center gap-2">
        {!dealing && drawing && view.canDraw && (
          <button onClick={onDraw} className={`${btn} bg-gold text-stone-900 [--sh:#9a6b12]`}>
            COMPRAR
          </button>
        )}
        {!dealing && drawing && view.canTake && (
          <button onClick={onTake} className={`${btn} bg-emerald-600 [--sh:#065f46]`}>
            LIXO · {view.pile.length}
          </button>
        )}
        {!dealing && playing && (
          <>
            <button onClick={onMeld} disabled={sel.length < 3} className={`${btn} bg-emerald-600 [--sh:#065f46] ${canMeldNow ? "turn-glow" : ""}`}>
              BAIXAR
            </button>
            <button onClick={onDiscard} disabled={sel.length !== 1} className={`${btn} bg-gold text-stone-900 [--sh:#9a6b12]`}>
              DESCARTAR
            </button>
          </>
        )}
        {sel.length > 0 && (
          <button
            onClick={onClear}
            aria-label="Limpar seleção"
            title="Limpar seleção"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 font-display text-white/80 transition hover:bg-white/20"
          >
            ✕
          </button>
        )}
      </div>
      <Hand
        cards={dealing ? [] : view.myHand}
        selected={sel}
        onToggle={onToggle}
        onHover={onHover}
        onDouble={playing ? onDiscardCard : undefined}
        active={myTurn}
        deal={view.events.length === 0}
        dealKey={`${view.gameNo}-${view.handNo}`}
      />
      <span className={`flex items-center gap-1.5 font-display text-xs transition-colors ${myTurn ? "text-gold" : "text-white/50"}`}>
        {myTurn && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
        {myTurn ? name : turnName ? `${name} · vez de ${turnName}` : name}
        {view.dealer === view.seat && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white font-display text-[10px] leading-none text-stone-900">D</span>}
      </span>
    </section>
  );
}

/** Embaralhando e distribuindo no começo da mão: as cartas voam do centro para cada lugar. */
function DealAnimation({ view, me }: { view: PlayerView; me: Seat }) {
  const duo = view.mode === "duplas";
  const posOf = (seat: Seat): Pos => (duo ? POS[(seat - me + 4) % 4] : seat === me ? "bottom" : "top");
  const TARGET: Record<Pos, { x: string; y: string; rot: string }> = {
    bottom: { x: "50%", y: "118%", rot: "0deg" },
    top: { x: "50%", y: "4%", rot: "180deg" },
    left: { x: "6%", y: "40%", rot: "90deg" },
    right: { x: "94%", y: "40%", rot: "-90deg" },
  };
  const players = view.players;
  const first = players.indexOf(view.dealer);
  const total = players.length * 3;
  const SHUFFLE = 900;
  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`s${i}`}
          className="shuffle-card absolute left-1/2 top-1/2 w-10 sm:w-14"
          style={{ "--dir": i % 2 ? 1 : -1, animationDelay: `${(i % 4) * 40}ms`, zIndex: i } as React.CSSProperties}
        >
          <CardBack />
        </div>
      ))}
      {Array.from({ length: total }).map((_, k) => {
        const t = TARGET[posOf(players[(first + 1 + k) % players.length])];
        return (
          <div
            key={`f${k}`}
            className="fly-card absolute w-10 opacity-0 sm:w-14"
            style={{ "--tx": t.x, "--ty": t.y, "--rot": t.rot, animationDelay: `${SHUFFLE + k * 90}ms`, animationDuration: "380ms", zIndex: total - k } as React.CSSProperties}
          >
            <CardBack />
          </div>
        );
      })}
    </div>
  );
}

/** Embaralhar e distribuir a cada mão nova (também quando a partida abre numa mão ainda sem lances). */
function useDeal(view: PlayerView) {
  const fresh = view.phase === "playing" && view.events.length === 0;
  const key = `${view.gameNo}-${view.handNo}`;
  const [dealing, setDealing] = useState(false);
  const started = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!fresh || started.current === key) return;
    started.current = key;
    setDealing(true);
    playShuffleSound();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDealing(false), DEAL_UI_MS);
  }, [fresh, key]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      started.current = null;
    },
    [],
  );
  return dealing;
}

const lens = (melds: Meld[]) => Object.fromEntries(melds.map((m) => [m.id, m.cards.length]));

/** Sons dos lances novos (cartas, compra, canastra, morto, batida). Recarregar não toca nada. */
function useBuracoEvents(view: PlayerView) {
  const seen = useRef({ n: view.eventNo, hand: view.handNo, game: view.gameNo, lens: lens(view.melds) });
  useEffect(() => {
    const p = seen.current;
    seen.current = { n: view.eventNo, hand: view.handNo, game: view.gameNo, lens: lens(view.melds) };
    if (p.hand !== view.handNo || p.game !== view.gameNo) return;
    const fresh = Math.min(view.eventNo - p.n, view.events.length);
    if (fresh <= 0) return;
    const added = view.events.slice(view.events.length - fresh);
    const timers: ReturnType<typeof setTimeout>[] = [];
    const known: Record<string, number> = { ...p.lens };
    let delay = 0;
    for (const e of added) {
      if (e.kind === "draw") timers.push(setTimeout(playDrawSound, delay));
      else if (e.kind === "take") {
        timers.push(setTimeout(playDrawSound, delay));
        delay += 150;
        timers.push(setTimeout(playDrawSound, delay));
      } else if (e.kind === "discard") timers.push(setTimeout(playCardSound, delay));
      else if (e.kind === "meld" || e.kind === "add") {
        timers.push(setTimeout(playCardSound, delay));
        const m = view.melds.find((x) => x.id === e.meld);
        const kind = m ? canastraKind(m) : null;
        if (m && kind && (known[m.id] ?? 0) < 7) {
          known[m.id] = m.cards.length;
          timers.push(setTimeout(() => playCanastraSound(kind), delay + 180));
        }
      } else if (e.kind === "morto") timers.push(setTimeout(playMortoSound, delay));
      else if (e.kind === "batida") timers.push(setTimeout(playBatidaSound, delay + 100));
      delay += 420;
    }
    return () => timers.forEach(clearTimeout);
  }, [view.eventNo, view.handNo, view.gameNo]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Vitória ou derrota quando a partida acaba. */
function useEndSounds(view: PlayerView) {
  const played = useRef(view.phase === "gameOver" ? view.gameNo : -1);
  useEffect(() => {
    if (view.phase !== "gameOver" || played.current === view.gameNo) return;
    played.current = view.gameNo;
    setTimeout(view.winner === (view.team ?? view.seat % 2) ? playWinSound : playLoseSound, 300);
  }, [view.phase, view.gameNo, view.winner, view.team, view.seat]);
}

