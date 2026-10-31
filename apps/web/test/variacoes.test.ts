import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { THEMES } from "@mesa/caca-palavras";
import { cacaSheet, imprimirPaths, sheetOf, SUDOKU_LEVELS, sudokuSheet, SUDOKUS_PER_SHEET } from "@/lib/imprimir";
import { GAMES } from "@/lib/seo";
import { VARIATIONS } from "@/lib/variacoes";

const APP = join(import.meta.dir, "..", "app");

describe("variações dos jogos", () => {
  test("cada variação tem jogo, rota e texto", () => {
    const slugs = new Set(GAMES.map((g) => g.slug));
    for (const v of VARIATIONS) {
      expect(slugs.has(v.game)).toBe(true);
      expect(v.path.startsWith(GAMES.find((g) => g.slug === v.game)!.path + "/")).toBe(true);
      expect(readFileSync(join(APP, v.path, "page.tsx"), "utf8")).toContain(`"${v.path}"`);
      expect(v.about.length).toBeGreaterThan(0);
      expect(v.faq.length).toBeGreaterThan(0);
    }
  });

  test("sem caminho, título ou descrição repetidos", () => {
    for (const k of ["path", "title", "description"] as const) expect(new Set(VARIATIONS.map((v) => v[k])).size).toBe(VARIATIONS.length);
  });
});

describe("folhas para imprimir", () => {
  test("a mesma folha sai sempre igual e folhas diferentes mudam", () => {
    expect(cacaSheet("animais", "easy", 1)).toEqual(cacaSheet("animais", "easy", 1));
    expect(cacaSheet("animais", "easy", 1).grid).not.toBe(cacaSheet("animais", "easy", 2).grid);
    const a = sudokuSheet("easy", 3);
    expect(a.length).toBe(SUDOKUS_PER_SHEET);
    expect(a[0].puzzle).not.toEqual(a[1].puzzle);
  });

  test("todos os temas montam grade nos três níveis", () => {
    for (const t of THEMES) for (const l of ["easy", "medium", "hard"] as const) expect(cacaSheet(t.id, l, 1).words.length).toBeGreaterThan(0);
  });

  test("número da folha inválido volta para 1", () => {
    expect(sheetOf("2")).toBe(2);
    expect(sheetOf("0")).toBe(1);
    expect(sheetOf("abc")).toBe(1);
    expect(sheetOf("1000")).toBe(1);
    expect(sheetOf(undefined)).toBe(1);
  });

  test("caminhos das folhas existem como rota", () => {
    expect(imprimirPaths().length).toBe(2 + SUDOKU_LEVELS.length + THEMES.length);
    expect(existsSync(join(APP, "sudoku", "imprimir", "[nivel]", "page.tsx"))).toBe(true);
    expect(existsSync(join(APP, "caca-palavras", "imprimir", "[tema]", "page.tsx"))).toBe(true);
  });
});
