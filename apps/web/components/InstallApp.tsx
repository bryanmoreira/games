"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Registra o service worker e, quando o navegador deixa, mostra o botão de instalar o app. */
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [ios, setIos] = useState(false);
  const [dica, setDica] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => {});
    const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (instalado) return;
    try {
      if (localStorage.getItem("mesa-install-off")) return;
    } catch {}
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent));
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // só na home e só quando dá para instalar (Android/desktop: prompt do navegador; iPhone: dica do Safari)
  if (!prompt && !ios) return null;
  if (typeof location !== "undefined" && location.pathname !== "/") return null;

  const fechar = () => {
    setPrompt(null);
    setIos(false);
    try {
      localStorage.setItem("mesa-install-off", "1");
    } catch {}
  };
  const instalar = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else setDica((d) => !d);
  };

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-3 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-2 rounded-full border border-amber-300/40 bg-[#0b120e]/95 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-lg backdrop-blur">
        {dica ? (
          <span className="flex items-center gap-1.5">
            Toque em
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Compartilhar">
              <path d="M12 3v12M8 7l4-4 4 4M5 12v8h14v-8" />
            </svg>
            e “Adicionar à Tela de Início”
            <a href="/instalar" className="ml-1 font-semibold text-amber-300 underline underline-offset-2">
              Ver passos
            </a>
          </span>
        ) : (
          <span>Instale o Mesa no celular</span>
        )}
        {!dica && (
          <button onClick={instalar} className="rounded-full bg-amber-400 px-3 py-1.5 font-semibold text-black">
            Instalar
          </button>
        )}
        <button onClick={fechar} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-full text-white/60 hover:text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
