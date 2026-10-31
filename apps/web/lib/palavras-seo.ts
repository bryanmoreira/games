import type { Metadata } from "next";
import { ANSWERS, EXTRA } from "@mesa/verbete";
import { breadcrumbLd, SITE_NAME, SITE_URL } from "@/lib/seo";
import { pagePath, pageTitle, pageWords, PALAVRAS_PATH, type PalavrasPage } from "@/lib/palavras";

// Títulos, descrições e JSON-LD das páginas de palavras de 5 letras.

export const TOTAL = ANSWERS.length + EXTRA.length;
const fmt = (n: number) => n.toLocaleString("pt-BR");

function meta(path: string, title: string, description: string, keywords: string[]): Metadata {
  return {
    title, // o template do layout raiz acrescenta o nome do site
    description,
    keywords,
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, locale: "pt_BR", type: "website" },
    twitter: { card: "summary", title: `${title} · ${SITE_NAME}`, description },
  };
}

/** Perguntas da página principal: texto que buscadores e IAs conseguem citar */
export const HUB_FAQ = [
  {
    q: "Quantas palavras de 5 letras existem em português?",
    a: `A lista do Mesa de Jogos tem ${fmt(TOTAL)} palavras de 5 letras em português que valem no Verbete. Dessas, ${fmt(ANSWERS.length)} são palavras comuns do dia a dia.`,
  },
  {
    q: "Como achar uma palavra de 5 letras?",
    a: "Escreva as letras que você já sabe na casa certa, as letras que a palavra tem em qualquer lugar e as que ela não tem. A lista atualiza na hora, com as palavras mais comuns primeiro.",
  },
  {
    q: "Acento e cedilha contam na busca?",
    a: "Não. A busca ignora acento e cedilha: A encontra Á, Â e Ã, e C encontra Ç. As palavras aparecem escritas do jeito certo, com acento.",
  },
];

export function hubMetadata(): Metadata {
  return meta(
    PALAVRAS_PATH,
    "Palavras de 5 letras: busca por letra e posição",
    `Ache palavras de 5 letras em português: escolha a letra em cada posição, as letras que a palavra tem e as que não tem. ${fmt(TOTAL)} palavras, as comuns primeiro.`,
    ["palavras de 5 letras", "palavras com 5 letras", "lista de palavras de 5 letras", "palavras de cinco letras", "buscar palavras de 5 letras"],
  );
}

export function hubLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Palavras de 5 letras",
        url: `${SITE_URL}${PALAVRAS_PATH}`,
        applicationCategory: "ReferenceApplication",
        operatingSystem: "Qualquer (navegador)",
        inLanguage: "pt-BR",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "BRL" },
      },
      { "@type": "FAQPage", mainEntity: HUB_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      breadcrumbLd([
        { name: SITE_NAME, path: "/" },
        { name: "Palavras de 5 letras", path: PALAVRAS_PATH },
      ]),
    ],
  };
}

export function pageMetadata(p: PalavrasPage): Metadata {
  const { common, other } = pageWords(p);
  const sample = (common.length ? common : other).slice(0, 5).join(", ");
  const L = p.letter.toUpperCase();
  const verb = p.kind === "start" ? "começam" : "terminam";
  return meta(
    pagePath(p),
    pageTitle(p),
    `${fmt(common.length + other.length)} palavras de 5 letras que ${verb} com ${L}: ${sample} e mais. Lista com as mais comuns primeiro e busca por posição.`,
    [`palavras de 5 letras com ${p.letter}`, `palavras de 5 letras que ${verb} com ${p.letter}`, `palavra de 5 letras ${p.kind === "start" ? "começando" : "terminando"} com ${p.letter}`],
  );
}

export function pageLd(p: PalavrasPage) {
  const { common } = pageWords(p);
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbLd([
        { name: SITE_NAME, path: "/" },
        { name: "Palavras de 5 letras", path: PALAVRAS_PATH },
        { name: pageTitle(p), path: pagePath(p) },
      ]),
      {
        "@type": "ItemList",
        name: pageTitle(p),
        numberOfItems: common.length,
        itemListElement: common.slice(0, 50).map((w, i) => ({ "@type": "ListItem", position: i + 1, name: w })),
      },
    ],
  };
}
