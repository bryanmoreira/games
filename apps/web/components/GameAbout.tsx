import Link from "next/link";
import { GameFaq } from "@/components/seo";
import { GAME_ABOUT } from "@/lib/game-about";
import { DAILY_SEO, getGame } from "@/lib/seo";
import { RESPOSTAS_PATH } from "@/lib/stop/respostas";
import { PALAVRAS_PATH } from "@/lib/palavras";
import { CACA_PRINT_PATH, SUDOKU_PRINT_PATH } from "@/lib/imprimir";
import { variationsOf } from "@/lib/variacoes";

/** Texto sobre o jogo abaixo da mesa (fora da primeira tela): história, modos, links e perguntas frequentes. */
export function GameAbout({ slug }: { slug: string }) {
  const g = getGame(slug);
  const link = "rounded-full bg-black/30 px-4 py-2 font-display text-xs text-white/80 ring-1 ring-white/10 transition hover:text-gold";
  return (
    <section aria-labelledby="sobre" className="mx-auto flex max-w-3xl flex-col gap-8 border-t border-white/10 px-4 pb-16 pt-12">
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-white/70 sm:text-base">
        <h2 id="sobre" className="text-center font-display text-xl text-gold">
          Sobre o {g.name}
        </h2>
        {GAME_ABOUT[slug].map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
        <p className="text-white/50">
          <b className="font-semibold text-white/80">Modos:</b> {g.modes}
        </p>
        <nav aria-label={`Mais sobre ${g.name}`} className="flex flex-wrap justify-center gap-2 pt-2">
          <Link href={`${g.path}/como-jogar`} className={link}>
            Regras completas
          </Link>
          {variationsOf(slug).map((v) => (
            <Link key={v.path} href={v.path} className={link}>
              {v.h1}
            </Link>
          ))}
          {slug === "sudoku" && (
            <Link href={SUDOKU_PRINT_PATH} className={link}>
              Para imprimir
            </Link>
          )}
          {slug === "caca-palavras" && (
            <Link href={CACA_PRINT_PATH} className={link}>
              Para imprimir
            </Link>
          )}
          {slug === "stop" && (
            <Link href={RESPOSTAS_PATH} className={link}>
              Respostas de A a Z
            </Link>
          )}
          {slug === "verbete" && (
            <Link href={PALAVRAS_PATH} className={link}>
              Palavras de 5 letras
            </Link>
          )}
          {slug in DAILY_SEO && (
            <Link href={`${g.path}/diario`} className={link}>
              Desafio do dia
            </Link>
          )}
        </nav>
      </div>
      <GameFaq slug={slug} />
    </section>
  );
}
