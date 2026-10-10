"use client";

import { useEffect } from "react";
import { HowToPlay } from "./HowToPlay";

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Como jogar"
    >
      <div
        className="banner relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-[#0f1813] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex flex-col leading-none">
            <span className="font-display text-xl text-gold sm:text-2xl">COMO JOGAR</span>
            <span className="mt-1 font-display text-[10px] tracking-[0.4em] text-white/50">TRUCO PAULISTA</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>
        <div className="flex flex-col gap-5 overflow-y-auto p-3 sm:p-6">
          <HowToPlay />
        </div>
      </div>
    </div>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Como jogar"
      title="Como jogar"
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white sm:h-10 sm:w-10"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    </button>
  );
}
