import { describe, expect, test } from "bun:test";
import { howToExtra } from "@/lib/como-jogar";
import { GLOSSARY, glossarioPaths, findTerm } from "@/lib/glossario";
import { GAMES } from "@/lib/seo";

const words = (s: string) => s.trim().split(/\s+/).length;

describe("conteúdo extra dos Como jogar", () => {
  test("todo jogo tem resposta direta curta, perguntas novas e termos", () => {
    for (const g of GAMES) {
      const x = howToExtra(g.slug);
      expect(x).not.toBeNull();
      expect(words(x!.answer)).toBeGreaterThanOrEqual(35);
      expect(words(x!.answer)).toBeLessThanOrEqual(70);
      expect(x!.faq.length).toBeGreaterThanOrEqual(5);
      const base = new Set(g.faq.map((f) => f.q));
      expect(x!.faq.filter((f) => base.has(f.q))).toEqual([]);
    }
  });

  test("nenhuma menção a jogo ou site de fora", () => {
    const all = JSON.stringify(GAMES.map((g) => howToExtra(g.slug)));
    expect(all).not.toMatch(/tetris|wordle|\btermo\b|megajogos|jogatina|lichess|chess\.com/i);
  });
});

describe("glossário", () => {
  test("slugs únicos e válidos, definições de tamanho citável", () => {
    expect(new Set(GLOSSARY.map((t) => t.slug)).size).toBe(GLOSSARY.length);
    for (const t of GLOSSARY) {
      expect(t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(words(t.definition)).toBeGreaterThanOrEqual(25);
      expect(findTerm(t.slug)).toEqual(t);
    }
  });

  test("caminhos: índice e um por termo", () => {
    expect(glossarioPaths().length).toBe(GLOSSARY.length + 1);
  });
});
