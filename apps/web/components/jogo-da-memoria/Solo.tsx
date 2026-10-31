"use client";

import { useEffect, useRef, useState } from "react";
import { applyAction, newGame, replay, REVEAL_MS, viewFor, type GameState } from "@mesa/jogo-da-memoria";
import { useClock } from "@/lib/useClock";
import { reportSoloWin } from "@/lib/stats/report";
import { trackStart } from "@/lib/analytics";
import { Table } from "./Table";

const KEY = "jogo-da-memoria.solo.v1";
interface Saved { deck: number[]; history: number[]; timeMs: number; reported: boolean; gameNo: number; id: string }

export function Solo() {
  const [state, setState] = useState<GameState | null>(null);
  const [help, setHelp] = useState(false);
  const [visible, setVisible] = useState(true);
  const reported = useRef(false);
  const id = useRef("");
  const clock = useClock(!!state && state.history.length > 0 && state.phase !== "gameOver" && visible && !help);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let s: GameState | null = null;
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
      if (saved) {
        s = replay(saved.deck, saved.history);
        if (s && Number.isInteger(saved.gameNo) && saved.gameNo > 0 && typeof saved.id === "string" && Number.isFinite(saved.timeMs) && saved.timeMs >= 0) {
          s.gameNo = saved.gameNo;
          clock.reset(saved.timeMs);
          reported.current = saved.reported === true;
          id.current = saved.id;
        } else s = null;
      }
    } catch {}
    if (!s) { s = newGame(); id.current = crypto.randomUUID(); }
    setState(s);
    const visibility = () => setVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => document.removeEventListener("visibilitychange", visibility);
  }, [clock]);

  useEffect(() => {
    const save = () => {
      const s = stateRef.current;
      if (!s) return;
      try { localStorage.setItem(KEY, JSON.stringify({ deck: s.deck, history: s.history, timeMs: Math.round(clock.now()), reported: reported.current, gameNo: s.gameNo, id: id.current } satisfies Saved)); } catch {}
    };
    save();
    const t = setInterval(save, 1000);
    window.addEventListener("pagehide", save);
    return () => { clearInterval(t); window.removeEventListener("pagehide", save); save(); };
  }, [state, clock]);

  useEffect(() => {
    if (state?.phase !== "reveal" || !visible || help) return;
    const t = setTimeout(() => setState(s => {
      if (!s) return s;
      const r = applyAction(s, { type: "advance" });
      return r.ok ? r.state : s;
    }), REVEAL_MS);
    return () => clearTimeout(t);
  }, [state, visible, help]);

  useEffect(() => {
    if (state?.phase !== "gameOver" || reported.current) return;
    reported.current = true;
    try { localStorage.setItem(KEY, JSON.stringify({ deck: state.deck, history: state.history, timeMs: Math.round(clock.now()), reported: true, gameNo: state.gameNo, id: id.current } satisfies Saved)); } catch {}
    reportSoloWin("jogo-da-memoria", { deck: state.deck, history: state.history, timeMs: Math.max(1000, Math.round(clock.now())) });
  }, [state, clock]);

  const flip = (index: number) => setState(s => {
    if (!s || help || !visible) return s;
    const r = applyAction(s, { type: "flip", seat: 0, index });
    return r.ok ? r.state : s;
  });

  useEffect(() => {
    if (state?.history.length === 1) trackStart("jogo-da-memoria", { modo: "solo" });
  }, [state?.history.length]);

  const again = () => {
    reported.current = false;
    id.current = crypto.randomUUID();
    clock.reset(0);
    setState(s => newGame(Math.random, [0], undefined, s));
  };
  if (!state) return <main className="flex h-dvh items-center justify-center"><span role="status" className="h-10 w-10 animate-spin rounded-full border-4 border-gold border-t-transparent" aria-label="Carregando" /></main>;
  return <Table view={viewFor(state, 0)} timeMs={clock.now()} onFlip={flip} onAgain={again} onHelpChange={setHelp} />;
}
