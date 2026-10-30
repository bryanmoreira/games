"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/ui/icons";

/** Compartilha o link do perfil (menu nativo no celular, copia no computador). */
export function ShareProfileButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: `${name} · Mesa de Jogos`, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <button
      onClick={share}
      data-umami-event="compartilhar-perfil"
      className="flex h-9 items-center gap-2 rounded-full bg-gold/15 px-4 text-xs text-gold ring-1 ring-gold/40 transition hover:bg-gold/25"
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        </svg>
      )}
      {copied ? "Copiado" : "Link"}
    </button>
  );
}
