import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Model } from "@mesa/quente-ou-frio";

// Vocabulário e vetores do Quente ou Frio, lidos uma vez por processo (~15 MB). Só no servidor.
// Em dev e no standalone o diretório atual é apps/web (nos testes, a raiz); os arquivos entram no build por
// outputFileTracingIncludes.

const DATA = "packages/quente-ou-frio/data";
const dir = () => [join(process.cwd(), "../..", DATA), join(process.cwd(), DATA)].find((d) => existsSync(join(d, "words.txt")));

let model: Model | null = null;

export function getModel(): Model {
  if (model) return model;
  const DIR = dir();
  if (!DIR) throw new Error("vocabulário do Quente ou Frio não encontrado");
  const buf = readFileSync(join(DIR, "vectors.bin"));
  model = new Model(readFileSync(join(DIR, "words.txt"), "utf8"), new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength));
  return model;
}
