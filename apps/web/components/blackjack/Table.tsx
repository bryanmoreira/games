"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { handValue, isBlackjack, START_CHIPS, type Card, type ClientAction, type Hand, type Player, type PlayerView, type Seat } from "@mesa/blackjack";
import type { RoomInfo } from "@mesa/truco";
import { clearError, send, useRoom } from "@/lib/socket";
import { BLACKJACK_PATH } from "@/lib/blackjack/paths";
import { CardBack, CardImg, DeckProvider } from "@/components/cards/Card";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, MuteButton, TipsButton, useTips } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { Framed } from "@/components/shop/Art";
import { playCardSound, playCountdownSound, playDrawSound, playLoseSound, playShuffleSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playBlackjackSound, playBustSound, playChipSound, playPayoutSound } from "@/lib/blackjack/sound";
import { BetStack, Chip, CHIP_VALUES, fmt, signed } from "./Chips";
import { MOVE_LABEL, MOVE_STYLE, TipPanel } from "./Strategy";
import { HowToPlay } from "./HowToPlay";

/** O servidor distribui uma carta a cada BJ_CARD_MS (apps/server/src/games.ts), começando depois de 300 ms. */
const CARD_MS = 180;
const DEAL_START_MS = 300;

/** Depois da primeira pintura, cartas novas entram animadas (recarregar a página não anima a mesa toda). */
const Live = createContext<{ current: boolean }>({ current: false });

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const { error } = useRoom();
  const me = view.seat;
  const player = view.players.includes(me) ? view.table[me] : null;
  const name = (seat: Seat) => room.seats[seat]?.name ?? "";
  const [help, setHelp] = useState(false);
  const [tips, toggleTips] = useTips();
  const [hovering, setHovering] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const live = useRef(false);
  useEffect(() => {
    live.current = true;
  }, []);
  useAudioUnlock();
  useBjSounds(view);
  useEndSounds(view, player);
  const dealOrder = useDealOrder(view);
  const dealing = useDealing(view, dealOrder);
  const shuffling = useShuffle(view);
  const left = useTimeLeft(view);

  useEffect(() => {
    if (!error) return;
    setToast(error);
    clearError();
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [error]);

  const over = view.phase === "gameOver";
  const myTurn = view.phase === "play" && view.turn?.seat === me;
  const leave = () => {
    send({ t: "leave" });
    router.push(BLACKJACK_PATH);
  };
  const act = (a: ClientAction) => send({ t: "action", action: a });

  // outros lugares no arco, dos dois lados (eu fico embaixo, no meio): quem joga logo depois de mim à esquerda,
  // quem joga antes à direita (a banca dá da direita para a esquerda)
  const order = view.players;
  const mine = order.indexOf(me);
  const others = mine < 0 ? order : [...order.slice(mine + 1), ...order.slice(0, mine)];
  const slot = useMemo(() => {
    const k = others.length;
    const left = others.slice(0, Math.floor(k / 2));
    const right = others.slice(Math.floor(k / 2));
    const xs = new Map<Seat, number>();
    const L = left.length === 1 ? [30] : [36, 13];
    const R = right.length === 1 ? [70] : right.length === 2 ? [87, 64] : [88, 69, 50];
    left.forEach((p, i) => xs.set(p, L[i]));
    right.forEach((p, i) => xs.set(p, R[i]));
    return (seat: Seat) => xs.get(seat) ?? 50;
  }, [others.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const hand = myTurn && player ? player.hands[view.turn!.hand] : null;
  const up = view.dealer[0];

  return (
    <Live.Provider value={live}>
      <DeckProvider deck={room.seats[me]?.deck}>
        <main className="flex h-dvh flex-col overflow-hidden">
          <header className="relative z-40 flex items-center justify-between gap-1 px-1.5 py-2 sm:gap-2 sm:px-6">
            <Bankroll chips={player?.chips ?? null} />
            <RoundInfo view={view} />
            <div className="flex items-center gap-0.5 sm:gap-2">
              {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
              <TipsButton on={tips} onClick={toggleTips} />
              <HelpButton onClick={() => setHelp(true)} />
              <MuteButton />
              <ExitConfirm onExit={leave} ask={!over} />
            </div>
            {tips && hovering && hand && up && !over && (
              <div className="absolute right-2 top-full z-50 mt-1 sm:right-6 [@media(hover:none)]:hidden">
                <TipPanel cards={hand.cards} up={up.rank} canDouble={view.canDouble} canSplit={view.canSplit} />
              </div>
            )}
          </header>

          <section className="relative mx-auto mb-1 mt-2 w-[calc(100%-1.5rem)] max-w-[1100px] flex-1 sm:mt-4 sm:w-[calc(100%-7rem)]">
            <div className="felt absolute inset-0 rounded-[32px] rounded-b-[45%] sm:rounded-[60px] sm:rounded-b-[50%]" />
            <Dealer view={view} dealOrder={dealOrder} />
            <Shoe view={view} shuffling={shuffling} />
            <div className="pointer-events-none absolute inset-x-0 top-[36%] flex flex-col sm:top-[45%] items-center gap-0.5 font-display text-[9px] tracking-[0.25em] text-gold/35 sm:text-xs" aria-hidden="true">
              <span>BLACKJACK PAGA 3:2</span>
              <span className="text-[8px] text-white/20 sm:text-[10px]">SEGURO 2:1</span>
            </div>
            {others.map((seat) => (
              <DeckProvider key={seat} deck={room.seats[seat]?.deck}>
                <Spot seat={seat} x={slot(seat)} room={room} view={view} dealOrder={dealOrder} left={left} />
              </DeckProvider>
            ))}
            {toast && (
              <div className="banner pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-2xl bg-black/80 px-4 py-2 font-display text-sm text-white">
                {toast}
              </div>
            )}
          </section>

          {player && (
            <MyArea
              view={view}
              player={player}
              name={name(me)}
              turnName={view.turn ? name(view.turn.seat) : ""}
              dealOrder={dealOrder}
              dealing={dealing}
              left={left}
              onAct={act}
              onHover={setHovering}
            />
          )}

          {over && player && (
            <GameEnd
              won={player.chips > START_CHIPS}
              draw={player.chips === START_CHIPS}
              onLeave={leave}
              onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
            >
              <div className="flex flex-col items-center gap-1 font-display leading-none">
                <span className="text-4xl text-gold">{fmt(player.chips)}</span>
                <span className={`text-lg ${player.chips >= START_CHIPS ? "text-gold/80" : "text-red-400"}`}>{signed(player.chips - START_CHIPS)}</span>
              </div>
              <div className="flex gap-6 font-display">
                <EndStat label="MÃOS" value={`${player.stats.handsWon}/${player.stats.handsPlayed}`} />
                <EndStat label="BLACKJACKS" value={player.stats.blackjacks} gold />
                {view.players.length > 1 && <EndStat label="LUGAR" value={`${placement(view, me)}º`} />}
              </div>
            </GameEnd>
          )}
          {help && (
            <HowToPlayModal game="BLACKJACK" onClose={() => setHelp(false)}>
              <HowToPlay />
            </HowToPlayModal>
          )}
        </main>
      </DeckProvider>
    </Live.Provider>
  );
}

/** Quando a última carta da distribuição chega (para o total aparecer junto). */
const lastDealt = (order: Map<string, number>, keys: string[]) => Math.max(0, ...keys.map((k) => order.get(k) ?? 0)) + (keys.some((k) => order.has(k)) ? 350 : 0);

const placement = (view: PlayerView, seat: Seat) => {
  const mine = view.table[seat]?.chips ?? 0;
  return 1 + view.players.filter((p) => (view.table[p]?.chips ?? 0) > mine).length;
};

function Bankroll({ chips }: { chips: number | null }) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-2 py-1.5 font-display sm:gap-2 sm:px-4 sm:py-2" aria-label={`Fichas: ${chips ?? 0}`}>
      <Chip value={100} label={false} className="h-6 w-6 sm:h-8 sm:w-8" />
      <span className="text-xl leading-none text-gold sm:text-3xl">{chips === null ? "—" : fmt(chips)}</span>
    </div>
  );
}

function RoundInfo({ view }: { view: PlayerView }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-black/40 px-3 py-1.5 font-display leading-none sm:px-4">
      <span className="text-[9px] tracking-wide text-white/50">MÃO</span>
      <span className="text-lg sm:text-2xl">
        {Math.min(view.round, view.settings.rounds)}
        <span className="text-sm text-white/40 sm:text-base">/{view.settings.rounds}</span>
      </span>
    </div>
  );
}

/** Carta que entra voando do sapato (só as que chegam depois de a mesa aparecer). */
function BjCard({ card, className, delay = 0, from }: { card: Card | null; className: string; delay?: number; from: string }) {
  const live = useContext(Live);
  const [anim] = useState(() => live.current);
  // a carta fechada vira quando a banca mostra
  const [hidden] = useState(() => card === null);
  const flip = hidden && card !== null;
  return (
    <div
      className={`relative shrink-0 ${className} ${anim ? "bj-in" : ""}`}
      style={anim ? ({ animationDelay: `${delay}ms`, "--from": from } as React.CSSProperties) : undefined}
    >
      {flip ? (
        <div className="flip-in">
          <CardImg card={card} />
          <div className="flip-back">
            <CardBack />
          </div>
        </div>
      ) : card ? (
        <CardImg card={card} />
      ) : (
        <CardBack />
      )}
    </div>
  );
}

/** Total da mão num selo: mole como 7/17 enquanto joga, BJ dourado, estouro em vermelho. */
function Total({ cards, hand, live, delay = 0, className = "" }: { cards: (Card | null)[]; hand?: Hand; live?: boolean; delay?: number; className?: string }) {
  const anim = useContext(Live);
  const [fade] = useState(() => anim.current && delay > 0);
  const known = cards.filter(Boolean) as Card[];
  if (known.length === 0) return null;
  const { total, soft } = handValue(known);
  const bj = known.length === cards.length && isBlackjack(known, hand?.split ?? false);
  const bust = total > 21;
  const text = bj ? "BJ" : soft && live && total < 21 ? `${total - 10}/${total}` : String(total);
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 font-display text-[11px] leading-none shadow ring-1 sm:px-2 sm:text-sm ${
        bj ? "bg-gold text-stone-900 ring-gold" : bust ? "bg-red-600 text-white ring-red-400" : total === 21 ? "bg-black/70 text-gold ring-gold/60" : "bg-black/70 text-white ring-white/15"
      } ${fade ? "bj-fade" : ""} ${className}`}
      style={fade ? { animationDelay: `${delay}ms` } : undefined}
    >
      {text}
    </span>
  );
}

function Dealer({ view, dealOrder }: { view: PlayerView; dealOrder: Map<string, number> }) {
  const playing = view.phase === "dealer";
  return (
    <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 flex-col items-center gap-1 sm:top-5">
      <span className={`font-display text-[10px] tracking-[0.3em] sm:text-xs ${playing ? "text-gold" : "text-white/40"}`}>BANCA</span>
      <div className="flex min-h-[calc(var(--cw)*1.452)] items-start [--cw:clamp(40px,12vw,72px)]">
        {view.dealer.map((c, i) => (
          <BjCard
            key={`d-${view.gameNo}-${view.round}-${i}`}
            card={c}
            from="160px, -20px"
            delay={dealOrder.get(`d${i}`) ?? 0}
            className={`w-(--cw) ${i ? "ml-[calc(var(--cw)*-0.45)]" : ""}`}
          />
        ))}
      </div>
      {view.dealer.length > 0 && <Total cards={view.dealer} delay={lastDealt(dealOrder, ["d0", "d1"])} className="-mt-2" />}
    </div>
  );
}

/** Sapato no canto: cartas que sobram (fica mais baixo) e o embaralhar quando passa do corte. */
function Shoe({ view, shuffling }: { view: PlayerView; shuffling: boolean }) {
  const layers = Math.max(1, Math.round((view.shoeLeft / view.shoeSize) * 5));
  return (
    <div className="absolute right-4 top-4 z-10 sm:right-10 sm:top-6" aria-label={`Sapato: ${view.shoeLeft} cartas`} title="Sapato">
      <div className="relative w-8 rotate-[8deg] sm:w-11" style={{ aspectRatio: "500 / 726" }}>
        {Array.from({ length: layers }).map((_, i) => (
          <span key={i} className="absolute inset-0" style={{ transform: `translate(${i * 1.5}px, ${-i * 1.5}px)` }}>
            <CardBack />
          </span>
        ))}
        {shuffling &&
          Array.from({ length: 6 }).map((_, i) => (
            <span
              key={`s${i}`}
              className="shuffle-card absolute left-1/2 top-1/2 w-full"
              style={{ "--dir": i % 2 ? 1 : -1, animationDelay: `${(i % 3) * 50}ms`, zIndex: 10 + i } as React.CSSProperties}
            >
              <CardBack />
            </span>
          ))}
      </div>
    </div>
  );
}

/** Um lugar no arco: cartas, total, aposta e o jogador. */
function Spot({ seat, x, room, view, dealOrder, left }: { seat: Seat; x: number; room: RoomInfo; view: PlayerView; dealOrder: Map<string, number>; left: number | null }) {
  const p = view.table[seat]!;
  const info = room.seats[seat];
  const t = (x - 50) / 40;
  const bottom = 3 + 18 * t * t;
  const acting = actorsOf(view).includes(seat);
  const split = p.hands.length > 1;
  const out = p.bet === 0 && p.chips < view.minBet;
  return (
    <div
      className={`absolute z-10 flex w-[22%] -translate-x-1/2 flex-col items-center gap-1 ${info?.connected ? "" : "opacity-50"} ${out ? "opacity-40" : ""}`}
      style={{ left: `${x}%`, bottom: `${bottom}%` }}
    >
      <div className="flex items-end justify-center gap-1.5">
        {p.hands.map((h, i) => (
          <div key={i} className={`flex flex-col items-center gap-1 ${view.turn?.seat === seat && view.turn.hand !== i && split ? "opacity-60" : ""}`}>
            <Total cards={h.cards} hand={h} live={!h.done} delay={lastDealt(dealOrder, h.cards.map((c) => c.id))} />
            <div className={`flex ${split ? "[--cw:clamp(20px,6vw,36px)]" : "[--cw:clamp(26px,7.5vw,46px)]"}`}>
              {h.cards.map((c, j) => (
                <BjCard
                  key={c.id}
                  card={c}
                  from={`${(50 - x) * 4}px, -180px`}
                  delay={dealOrder.get(c.id) ?? 0}
                  className={`w-(--cw) ${j ? "ml-[calc(var(--cw)*-0.6)]" : ""}`}
                />
              ))}
            </div>
            {view.phase !== "settle" && <HandBet hand={h} />}
          </div>
        ))}
        {p.hands.length === 0 && p.bet !== null && p.bet > 0 && <BetStack amount={p.bet} size="h-4 w-4 sm:h-5 sm:w-5" text="text-[10px] sm:text-xs" />}
      </div>
      <div className="relative flex flex-col items-center">
        <Framed frame={info?.frame}>
          <div
            className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-[3px] border-white/30 bg-stone-800 font-display text-base shadow-lg shadow-black/40 sm:h-12 sm:w-12 sm:text-lg ${
              acting ? "turn-glow" : ""
            }`}
          >
            <SeatFace seat={info} />
          </div>
        </Framed>
        {acting && left !== null && <Timer ms={left} className="absolute -right-3 -top-2 h-6 w-6 text-[10px]" />}
        {p.net !== null && view.phase === "settle" && <NetBadge net={p.net} className="absolute -top-6" />}
        <span className="relative -mt-2 max-w-20 truncate rounded-full bg-stone-950/90 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-white/10 sm:text-[11px]">{info?.name}</span>
        <span className="font-display text-[10px] leading-tight text-gold/80 sm:text-xs">{fmt(p.chips)}</span>
      </div>
    </div>
  );
}

/** Aposta embaixo da mão (dobrada vem com a marca 2×). */
function HandBet({ hand, big }: { hand: Hand; big?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <BetStack amount={hand.bet} size={big ? "h-5 w-5 sm:h-6 sm:w-6" : "h-4 w-4 sm:h-5 sm:w-5"} text={big ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"} />
      {hand.doubled && <span className="rounded bg-gold px-1 font-display text-[9px] leading-tight text-stone-900">2×</span>}
    </span>
  );
}

function NetBadge({ net, className = "" }: { net: number; className?: string }) {
  return (
    <span
      className={`banner whitespace-nowrap rounded-full px-2 py-0.5 font-display text-xs shadow-lg ${
        net > 0 ? "bg-gold text-stone-900" : net < 0 ? "bg-red-600 text-white" : "bg-white/80 text-stone-900"
      } ${className}`}
    >
      {net === 0 ? "=" : signed(net)}
    </span>
  );
}

/** Segundos que faltam, num círculo que fica vermelho no fim. */
function Timer({ ms, className = "" }: { ms: number; className?: string }) {
  const s = Math.ceil(ms / 1000);
  return (
    <span
      className={`flex items-center justify-center rounded-full font-display leading-none shadow ${s <= 5 ? "bg-red-600 text-white" : "bg-black/80 text-white/90 ring-1 ring-white/20"} ${className}`}
      aria-label={`${s} segundos`}
    >
      {s}
    </span>
  );
}

function actorsOf(view: PlayerView): Seat[] {
  const ps = view.players.map((p) => view.table[p]!).filter(Boolean);
  if (view.phase === "bet") return ps.filter((p) => p.bet === null).map((p) => p.seat);
  if (view.phase === "insurance") return ps.filter((p) => p.hands.length > 0 && p.insurance === null).map((p) => p.seat);
  if (view.phase === "play" && view.turn) return [view.turn.seat];
  return [];
}

const btn =
  "banner rounded-xl px-3 py-2 font-display text-sm shadow-[0_3px_0_var(--sh)] transition active:translate-y-0.5 active:shadow-none disabled:opacity-40 sm:px-5 sm:text-base";

function MyArea({
  view,
  player,
  name,
  turnName,
  dealOrder,
  dealing,
  left,
  onAct,
  onHover,
}: {
  view: PlayerView;
  player: Player;
  name: string;
  turnName: string;
  dealOrder: Map<string, number>;
  dealing: boolean;
  left: number | null;
  onAct: (a: ClientAction) => void;
  onHover: (on: boolean) => void;
}) {
  const myTurn = !dealing && view.phase === "play" && view.turn?.seat === player.seat;
  const acting = !dealing && actorsOf(view).includes(player.seat);
  const split = player.hands.length > 1;
  const out = player.bet === 0 && player.chips < view.minBet;
  const result = view.phase === "settle" && player.net !== null ? player : null;
  const bj = result?.hands.some((h) => h.result === "blackjack");

  return (
    <section className="relative z-20 flex flex-col items-center gap-1 px-2 pb-2">
      <div className="flex min-h-[3.25rem] flex-wrap items-center justify-center gap-2">
        {acting && left !== null && <Timer ms={left} className="h-8 w-8 text-xs" />}
        {view.canBet && <BetControls view={view} player={player} onBet={(amount) => onAct({ type: "bet", amount })} />}
        {!dealing && view.mustInsure && (
          <>
            <button onClick={() => onAct({ type: "insurance", take: true })} className={`${btn} bg-emerald-600 [--sh:#065f46]`}>
              SEGURO · {view.insuranceCost}
            </button>
            <button onClick={() => onAct({ type: "insurance", take: false })} className={`${btn} bg-red-600 [--sh:#7f1d1d]`}>
              NÃO
            </button>
          </>
        )}
        {myTurn && (
          <>
            <button onClick={() => onAct({ type: "hit" })} disabled={!view.canHit} className={`${btn} ${MOVE_STYLE.hit}`}>
              {MOVE_LABEL.hit}
            </button>
            <button onClick={() => onAct({ type: "stand" })} disabled={!view.canStand} className={`${btn} ${MOVE_STYLE.stand}`}>
              {MOVE_LABEL.stand}
            </button>
            {view.canDouble && (
              <button onClick={() => onAct({ type: "double" })} className={`${btn} ${MOVE_STYLE.double}`}>
                {MOVE_LABEL.double}
              </button>
            )}
            {view.canSplit && (
              <button onClick={() => onAct({ type: "split" })} className={`${btn} ${MOVE_STYLE.split}`}>
                {MOVE_LABEL.split}
              </button>
            )}
          </>
        )}
        {result && (
          <span
            className={`banner rounded-2xl px-4 py-1.5 font-display text-lg shadow-lg ${
              bj ? "bg-gold text-stone-900" : result.net! > 0 ? "bg-gold text-stone-900" : result.net! < 0 ? "bg-red-600 text-white" : "bg-white/85 text-stone-900"
            }`}
          >
            {bj ? `BLACKJACK! ${signed(result.net!)}` : result.net === 0 ? "EMPATE" : signed(result.net!)}
          </span>
        )}
        {out && view.phase !== "gameOver" && <span className="rounded-2xl bg-white/10 px-4 py-1.5 font-display text-sm text-white/60">SEM FICHAS</span>}
      </div>

      <div
        className="flex min-h-[calc(clamp(58px,17vw,100px)*1.452+1.5rem)] items-end justify-center gap-4 sm:gap-8"
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
        {player.hands.map((h, i) => {
          const active = myTurn && view.turn!.hand === i;
          return (
            <div key={i} className={`flex flex-col items-center gap-1 transition ${myTurn && !active ? "opacity-50" : ""}`}>
              <Total cards={h.cards} hand={h} live={!h.done} delay={lastDealt(dealOrder, h.cards.map((c) => c.id))} />
              <div className={active ? "turn-card" : ""}>
                <div className={`flex ${split ? "[--cw:clamp(46px,13vw,80px)]" : "[--cw:clamp(58px,17vw,100px)]"}`}>
                  {h.cards.map((c, j) => (
                    <BjCard
                      key={c.id}
                      card={c}
                      from="30vw, -45vh"
                      delay={dealOrder.get(c.id) ?? 0}
                      className={`w-(--cw) ${j ? "ml-[calc(var(--cw)*-0.62)]" : ""}`}
                    />
                  ))}
                </div>
              </div>
              <HandBet hand={h} big />
            </div>
          );
        })}
        {player.hands.length === 0 && player.bet !== null && player.bet > 0 && <BetStack amount={player.bet} size="h-6 w-6" text="text-sm" />}
      </div>

      <span className={`flex items-center gap-1.5 font-display text-xs transition-colors ${acting ? "text-gold" : "text-white/50"}`}>
        {acting && <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />}
        {name}
        {!acting && view.phase === "play" && turnName ? ` · vez de ${turnName}` : ""}
        {!acting && view.phase === "bet" && player.bet !== null && " · ⏳"}
      </span>
    </section>
  );
}

/** Fichas para montar a aposta, REPETE a última e APOSTAR. */
function BetControls({ view, player, onBet }: { view: PlayerView; player: Player; onBet: (amount: number) => void }) {
  const [amount, setAmount] = useState(0);
  // nova rodada: começa do zero
  useEffect(() => setAmount(0), [view.round, view.gameNo]);
  const max = view.maxBet;
  const add = (v: number) => {
    setAmount((a) => Math.min(max, a + v));
    playChipSound();
  };
  const repeat = player.lastBet >= view.minBet && player.lastBet <= max ? player.lastBet : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        {CHIP_VALUES.map((v) => (
          <button
            key={v}
            onClick={() => add(v)}
            disabled={amount + v > max && amount >= max}
            aria-label={`Ficha de ${v}`}
            title={String(v)}
            className="rounded-full transition hover:brightness-110 active:scale-95 disabled:opacity-30"
          >
            <Chip value={v} className="h-11 w-11 drop-shadow-[0_3px_2px_rgba(0,0,0,0.5)] sm:h-12 sm:w-12" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {amount > 0 && (
          <button
            onClick={() => setAmount(0)}
            aria-label="Limpar aposta"
            title="Limpar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 font-display text-white/80 transition hover:bg-white/20"
          >
            ✕
          </button>
        )}
        {amount > 0 && amount * 2 <= max && (
          <button onClick={() => setAmount(amount * 2)} className={`${btn} bg-white/15 [--sh:rgba(0,0,0,0.4)]`} title="Dobrar a aposta">
            2×
          </button>
        )}
        {amount === 0 && repeat > 0 && (
          <button onClick={() => onBet(repeat)} className={`${btn} bg-emerald-600 [--sh:#065f46]`} title="Repetir a última aposta">
            REPETE · {repeat}
          </button>
        )}
        <button onClick={() => onBet(amount)} disabled={amount < view.minBet} className={`${btn} bg-gold text-stone-900 [--sh:#9a6b12]`}>
          APOSTAR{amount > 0 ? ` · ${amount}` : ""}
        </button>
      </div>
    </div>
  );
}

/**
 * Ordem de cada carta da distribuição (para entrarem uma por vez, como o servidor espera): 1ª de cada jogador,
 * 1ª da banca, 2ª de cada um, 2ª da banca. Cartas compradas depois entram na hora.
 */
function useDealOrder(view: PlayerView): Map<string, number> {
  const deal = [...view.events].reverse().find((e) => e.kind === "deal");
  const key = deal ? `${view.gameNo}-${deal.n}` : "";
  return useMemo(() => {
    const m = new Map<string, number>();
    if (!deal) return m;
    const ps = view.players.map((p) => view.table[p]!).filter((p) => p && p.hands.length > 0);
    let k = 0;
    for (let i = 0; i < 2; i++) {
      for (const p of ps) {
        const c = p.hands[0].cards[i];
        if (c && !m.has(c.id)) m.set(c.id, DEAL_START_MS + k * CARD_MS);
        k++;
      }
      m.set(`d${i}`, DEAL_START_MS + k * CARD_MS);
      k++;
    }
    return m;
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** As cartas da distribuição ainda estão voando (os botões esperam). Recarregar no meio não espera. */
function useDealing(view: PlayerView, order: Map<string, number>) {
  const live = useContext(Live);
  const deal = [...view.events].reverse().find((e) => e.kind === "deal");
  const key = deal ? `${view.gameNo}-${deal.n}` : "";
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!key || !live.current) return;
    setBusy(true);
    const t = setTimeout(() => setBusy(false), Math.max(0, ...order.values()) + 350);
    return () => {
      clearTimeout(t);
      setBusy(false);
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return busy;
}

/** Embaralhando quando o sapato é trocado (começo da partida ou passou do corte). */
function useShuffle(view: PlayerView) {
  const [on, setOn] = useState(false);
  const seen = useRef(view.shuffleNo);
  useEffect(() => {
    if (view.shuffleNo === seen.current) return;
    seen.current = view.shuffleNo;
    setOn(true);
    playShuffleSound();
    const t = setTimeout(() => setOn(false), 950);
    return () => clearTimeout(t);
  }, [view.shuffleNo]);
  return on;
}

/** ms até o fim da decisão atual, descendo no navegador a partir do que chegou do servidor. */
function useTimeLeft(view: PlayerView): number | null {
  const got = useRef({ at: 0, left: view.timeLeft, n: -1 });
  const [now, setNow] = useState(0);
  // cada visão nova acerta o relógio
  if (got.current.n !== view.eventNo || got.current.left === null || view.timeLeft === null) {
    got.current = { at: typeof performance === "undefined" ? 0 : performance.now(), left: view.timeLeft, n: view.eventNo };
  }
  const running = view.timeLeft !== null;
  useEffect(() => {
    if (!running) return;
    setNow(performance.now());
    const id = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(id);
  }, [running]);
  const left = got.current.left;
  const ms = left === null ? null : Math.max(0, left - Math.max(0, now - got.current.at));
  // aviso nos últimos 5 segundos da minha decisão
  const mine = actorsOf(view).includes(view.seat);
  const beeped = useRef(-1);
  useEffect(() => {
    if (ms === null || !mine) return;
    const s = Math.ceil(ms / 1000);
    if (s <= 5 && s > 0 && beeped.current !== s) {
      beeped.current = s;
      playCountdownSound(s === 1);
    }
  }, [ms, mine]);
  return ms;
}

/** Sons dos lances novos. Recarregar não toca nada. */
function useBjSounds(view: PlayerView) {
  const seen = useRef({ n: view.eventNo, game: view.gameNo });
  useEffect(() => {
    const p = seen.current;
    seen.current = { n: view.eventNo, game: view.gameNo };
    if (p.game !== view.gameNo && p.n > view.eventNo) return;
    const fresh = Math.min(view.eventNo - p.n, view.events.length);
    if (fresh <= 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, f: () => void) => timers.push(setTimeout(f, ms));
    const me = view.table[view.seat];
    let delay = 0;
    for (const e of view.events.slice(view.events.length - fresh)) {
      switch (e.kind) {
        case "deal":
          for (let i = 0; i < e.cards; i++) at(DEAL_START_MS + i * CARD_MS, playCardSound);
          delay += DEAL_START_MS + e.cards * CARD_MS;
          break;
        case "hit":
        case "double":
        case "dealerHit":
        case "reveal":
          at(delay, playCardSound);
          delay += 200;
          break;
        case "bet":
        case "insurance":
          if (e.kind === "bet" || e.take) at(delay, playChipSound);
          break;
        case "bust":
          if (e.seat === view.seat) at(delay + 150, playBustSound);
          break;
        case "settle":
          if (me && me.net !== null) {
            if (me.hands.some((h) => h.result === "blackjack")) at(delay + 200, playBlackjackSound);
            else if (me.net > 0) at(delay + 200, playPayoutSound);
            else if (me.net === 0 && me.hands.length) at(delay + 200, playDrawSound);
          }
          break;
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [view.eventNo, view.gameNo]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Vitória, derrota ou empate quando a partida acaba. */
function useEndSounds(view: PlayerView, player: Player | null) {
  const played = useRef(view.phase === "gameOver" ? view.gameNo : -1);
  useEffect(() => {
    if (view.phase !== "gameOver" || !player || played.current === view.gameNo) return;
    played.current = view.gameNo;
    const f = player.chips > START_CHIPS ? playWinSound : player.chips < START_CHIPS ? playLoseSound : playDrawSound;
    setTimeout(f, 300);
  }, [view.phase, view.gameNo, player]);
}
