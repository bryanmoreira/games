"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCreated, clearError, connect, getName, send, setName, useRoom } from "@/lib/socket";
import { BackButton } from "@/components/BackButton";
import { AdSlot } from "@/components/AdSlot";
import { GameIntro } from "@/components/seo";
import { BCard } from "@/components/buraco/Cards";
import { BURACO_PATH, roomPath } from "@/lib/buraco/paths";
import { PlayerName } from "@/components/ui/PlayerName";

const MODE_KEY = "buraco.mode";
/** IAs na mesa do solo: duplas = parceiro + 2 adversários; 1×1 = um adversário. */
const MODES = [
  { id: "duplas", label: "2×2", bots: 3 },
  { id: "1x1", label: "1×1", bots: 1 },
] as const;
type Mode = (typeof MODES)[number]["id"];

export default function BuracoHome() {
  const router = useRouter();
  const { created, error } = useRoom();
  const [name, setNameInput] = useState("");
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<Mode>("duplas");

  useEffect(() => {
    setNameInput(getName());
    connect();
    clearError();
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === "duplas" || m === "1x1") setMode(m);
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

  const pickMode = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  };

  const create = (solo: boolean) => {
    saveName();
    const bots = MODES.find((m) => m.id === mode)!.bots;
    send({ t: "create", solo, game: "buraco", ...(solo ? { bots } : {}) });
  };

  const join = () => {
    if (code.trim().length < 4) return;
    saveName();
    router.push(roomPath(code.trim().toUpperCase()));
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <div className="flex items-end" aria-hidden="true">
        {([["6", "hearts", "-rotate-[14deg]"], ["7", "hearts", "-rotate-[5deg] -translate-y-1.5"], ["JK", null, "rotate-[5deg] -translate-y-1.5"], ["9", "hearts", "rotate-[14deg]"]] as const).map(([rank, suit, cls], i) => (
          <div key={i} className={`w-14 shrink-0 ${i ? "-ml-6" : ""} ${cls}`}>
            <BCard card={{ id: `${rank}${i}`, rank, suit }} />
          </div>
        ))}
      </div>
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-6xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c]">BURACO</span>
        <span className="mt-2 font-display text-sm tracking-[0.5em] text-white/70">CANASTRAS</span>
      </h1>
      <GameIntro slug="buraco" />

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
          <div className="flex rounded-xl bg-white/10 p-1" role="radiogroup" aria-label="Modo">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="radio"
                aria-checked={mode === m.id}
                aria-label={m.id === "duplas" ? "Duplas" : "Mano a mano"}
                title={m.id === "duplas" ? "Duplas" : "Mano a mano"}
                onClick={() => pickMode(m.id)}
                className={`w-11 rounded-lg font-display text-sm transition ${mode === m.id ? "bg-gold text-stone-900" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {m.label}
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
        href={`${BURACO_PATH}/como-jogar`}
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
