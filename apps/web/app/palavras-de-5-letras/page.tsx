import type { Metadata } from "next";
import { GameFaq } from "@/components/seo";
import { Finder } from "@/components/palavras/Finder";
import { LetterGrid, PalavrasShell, Section } from "@/components/palavras/Parts";
import { HUB_FAQ, hubLd, hubMetadata } from "@/lib/palavras-seo";

export const metadata: Metadata = hubMetadata();

export default function Palavras() {
  return (
    <PalavrasShell back="/" title="Palavras de 5 letras" ld={hubLd()}>
      <p className="-mt-4 text-center text-sm leading-relaxed text-white/70 sm:text-base">
        Escreva o que você já sabe e veja as palavras que encaixam, das mais comuns às mais raras.
      </p>
      <Finder />
      <Section title="Começam com">
        <LetterGrid kind="start" />
      </Section>
      <Section title="Terminam com">
        <LetterGrid kind="end" />
      </Section>
      <GameFaq items={HUB_FAQ} />
    </PalavrasShell>
  );
}
