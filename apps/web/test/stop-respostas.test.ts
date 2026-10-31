import { describe, expect, test } from "bun:test";
import {
  ALPHABET,
  ANSWER_CATEGORIES,
  answerPath,
  answers,
  categoriesOf,
  initial,
  lettersOf,
  resolveSlug,
  respostasPaths,
} from "@/lib/stop/respostas";
import { RESPOSTAS } from "@/lib/stop/respostas-dados";

describe("dados das respostas do Stop", () => {
  test("toda categoria tem dados e toda chave de dados tem categoria", () => {
    expect(Object.keys(RESPOSTAS).sort()).toEqual(ANSWER_CATEGORIES.map((c) => c.id).sort());
  });

  test("cada resposta começa com a letra da linha (sem contar acento)", () => {
    const wrong = ANSWER_CATEGORIES.flatMap((c) => ALPHABET.flatMap((l) => answers(c, l).filter((w) => initial(w) !== l).map((w) => `${c.id} ${l}: ${w}`)));
    expect(wrong).toEqual([]);
  });

  test("sem resposta repetida na mesma letra", () => {
    const dup = ANSWER_CATEGORIES.flatMap((c) =>
      ALPHABET.flatMap((l) => {
        const seen = answers(c, l).map((w) => w.toLowerCase());
        return seen.filter((w, i) => seen.indexOf(w) !== i).map((w) => `${c.id} ${l}: ${w}`);
      }),
    );
    expect(dup).toEqual([]);
  });

  test("letras comuns têm página em todas as categorias", () => {
    for (const l of ["A", "B", "C", "M", "P", "S", "T"]) expect(categoriesOf(l).length).toBe(ANSWER_CATEGORIES.length);
  });
});

describe("slugs", () => {
  const fruta = ANSWER_CATEGORIES.find((c) => c.id === "fruta")!;
  const sogra = ANSWER_CATEGORIES.find((c) => c.id === "sogra")!;

  test("resposta, letra e categoria", () => {
    expect(resolveSlug("fruta-com-a")).toEqual({ kind: "answer", cat: fruta, letter: "A" });
    expect(resolveSlug("minha-sogra-e-com-b")).toEqual({ kind: "answer", cat: sogra, letter: "B" });
    expect(resolveSlug("letra-k")).toEqual({ kind: "letter", letter: "K" });
    expect(resolveSlug("fruta")).toEqual({ kind: "category", cat: fruta });
  });

  test("letra sem respostas suficientes ou slug estranho dá 404", () => {
    expect(resolveSlug("fruta-com-y")).toBeNull();
    expect(resolveSlug("planeta-com-a")).toBeNull();
    expect(resolveSlug("letra-1")).toBeNull();
    expect(resolveSlug("fruta-com-A")).toBeNull();
  });

  test("todo caminho listado resolve", () => {
    const paths = respostasPaths();
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of paths.slice(1)) expect(resolveSlug(p.split("/").pop()!)).not.toBeNull();
    for (const c of ANSWER_CATEGORIES) for (const l of lettersOf(c)) expect(paths).toContain(answerPath(c, l));
  });
});
