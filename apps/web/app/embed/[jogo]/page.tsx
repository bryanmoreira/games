import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dayNumber } from "@/lib/daily/challenge";
import { DAILY_SEO, getGame, noindex } from "@/lib/seo";
import { dayKey } from "@/lib/stats/achievements";

export const metadata: Metadata = noindex;

type Props = { params: Promise<{ jogo: string }> };

/** Cartão do widget (dentro do iframe em outro site): o desafio de hoje e o botão para jogar no Mesa. */
export default async function Embed({ params }: Props) {
  const { jogo } = await params;
  if (!(jogo in DAILY_SEO)) notFound();
  const g = getGame(jogo);
  const n = dayNumber(dayKey(new Date()));
  const href = `${g.path}/diario?utm_source=widget&utm_medium=embed&utm_campaign=${jogo}`;
  return (
    <div className="embed-root flex h-dvh items-center justify-center bg-transparent p-1">
      <a
        href={href}
        target="_blank"
        rel="noopener"
        data-umami-event="widget-clique"
        data-umami-event-jogo={jogo}
        className="felt flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center ring-2 ring-gold/50 transition hover:ring-gold"
      >
        <span className="font-display text-[11px] tracking-[0.3em] text-white/70">DESAFIO DO DIA #{n}</span>
        <span className="font-display text-2xl leading-none text-gold drop-shadow-[0_3px_0_#7a4e0c]">{g.name.toUpperCase()}</span>
        <span className="rounded-xl bg-gold px-5 py-2 font-display text-sm text-stone-900 shadow-[0_3px_0_#9a6b12]">JOGAR AGORA</span>
        <span className="text-[10px] text-white/60">mesadejogos.com · grátis</span>
      </a>
    </div>
  );
}
