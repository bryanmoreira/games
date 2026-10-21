"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Rotas de partida: nunca mostram anúncio, nem carregam o script do AdSense (assim os anúncios automáticos também não entram nelas). */
const NO_ADS = [/\/sala(\/|$)/, /\/jogo(\/|$)/, /\/diario\/./, /^\/admin/, /^\/login/];

let loading: Promise<void> | undefined;

/** Carrega o adsbygoogle.js só quando a primeira página com anúncio abre. */
function loadScript(client: string) {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = undefined;
      reject();
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Bloco de anúncio responsivo do AdSense, fora das partidas. Sem ADSENSE_CLIENT/ADSENSE_SLOT configurados, não renderiza nada. */
export function AdSlot({ className = "" }: { className?: string }) {
  const path = usePathname();
  const ref = useRef<HTMLModElement>(null);
  // lido depois de montar, para o HTML do servidor e o primeiro render no navegador serem iguais
  const [env, setEnv] = useState<Window["__ENV__"]>();
  useEffect(() => setEnv(window.__ENV__), []);
  const client = env?.ADSENSE_CLIENT;
  const slot = env?.ADSENSE_SLOT;
  const blocked = NO_ADS.some((r) => r.test(path));

  useEffect(() => {
    if (!client || !slot || blocked) return;
    const el = ref.current;
    loadScript(client)
      .then(() => {
        if (el && !el.dataset.adsbygoogleStatus) (window.adsbygoogle ??= []).push({});
      })
      .catch(() => {});
  }, [client, slot, blocked, path]);

  if (!client || !slot || blocked) return null;

  return (
    <aside aria-label="Publicidade" className={`mx-auto w-full max-w-3xl ${className}`}>
      <span className="mb-1 block text-center text-[10px] tracking-[0.2em] text-white/30">PUBLICIDADE</span>
      <ins
        key={path}
        ref={ref}
        className="adsbygoogle block min-h-[100px]"
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
        {...(process.env.NODE_ENV !== "production" && { "data-adtest": "on" })}
      />
    </aside>
  );
}
