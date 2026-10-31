"use client";

import { track } from "@/lib/analytics";

/** Abre a impressão do navegador (que também salva em PDF) */
export function PrintButton({ what }: { what: string }) {
  return (
    <button
      onClick={() => {
        track("imprimir", { folha: what });
        window.print();
      }}
      className="flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9V3h12v6" />
        <rect x="3" y="9" width="18" height="8" rx="2" />
        <path d="M6 14h12v7H6z" />
      </svg>
      Imprimir ou salvar PDF
    </button>
  );
}
