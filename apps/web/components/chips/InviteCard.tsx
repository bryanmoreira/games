"use client";

import { useState } from "react";
import { ChipIcon } from "@/components/chips/ChipIcon";
import { CheckIcon, ShareIcon } from "@/components/ui/icons";
import { REFERRAL_CHIPS, REFERRED_CHIPS } from "@/lib/chips-rules";

/** Convite com o link de indicação do jogador: menu nativo no celular, copia no computador. */
export function InviteCard({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://mesadejogos.com/?ref=${username}&utm_source=indicacao&utm_medium=link`;

  const share = async () => {
    const text = `Bora jogar no Mesa de Jogos? Truco, buraco, xadrez e mais, grátis e sem baixar nada. Entrando por este link você ganha ${REFERRED_CHIPS} fichas:`;
    try {
      if (navigator.share && matchMedia("(hover: none)").matches) await navigator.share({ text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gold/10 p-4 ring-1 ring-gold/40 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <div className="flex items-center gap-3">
        <ChipIcon className="h-10 w-10 shrink-0" />
        <div className="flex flex-col">
          <span className="font-display text-gold">+{REFERRAL_CHIPS} POR AMIGO</span>
          <span className="text-sm text-white/70">Quem criar conta pelo seu link ganha {REFERRED_CHIPS}, e você {REFERRAL_CHIPS}.</span>
        </div>
      </div>
      <button
        onClick={share}
        data-umami-event="convite-indicacao"
        className="flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2.5 font-display text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none sm:ml-auto"
      >
        {copied ? <CheckIcon className="h-5 w-5" /> : <ShareIcon />}
        {copied ? "Link copiado" : "Convidar"}
      </button>
    </div>
  );
}
