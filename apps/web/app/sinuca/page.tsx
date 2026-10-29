"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEFAULT_SETTINGS, parseSettings, type Settings } from "@mesa/sinuca";
import { clearCreated, clearError, connect, getName, send, setName, useRoom } from "@/lib/socket";
import { BackButton } from "@/components/BackButton";
import { AdSlot } from "@/components/AdSlot";
import { GameIntro } from "@/components/seo";
import { BallArt } from "@/components/sinuca/MiniBall";
import { SinucaOptions } from "@/components/sinuca/Settings";
import { SINUCA_PATH, roomPath } from "@/lib/sinuca/paths";
import { PlayerName } from "@/components/ui/PlayerName";
import { PeopleIcon, PersonIcon } from "@/components/ui/icons";

const SETTINGS_KEY = "sinuca.settings";
const SIZE_KEY = "sinuca.size";

export default function SinucaHome() {
  const router = useRouter();
  const { created, error } = useRoom();
  const [name, setNameInput] = useState("");
  const [code, setCode] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  // contra a IA: 1×1 ou 2×2 (você e uma IA contra duas)
  const [duo, setDuo] = useState(false);

  useEffect(() => {
    setNameInput(getName());
    connect();
    clearError();
    try {
      setSettings(parseSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null")));
      setDuo(localStorage.getItem(SIZE_KEY) === "2x2");
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

  const pickSize = (d: boolean) => {
    setDuo(d);
    try {
      localStorage.setItem(SIZE_KEY, d ? "2x2" : "1x1");
    } catch {}
  };

  // contra a IA sem relógio; na sala o host escolhe
  const create = (solo: boolean) => {
    saveName();
    send({ t: "create", solo, game: "sinuca", settings: { ...settings, clock: !solo }, ...(solo ? { bots: duo ? 3 : 1 } : {}) });
  };

  const join = () => {
    if (code.trim().length < 4) return;
    saveName();
    router.push(roomPath(code.trim().toUpperCase()));
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <div className="relative h-24 w-44 drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]">
        <BallArt n={0} className="absolute left-5 top-3 h-20 w-20" />
        <BallArt n={8} className="absolute right-5 top-1 h-[5.5rem] w-[5.5rem]" />
      </div>
      <h1 className="font-display text-6xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c]">SINUCA</h1>
      <GameIntro slug="sinuca" />

      <PlayerName value={name} onChange={setNameInput} onBlur={saveName} />

      <SinucaOptions value={settings} onChange={pick} clock={false} />

      <div className="flex w-full flex-col gap-3">
        <div className="flex gap-2">
          <button
            disabled={!ready}
            onClick={() => create(true)}
            className="flex-1 rounded-xl bg-gold py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
          >
            🤖 Jogar com IA
          </button>
          <div className="flex rounded-xl bg-white/10 p-1" role="radiogroup" aria-label="Jogadores">
            {[false, true].map((d) => (
              <button
                key={String(d)}
                role="radio"
                aria-checked={duo === d}
                aria-label={d ? "2×2" : "1×1"}
                title={d ? "2×2" : "1×1"}
                onClick={() => pickSize(d)}
                className={`flex w-10 items-center justify-center rounded-lg transition ${duo === d ? "bg-gold text-stone-900" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {d ? <PeopleIcon className="h-5 w-5" /> : <PersonIcon className="h-5 w-5" />}
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
        href={`${SINUCA_PATH}/como-jogar`}
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
