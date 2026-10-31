import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { GameFaq, GameTerms, JsonLd, QuickAnswer } from "@/components/seo";
import { howToLd, howToMetadata } from "@/lib/seo";
import { HowToPlay } from "@/components/truco/HowToPlay";
import { TRUCO_PATH } from "@/lib/truco/paths";

export const metadata: Metadata = howToMetadata("truco-paulista");

export default function ComoJogar() {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
        <JsonLd data={howToLd("truco-paulista")} />
        <header className="relative flex flex-col items-center gap-1">
          <BackButton href={TRUCO_PATH} className="absolute left-0 top-1/2 -translate-y-1/2" />
          <h1 className="font-display text-3xl text-gold sm:text-4xl">COMO JOGAR</h1>
          <span className="font-display text-xs tracking-[0.4em] text-white/60">TRUCO PAULISTA</span>
        </header>

        <QuickAnswer slug="truco-paulista" />

        <HowToPlay />

        <GameFaq slug="truco-paulista" full />

        <GameTerms slug="truco-paulista" />

        <Link
          href={TRUCO_PATH}
          className="mx-auto rounded-xl bg-gold px-8 py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none"
        >
          Bora jogar
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
