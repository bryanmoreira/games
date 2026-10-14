"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCreated, clearError, connect, getName, send, setName, useRoom } from "@/lib/socket";
import { BackButton } from "@/components/BackButton";
import { GameIntro } from "@/components/seo";
import { DieFace, Pawn } from "@/components/ludo/Board";
import { LUDO_PATH, roomPath } from "@/lib/ludo/paths";
import { PlayerName } from "@/components/ui/PlayerName";

const BOTS_KEY = "ludo.bots";

export default function LudoHome() {
  const router = useRouter();
  const { created, error } = useRoom();
  const [name, setNameInput] = useState("");
  const [code, setCode] = useState("");
  const [bots, setBots] = useState(1);

  useEffect(() => {
    setNameInput(getName());
    connect();
    clearError();
    try {
      const n = Number(localStorage.getItem(BOTS_KEY));
      if (n >= 1 && n <= 3) setBots(n);
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

  const pickBots = (n: number) => {
    setBots(n);
    try {
      localStorage.setItem(BOTS_KEY, String(n));
    } catch {}
  };

  const create = (solo: boolean) => {
    saveName();
    send({ t: "create", solo, game: "ludo", ...(solo ? { bots } : {}) });
  };

  const join = () => {
    if (code.trim().length < 4) return;
    saveName();
    router.push(roomPath(code.trim().toUpperCase()));
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <div className="flex items-end gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((c) => (
          <Pawn key={c} color={c} className={`h-14 w-14 ${c % 2 ? "-translate-y-2" : ""}`} />
        ))}
        <DieFace value={6} className="ml-2 h-12 w-12 rotate-12" />
      </div>
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-6xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c]">LUDO</span>
        <span className="mt-2 font-display text-sm tracking-[0.5em] text-white/70">CORRIDA DE PEÕES</span>
      </h1>
      <GameIntro slug="ludo" />

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
          <div className="flex rounded-xl bg-white/10 p-1" role="radiogroup" aria-label="Quantas IAs">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={bots === n}
                aria-label={`${n} IA${n > 1 ? "s" : ""}`}
                title={`${n} IA${n > 1 ? "s" : ""}`}
                onClick={() => pickBots(n)}
                className={`w-9 rounded-lg font-display transition ${bots === n ? "bg-gold text-stone-900" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {n}
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
        href={`${LUDO_PATH}/como-jogar`}
        className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-current text-xs">?</span>
        Como jogar
      </Link>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </main>
  );
}
