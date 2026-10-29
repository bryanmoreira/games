"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCreated, clearError, connect, getName, send, setName, useRoom } from "@/lib/socket";
import { BackButton } from "@/components/BackButton";
import { AdSlot } from "@/components/AdSlot";
import { GameIntro } from "@/components/seo";
import { TijoladaArt } from "@/components/tijolada/Art";
import { roomPath, SOLO_PATH, TIJOLADA_PATH } from "@/lib/tijolada/paths";
import { PlayerName } from "@/components/ui/PlayerName";

export default function TijoladaHome() {
  const router = useRouter();
  const { created, error } = useRoom();
  const [name, setNameInput] = useState("");
  const [code, setCode] = useState("");
  const [best, setBest] = useState(0);

  useEffect(() => {
    setNameInput(getName());
    connect();
    clearError();
    try {
      setBest(Number(localStorage.getItem("tijolada.best")) || 0);
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

  const create = () => {
    saveName();
    send({ t: "create", game: "tijolada" });
  };

  const join = () => {
    if (code.trim().length < 4) return;
    saveName();
    router.push(roomPath(code.trim().toUpperCase()));
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-8 px-4 py-10">
      <BackButton href="/" className="fixed left-4 top-4" />
      <TijoladaArt className="w-32 drop-shadow-[0_6px_0_rgba(0,0,0,0.35)]" />
      <h1 className="flex flex-col items-center leading-none">
        <span className="font-display text-6xl tracking-wide text-gold drop-shadow-[0_3px_0_#7a4e0c]">TIJOLADA</span>
      </h1>
      <GameIntro slug="tijolada" />

      <PlayerName value={name} onChange={setNameInput} onBlur={saveName} />

      <div className="flex w-full flex-col gap-3">
        <Link
          href={SOLO_PATH}
          onClick={saveName}
          className="flex items-center justify-center gap-3 rounded-xl bg-gold py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none"
        >
          Jogar solo
          {best > 0 && <span className="rounded-full bg-stone-900/15 px-2 py-0.5 text-xs">🏆 {best.toLocaleString("pt-BR")}</span>}
        </Link>
        <button
          disabled={!ready}
          onClick={create}
          className="rounded-xl bg-emerald-600 py-3 font-display text-lg shadow-[0_4px_0_#065f46] transition active:translate-y-1 active:shadow-none disabled:opacity-40"
        >
          ➕ Criar sala 1×1
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
        href={`${TIJOLADA_PATH}/como-jogar`}
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
