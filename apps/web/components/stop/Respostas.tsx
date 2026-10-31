import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/seo";
import {
  ALPHABET,
  ANSWER_CATEGORIES,
  answerPath,
  answerTitle,
  categoriesOf,
  categoryPath,
  lettersOf,
  letterPath,
  OFF_GAME,
  type AnswerCategory,
} from "@/lib/stop/respostas";
import { STOP_PATH } from "@/lib/stop/paths";

const chip = "rounded-full bg-black/30 px-3 py-1.5 text-sm text-white/80 ring-1 ring-white/10 transition hover:text-gold";

/** Moldura das páginas de respostas: voltar, título, conteúdo, botão de jogar e rodapé. */
export function RespostasShell({ back, kicker, title, ld, children }: { back: string; kicker: string; title: string; ld: object; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:py-12">
        <JsonLd data={ld} />
        <header className="relative flex flex-col items-center gap-1 px-12">
          <BackButton href={back} className="absolute left-0 top-1/2 -translate-y-1/2" />
          <span className="font-display text-xs tracking-[0.4em] text-white/60">{kicker}</span>
          <h1 className="text-balance text-center font-display text-3xl text-gold sm:text-4xl">{title}</h1>
        </header>
        {children}
        <PlayStop />
      </main>
      <SiteFooter />
    </div>
  );
}

export function PlayStop() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/30 px-4 py-6 text-center ring-1 ring-white/10">
      <p className="text-sm text-white/70">Jogue Stop online com os amigos, de graça e sem cadastro.</p>
      <Link
        href={STOP_PATH}
        className="rounded-xl bg-gold px-8 py-3 font-display text-lg text-stone-900 shadow-[0_4px_0_#9a6b12] active:translate-y-1 active:shadow-none"
      >
        Jogar Stop
      </Link>
    </div>
  );
}

/** Respostas de uma categoria numa letra, em fichas */
export function AnswerList({ words }: { words: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {words.map((w) => (
        <li key={w} className="rounded-xl bg-white/5 px-4 py-2 font-semibold text-white/90 ring-1 ring-white/10">
          {w}
        </li>
      ))}
    </ul>
  );
}

/** A–Z de uma categoria (ou de todas, sem `cat`): letra sem página fica apagada */
export function LetterStrip({ cat, current }: { cat?: AnswerCategory; current?: string }) {
  const has = new Set(cat ? lettersOf(cat) : ALPHABET.filter((l) => categoriesOf(l).length));
  return (
    <nav aria-label="Letras" className="grid grid-cols-7 gap-1.5 sm:grid-cols-[repeat(13,minmax(0,1fr))]">
      {ALPHABET.map((l) =>
        has.has(l) ? (
          <Link
            key={l}
            href={cat ? answerPath(cat, l) : letterPath(l)}
            aria-current={l === current ? "page" : undefined}
            className={`flex aspect-square items-center justify-center rounded-lg font-display text-lg ring-1 transition ${
              l === current ? "bg-gold text-stone-900 ring-gold" : "bg-black/30 text-white/80 ring-white/10 hover:text-gold"
            }`}
          >
            {l}
          </Link>
        ) : (
          <span key={l} aria-hidden="true" className="flex aspect-square items-center justify-center rounded-lg font-display text-lg text-white/15 ring-1 ring-white/5">
            {l}
          </span>
        ),
      )}
    </nav>
  );
}

/** Categorias de uma letra (links para "Fruta com A"...) ou todas as categorias */
export function CategoryLinks({ letter, skip }: { letter?: string; skip?: string }) {
  const cats = (letter ? categoriesOf(letter) : ANSWER_CATEGORIES).filter((c) => c.id !== skip);
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {cats.map((c) => (
        <li key={c.id}>
          <Link href={letter ? answerPath(c, letter) : categoryPath(c)} className={chip}>
            {letter ? answerTitle(c, letter) : c.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-center font-display text-xl text-gold">{title}</h2>
      {children}
    </section>
  );
}

/** Aviso nas letras que o jogo do site não sorteia */
export function OffGameNote({ letter }: { letter: string }) {
  if (!OFF_GAME.includes(letter)) return null;
  return (
    <p className="text-center text-xs text-white/50">
      O Stop do Mesa de Jogos não sorteia {OFF_GAME.join(", ")}: são letras difíceis demais para uma rodada.
    </p>
  );
}

/** "Abacaxi, Abacate, Açaí e Acerola" */
export const joinWords = (words: string[]) => (words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} e ${words[words.length - 1]}`);
