import type { Metadata } from "next";
import { CategoryLinks, LetterStrip, RespostasShell, Section } from "@/components/stop/Respostas";
import { hubLd, hubMetadata } from "@/lib/stop/respostas-seo";
import { STOP_PATH } from "@/lib/stop/paths";

export const metadata: Metadata = hubMetadata();

export default function Respostas() {
  return (
    <RespostasShell back={STOP_PATH} kicker="STOP · ADEDONHA" title="Respostas de A a Z" ld={hubLd()}>
      <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">
        Travou na letra? Escolha a letra para ver uma resposta de cada categoria, ou a categoria para ver todas as letras.
      </p>
      <Section title="Por letra">
        <LetterStrip />
      </Section>
      <Section title="Por categoria">
        <CategoryLinks />
      </Section>
    </RespostasShell>
  );
}
