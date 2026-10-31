import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerList, CategoryLinks, joinWords, LetterStrip, OffGameNote, RespostasShell, Section } from "@/components/stop/Respostas";
import {
  answerPath,
  answers,
  answerTitle,
  categoriesOf,
  categoryPath,
  letterPath,
  lettersOf,
  resolveSlug,
  respostasPaths,
  RESPOSTAS_PATH,
  type AnswerCategory,
} from "@/lib/stop/respostas";
import { pageLd, pageMetadata } from "@/lib/stop/respostas-seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return respostasPaths()
    .slice(1)
    .map((p) => ({ slug: p.split("/").pop()! }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = resolveSlug((await params).slug);
  return p ? pageMetadata(p) : {};
}

const preview = (words: string[]) => (words.length > 4 ? `${words.slice(0, 4).join(", ")}…` : words.join(", "));

const card = "flex flex-col gap-1 rounded-xl bg-black/30 px-4 py-3 ring-1 ring-white/10 transition hover:ring-gold/50";

export default async function RespostasPage({ params }: Props) {
  const p = resolveSlug((await params).slug);
  if (!p) notFound();

  if (p.kind === "letter") {
    const l = p.letter;
    return (
      <RespostasShell back={RESPOSTAS_PATH} kicker="STOP · ADEDONHA" title={`Stop com a letra ${l}`} ld={pageLd(p)}>
        <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">
          Respostas com {l} para cada categoria do Stop. Toque na categoria para ver a lista completa.
        </p>
        <OffGameNote letter={l} />
        <ul className="grid gap-2 sm:grid-cols-2">
          {categoriesOf(l).map((c) => (
            <li key={c.id}>
              <Link href={answerPath(c, l)} className={card}>
                <span className="font-display text-gold">{answerTitle(c, l)}</span>
                <span className="text-sm text-white/70">{preview(answers(c, l))}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Section title="Outras letras">
          <LetterStrip current={l} />
        </Section>
      </RespostasShell>
    );
  }

  if (p.kind === "category") {
    const c = p.cat;
    return (
      <RespostasShell back={RESPOSTAS_PATH} kicker="STOP · ADEDONHA" title={`${c.label} de A a Z`} ld={pageLd(p)}>
        <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">
          Respostas de {c.noun} para o Stop em {lettersOf(c).length} letras. Toque na letra para ver a lista completa.
        </p>
        <LetterStrip cat={c} />
        <ul className="grid gap-2 sm:grid-cols-2">
          {lettersOf(c).map((l) => (
            <li key={l}>
              <Link href={answerPath(c, l)} className={card}>
                <span className="font-display text-gold">{answerTitle(c, l)}</span>
                <span className="text-sm text-white/70">{preview(answers(c, l))}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Section title="Outras categorias">
          <CategoryLinks skip={c.id} />
        </Section>
      </RespostasShell>
    );
  }

  return <AnswerPage cat={p.cat} letter={p.letter} />;
}

function AnswerPage({ cat: c, letter: l }: { cat: AnswerCategory; letter: string }) {
  const words = answers(c, l);
  return (
    <RespostasShell back={categoryPath(c)} kicker="STOP · ADEDONHA" title={answerTitle(c, l)} ld={pageLd({ kind: "answer", cat: c, letter: l })}>
      <p className="text-center text-sm leading-relaxed text-white/70 sm:text-base">
        <b className="font-semibold text-white/90">
          {words.length} {c.plural} com a letra {l}
        </b>{" "}
        para o Stop (Adedonha). As mais fáceis de lembrar são {joinWords(words.slice(0, 3))}.
      </p>
      <AnswerList words={words} />
      <p className="text-center text-xs leading-relaxed text-white/50">
        No Stop, resposta que só você escreveu vale 10 pontos e repetida vale 5. As do fim da lista costumam ser as menos óbvias.
      </p>
      <OffGameNote letter={l} />
      <Section title={`${c.label} com outras letras`}>
        <LetterStrip cat={c} current={l} />
      </Section>
      {categoriesOf(l).length > 1 && (
        <Section title={`Outras categorias com ${l}`}>
          <CategoryLinks letter={l} skip={c.id} />
          <Link href={letterPath(l)} className="mx-auto text-sm text-white/60 underline-offset-4 transition hover:text-gold hover:underline">
            Todas as respostas com {l}
          </Link>
        </Section>
      )}
    </RespostasShell>
  );
}
