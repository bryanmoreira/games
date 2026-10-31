"use client";

import { useState } from "react";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";

/**
 * Compartilhar o resultado do desafio do dia: menu nativo no celular, copia no computador.
 * O link leva ao calendário do jogo com UTM, para o Umami saber que veio de um resultado compartilhado.
 */
export function ShareResult({ game, text, path }: { game: string; text: string; path: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${location.origin}${path}?utm_source=compartilhar&utm_medium=resultado&utm_campaign=${game}`;
    const full = `${text}\n\n${url}`;
    try {
      if (navigator.share && matchMedia("(hover: none)").matches) await navigator.share({ text: full });
      else {
        await navigator.clipboard.writeText(full);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  return (
    <button
      onClick={share}
      data-umami-event="compartilhar"
      data-umami-event-jogo={game}
      aria-label="Compartilhar"
      title={copied ? "Copiado" : "Compartilhar"}
      className="flex items-center rounded-xl bg-emerald-600 px-4 py-3 shadow-[0_4px_0_#065f46] transition hover:brightness-110 active:translate-y-1 active:shadow-none sm:px-5"
    >
      {copied ? <CheckIcon className="h-5 w-5" /> : <ShareIcon />}
    </button>
  );
}
