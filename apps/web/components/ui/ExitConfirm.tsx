"use client";

import { useState } from "react";
import { ExitButton, XIcon } from "./buttons";

/**
 * Botão de sair com confirmação na própria página (confirm() nativo pode ser bloqueado no navegador embutido).
 * Fica dentro do `header` (relative): o balão abre logo abaixo, à direita. Sem `ask`, sai direto.
 */
export function ExitConfirm({ onExit, ask = true, onOpenChange }: { onExit: () => void; ask?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpenState] = useState(false);
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(open) : v;
    setOpenState(next);
    onOpenChange?.(next);
  };
  return (
    <>
      <ExitButton onClick={() => (ask ? setOpen((v) => !v) : onExit())} />
      {open && (
        <div className="banner absolute right-2 top-full z-50 mt-1 flex items-center gap-2 rounded-2xl bg-stone-950/90 py-2 pl-4 pr-2 font-display shadow-2xl ring-1 ring-white/10 sm:right-6">
          <span className="text-sm text-white/70">SAIR?</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Cancelar"
            title="Cancelar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <XIcon />
          </button>
          <button
            onClick={onExit}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm text-white shadow-[0_3px_0_#991b1b] active:translate-y-0.5 active:shadow-none"
          >
            SAIR
          </button>
        </div>
      )}
    </>
  );
}
