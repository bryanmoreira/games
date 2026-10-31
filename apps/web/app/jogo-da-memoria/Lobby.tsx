"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCreated, clearError, connect, getName, send, setName, useRoom } from "@/lib/socket";
import { BackButton } from "@/components/BackButton";
import { PlayerName } from "@/components/ui/PlayerName";
import { GameIntro } from "@/components/seo";
import { MemoryArt } from "@/components/jogo-da-memoria/Fruit";
import { MEMORIA_PATH, SOLO_PATH, roomPath } from "@/lib/jogo-da-memoria/paths";

export default function MemoryHome() {
  const router = useRouter();
  const { created, error } = useRoom();
  const [name, setInput] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setInput(getName()); clearError();
  }, []);
  useEffect(() => { if (created) { clearCreated(); router.push(roomPath(created)); } }, [created, router]);
  useEffect(() => { if (error) setBusy(false); }, [error]);
  const saveName = () => setName(name.trim());
  const create = (solo: boolean) => {
    if (!name.trim() || busy) return;
    saveName(); connect(); setBusy(true);
    send({ t: "create", solo, bots: 1, game: "jogo-da-memoria" });
  };
  const join = () => { if (code.length !== 4 || !name.trim()) return; saveName(); router.push(roomPath(code)); };
  return <main className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-6 px-5 py-10">
    <BackButton href="/" className="fixed left-4 top-4" />
    <MemoryArt className="w-40 -rotate-3" />
    <h1 className="flex flex-col items-center leading-none"><span className="mb-2 font-display text-xs tracking-[.35em] text-white/60">JOGO DA</span><span className="font-display text-4xl text-gold sm:text-5xl">MEMÓRIA</span></h1>
    <GameIntro slug="jogo-da-memoria" />
    <Link href={SOLO_PATH} className="w-full rounded-xl bg-gold py-3 text-center font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] hover:bg-amber-300 active:translate-y-1 active:shadow-none">Jogar solo</Link>
    <div className="flex w-full flex-col items-center gap-4 border-t border-white/10 pt-5">
      <PlayerName value={name} onChange={setInput} onBlur={saveName} />
      <button disabled={!name.trim() || busy} onClick={() => create(true)} className="w-full rounded-xl bg-emerald-600 py-3 font-display shadow-[0_4px_0_#065f46] hover:bg-emerald-500 disabled:opacity-40">Jogar com IA</button>
      <button disabled={!name.trim() || busy} onClick={() => create(false)} className="w-full rounded-xl bg-white/10 py-3 font-display hover:bg-white/20 disabled:opacity-40">Criar sala</button>
      <div className="flex w-full gap-2"><input aria-label="Código da sala" value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0,4))} onKeyDown={e => e.key === "Enter" && join()} placeholder="CÓDIGO" className="w-0 flex-1 rounded-xl bg-white/10 px-3 py-3 text-center font-display tracking-[.3em] outline-none focus:ring-2 focus:ring-gold" /><button disabled={!name.trim() || code.length !== 4 || busy} onClick={join} className="rounded-xl bg-white/15 px-5 font-display hover:bg-white/25 disabled:opacity-40">Entrar</button></div>
    </div>
    {busy && <p role="status" className="text-xs text-white/60">Conectando…</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <Link href={`${MEMORIA_PATH}/como-jogar`} className="rounded-full px-4 py-2 font-display text-sm text-white/60 hover:bg-white/10">Como jogar</Link>
  </main>;
}
