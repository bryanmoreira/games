import { GAMES } from "@/lib/seo";
import { howToExtra, type Term } from "@/lib/como-jogar";

// Glossário: um termo por página (/glossario/manilha), com o jogo de onde ele vem.

export const GLOSSARIO_PATH = "/glossario";

export interface GlossaryEntry extends Term {
  /** slug do jogo em lib/seo.ts */
  game: string;
}

/** Todos os termos, em ordem alfabética; slug repetido entre jogos fica com o primeiro */
export const GLOSSARY: GlossaryEntry[] = (() => {
  const seen = new Set<string>();
  const out: GlossaryEntry[] = [];
  for (const g of GAMES)
    for (const t of howToExtra(g.slug)?.glossary ?? []) {
      if (seen.has(t.slug)) continue;
      seen.add(t.slug);
      out.push({ ...t, game: g.slug });
    }
  return out.sort((a, b) => a.term.localeCompare(b.term, "pt-BR"));
})();

export const termPath = (slug: string) => `${GLOSSARIO_PATH}/${slug}`;
export const findTerm = (slug: string) => GLOSSARY.find((t) => t.slug === slug) ?? null;
export const termsOf = (game: string) => GLOSSARY.filter((t) => t.game === game);
export const glossarioPaths = () => (GLOSSARY.length ? [GLOSSARIO_PATH, ...GLOSSARY.map((t) => termPath(t.slug))] : []);
