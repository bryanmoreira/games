import { ANSWERS, EXTRA } from "@mesa/verbete";

// Palavras de 5 letras: a ferramenta de busca e as páginas fixas (/palavras-de-5-letras/comecam-com-a ...).
// Fonte: as listas do Verbete. ANSWERS são as comuns (com acento); EXTRA, as que só valem como chute.

export const PALAVRAS_PATH = "/palavras-de-5-letras";
export const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

/** Sem acento e com Ç como C, em minúscula: é assim que os filtros comparam */
export const plain = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export interface Filter {
  /** letra certa em cada uma das 5 casas ("" = qualquer) */
  pos: string[];
  /** letras que a palavra tem, em qualquer lugar */
  has: string;
  /** letras que a palavra não tem */
  not: string;
}

export const EMPTY_FILTER: Filter = { pos: ["", "", "", "", ""], has: "", not: "" };

const letters = (s: string) => [...new Set(plain(s).replace(/[^a-z]/g, ""))];

export function matcher(f: Filter): (word: string) => boolean {
  const pos = f.pos.map((p) => plain(p).replace(/[^a-z]/g, "").slice(0, 1));
  const has = letters(f.has);
  const not = letters(f.not).filter((l) => !has.includes(l) && !pos.includes(l));
  return (word) => {
    const w = plain(word);
    return pos.every((p, i) => !p || w[i] === p) && has.every((l) => w.includes(l)) && not.every((l) => !w.includes(l));
  };
}

export const isEmpty = (f: Filter) => !f.pos.some(Boolean) && !f.has.trim() && !f.not.trim();

/** Palavras que passam no filtro: comuns primeiro, depois as outras */
export function search(f: Filter): { common: string[]; other: string[] } {
  const ok = matcher(f);
  return { common: ANSWERS.filter(ok), other: EXTRA.filter(ok) };
}

// Páginas fixas: começam com / terminam com cada letra

export type PalavrasPage = { kind: "start" | "end"; letter: string };

export const pagePath = (p: PalavrasPage) => `${PALAVRAS_PATH}/${p.kind === "start" ? "comecam" : "terminam"}-com-${p.letter}`;

export function pageFilter(p: PalavrasPage): Filter {
  const pos = ["", "", "", "", ""];
  pos[p.kind === "start" ? 0 : 4] = p.letter;
  return { ...EMPTY_FILTER, pos };
}

/** Menos comuns mostradas numa página fixa: o resto fica para a busca */
export const OTHER_LIMIT = 150;

/** Com pelo menos 3 palavras no total; senão não vira página */
export const pageWords = (p: PalavrasPage) => search(pageFilter(p));
const hasPage = (p: PalavrasPage) => {
  const r = pageWords(p);
  return r.common.length + r.other.length >= 3;
};

export const PAGES: PalavrasPage[] = (["start", "end"] as const).flatMap((kind) =>
  ALPHABET.map((letter) => ({ kind, letter })).filter(hasPage),
);

export function resolveSlug(slug: string): PalavrasPage | null {
  const m = slug.match(/^(comecam|terminam)-com-([a-z])$/);
  if (!m) return null;
  const p: PalavrasPage = { kind: m[1] === "comecam" ? "start" : "end", letter: m[2] };
  return PAGES.some((x) => x.kind === p.kind && x.letter === p.letter) ? p : null;
}

/** "Palavras de 5 letras que começam com A" */
export const pageTitle = (p: PalavrasPage) => `Palavras de 5 letras que ${p.kind === "start" ? "começam" : "terminam"} com ${p.letter.toUpperCase()}`;

export const palavrasPaths = () => [PALAVRAS_PATH, ...PAGES.map(pagePath)];
