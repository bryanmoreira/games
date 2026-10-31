import { LETTERS } from "@mesa/stop";
import { RESPOSTAS } from "@/lib/stop/respostas-dados";
import { STOP_PATH } from "@/lib/stop/paths";

// Páginas de respostas do Stop: /stop/respostas, /stop/respostas/letra-a, /stop/respostas/fruta e /stop/respostas/fruta-com-a.
// As 26 letras entram (muita gente busca "nome com K"), mesmo o jogo só sorteando as de LETTERS.

export const RESPOSTAS_PATH = `${STOP_PATH}/respostas`;
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
/** Letras que o Stop do site não sorteia */
export const OFF_GAME = ALPHABET.filter((l) => !LETTERS.includes(l));

export interface AnswerCategory {
  /** chave em RESPOSTAS */
  id: string;
  slug: string;
  /** "Fruta" em "Fruta com A" */
  label: string;
  /** "frutas" em "8 frutas com a letra A" */
  plural: string;
  /** "fruta" em "Qual fruta começa com A?" */
  noun: string;
}

export const ANSWER_CATEGORIES: AnswerCategory[] = [
  { id: "nome", slug: "nome", label: "Nome", plural: "nomes", noun: "nome" },
  { id: "cep", slug: "cep", label: "CEP", plural: "cidades, estados e países", noun: "cidade, estado ou país" },
  { id: "animal", slug: "animal", label: "Animal", plural: "animais", noun: "animal" },
  { id: "fruta", slug: "fruta", label: "Fruta", plural: "frutas", noun: "fruta" },
  { id: "cor", slug: "cor", label: "Cor", plural: "cores", noun: "cor" },
  { id: "objeto", slug: "objeto", label: "Objeto", plural: "objetos", noun: "objeto" },
  { id: "comida", slug: "comida", label: "Comida", plural: "comidas", noun: "comida" },
  { id: "profissao", slug: "profissao", label: "Profissão", plural: "profissões", noun: "profissão" },
  { id: "marca", slug: "marca", label: "Marca", plural: "marcas", noun: "marca" },
  { id: "filme", slug: "filme", label: "Filme ou série", plural: "filmes e séries", noun: "filme ou série" },
  { id: "corpo", slug: "parte-do-corpo", label: "Parte do corpo", plural: "partes do corpo", noun: "parte do corpo" },
  { id: "famoso", slug: "famoso", label: "Famoso", plural: "famosos", noun: "famoso" },
  { id: "bebida", slug: "bebida", label: "Bebida", plural: "bebidas", noun: "bebida" },
  { id: "adjetivo", slug: "adjetivo", label: "Adjetivo", plural: "adjetivos", noun: "adjetivo" },
  { id: "sogra", slug: "minha-sogra-e", label: "Minha sogra é...", plural: "respostas", noun: 'resposta para "Minha sogra é..."' },
];

function parse(text: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const line of text.split("\n")) {
    const m = line.trim().match(/^([A-Z]) (.+)$/);
    if (m) out[m[1]] = m[2].split(";").map((w) => w.trim()).filter(Boolean);
  }
  return out;
}

const TABLE: Record<string, Record<string, string[]>> = Object.fromEntries(Object.entries(RESPOSTAS).map(([id, t]) => [id, parse(t)]));

/** Respostas de uma categoria numa letra (vazio = sem página) */
export function answers(cat: AnswerCategory, letter: string): string[] {
  return TABLE[cat.id]?.[letter] ?? [];
}

/** Letras com pelo menos 2 respostas: menos que isso não vira página */
export const lettersOf = (cat: AnswerCategory) => ALPHABET.filter((l) => answers(cat, l).length >= 2);
export const categoriesOf = (letter: string) => ANSWER_CATEGORIES.filter((c) => answers(c, letter).length >= 2);

export const letterPath = (letter: string) => `${RESPOSTAS_PATH}/letra-${letter.toLowerCase()}`;
export const categoryPath = (cat: AnswerCategory) => `${RESPOSTAS_PATH}/${cat.slug}`;
export const answerPath = (cat: AnswerCategory, letter: string) => `${RESPOSTAS_PATH}/${cat.slug}-com-${letter.toLowerCase()}`;

/** "Fruta com A", "Minha sogra é... com A" */
export const answerTitle = (cat: AnswerCategory, letter: string) => `${cat.label} com ${letter}`;

export type RespostasPage =
  | { kind: "letter"; letter: string }
  | { kind: "category"; cat: AnswerCategory }
  | { kind: "answer"; cat: AnswerCategory; letter: string };

/** O que mostrar em /stop/respostas/<slug>; null = 404 */
export function resolveSlug(slug: string): RespostasPage | null {
  const letter = slug.match(/^letra-([a-z])$/)?.[1]?.toUpperCase();
  if (letter) return categoriesOf(letter).length ? { kind: "letter", letter } : null;
  const cat = ANSWER_CATEGORIES.find((c) => c.slug === slug);
  if (cat) return { kind: "category", cat };
  const m = slug.match(/^(.+)-com-([a-z])$/);
  const c = m && ANSWER_CATEGORIES.find((x) => x.slug === m[1]);
  if (!c) return null;
  const l = m[2].toUpperCase();
  return answers(c, l).length >= 2 ? { kind: "answer", cat: c, letter: l } : null;
}

/** Todas as páginas, para o sitemap e o IndexNow */
export function respostasPaths(): string[] {
  return [
    RESPOSTAS_PATH,
    ...ALPHABET.filter((l) => categoriesOf(l).length).map(letterPath),
    ...ANSWER_CATEGORIES.map(categoryPath),
    ...ANSWER_CATEGORIES.flatMap((c) => lettersOf(c).map((l) => answerPath(c, l))),
  ];
}

/** Sem acento e em maiúscula, para conferir a primeira letra */
export const initial = (word: string) => word.normalize("NFD").replace(/[̀-ͯ]/g, "")[0]?.toUpperCase() ?? "";
