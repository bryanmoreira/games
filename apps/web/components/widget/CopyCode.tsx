"use client";

import { useState } from "react";

/** Código do widget com botão de copiar */
export function CopyCode({ code, game }: { code: string; game: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <pre className="max-h-40 w-full overflow-auto whitespace-pre-wrap break-all rounded-xl bg-black/40 p-3 text-left text-[11px] leading-relaxed text-white/70 ring-1 ring-white/10">{code}</pre>
      <button
        onClick={copy}
        data-umami-event="widget-copiar"
        data-umami-event-jogo={game}
        className="self-center rounded-xl bg-gold px-5 py-2 font-display text-sm text-stone-900 shadow-[0_3px_0_#9a6b12] active:translate-y-0.5 active:shadow-none"
      >
        {copied ? "Copiado" : "Copiar código"}
      </button>
    </div>
  );
}
