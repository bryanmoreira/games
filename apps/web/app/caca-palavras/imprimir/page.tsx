import type { Metadata } from "next";
import Link from "next/link";
import { THEMES } from "@mesa/caca-palavras";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo";
import { CACA_PRINT_PATH, cacaPrintPath } from "@/lib/imprimir";
import { printLd, printMetadata } from "@/lib/imprimir-seo";
import { CACA_PATH } from "@/lib/caca-palavras/paths";

export const metadata: Metadata = printMetadata(
  CACA_PRINT_PATH,
  "Caça-palavras para imprimir: 17 temas com gabarito",
  "Caça-palavras para imprimir grátis em A4 ou PDF, com gabarito: animais, frutas, países, profissões, corpo humano, escola e mais 11 temas, nos níveis fácil, médio e difícil.",
  ["caça-palavras para imprimir", "caça-palavras pdf", "caça-palavras com gabarito", "caça-palavras infantil para imprimir", "caça-palavras escolar"],
  CACA_PATH,
);

export default function CacaPrintHub() {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
        <JsonLd data={printLd("caca")} />
        <header className="relative flex flex-col items-center gap-1 px-12">
          <BackButton href={CACA_PATH} className="absolute left-0 top-1/2 -translate-y-1/2" />
          <span className="font-display text-xs tracking-[0.4em] text-white/60">PARA IMPRIMIR</span>
          <h1 className="text-balance text-center font-display text-3xl text-gold sm:text-4xl">Caça-palavras para imprimir</h1>
        </header>
        <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">
          Escolha o tema: cada folha A4 traz a grade, a lista de palavras para riscar e o gabarito na página seguinte. Três níveis, do fácil (bom para crianças) ao difícil.
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEMES.map((t) => (
            <li key={t.id}>
              <Link
                href={cacaPrintPath(t.id)}
                className="flex flex-col gap-1 rounded-xl bg-black/30 px-4 py-3 ring-1 ring-white/10 transition hover:ring-gold/60"
              >
                <span className="font-display text-gold">{t.name}</span>
                <span className="truncate text-xs text-white/60">{t.words.slice(0, 4).join(", ").toLowerCase()}…</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
