// Gera src/words.ts a partir de um arquivo JavaScript com as duas listas:
//   `X = new Set(["ababa", "abacá", …])`  palavras extras, que só valem como chute;
//   `Y = ["festa", "suíte", …]`           respostas (palavras comuns), que também valem como chute.
// Uso: bun packages/verbete/scripts/words.ts <arquivo>. O arquivo não fica no repositório: src/words.ts já tem as listas.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("informe o arquivo da lista");
const raw = readFileSync(src, "utf8");

const plain = (w: string) => w.normalize("NFD").replace(/[̀-ͯ]/g, "");
// só letras do português: sem as estrangeiras (aïoli, flûte, nègre, müsli)
const PT = /^[a-záâãàçéêíóôõú]{5}$/;

/** Palavras do primeiro `= new Set([…])` (com set) ou `= […]` (sem). */
function list(set: boolean): string[] {
  const m = (set ? /=\s*new Set\(\[/ : /=\s*\[/).exec(raw);
  if (!m) throw new Error(`lista ${set ? "de chutes" : "de respostas"} não encontrada`);
  const start = m.index + m[0].length;
  const body = raw.slice(start, raw.indexOf("]", start));
  return [...body.matchAll(/"([^"]+)"/g)].map((x) => x[1].normalize("NFC").trim().toLowerCase());
}

const clean = (ws: string[]) => [...new Set(ws)].filter((w) => PT.test(w) && /^[a-z]{5}$/.test(plain(w)));
const sort = (ws: string[]) => [...ws].sort((a, b) => plain(a).localeCompare(plain(b)));

const answers = clean(list(false));
const taken = new Set(answers.map(plain));
const extra = clean(list(true)).filter((w) => !taken.has(plain(w)));

const seen = new Set<string>();
for (const w of [...answers, ...extra]) {
  if (seen.has(plain(w))) throw new Error(`duas palavras com a mesma escrita sem acento: ${w}`);
  seen.add(plain(w));
}

const out = `// Gerado por scripts/words.ts: não edite à mão.

/** ${answers.length} respostas: palavras comuns, com acento. Também valem como chute. */
export const ANSWERS: readonly string[] = "${sort(answers).join(" ")}".split(" ");

/** ${extra.length} palavras que só valem como chute. */
export const EXTRA: readonly string[] = "${sort(extra).join(" ")}".split(" ");
`;
writeFileSync(join(import.meta.dir, "../src/words.ts"), out);
console.log(`${answers.length} respostas e ${extra.length} chutes extras`);
