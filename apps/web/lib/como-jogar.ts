import data from "@/lib/como-jogar-extra.json";

// Conteúdo extra dos "Como jogar" (resposta direta, perguntas a mais e termos do glossário), conferido com as regras de cada jogo.
// Fica num JSON à parte para lib/seo.ts não crescer; o glossário (lib/glossario.ts) sai dos termos daqui.

/** Data da última revisão dos textos de regras: aparece na página e no JSON-LD */
export const HOWTO_UPDATED = "2026-10-31";

export interface Term {
  term: string;
  slug: string;
  definition: string;
}

export interface HowToExtra {
  /** resposta de 40 a 60 palavras para "Como jogar X?" */
  answer: string;
  faq: { q: string; a: string }[];
  glossary: Term[];
}

const EXTRA = data as Record<string, HowToExtra>;

export const howToExtra = (slug: string): HowToExtra | null => EXTRA[slug] ?? null;
