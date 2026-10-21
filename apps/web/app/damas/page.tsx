"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEFAULT_SETTINGS, parseSettings, type Settings } from "@mesa/damas";
import { clearCreated, clearError, connect, getName, send, setName, useRoom } from "@/lib/socket";
import { BackButton } from "@/components/BackButton";
import { AdSlot } from "@/components/AdSlot";
import { GameIntro } from "@/components/seo";
import { PieceShape } from "@/components/damas/Board";
import { DamasOptions } from "@/components/damas/Settings";
import { DAMAS_PATH, roomPath } from "@/lib/damas/paths";
import { PlayerName } from "@/components/ui/PlayerName";

const SETTINGS_KEY = "damas.settings";

export default function DamasHome() {
  const router = useRouter();
  const { created, error } = useRoom();
  const [name, setNameInput] = useState("");
  const [code, setCode] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setNameInput(getName());
    connect();
    clearError();
    try {
      setSettings(parseSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null")));
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

  const pick = (s: Settings) => {
    setSettings(s);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    } catch {}
  };

  const create = (solo: boolean) => {
    saveName();
    send({ t: "create", solo, game: "damas", settings });
  };

  const join = () => {
    if (code.trim().length < 4) return;
    saveName();
    router.push(roomPath(code.trim().toUpperCase()));
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <Stack />
      <h1 className="font-display text-6xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c]">DAMAS</h1>
      <GameIntro slug="damas" />

      <PlayerName value={name} onChange={setNameInput} onBlur={saveName} />

      <DamasOptions value={settings} onChange={pick} />

      <div className="flex w-full flex-col gap-3">
        <button
          disabled={!ready}
          onClick={() => create(true)}
          className="rounded-xl bg-gold py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          🤖 Jogar com IA
        </button>
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
        href={`${DAMAS_PATH}/como-jogar`}
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

/** Uma dama de cada cor, levemente sobrepostas. */
function Stack() {
  return (
    <div className="relative flex h-24 w-36 items-center justify-center">
      <PieceShape p={-2} className="absolute left-2 top-1 h-20 w-20 -rotate-6" />
      <PieceShape p={2} className="absolute right-2 top-3 h-20 w-20 rotate-6" />
    </div>
  );
}
