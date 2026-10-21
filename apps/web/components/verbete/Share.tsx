"use client";

import { useEffect, useState } from "react";
import { shareText, type GameState } from "@mesa/verbete";
import { Icon, XIcon } from "@/components/ui/buttons";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";
import { shareImage } from "@/lib/verbete/shareImage";

const SITE = "mesadejogos.com/verbete";

function ImageIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m20.5 16-4.5-4.5L6 19.5" />
    </Icon>
  );
}

function TextIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M5 6h14M5 12h14M5 18h9" />
    </Icon>
  );
}

/**
 * Compartilhar o resultado: o texto com emojis e a imagem das grades.
 * No celular, um botão manda os dois juntos (WhatsApp, X, Instagram…); no computador, copia o texto e copia (ou baixa) a imagem.
 */
export function Share({ game, title, streak, onClose }: { game: GameState; title: string; streak: number; onClose: () => void }) {
  const text = `${shareText(game, title, streak)}\n\n${SITE}`;
  const [img, setImg] = useState<{ blob: Blob; url: string } | null>(null);
  const [touch, setTouch] = useState(false);
  const [done, setDone] = useState<"text" | "image" | null>(null);

  useEffect(() => {
    setTouch(matchMedia("(hover: none)").matches);
    let url = "";
    let alive = true;
    shareImage(game, title, streak).then((blob) => {
      if (!blob || !alive) return;
      url = URL.createObjectURL(blob);
      setImg({ blob, url });
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [game, title, streak]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const flash = (what: "text" | "image") => {
    setDone(what);
    setTimeout(() => setDone((d) => (d === what ? null : d)), 2000);
  };

  const file = img && new File([img.blob], "verbete.png", { type: "image/png" });
  const canSend = touch && !!file && !!navigator.canShare?.({ files: [file], text });

  const send = async () => {
    try {
      await navigator.share({ text, files: [file!] });
    } catch {}
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      flash("text");
    } catch {}
  };

  // copia a imagem; sem suporte (ou bloqueado), baixa o arquivo
  const copyImage = async () => {
    if (!img) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": img.blob })]);
      flash("image");
    } catch {
      const a = document.createElement("a");
      a.href = img.url;
      a.download = "verbete.png";
      a.click();
      flash("image");
    }
  };

  const btn = "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 font-display text-sm transition active:translate-y-0.5";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onClick={onClose}>
      <div className="banner relative flex w-full max-w-md flex-col gap-4 rounded-3xl bg-stone-900 p-4 ring-2 ring-gold/50 sm:p-5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Fechar"
          title="Fechar"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
        >
          <XIcon />
        </button>
        <h2 className="flex items-center gap-2 font-display text-lg text-gold">
          <ShareIcon className="h-5 w-5" />
          COMPARTILHAR
        </h2>

        <div className="flex min-h-24 items-center justify-center overflow-hidden rounded-2xl bg-black/30">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.url} alt="Resultado em cores, sem as letras" className="max-h-[42vh] w-full object-contain" />
          ) : (
            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-white/40 border-r-transparent" aria-label="Gerando" />
          )}
        </div>

        <pre className="max-h-40 overflow-auto whitespace-pre rounded-2xl bg-black/30 p-3 text-center font-sans text-sm leading-snug text-white/90">{text}</pre>

        <div className="flex gap-2">
          {canSend && (
            <button onClick={send} className={`${btn} bg-gold text-stone-900 shadow-[0_4px_0_#9a6b12] active:shadow-none`}>
              <ShareIcon className="h-5 w-5" />
              ENVIAR
            </button>
          )}
          <button onClick={copyText} className={`${btn} ${done === "text" ? "bg-emerald-600" : "bg-white/10 hover:bg-white/20"}`}>
            {done === "text" ? <CheckIcon className="h-5 w-5" /> : <TextIcon className="h-5 w-5" />}
            {done === "text" ? "COPIADO" : "TEXTO"}
          </button>
          <button onClick={copyImage} disabled={!img} className={`${btn} disabled:opacity-40 ${done === "image" ? "bg-emerald-600" : "bg-white/10 hover:bg-white/20"}`}>
            {done === "image" ? <CheckIcon className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
            {done === "image" ? "PRONTO" : "IMAGEM"}
          </button>
        </div>
      </div>
    </div>
  );
}
