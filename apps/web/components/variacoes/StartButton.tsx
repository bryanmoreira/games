"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { newGame as newSudoku } from "@mesa/sudoku";
import { newGame as newSpider } from "@mesa/spider";
import { PlayerName } from "@/components/ui/PlayerName";
import { clearCreated, clearError, connect, getName, send, setName, useRoom } from "@/lib/socket";
import { saveGame as saveSudoku } from "@/lib/sudoku/storage";
import { saveGame as saveSpider } from "@/lib/spider/storage";
import { SUDOKU_PLAY_PATH } from "@/lib/sudoku/paths";
import { SPIDER_PLAY_PATH } from "@/lib/spider/paths";
import type { Start } from "@/lib/variacoes";

const btn =
  "rounded-xl bg-gold px-8 py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] transition active:translate-y-1 active:shadow-none disabled:opacity-40 disabled:active:translate-y-0";

/** Começa a partida da página de variação: jogo solo salvo no aparelho ou sala solo contra o computador. */
export function StartButton({ start, cta, gamePath }: { start: Start; cta: string; gamePath: string }) {
  const router = useRouter();
  if (start.kind === "solo") return <SoloStart start={start} cta={cta} gamePath={gamePath} />;
  const go = () => {
    if (start.kind === "sudoku") {
      saveSudoku(newSudoku(start.difficulty));
      router.push(SUDOKU_PLAY_PATH);
    } else {
      saveSpider(newSpider(start.suits));
      router.push(SPIDER_PLAY_PATH);
    }
  };
  return (
    <button onClick={go} className={btn}>
      {cta}
    </button>
  );
}

/** Opções salvas pelo lobby do jogo (o nível escolhido aqui vale lá também) */
function loadSettings(key?: string): Record<string, unknown> {
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

function SoloStart({ start, cta, gamePath }: { start: Extract<Start, { kind: "solo" }>; cta: string; gamePath: string }) {
  const router = useRouter();
  const { created, error } = useRoom();
  const [name, setNameInput] = useState("");
  const [level, setLevel] = useState("medium");

  useEffect(() => {
    setNameInput(getName());
    const saved = loadSettings(start.settingsKey).level;
    if (typeof saved === "string" && start.levels?.some((l) => l.id === saved)) setLevel(saved);
    connect();
    clearError();
  }, [start]);

  useEffect(() => {
    if (created) {
      clearCreated();
      router.push(`${gamePath}/sala/${created}`);
    }
  }, [created, gamePath, router]);

  const ready = name.trim().length > 0;
  const go = () => {
    setName(name.trim());
    if (!start.levels) return send({ t: "create", solo: true, game: start.game as never });
    const settings = { ...loadSettings(start.settingsKey), level };
    try {
      localStorage.setItem(start.settingsKey!, JSON.stringify(settings));
    } catch {}
    send({ t: "create", solo: true, game: start.game as never, settings });
  };

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3">
      <PlayerName value={name} onChange={setNameInput} onEnter={() => ready && go()} />
      {start.levels && (
        <div role="radiogroup" aria-label="Nível" className="grid w-full grid-cols-3 gap-2">
          {start.levels.map((l) => (
            <button
              key={l.id}
              role="radio"
              aria-checked={level === l.id}
              onClick={() => setLevel(l.id)}
              className={`rounded-xl px-2 py-2.5 font-display text-xs transition ${
                level === l.id ? "bg-gold/15 text-white ring-2 ring-gold" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={go} disabled={!ready} className={`${btn} w-full`}>
        {cta}
      </button>
      {error && <p className="text-center text-sm text-red-300">{error}</p>}
    </div>
  );
}
