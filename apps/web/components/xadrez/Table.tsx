"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  analyze,
  capturedBy,
  hint as findHint,
  KING,
  KNIGHT,
  materialOfSeat,
  MATE,
  posOf,
  QUEEN,
  BISHOP,
  ROOK,
  sideOfSeat,
  type EndReason,
  type Move,
  type MoveRecord,
  type PlayerView,
  type Seat,
} from "@truco/xadrez";
import type { RoomInfo } from "@truco/game";
import { send } from "@/lib/socket";
import { XADREZ_PATH } from "@/lib/xadrez/paths";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { HelpButton, IconButton, MuteButton, XIcon } from "@/components/ui/buttons";
import { BarsIcon, CheckIcon } from "@/components/ui/icons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { EndStat, GameEnd } from "@/components/ui/GameEnd";
import { SeatFace } from "@/components/ui/SeatFace";
import { playCountdownSound, playDrawSound, playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { playCaptureSound, playCastleSound, playCheckSound, playMoveSound, playOfferSound, playPromoteSound } from "@/lib/xadrez/sound";
import { Board, piecesOf, place, type Mark, type UiPiece } from "./Board";
import { PieceShape } from "./Piece";
import { HowToPlay } from "./HowToPlay";
import { BulbIcon, FlagIcon, HalfIcon } from "./icons";

/** Deslize da peça (o servidor espera o mesmo antes de a IA jogar). */
const MOVE_MS = 300;
const EVAL_KEY = "xadrez.eval";
const PIECE_NAME: Record<number, string> = { [QUEEN]: "Dama", [ROOK]: "Torre", [BISHOP]: "Bispo", [KNIGHT]: "Cavalo" };

export const END_LABEL: Record<EndReason, string> = {
  mate: "XEQUE-MATE",
  stalemate: "AFOGADO",
  material: "SEM MATERIAL",
  repeat: "REPETIÇÃO",
  fifty: "50 LANCES",
  resign: "DESISTÊNCIA",
  agreed: "COMBINADO",
  time: "TEMPO",
};

export function Table({ room, view }: { room: RoomInfo; view: PlayerView }) {
  const router = useRouter();
  const me = view.seat;
  const opp = (1 - me) as Seat;
  const mySide = sideOfSeat(view, me);
  const over = view.phase === "gameOver";
  // dica e barra de vantagem só contra a IA; entre pessoas seria ajuda de fora
  const vsAI = room.seats[opp].kind === "bot";
  const flip = mySide < 0;

  const [help, setHelp] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [promo, setPromo] = useState<{ from: number; to: number } | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [thinking, setThinking] = useState(false);
  const [evalOn, toggleEval] = useEvalPref();
  const drag = useRef<{ from: number; id: number; x: number; y: number; moved: boolean; again: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ id: number; p: number; x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const dropped = useRef<number | null>(null);

  useAudioUnlock();
  const { pieces, animating } = useAnimatedPieces(view, dropped, (move) => {
    if (move.check) playCheckSound();
    else if (move.rook) playCastleSound();
    else if (move.captured) playCaptureSound();
    else playMoveSound();
    if (move.promo) setTimeout(playPromoteSound, 150);
  });
  useEndSounds(view, animating);
  const showEnd = useEndDelay(view, animating);
  const clock = useClockDisplay(view);
  const score = useEval(view, vsAI && evalOn, animating);

  const interactive = view.canPlay && !help;
  const fromSquares = new Set(interactive ? view.legal.map((m) => m.from) : []);
  const targets = sel === null ? [] : view.legal.filter((m) => m.from === sel);
  const targetSet = new Set(targets.map((m) => m.to));

  // lance novo ou vez do outro: limpa seleção, promoção e dica
  useEffect(() => {
    setSel(null);
    setPromo(null);
    setHint(null);
  }, [view.moves.length, view.gameNo, interactive]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSel(null);
      setPromo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // oferta de empate chegando
  useEffect(() => {
    if (view.mustAnswerDraw) playOfferSound();
  }, [view.mustAnswerDraw]);

  const leave = () => {
    send({ t: "leave" });
    router.push(XADREZ_PATH);
  };

  const play = (from: number, to: number, piece?: number) => {
    setSel(null);
    setPromo(null);
    send({ t: "action", action: { type: "move", from, to, ...(piece ? { promo: piece } : {}) } });
  };

  /** Tenta o lance de `from` para `to`; promoção abre a escolha da peça. */
  const tryMove = (from: number, to: number) => {
    const ms = view.legal.filter((m) => m.from === from && m.to === to);
    if (!ms.length) return false;
    if (ms.some((m) => m.promo)) setPromo({ from, to });
    else play(from, to);
    return true;
  };

  const squareAt = (x: number, y: number) => {
    const r = boardRef.current?.getBoundingClientRect();
    if (!r) return null;
    const col = Math.floor(((x - r.left) / r.width) * 8);
    const row = Math.floor(((y - r.top) / r.height) * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    const v = row * 8 + col;
    return flip ? 63 - v : v;
  };

  const onDown = (e: React.PointerEvent, sq: number) => {
    if (!interactive || promo) return;
    if (sel !== null && targetSet.has(sq)) {
      tryMove(sel, sq);
      return;
    }
    if (!fromSquares.has(sq)) return setSel(null);
    const pc = pieces.find((x) => x.sq === sq && !x.out);
    if (!pc) return;
    setSel(sq);
    drag.current = { from: sq, id: pc.id, x: e.clientX, y: e.clientY, moved: false, again: sel === sq };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    d.moved = true;
    const pc = pieces.find((x) => x.id === d.id);
    if (pc) setGhost({ id: d.id, p: pc.p, x: e.clientX, y: e.clientY });
  };

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setGhost(null);
    if (!d) return;
    // tocar de novo na peça escolhida desfaz a escolha
    if (!d.moved) return void (d.again && setSel(null));
    const to = squareAt(e.clientX, e.clientY);
    if (to !== null && to !== d.from) {
      // largou em cima da casa: a peça aparece lá sem deslizar de novo
      dropped.current = d.id;
      if (!tryMove(d.from, to)) dropped.current = null;
    }
  };

  const askHint = () => {
    if (!interactive || thinking) return;
    setThinking(true);
    setTimeout(() => {
      setHint(findHint(view));
      setThinking(false);
    }, 30);
  };

  // marcas nas casas
  const marks: Partial<Record<number, Mark[]>> = {};
  const add = (sq: number, m: Mark) => (marks[sq] ??= []).push(m);
  const last = view.moves.at(-1);
  if (last) [last.from, last.to].forEach((sq) => add(sq, "last"));
  if (view.check && (view.phase === "playing" || view.end === "mate")) {
    const king = view.board.indexOf(sideOfSeat(view, view.turn) * KING);
    if (king >= 0) add(king, "check");
  }
  if (hint) [hint.from, hint.to].forEach((sq) => add(sq, "hint"));
  if (sel !== null) {
    add(sel, "selected");
    for (const sq of targetSet) add(sq, view.board[sq] || (view.board[sel] === mySide && view.ep === sq) ? "capture" : "target");
  }

  const myCaptured = capturedBy(view, me);
  const oppCaptured = capturedBy(view, opp);
  const diff = materialOfSeat(view, me) - materialOfSeat(view, opp);
  const shown = ghost ? pieces.map((x) => (x.id === ghost.id ? { ...x, hidden: true } : x)) : pieces;

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-40 flex items-center justify-between gap-1.5 px-2 py-2 sm:gap-2 sm:px-6">
        <div className="flex items-center gap-1.5 rounded-2xl bg-black/40 px-3 py-2 font-display sm:gap-3 sm:px-4">
          <Score icon={<PieceShape p={mySide * KING} className="h-4 w-4" />} value={view.scores[me]} gold />
          <Times />
          <Score icon={<PieceShape p={-mySide * KING} className="h-4 w-4" />} value={view.scores[opp]} />
          {view.draws > 0 && (
            <>
              <Times />
              <Score icon={<HalfIcon className="h-3.5 w-3.5 text-white/60" />} value={view.draws} dim label="Empates" />
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {!room.solo && <span className="hidden font-display text-white/40 sm:inline">{room.code}</span>}
          <HelpButton onClick={() => setHelp(true)} />
          {vsAI && (
            <IconButton label="Vantagem" onClick={toggleEval} active={evalOn} className={evalOn ? "" : "!text-white/50"}>
              <BarsIcon className="h-5 w-5" />
            </IconButton>
          )}
          <MuteButton />
          <ExitConfirm onExit={leave} ask={!over} />
        </div>
      </header>

      <section className="relative mx-auto mb-2 w-[calc(100%-0.5rem)] max-w-[900px] flex-1 sm:w-[calc(100%-4rem)]">
        <div className="felt absolute inset-0 rounded-[28px] sm:rounded-[60px]" />
        <div className="absolute inset-0 [container-type:size]">
          <div className="flex h-full items-center justify-center py-2">
            {/* coluna do tabuleiro: cabe na largura e na altura (faixas de cima e de baixo somam ~9rem) */}
            <div className="flex w-[min(calc(100cqw-1rem),calc(100cqh-9.5rem),640px)] flex-col gap-1.5">
              <PlayerStrip room={room} seat={opp} side={-mySide} captured={oppCaptured} plus={-diff} time={clock(opp)} running={view.phase === "playing" && view.turn === opp} />

              <div className="flex gap-1.5">
                {vsAI && evalOn && <EvalBar score={score} side={mySide} />}
                <div className="relative min-w-0 flex-1">
                  <Board pieces={shown.filter((x) => !(x as { hidden?: boolean }).hidden)} flip={flip} marks={marks}>
                    <div
                      ref={boardRef}
                      className="absolute inset-0 grid touch-none select-none grid-cols-8 grid-rows-8"
                      onPointerMove={onMove}
                      onPointerUp={onUp}
                      onPointerCancel={() => {
                        drag.current = null;
                        setGhost(null);
                      }}
                    >
                      {Array.from({ length: 64 }, (_, i) => {
                        const sq = flip ? 63 - i : i;
                        const active = fromSquares.has(sq) || targetSet.has(sq);
                        return (
                          <button
                            key={i}
                            aria-label={`Casa ${sq}`}
                            tabIndex={active ? 0 : -1}
                            onPointerDown={(e) => onDown(e, sq)}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              if (sel !== null && targetSet.has(sq)) tryMove(sel, sq);
                              else if (fromSquares.has(sq)) setSel(sq === sel ? null : sq);
                            }}
                            className={`outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold ${active && interactive ? "cursor-pointer" : "cursor-default"}`}
                          />
                        );
                      })}
                    </div>
                    {promo && <PromotionPicker side={mySide} to={promo.to} flip={flip} onPick={(p) => play(promo.from, promo.to, p)} onCancel={() => setPromo(null)} />}
                  </Board>
                  {view.mustAnswerDraw && !over && <DrawPrompt />}
                </div>
              </div>

              <PlayerStrip room={room} seat={me} side={mySide} captured={myCaptured} plus={diff} time={clock(me)} running={view.phase === "playing" && view.turn === me} mine />

              <div className="flex items-center gap-1.5">
                <History moves={view.moves} />
                {!over && (
                  <GameActions
                    view={view}
                    vsAI={vsAI}
                    hint={vsAI ? { onClick: askHint, busy: thinking, disabled: !interactive } : undefined}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {ghost && (
        <div className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2" style={{ left: ghost.x, top: ghost.y, width: (boardRef.current?.clientWidth ?? 320) / 8 + 8 }}>
          <PieceShape p={ghost.p} className="h-full w-full scale-110 drop-shadow-[0_6px_6px_rgba(0,0,0,0.45)]" />
        </div>
      )}

      {over && showEnd && (
        <GameEnd
          won={view.winner === me}
          draw={view.winner === null}
          badge={view.end ? <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 font-display text-sm text-white/80">{END_LABEL[view.end]}</span> : undefined}
          onLeave={leave}
          onAgain={room.isHost ? () => send({ t: "restart" }) : undefined}
        >
          <p className="flex items-center font-display text-3xl">
            <span className="text-gold">{view.scores[me]}</span>
            <span className="mx-3 text-white/30">×</span>
            {view.scores[opp]}
          </p>
          <div className="flex gap-6 font-display">
            <EndStat label="LANCES" value={view.moves.filter((m) => m.seat === me).length} gold />
            <EndStat label="CAPTURAS" value={myCaptured.length} />
          </div>
        </GameEnd>
      )}
      {help && (
        <HowToPlayModal game="XADREZ" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}

/** Escolha da peça na promoção: coluna de 4 peças a partir da casa de chegada. */
function PromotionPicker({ side, to, flip, onPick, onCancel }: { side: number; to: number; flip: boolean; onPick: (p: number) => void; onCancel: () => void }) {
  const { col, row } = place(to, flip);
  const down = row === 0;
  return (
    <div className="absolute inset-0 z-20 bg-black/40" onPointerDown={onCancel}>
      <div
        className="absolute flex w-[12.5%] flex-col overflow-hidden rounded-lg bg-stone-100 shadow-2xl ring-2 ring-gold"
        style={{ left: `${col * 12.5}%`, ...(down ? { top: 0 } : { bottom: 0 }), flexDirection: down ? "column" : "column-reverse" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {[QUEEN, KNIGHT, ROOK, BISHOP].map((p) => (
          <button key={p} onClick={() => onPick(p)} aria-label={PIECE_NAME[p]} title={PIECE_NAME[p]} className="aspect-square p-[6%] transition hover:bg-gold/40">
            <PieceShape p={side * p} className="h-full w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}

/** Oferta de empate do adversário: ✓ aceita, ✕ recusa. */
function DrawPrompt() {
  return (
    <div className="banner absolute left-1/2 top-1/2 z-30 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-2xl bg-stone-900/95 px-4 py-3 shadow-2xl ring-2 ring-gold/60">
      <HalfIcon className="h-6 w-6 text-gold" />
      <span className="font-display text-lg">EMPATE?</span>
      <button
        onClick={() => send({ t: "action", action: { type: "answerDraw", accept: false } })}
        aria-label="Recusar"
        title="Recusar"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
      >
        <XIcon />
      </button>
      <button
        onClick={() => send({ t: "action", action: { type: "answerDraw", accept: true } })}
        aria-label="Aceitar"
        title="Aceitar"
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-stone-900 transition hover:brightness-110"
      >
        <CheckIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

/** Dica (contra a IA), oferecer empate e desistir. */
function GameActions({ view, vsAI, hint }: { view: PlayerView; vsAI: boolean; hint?: { onClick: () => void; busy: boolean; disabled: boolean } }) {
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [confirm]);
  const waiting = view.drawOffer === view.seat;
  return (
    <div className="flex shrink-0 items-center gap-1">
      {hint && (
        <SmallButton label="Dica" onClick={hint.onClick} disabled={hint.disabled || hint.busy}>
          {hint.busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> : <BulbIcon />}
        </SmallButton>
      )}
      {!vsAI && (
        <SmallButton
          label={waiting ? "Empate oferecido" : "Oferecer empate"}
          onClick={() => send({ t: "action", action: { type: "offerDraw" } })}
          disabled={!view.canOfferDraw}
          active={waiting}
        >
          <HalfIcon className="h-4 w-4" />
        </SmallButton>
      )}
      {confirm ? (
        <button
          onClick={() => send({ t: "action", action: { type: "resign" } })}
          className="flex h-8 items-center gap-1 rounded-lg bg-red-500 px-2.5 font-display text-xs text-white transition hover:bg-red-400"
        >
          <FlagIcon />
          DESISTIR
        </button>
      ) : (
        <SmallButton label="Desistir" onClick={() => setConfirm(true)}>
          <FlagIcon />
        </SmallButton>
      )}
    </div>
  );
}

function SmallButton({ label, onClick, disabled, active, children }: { label: string; onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-30 ${
        active ? "bg-gold/25 text-gold" : "bg-black/35 text-white/80 enabled:hover:bg-black/50 enabled:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/** Lances da partida numa linha que rola sozinha até o último. */
function History({ moves }: { moves: MoveRecord[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [moves.length]);
  return (
    <div ref={ref} className="flex h-8 min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap rounded-lg bg-black/35 px-2 font-mono text-xs [scrollbar-width:none]">
      {moves.map((m, i) => (
        <span key={i} className="flex items-center gap-1">
          {i % 2 === 0 && <span className="text-white/35">{i / 2 + 1}.</span>}
          <span className={i === moves.length - 1 ? "rounded bg-gold/25 px-1 text-gold" : "text-white/80"}>{m.san}</span>
        </span>
      ))}
    </div>
  );
}

/** Faixa de um jogador: rosto, nome, peças que capturou, vantagem de material e relógio. */
function PlayerStrip({
  room,
  seat,
  side,
  captured,
  plus,
  time,
  running,
  mine,
}: {
  room: RoomInfo;
  seat: Seat;
  side: number;
  captured: number[];
  plus: number;
  time: number | null;
  running: boolean;
  mine?: boolean;
}) {
  const info = room.seats[seat];
  return (
    <div className="flex h-10 items-center gap-2">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] bg-stone-800 font-display text-white shadow-lg shadow-black/40 ${
          mine ? "border-gold/80" : "border-red-400/80"
        } ${running ? "turn-glow" : ""} ${info.connected ? "" : "opacity-40"}`}
      >
        <SeatFace seat={info} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className={`truncate text-xs font-semibold ${running ? (mine ? "text-gold" : "text-white") : "text-white/70"}`}>{info.name}</span>
        <span className="flex h-4 items-center">
          {captured.map((t, i) => (
            <PieceShape key={i} p={-side * t} className={`h-4 w-4 ${i > 0 && captured[i - 1] === t ? "-ml-2" : ""}`} />
          ))}
          {plus > 0 && <span className="ml-1 font-display text-[11px] text-white/60">+{plus}</span>}
        </span>
      </div>
      {time !== null && <ClockFace ms={time} running={running} />}
    </div>
  );
}

function ClockFace({ ms, running }: { ms: number; running: boolean }) {
  const low = ms < 20_000;
  const s = Math.ceil(ms / 1000);
  const text = ms < 10_000 ? (ms / 1000).toFixed(1).replace(".", ",") : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <span
      className={`min-w-[4.5rem] rounded-lg px-2 py-1 text-center font-display text-lg tabular-nums transition-colors ${
        running ? (low ? "bg-red-500 text-white" : "bg-stone-100 text-stone-900") : low ? "bg-black/40 text-red-300" : "bg-black/40 text-white/60"
      }`}
    >
      {text}
    </span>
  );
}

/** Barra de vantagem na sua visão: cheia em cima = você está melhor (o seu lado fica embaixo). */
function EvalBar({ score, side }: { score: number | null; side: number }) {
  const mine = score === null ? 0 : score * side;
  const pct = Math.abs(mine) >= MATE / 2 ? (mine > 0 ? 100 : 0) : 50 + 50 * Math.tanh(mine / 500);
  const label = score === null ? "" : Math.abs(mine) >= MATE / 2 ? "M" : (Math.abs(mine) / 100).toFixed(1).replace(".", ",");
  return (
    <div
      className={`relative w-3 shrink-0 overflow-hidden rounded-md ring-1 ring-black/40 sm:w-4 ${side > 0 ? "bg-stone-800" : "bg-stone-100"}`}
      title={label ? `${mine >= 0 ? "+" : "−"}${label}` : undefined}
    >
      <div className={`absolute inset-x-0 bottom-0 transition-[height] duration-500 ${side > 0 ? "bg-stone-100" : "bg-stone-800"}`} style={{ height: `${pct}%` }} />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gold/60" />
    </div>
  );
}

function Times() {
  return (
    <div className="flex flex-col items-center leading-none" aria-hidden="true">
      <span className="invisible h-4">×</span>
      <span className="flex h-[1em] items-center text-3xl">
        <span className="text-base text-white/30">×</span>
      </span>
    </div>
  );
}

function Score({ icon, value, gold, dim, label }: { icon: React.ReactNode; value: number; gold?: boolean; dim?: boolean; label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 leading-none" title={label}>
      <span className="flex h-4 items-center">{icon}</span>
      <span className={`text-3xl ${gold ? "text-gold" : dim ? "text-white/60" : ""}`}>{value}</span>
    </div>
  );
}

/**
 * Peças da tela acompanhando a visão. O lance novo desliza (a torre do roque também, a capturada some);
 * entrar, recarregar ou pular lances monta direto do tabuleiro.
 */
function useAnimatedPieces(view: PlayerView, dropped: React.RefObject<number | null>, onMove: (move: MoveRecord) => void) {
  const gen = useRef(0);
  const [pieces, setPieces] = useState<UiPiece[]>(() => piecesOf(view.board));
  const rebuild = () => piecesOf(view.board, ++gen.current);
  const [animating, setAnimating] = useState(false);
  const seen = useRef({ game: view.gameNo, moves: view.moves.length });
  const live = useRef(pieces);
  live.current = pieces;
  const moveRef = useRef(onMove);
  moveRef.current = onMove;

  useEffect(() => {
    const p = seen.current;
    seen.current = { game: view.gameNo, moves: view.moves.length };
    const move = view.moves.at(-1);
    const mover = move && live.current.find((x) => x.sq === move.from && !x.out);
    const instant = dropped.current;
    dropped.current = null;
    if (view.gameNo !== p.game || view.moves.length !== p.moves + 1 || !move || !mover) {
      setPieces(rebuild());
      setAnimating(false);
      return;
    }
    setAnimating(true);
    setPieces((ps) =>
      ps.map((x) => {
        if (x.id === mover.id) return { ...x, sq: move.to, ...(instant === x.id ? { id: x.id + 10_000 } : {}) };
        if (move.rook && x.sq === move.rook[0] && !x.out) return { ...x, sq: move.rook[1] };
        if (move.captured && x.sq === move.capturedAt && !x.out) return { ...x, out: true };
        return x;
      }),
    );
    moveRef.current(move);
    let done = false;
    const t = setTimeout(() => {
      setPieces((ps) => {
        const next = ps.filter((x) => !x.out).map((x) => (view.board[x.sq] !== x.p ? { ...x, p: view.board[x.sq] } : x));
        const ok = next.length === view.board.filter(Boolean).length && next.every((x) => view.board[x.sq] !== 0);
        return ok ? next : rebuild();
      });
      setAnimating(false);
      done = true;
    }, MOVE_MS + 150);
    return () => {
      clearTimeout(t);
      if (!done) seen.current = { game: -1, moves: -1 };
    };
  }, [view.gameNo, view.moves.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return { pieces, animating };
}

/** Tempo de cada lugar agora: o da vez desce a partir do que chegou do servidor. */
function useClockDisplay(view: PlayerView) {
  const [now, setNow] = useState(() => performance.now());
  const got = useRef({ at: performance.now(), left: view.timeLeft });
  if (got.current.left !== view.timeLeft) got.current = { at: performance.now(), left: view.timeLeft };
  const running = view.phase === "playing" && view.timeLeft !== null;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(id);
  }, [running]);
  const time = (seat: Seat) => {
    const left = got.current.left;
    if (!left) return null;
    return running && view.turn === seat ? Math.max(0, left[seat] - (now - got.current.at)) : left[seat];
  };
  // aviso de tempo acabando no seu relógio
  const mine = time(view.seat);
  const warned = useRef(false);
  useEffect(() => {
    if (mine === null || view.turn !== view.seat) return;
    if (mine > 10_000) warned.current = false;
    else if (!warned.current && mine > 0) {
      warned.current = true;
      playCountdownSound(false);
    }
  }, [mine, view.turn, view.seat]);
  return time;
}

/** Nota da posição (visão das brancas) depois de cada lance, com uma busca curta no navegador. */
function useEval(view: PlayerView, on: boolean, animating: boolean) {
  const [score, setScore] = useState<number | null>(null);
  useEffect(() => {
    if (!on || animating) return;
    if (view.phase === "gameOver") {
      setScore(view.winner === null ? 0 : (sideOfSeat(view, view.winner) * MATE));
      return;
    }
    const t = setTimeout(() => setScore(analyze(posOf(view))), 60);
    return () => clearTimeout(t);
  }, [on, animating, view.moves.length, view.gameNo, view.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  return score;
}

/** Barra de vantagem ligada ou não, salva no aparelho (vem ligada). */
function useEvalPref(): [boolean, () => void] {
  const [on, setOn] = useState(true);
  useEffect(() => {
    try {
      setOn(localStorage.getItem(EVAL_KEY) !== "0");
    } catch {}
  }, []);
  const toggle = () =>
    setOn((v) => {
      try {
        localStorage.setItem(EVAL_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });
  return [on, toggle];
}

/** Som de fim de partida, depois de a última peça pousar. */
function useEndSounds(view: PlayerView, animating: boolean) {
  const played = useRef(view.phase === "gameOver" ? view.gameNo : -1);
  useEffect(() => {
    if (view.phase !== "gameOver" || animating || played.current === view.gameNo) return;
    played.current = view.gameNo;
    const end = view.winner === null ? playDrawSound : view.winner === view.seat ? playWinSound : playLoseSound;
    setTimeout(end, 250);
  }, [view.phase, view.gameNo, view.winner, view.seat, animating]);
}

/** Mostra a tela de fim só um pouco depois do último lance. */
function useEndDelay(view: PlayerView, animating: boolean) {
  const [show, setShow] = useState(view.phase === "gameOver");
  useEffect(() => {
    if (view.phase !== "gameOver") return setShow(false);
    if (animating) return;
    const t = setTimeout(() => setShow(true), view.end === "mate" ? 1400 : 700);
    return () => clearTimeout(t);
  }, [view.phase, view.gameNo, animating, view.end]);
  return show;
}
