import { generate as cacaGenerate, THEMES, type Level as CacaLevel, type Puzzle as CacaPuzzle } from "@mesa/caca-palavras";
import { generate as sudokuGenerate, type Difficulty, type Puzzle as SudokuPuzzle } from "@mesa/sudoku";
import { CACA_PATH } from "@/lib/caca-palavras/paths";
import { SUDOKU_PATH } from "@/lib/sudoku/paths";

// Folhas para imprimir: sudoku por nível e caça-palavras por tema. A mesma folha (nível/tema + número) sai sempre igual,
// para o link impresso numa aula valer de novo amanhã. "Outra folha" só troca o número (?folha=2...).

export const SUDOKU_PRINT_PATH = `${SUDOKU_PATH}/imprimir`;
export const CACA_PRINT_PATH = `${CACA_PATH}/imprimir`;

/** Sudokus por folha (2 × 2 numa A4) */
export const SUDOKUS_PER_SHEET = 4;
export const MAX_SHEET = 99;

export const SUDOKU_LEVELS: { slug: string; difficulty: Difficulty; name: string }[] = [
  { slug: "facil", difficulty: "easy", name: "Fácil" },
  { slug: "medio", difficulty: "medium", name: "Médio" },
  { slug: "dificil", difficulty: "hard", name: "Difícil" },
  { slug: "expert", difficulty: "expert", name: "Expert" },
];

export const CACA_LEVELS: { slug: string; level: CacaLevel; name: string; hint: string }[] = [
  { slug: "facil", level: "easy", name: "Fácil", hint: "grade 10 × 10, palavras na horizontal e na vertical" },
  { slug: "medio", level: "medium", name: "Médio", hint: "grade 12 × 12, palavras também na diagonal" },
  { slug: "dificil", level: "hard", name: "Difícil", hint: "grade 15 × 15, palavras em todas as direções, até de trás para frente" },
];
export const DEFAULT_CACA_LEVEL = CACA_LEVELS[1];

export const sudokuLevel = (slug: string) => SUDOKU_LEVELS.find((l) => l.slug === slug) ?? null;
export const cacaTheme = (id: string) => THEMES.find((t) => t.id === id) ?? null;
/** Nome do tema no meio da frase ("de animais", mas "do Brasil") */
export const themeInText = (t: { id: string; name: string }) => (t.id === "brasil" ? "do Brasil" : `de ${t.name.toLowerCase()}`);
export const cacaLevel = (slug: string | undefined) => CACA_LEVELS.find((l) => l.slug === slug) ?? DEFAULT_CACA_LEVEL;

/** Número da folha vindo do endereço: 1 a MAX_SHEET */
export function sheetOf(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n >= 1 && n <= MAX_SHEET ? n : 1;
}

/** Semente fixa a partir de um texto (FNV-1a) */
function seedOf(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

// gerar sudoku expert leva ~0,2 s: guarda as folhas já montadas
const sudokuCache = new Map<string, SudokuPuzzle[]>();

export function sudokuSheet(difficulty: Difficulty, sheet: number): SudokuPuzzle[] {
  const key = `${difficulty}:${sheet}`;
  let out = sudokuCache.get(key);
  if (!out) {
    out = Array.from({ length: SUDOKUS_PER_SHEET }, (_, i) => sudokuGenerate(difficulty, seedOf(`sudoku:${difficulty}:${sheet}:${i}`)));
    if (sudokuCache.size > 200) sudokuCache.clear();
    sudokuCache.set(key, out);
  }
  return out;
}

export const cacaSheet = (theme: string, level: CacaLevel, sheet: number): CacaPuzzle => cacaGenerate(level, theme, seedOf(`caca:${theme}:${level}:${sheet}`));

export const sudokuPrintPath = (slug: string) => `${SUDOKU_PRINT_PATH}/${slug}`;
export const cacaPrintPath = (theme: string) => `${CACA_PRINT_PATH}/${theme}`;

export const imprimirPaths = () => [
  SUDOKU_PRINT_PATH,
  ...SUDOKU_LEVELS.map((l) => sudokuPrintPath(l.slug)),
  CACA_PRINT_PATH,
  ...THEMES.map((t) => cacaPrintPath(t.id)),
];
