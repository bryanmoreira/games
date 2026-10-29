"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUND_OPTIONS, type Rounds } from "@mesa/blackjack";
import { clearCreated, clearError, connect, getName, send, setName, useRoom } from "@/lib/socket";
import { BackButton } from "@/components/BackButton";
import { AdSlot } from "@/components/AdSlot";
import { GameIntro } from "@/components/seo";
import { CardImg } from "@/components/cards/Card";
import { Chip } from "@/components/blackjack/Chips";
import { BLACKJACK_PATH, roomPath } from "@/lib/blackjack/paths";
import { PlayerName } from "@/components/ui/PlayerName";

const BOTS_KEY = "blackjack.bots";
const ROUNDS_KEY = "blackjack.rounds";
const BOTS = [0, 1, 2, 3, 4];

export default function BlackjackHome() {
  const router = useRouter();
  const { created, error } = useRoom();
  const [name, setNameInput] = useState("");
  const [code, setCode] = useState("");
  const [bots, setBots] = useState(2);
  const [rounds, setRounds] = useState<Rounds>(10);

  useEffect(() => {
    setNameInput(getName());
    connect();
    clearError();
    try {
      const b = localStorage.getItem(BOTS_KEY);
      if (b !== null && BOTS.includes(Number(b))) setBots(Number(b));
      const r = Number(localStorage.getItem(ROUNDS_KEY));
      if (ROUND_OPTIONS.includes(r as Rounds)) setRounds(r as Rounds);
    } catch {}
  }, []);

  useEffect(() => {
    if (created) {
      clearCreated();
      router.push(roomPath(created));
    }
  }, [created, router]);

  const ready = name.trim().length > 0;
  const saveName = () => setName(name.trim());
  const remember = (key: string, v: number) => {
    try {
      localStorage.setItem(key, String(v));
    } catch {}
  };

  // o solo joga sem relógio; a sala online tem relógio nas decisões
  const create = (solo: boolean) => {
    saveName();
    send({ t: "create", solo, game: "blackjack", settings: { rounds, clock: !solo }, ...(solo ? { bots } : {}) });
  };

  const join = () => {
    if (code.trim().length < 4) return;
    saveName();
    router.push(roomPath(code.trim().toUpperCase()));
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <div className="relative flex items-end" aria-hidden="true">
        <div className="w-16 shrink-0 -rotate-[10deg]">
          <CardImg card={{ rank: "A", suit: "spades" }} />
        </div>
        <div className="-ml-7 w-16 shrink-0 rotate-[8deg] -translate-y-1">
          <CardImg card={{ rank: "J", suit: "hearts" }} />
        </div>
        <Chip value={100} className="absolute -bottom-3 -right-6 h-10 w-10 drop-shadow-[0_3px_2px_rgba(0,0,0,0.5)]" />
      </div>
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-[clamp(2.6rem,13vw,3.75rem)] tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c]">BLACKJACK</span>
        <span className="mt-2 font-display text-sm tracking-[0.5em] text-white/70">VINTE E UM</span>
      </h1>
      <GameIntro slug="blackjack" />

      <PlayerName value={name} onChange={setNameInput} onBlur={saveName} />

      <div className="flex w-full flex-col gap-3">
        <div className="flex gap-2">
          <button
            disabled={!ready}
            onClick={() => create(true)}
            className="flex-1 rounded-xl bg-gold py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
          >
            🤖 Jogar com IA
          </button>
          <div className="flex rounded-xl bg-white/10 p-1" role="radiogroup" aria-label="IAs na mesa">
            {BOTS.map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={bots === n}
                aria-label={n === 0 ? "Só você contra a banca" : `${n} IA${n > 1 ? "s" : ""} na mesa`}
                title={n === 0 ? "Só você contra a banca" : `${n} IA${n > 1 ? "s" : ""} na mesa`}
                onClick={() => {
                  setBots(n);
                  remember(BOTS_KEY, n);
                }}
                className={`w-7 rounded-lg font-display transition sm:w-8 ${bots === n ? "bg-gold text-stone-900" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-white/5 py-1 pl-4 pr-1">
          <span className="font-display text-xs tracking-widest text-white/50">MÃOS</span>
          <div className="flex" role="radiogroup" aria-label="Mãos na partida">
            {ROUND_OPTIONS.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={rounds === r}
                onClick={() => {
                  setRounds(r);
                  remember(ROUNDS_KEY, r);
                }}
                className={`h-8 w-11 rounded-lg font-display text-sm transition ${rounds === r ? "bg-gold text-stone-900" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <button
          disabled={!ready}
          onClick={() => create(false)}
          className="rounded-xl bg-emerald-600 py-3 font-display text-lg shadow-[0_4px_0_#065f46] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          ➕ Criar sala
        </button>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && ready && join()}
            placeholder="CÓDIGO"
            className="w-0 flex-1 rounded-xl bg-white/10 px-4 py-3 text-center font-display tracking-[0.3em] outline-none ring-gold/60 placeholder:text-white/30 focus:ring-2"
          />
          <button
            disabled={!ready || code.length < 4}
            onClick={join}
            className="rounded-xl bg-white/15 px-5 font-display transition hover:bg-white/25 disabled:opacity-40"
          >
            Entrar
          </button>
        </div>
      </div>
      <Link
        href={`${BLACKJACK_PATH}/como-jogar`}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
        Como jogar
      </Link>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <AdSlot className="mt-6" />
    </main>
  );
}
