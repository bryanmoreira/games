"use client";

import { useEffect, useState } from "react";
import { pushSupported, reminderOn, setReminder } from "@/lib/push-client";

function BellIcon({ on, className = "" }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/**
 * Sino do lembrete dos desafios do dia (notificação de manhã, todos os jogos diários) neste aparelho.
 * `from`: onde ele está (home ou o jogo), só para as métricas. `round`: botão redondo do trilho da home.
 */
export function ReminderButton({ from, round = false }: { from: string; round?: boolean }) {
  const [ready, setReady] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!pushSupported()) return;
    setReady(true);
    setOn(reminderOn());
    setDenied(Notification.permission === "denied");
  }, []);

  if (!ready) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      const now = await setReminder(!on, from);
      setOn(now);
      setDenied(Notification.permission === "denied");
    } catch {}
    setBusy(false);
  };

  const label = denied ? "Notificações bloqueadas no navegador" : on ? "Lembrete dos desafios ligado: toque para desligar" : "Me lembrar dos desafios todo dia";
  if (round)
    return (
      <button
        onClick={toggle}
        disabled={busy || denied}
        aria-pressed={on}
        aria-label={label}
        title={label}
        className={`flex h-10 w-10 items-center justify-center rounded-full ring-1 transition disabled:opacity-50 ${
          on ? "text-gold ring-gold/60" : "text-gold ring-gold/30 hover:ring-gold/60"
        }`}
      >
        <BellIcon on={on} className="h-5 w-5" />
      </button>
    );
  return (
    <button
      onClick={toggle}
      disabled={busy || denied}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`flex h-8 items-center gap-1.5 rounded-full px-3 font-display text-xs ring-1 transition disabled:opacity-50 ${
        on ? "bg-gold/15 text-gold ring-gold/50" : "bg-white/5 text-white/70 ring-white/10 hover:text-white"
      }`}
    >
      <BellIcon on={on} className="h-4 w-4" />
      {on ? "Lembrete" : "Lembrar"}
    </button>
  );
}
