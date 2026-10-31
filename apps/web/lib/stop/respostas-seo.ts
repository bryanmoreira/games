import type { Metadata } from "next";
import { breadcrumbLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import { STOP_PATH } from "@/lib/stop/paths";
import {
  answerPath,
  answers,
  answerTitle,
  categoryPath,
  letterPath,
  lettersOf,
  RESPOSTAS_PATH,
  categoriesOf,
  type AnswerCategory,
  type RespostasPage,
} from "@/lib/stop/respostas";

// Títulos, descrições e JSON-LD das páginas de respostas do Stop.

const OG_IMAGE = `${STOP_PATH}/opengraph-image`;

function meta(path: string, title: string, description: string, keywords: string[]): Metadata {
  return {
    // o layout do Stop tem título próprio, então o template do layout raiz não chega aqui
    title: `${title} · ${SITE_NAME}`,
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, locale: "pt_BR", type: "article", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: [OG_IMAGE] },
  };
}

const first = (words: string[], n: number) => words.slice(0, n).join(", ");

export function hubMetadata(): Metadata {
  return meta(
    RESPOSTAS_PATH,
    "Respostas para Stop (Adedonha) de A a Z",
    "Respostas para o Stop (Adedonha) em todas as letras: nome, CEP, animal, fruta, cor, objeto, comida, profissão, marca e mais. Escolha a letra ou a categoria.",
    ["respostas stop", "respostas adedonha", "stop de a a z", "lista para stop", "adedonha respostas"],
  );
}

export function pageMetadata(p: RespostasPage): Metadata {
  if (p.kind === "letter") {
    const l = p.letter;
    const cats = categoriesOf(l);
    return meta(
      letterPath(l),
      `Stop com a letra ${l}: respostas para todas as categorias`,
      `Respostas com a letra ${l} para o Stop (Adedonha): ${cats
        .slice(0, 4)
        .map((c) => `${c.noun} (${answers(c, l)[0]})`)
        .join(", ")} e mais ${cats.length} categorias.`,
      [`stop letra ${l.toLowerCase()}`, `adedonha letra ${l.toLowerCase()}`, `respostas stop com ${l.toLowerCase()}`],
    );
  }
  if (p.kind === "category") {
    const c = p.cat;
    return meta(
      categoryPath(c),
      `${c.label} para Stop: respostas de A a Z`,
      `Respostas de ${c.noun} para o Stop (Adedonha) em ${lettersOf(c).length} letras, de A a Z. Escolha a letra e veja a lista.`,
      [`${c.noun} stop`, `${c.noun} adedonha`, `${c.plural} de a a z`],
    );
  }
  const { cat: c, letter: l } = p;
  const words = answers(c, l);
  return meta(
    answerPath(c, l),
    `${answerTitle(c, l)}: ${words.length} ${c.plural} com a letra ${l} para o Stop`,
    `${c.plural[0].toUpperCase()}${c.plural.slice(1)} com ${l} para o Stop (Adedonha): ${first(words, 5)} e mais. Veja a lista e jogue Stop online grátis com os amigos.`,
    [`${c.noun} com ${l.toLowerCase()}`, `${c.noun} com a letra ${l.toLowerCase()}`, `stop ${c.noun} ${l.toLowerCase()}`, `adedonha ${c.noun} ${l.toLowerCase()}`],
  );
}

const crumbs = (extra: { name: string; path: string }[]) =>
  breadcrumbLd([{ name: SITE_NAME, path: "/" }, { name: "Stop", path: STOP_PATH }, { name: "Respostas", path: RESPOSTAS_PATH }, ...extra]);

const list = (name: string, items: { name: string; url?: string }[]) => ({
  "@type": "ItemList",
  name,
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.url ? { url: `${SITE_URL}${it.url}` } : {}) })),
});

export function hubLd() {
  return { "@context": "https://schema.org", "@graph": [breadcrumbLd([{ name: SITE_NAME, path: "/" }, { name: "Stop", path: STOP_PATH }, { name: "Respostas", path: RESPOSTAS_PATH }])] };
}

export function pageLd(p: RespostasPage) {
  if (p.kind === "letter") {
    const cats = categoriesOf(p.letter);
    return {
      "@context": "https://schema.org",
      "@graph": [
        crumbs([{ name: `Letra ${p.letter}`, path: letterPath(p.letter) }]),
        list(`Stop com a letra ${p.letter}`, cats.map((c) => ({ name: answerTitle(c, p.letter), url: answerPath(c, p.letter) }))),
      ],
    };
  }
  if (p.kind === "category") {
    return { "@context": "https://schema.org", "@graph": [crumbs([{ name: p.cat.label, path: categoryPath(p.cat) }])] };
  }
  const { cat: c, letter: l } = p;
  const words = answers(c, l);
  return {
    "@context": "https://schema.org",
    "@graph": [
      crumbs([
        { name: c.label, path: categoryPath(c) },
        { name: answerTitle(c, l), path: answerPath(c, l) },
      ]),
      list(`${answerTitle(c, l)} para o Stop`, words.map((w) => ({ name: w }))),
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Qual ${c.noun} começa com a letra ${l}?`,
            acceptedAnswer: { "@type": "Answer", text: `Algumas opções de ${c.noun} com ${l}: ${words.join(", ")}.` },
          },
        ],
      },
    ],
  };
}
