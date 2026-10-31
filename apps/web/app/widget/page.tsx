import type { Metadata } from "next";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { CopyCode } from "@/components/widget/CopyCode";
import { getGame, SITE_NAME } from "@/lib/seo";
import { embedPath, WIDGET_GAMES, WIDGET_PATH, WIDGET_SIZE, widgetCode } from "@/lib/widget";

export const metadata: Metadata = {
  title: "Widget grátis de jogos diários para o seu site",
  description: `Coloque o Sudoku, o Verbete, o Caça-Palavras e outros desafios do dia no seu site ou blog, de graça: copie o código do widget do ${SITE_NAME} e cole no HTML.`,
  alternates: { canonical: WIDGET_PATH },
};

export default function Widget() {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
        <header className="relative flex flex-col items-center gap-1 px-12">
          <BackButton href="/" className="absolute left-0 top-1/2 -translate-y-1/2" />
          <h1 className="font-display text-3xl text-gold sm:text-4xl">WIDGET</h1>
          <span className="font-display text-xs tracking-[0.4em] text-white/60">DESAFIO DO DIA</span>
        </header>
        <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">
          Tem um site, blog ou página de escola? Coloque o desafio do dia de um dos jogos do {SITE_NAME}: o cartão mostra o número do dia e leva
          para jogar de graça. Copie o código e cole no HTML da página, onde quiser que ele apareça.
        </p>
        <ul className="grid gap-6 sm:grid-cols-2">
          {WIDGET_GAMES.map((game) => (
            <li key={game} className="flex flex-col items-center gap-3 rounded-2xl bg-black/20 p-4 ring-1 ring-white/10">
              <h2 className="font-display text-lg text-gold">{getGame(game).name}</h2>
              <iframe src={embedPath(game)} width={WIDGET_SIZE.width} height={WIDGET_SIZE.height} className="max-w-full rounded-2xl" loading="lazy" title={`${getGame(game).name} do dia`} />
              <CopyCode code={widgetCode(game)} game={game} />
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
