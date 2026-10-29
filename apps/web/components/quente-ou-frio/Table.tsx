"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { attempts, byRank, heat, hintsUsed, status, type GameState, type Move } from "@mesa/quente-ou-frio";
import { DailyBadge } from "@/components/daily/common";
import { HelpButton, Icon, IconButton, MuteButton, XIcon } from "@/components/ui/buttons";
import { ExitConfirm } from "@/components/ui/ExitConfirm";
import { HowToPlayModal } from "@/components/ui/HowToPlayModal";
import { BarsIcon, ClockIcon, HintIcon, InfinityIcon } from "@/components/ui/icons";
import { sendPlay } from "@/lib/quente-ou-frio/api";
import { QUENTE_DAILY_PATH, QUENTE_PATH } from "@/lib/quente-ou-frio/paths";
import type { GameRef, PlayRequest, Reveal } from "@/lib/quente-ou-frio/protocol";
import { playGuessSound, playHintSound, playInvalidSound } from "@/lib/quente-ou-frio/sound";
import { addPlayed, loadDailyGame, loadFreeGame, newFreeId, saveDailyGame, saveFreeGame } from "@/lib/quente-ou-frio/storage";
import { playLoseSound, playWinSound, useAudioUnlock } from "@/lib/sound";
import { End } from "./End";
import { HowToPlay } from "./HowToPlay";
import { WordBar } from "./WordBar";

const HEADER = "relative z-40 grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-1.5 px-2 py-2 sm:min-h-[64px] sm:gap-2 sm:px-6";
/** Antes da primeira resposta do servidor, a barra usa este total (o vocabulário tem 40 mil palavras). */
const TOTAL = 40_000;

function FlagIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M5 21V4" />
      <path d="M5 4h11l-2 4 2 4H5" />
    </Icon>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

const sent = (g: GameState): PlayRequest["moves"] => g.moves.map((m) => (m.hint ? { word: m.word, hint: true } : { word: m.word }));

/** Partida do Quente ou Frio. `day`: palavra do dia; sem ele, modo livre. */
export function Table({ day }: { day?: string }) {
  const router = useRouter();
  const home = day ? QUENTE_DAILY_PATH : QUENTE_PATH;

  const [game, setGame] = useState<GameState | null>(null);
  const [freeId, setFreeId] = useState(0);
  const [total, setTotal] = useState(TOTAL);
  const [input, setInput] = useState("");
  const [last, setLast] = useState<Move | null>(null);
  const [flash, setFlash] = useState<{ word: string; key: number } | null>(null);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [byOrder, setByOrder] = useState(false);
  const [askGiveUp, setAskGiveUp] = useState(false);
  const [end, setEnd] = useState<Reveal | null>(null);
  const [showEnd, setShowEnd] = useState(false);
  const [help, setHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useAudioUnlock();

  const ref = (id = freeId): GameRef => (day ? { day } : { id });
  const save = (g: GameState, id = freeId) => (day ? saveDailyGame(day, g) : saveFreeGame({ ...g, id }));

  // carrega a partida salva; terminada, pede de novo as palavras mais próximas
  useEffect(() => {
    let g: GameState | null;
    let id = 0;
    if (day) g = loadDailyGame(day);
    else {
      const f = loadFreeGame();
      id = f?.id ?? newFreeId();
      g = f;
    }
    g ??= { moves: [] };
    if (!day) {
      setFreeId(id);
      saveFreeGame({ ...g, id });
    }
    setGame(g);
    setLast(g.moves.at(-1) ?? null);
    if (status(g) !== "playing") {
      setShowEnd(true);
      sendPlay({ game: day ? { day } : { id }, moves: sent(g), gaveUp: g.gaveUp, action: "end" }).then((r) => {
        if (r && "end" in r && r.end) {
          setEnd(r.end);
          setTotal(r.end.total);
        }
      });
    }
  }, [day]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast((x) => (x?.key === toast.key ? null : x)), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const say = (text: string) => setToast({ text, key: Date.now() });
  const refuse = (text: string) => {
    playInvalidSound();
    say(text);
  };

  const finish = (g: GameState, reveal: Reveal) => {
    const won = status(g) === "won";
    setEnd(reveal);
    addPlayed({ won, attempts: attempts(g), ...(day ? { day } : {}) });
    setTimeout(won ? playWinSound : playLoseSound, won ? 350 : 100);
    setTimeout(() => setShowEnd(true), won ? 1100 : 500);
  };

  const apply = (g: GameState, move: Move, reveal?: Reveal) => {
    const next = { ...g, moves: [...g.moves, move] };
    setGame(next);
    save(next);
    setLast(move);
    if (reveal) finish(next, reveal);
    return next;
  };

  const submit = async () => {
    const word = input.trim();
    if (!game || busy || !word || status(game) !== "playing") return;
    if (/\s/.test(word)) return refuse("SÓ UMA PALAVRA");
    setBusy(true);
    const r = await sendPlay({ game: ref(), moves: sent(game), action: "guess", word });
    setBusy(false);
    inputRef.current?.focus();
    if (!r) return refuse("SEM CONEXÃO");
    if ("error" in r) {
      if (r.error === "repeat" && r.word) {
        setInput("");
        setFlash({ word: r.word, key: Date.now() });
        return refuse("JÁ FOI");
      }
      return refuse("NÃO CONHEÇO");
    }
    if (!("move" in r)) return;
    setInput("");
    setTotal(r.total);
    playGuessSound(heat(r.move.rank));
    apply(game, r.move, r.end);
  };

  const askHint = async () => {
    if (!game || busy || status(game) !== "playing") return;
    setBusy(true);
    const r = await sendPlay({ game: ref(), moves: sent(game), action: "hint" });
    setBusy(false);
    if (!r) return refuse("SEM CONEXÃO");
    if (!("move" in r)) return refuse("SEM DICA");
    setTotal(r.total);
    playHintSound();
    apply(game, r.move);
  };

  const giveUp = async () => {
    setAskGiveUp(false);
    if (!game || busy || status(game) !== "playing") return;
    setBusy(true);
    const r = await sendPlay({ game: ref(), moves: sent(game), action: "giveup" });
    setBusy(false);
    if (!r || !("end" in r) || !r.end) return refuse("SEM CONEXÃO");
    const over = { ...game, gaveUp: true };
    setGame(over);
    save(over);
    setTotal(r.end.total);
    finish(over, r.end);
  };

  const again = () => {
    if (day) return router.push(QUENTE_PATH);
    const id = newFreeId();
    const g = { moves: [] };
    setFreeId(id);
    saveFreeGame({ ...g, id });
    setGame(g);
    setLast(null);
    setEnd(null);
    setShowEnd(false);
    setInput("");
  };

  const list = useMemo(() => (game ? (byOrder ? [...game.moves].reverse() : byRank(game.moves)) : []), [game, byOrder]);

  if (!game) {
    return (
      <main className="flex h-dvh flex-col overflow-hidden">
        <header className={HEADER} />
      </main>
    );
  }

  const st = status(game);
  const playing = st === "playing";

  return (
    <main className="flex h-dvh touch-manipulation flex-col overflow-hidden">
      <header className={HEADER}>
        <div className="col-start-1 flex items-center gap-1 justify-self-start sm:gap-2">
          {day ? (
            <DailyBadge day={day} className="rounded-full bg-black/30 px-3 py-1.5 text-white/70" />
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 font-display text-xs text-white/70" title="Livre">
              <InfinityIcon className="h-4 w-4 text-gold" />
              LIVRE
            </span>
          )}
        </div>

        <span className="col-start-2 flex items-baseline gap-1.5 font-display text-white/60" title="Tentativas">
          <span className="text-xs">TENTATIVAS</span>
          <span className="text-lg tabular-nums text-white">{attempts(game)}</span>
        </span>

        <div className="col-start-3 flex items-center gap-1 justify-self-end sm:gap-2">
          {!playing && !showEnd && (
            <IconButton label="Resultado" onClick={() => setShowEnd(true)} active>
              <BarsIcon />
            </IconButton>
          )}
          <HelpButton onClick={() => setHelp(true)} />
          <MuteButton />
          <ExitConfirm onExit={() => router.push(home)} ask={playing && game.moves.length > 0} />
        </div>
      </header>

      <section className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-2 px-3 pb-3">
        {toast && (
          <div
            key={`toast-${toast.key}`}
            className="banner pointer-events-none absolute left-1/2 top-14 z-30 -translate-x-1/2 rounded-full bg-stone-950/90 px-4 py-1.5 font-display text-sm text-white shadow-xl ring-1 ring-white/15"
            role="status"
          >
            {toast.text}
          </div>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!playing}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="send"
            maxLength={30}
            placeholder={playing ? "palavra" : ""}
            aria-label="Palavra"
            className="h-12 min-w-0 flex-1 rounded-xl bg-black/40 px-4 font-display text-lg text-white outline-none ring-1 ring-white/15 placeholder:text-white/30 focus:ring-2 focus:ring-gold disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!playing || busy || !input.trim()}
            aria-label="Chutar"
            title="Chutar"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-stone-900 shadow-[0_3px_0_#9a6b12] transition enabled:hover:brightness-110 enabled:active:translate-y-0.5 enabled:active:shadow-none disabled:opacity-40"
          >
            {busy ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-current border-r-transparent" /> : <SendIcon className="h-6 w-6" />}
          </button>
        </form>

        <div className="relative flex items-center gap-2">
          <button
            onClick={askHint}
            disabled={!playing || busy}
            className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 font-display text-sm text-white/85 transition enabled:hover:bg-white/20 enabled:hover:text-white disabled:opacity-30"
            title="Dica: revela uma palavra mais perto"
          >
            <HintIcon className="h-4 w-4 text-gold" />
            DICA
            {hintsUsed(game) > 0 && <span className="text-xs text-white/50">{hintsUsed(game)}</span>}
          </button>
          <button
            onClick={() => setAskGiveUp((v) => !v)}
            disabled={!playing || busy}
            className="flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3.5 font-display text-sm text-white/85 transition enabled:hover:bg-white/20 enabled:hover:text-white disabled:opacity-30"
            title="Desistir e ver a palavra"
          >
            <FlagIcon className="h-4 w-4 text-red-400" />
            DESISTIR
          </button>
          <span className="flex-1" />
          <IconButton label={byOrder ? "Ordenar pela posição" : "Ordenar pela ordem dos chutes"} onClick={() => setByOrder((v) => !v)} active={byOrder}>
            <ClockIcon className="h-5 w-5" />
          </IconButton>

          {askGiveUp && (
            <div className="banner absolute left-0 top-full z-30 mt-1 flex items-center gap-2 rounded-2xl bg-stone-950/95 py-2 pl-4 pr-2 font-display shadow-2xl ring-1 ring-white/10">
              <span className="text-sm text-white/70">DESISTIR?</span>
              <button
                onClick={() => setAskGiveUp(false)}
                aria-label="Cancelar"
                title="Cancelar"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <XIcon />
              </button>
              <button onClick={giveUp} className="rounded-xl bg-red-500 px-4 py-2 text-sm text-white shadow-[0_3px_0_#991b1b] active:translate-y-0.5 active:shadow-none">
                DESISTIR
              </button>
            </div>
          )}
        </div>

        {last && <WordBar key={`last-${last.word}`} {...last} total={total} fresh className="qf-in" />}

        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1 pb-2 pt-1">
          {list.map((m) => (
            // a chave muda quando a palavra pisca, para a animação rodar de novo
            <WordBar key={flash?.word === m.word ? `${m.word}-${flash.key}` : m.word} {...m} total={total} flash={flash?.word === m.word} />
          ))}
          {!game.moves.length && (
            <p className="mt-6 text-center font-display text-sm text-white/40">A secreta é a nº 1</p>
          )}
        </div>
      </section>

      {showEnd && !playing && (
        <End game={game} reveal={end} day={day} total={total} onLeave={() => router.push(home)} onHide={() => setShowEnd(false)} onAgain={again} />
      )}

      {help && (
        <HowToPlayModal game="QUENTE OU FRIO" onClose={() => setHelp(false)}>
          <HowToPlay />
        </HowToPlayModal>
      )}
    </main>
  );
}
