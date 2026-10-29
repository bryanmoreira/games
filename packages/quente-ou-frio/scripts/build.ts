// Gera data/words.txt e data/vectors.bin a partir de uma pasta com:
//   word2vec/, glove/      um modelo de vetores em cada: vocab.txt (uma palavra por linha, da mais frequente à menos) e
//                          vectors.f32 (as primeiras linhas da matriz, float32 com DIM colunas, na ordem do vocab.txt)
//   pt_BR.dic, pt_BR.aff   dicionário Hunspell pt-BR (só palavras que existem em português entram)
//   pt_lemma_lookup.json   forma → lema (conjugação e plural); só é usado com as regras de `canonical`
// Modelos: word2vec skip-gram e GloVe, 300 dimensões, do NILC/USP (CC BY 4.0), no Hugging Face (nilc-nlp/*-300d).
// O word2vec junta palavras do mesmo tipo (médico → cirurgião, pediatra); o GloVe, do mesmo assunto (médico → hospital,
// paciente). Cada palavra guarda os dois vetores unitários lado a lado: o cosseno do par é a média dos dois cossenos.
// Uso: bun packages/quente-ou-frio/scripts/build.ts <pasta>. A pasta não fica no repositório: data/ já tem o resultado.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { SECRETS } from "../src/secrets";

const DIM = 300;
/** Quantas palavras do topo do modelo olhar. */
const TOP = 200_000;
/** Quantas palavras-base ficam no jogo (as mais frequentes). */
const MAX_WORDS = 40_000;

const dir = process.argv[2];
if (!dir) throw new Error("informe a pasta dos dados");
const read = (f: string) => readFileSync(join(dir, f), "utf8").replace(/^﻿/, "");

const PT = /^[a-záàâãéêíóôõúüç]{2,}$/;

// ---------- modelos ----------
function loadModel(name: string) {
  const vocab = read(`${name}/vocab.txt`).split("\n").slice(0, TOP).map((w) => w.trim());
  const raw = readFileSync(join(dir, name, "vectors.f32"));
  const floats = new Float32Array(raw.buffer, raw.byteOffset, Math.floor(raw.byteLength / 4));
  if (floats.length < vocab.length * DIM) throw new Error(`${name}/vectors.f32 menor que o vocabulário`);
  const row = new Map<string, number>();
  vocab.forEach((w, i) => PT.test(w) && !row.has(w) && row.set(w, i));
  return { floats, row };
}
const w2v = loadModel("word2vec");
const glove = loadModel("glove");
const floats = w2v.floats;
/** posição de frequência (0 = mais frequente), pelo word2vec; só palavras que os dois modelos conhecem */
const freq = new Map([...w2v.row].filter(([w]) => glove.row.has(w)));

// ---------- dicionário: todas as formas que o Hunspell gera e que o modelo conhece ----------
interface Affix { strip: string; add: string; cond: RegExp }
const sfx = new Map<string, { cross: boolean; rules: Affix[] }>();
const pfx = new Map<string, { cross: boolean; rules: Affix[] }>();
for (const line of read("pt_BR.aff").split(/\r?\n/)) {
  const p = line.trim().split(/\s+/);
  if (p[0] !== "SFX" && p[0] !== "PFX") continue;
  const table = p[0] === "SFX" ? sfx : pfx;
  if (p.length === 4 && /^[YN]$/.test(p[2])) {
    table.set(p[1], { cross: p[2] === "Y", rules: [] });
    continue;
  }
  const [, flag, strip, add, cond = "."] = p;
  const re = p[0] === "SFX" ? new RegExp(`${cond}$`) : new RegExp(`^${cond}`);
  table.get(flag)?.rules.push({ strip: strip === "0" ? "" : strip, add: (add === "0" ? "" : add).split("/")[0], cond: re });
}

const valid = new Set<string>();
/** entradas próprias do dicionário ("luz", "bebê", "termo"): são palavras-base, nunca conjugação de outra */
const entries = new Set<string>();
const keep = (w: string) => freq.has(w) && valid.add(w);
for (const line of read("pt_BR.dic").split(/\r?\n/).slice(1)) {
  const [word, flags = ""] = line.split("/");
  if (!word || word !== word.toLowerCase()) continue; // nomes próprios e siglas ficam de fora
  keep(word);
  entries.add(word);
  const fs = [...flags.trim()];
  const suffixed: string[] = [];
  for (const f of fs) {
    const t = sfx.get(f);
    if (!t) continue;
    for (const r of t.rules) {
      if (!r.cond.test(word) || !word.endsWith(r.strip)) continue;
      const w = word.slice(0, word.length - r.strip.length) + r.add;
      keep(w);
      if (t.cross) suffixed.push(w);
    }
  }
  for (const f of fs) {
    const t = pfx.get(f);
    if (!t) continue;
    for (const base of t.cross ? [word, ...suffixed] : [word]) {
      for (const r of t.rules) if (r.cond.test(base) && base.startsWith(r.strip)) keep(r.add + base.slice(r.strip.length));
    }
  }
}
console.log(`${valid.size} formas válidas entre as ${TOP} mais frequentes`);

// ---------- palavras gramaticais: ficam fora do jogo (enchem a lista das mais próximas de "ela", "dela", "que") ----------
const FUNCTION_WORDS = new Set(
  `a à ao aos aquela aquelas aquele aqueles aquilo as às até cada com como contra cujo cuja da das de dela delas dele deles
  desde do dos e ela elas ele eles em entre essa essas esse esses isso isto esta estas este estes eu lhe lhes me mesmo meu meus
  minha minhas na nas nem no nos nós nossa nossas nosso nossos num numa o os ou para pela pelas pelo pelos per perante por porém
  porque qual quais quando que quem se sem sob sobre sua suas seu seus te teu teus tua tuas tu vos vós você vocês comigo contigo
  conosco consigo mas pois contudo todavia entretanto embora conforme enquanto onde aonde cujos cujas ali aí
  aqui lá cá também tampouco já ainda apenas só somente muito muita muitos muitas pouco pouca poucos poucas tão tanto tanta tantos
  tantas todo toda todos todas outro outra outros outras algum alguma alguns algumas nenhum nenhuma qualquer quaisquer
  tal tais não sim mais menos então assim depois antes sempre nunca jamais talvez quase tudo nada algo alguém ninguém
  daí dali daqui dessa desse desta deste disso disto naquele naquela nessa nesse nesta neste nisso nisto àquele àquela`.split(/\s+/),
);

// ---------- forma → palavra-base ----------
const lookup = JSON.parse(read("pt_lemma_lookup.json")) as Record<string, string>;
const isVerb = (w: string) => /(ar|er|ir|or|ôr)$/.test(w);
const PARTICIPLE = /(ad|id|íd)[oa]s?$/;
/** terminação que também é de substantivo ("casa", "canto"): só vira infinitivo se o infinitivo for mais frequente */
const NOUNISH = /[aeo]s?$/;
/** terminação que só verbo tem ("andava", "correndo", "fizesse") */
const VERBISH = /(avam?|ndo|ssem?)$/;
/** abaixo disso, forma e infinitivo aparecem em contextos diferentes: são palavras diferentes ("termo" e "ter", "conta" e "contar") */
const SAME_WORD = 0.3;
/** o mesmo para plural mais frequente que o singular */
const SAME_PLURAL = 0.2;

function cos(a: string, b: string) {
  const i = freq.get(a)! * DIM;
  const j = freq.get(b)! * DIM;
  let s = 0, x = 0, y = 0;
  for (let d = 0; d < DIM; d++) {
    s += floats[i + d] * floats[j + d];
    x += floats[i + d] ** 2;
    y += floats[j + d] ** 2;
  }
  return s / Math.sqrt(x * y);
}

const plain = (w: string) => w.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * O singular de um plural: o que a tabela diz, se for um dos candidatos; senão o candidato válido mais frequente
 * ("pais" → pai, e não pal). Se a forma com -s é a mais frequente e as duas aparecem em contextos diferentes, não é plural
 * ("antes" não é ante, "férias" não é féria; "olhos" é olho).
 */
function singular(w: string): string | undefined {
  const cands = singulars(w).filter((s) => valid.has(s));
  const sg = cands.find((s) => s === lookup[w]) ?? cands.sort((a, b) => freq.get(a)! - freq.get(b)!)[0];
  if (sg && freq.get(w)! < freq.get(sg)! && cos(w, sg) < SAME_PLURAL) return undefined;
  return sg;
}

/** Singulares possíveis de um plural. */
function singulars(w: string): string[] {
  const out: string[] = [];
  const end = (s: string, to: string) => w.endsWith(s) && out.push(w.slice(0, -s.length) + to);
  end("ões", "ão");
  end("ães", "ão");
  end("ãos", "ão");
  end("éis", "el");
  end("óis", "ol");
  end("eis", "el");
  end("ais", "al");
  end("uis", "ul");
  end("is", "il");
  end("ns", "m");
  end("eses", "ês");
  if (/[rsz]es$/.test(w)) end("es", "");
  end("s", "");
  return out;
}

/**
 * A palavra-base de uma forma:
 * - palavra secreta fica como está;
 * - entrada própria do dicionário e substantivo com plural conhecido nunca viram verbo (mas perdem o plural);
 * - particípio (-ado, -ida…) fica como está, só sem o plural: "estado", "partida" e "dados" (→ dado) não viram verbo;
 * - conjugação vira o infinitivo ("corri" → correr, "foi" → ser); se a forma também pode ser substantivo (-a, -e, -o),
 *   só quando o infinitivo é mais frequente e os dois aparecem em contextos parecidos: "casa" continua casa (a tabela
 *   diria casar), "termo" não vira ter, e "corre" vira correr;
 * - plural vira singular quando a tabela diz que é forma de outra palavra ("casas" → casa, "meninas" → menina, e não
 *   "mais" → mal, que a tabela não conhece como forma).
 */
/** formas que a tabela diz serem plural de outra ("olhos" → olho): a outra é substantivo */
const secret = new Set(SECRETS);
const nouns = new Set<string>();
for (const w of valid) if (w.endsWith("s") && lookup[w] && !isVerb(lookup[w])) nouns.add(lookup[w]);

function canonical(w: string): string {
  const lemma = lookup[w];
  if (secret.has(w)) return w;
  if (PARTICIPLE.test(w)) {
    const sg = w.endsWith("s") ? w.slice(0, -1) : w;
    return valid.has(sg) ? sg : w;
  }
  // plural de substantivo antes de verbo: "animais" é animal, não animar
  if (lemma && lemma !== w && w.endsWith("s")) {
    const sg = singular(w);
    if (sg && (entries.has(sg) || nouns.has(sg) || secret.has(sg))) return sg;
  }
  if (lemma && lemma !== w && isVerb(lemma) && valid.has(lemma) && !entries.has(w) && !nouns.has(w)) {
    if (!NOUNISH.test(w) || VERBISH.test(w)) return lemma;
    if (freq.get(w)! > freq.get(lemma)! && cos(w, lemma) >= SAME_WORD) return lemma;
  }
  if (lemma && lemma !== w && w.endsWith("s")) {
    const sg = singular(w);
    if (sg) return sg;
  }
  // a tabela não conhece alguns plurais com acento no fim ("bebês", "irmãs"); o singular precisa ser mais frequente ("mês" não é plural de "mê")
  if (!lemma && /[áéêóôã]s$/.test(w) && valid.has(w.slice(0, -1)) && freq.get(w.slice(0, -1))! < freq.get(w)!) return w.slice(0, -1);
  return w;
}

const base = new Map<string, string>();
const resolve = (w: string): string => {
  let cur = w;
  for (let i = 0; i < 4; i++) {
    const next = canonical(cur);
    if (next === cur) break;
    cur = next;
  }
  return cur;
};
for (const w of valid) base.set(w, resolve(w));

// palavras-base: as que apontam para si mesmas, da mais frequente à menos
let lemmas = [...new Set(base.values())].filter((l) => valid.has(l) && base.get(l) === l).sort((a, b) => freq.get(a)! - freq.get(b)!);

// escrita sem acento de uma palavra bem mais frequente com acento ("musica" → música) é a mesma palavra;
// as duas com frequência parecida são palavras diferentes ("pais" e "país") e ficam separadas
const accentedOf = new Map<string, string>();
for (const l of lemmas) if (plain(l) !== l && !accentedOf.has(plain(l))) accentedOf.set(plain(l), l);
for (const l of lemmas) {
  const a = accentedOf.get(l);
  if (a && freq.get(l)! > 8 * freq.get(a)!) for (const [f, b] of base) if (b === l) base.set(f, a);
}

// grafia de Portugal com acento agudo onde o Brasil usa circunflexo ("bebé", "ténis", "económico") vira a brasileira;
// "avó" e "avô" (ó/ô no fim) são palavras diferentes e ficam
const brazilian = new Map(lemmas.map((l) => [l, l]));
const isPtVariant = (pt: string, br: string) =>
  pt.length === br.length &&
  [...pt].every((c, i) => c === br[i] || (c === "é" && br[i] === "ê") || (c === "ó" && br[i] === "ô" && i < pt.length - 1)) &&
  pt !== br;
const byPlain = new Map<string, string[]>();
for (const l of lemmas) byPlain.set(plain(l), [...(byPlain.get(plain(l)) ?? []), l]);
for (const group of byPlain.values())
  for (const pt of group) {
    const br = group.find((b) => isPtVariant(pt, b));
    if (br && !secret.has(pt)) brazilian.set(pt, br);
  }
for (const [f, b] of base) if (brazilian.get(b) !== b) base.set(f, brazilian.get(b)!);
lemmas = lemmas.filter((l) => base.get(l) === l && !FUNCTION_WORDS.has(l));
const words = lemmas.slice(0, MAX_WORDS);
const index = new Map(words.map((w, i) => [w, i]));
const forms: string[][] = words.map(() => []);
for (const [f, l] of base) {
  const i = index.get(l);
  if (i !== undefined && f !== l && !FUNCTION_WORDS.has(f)) forms[i].push(f);
}
for (const fs of forms) fs.sort((a, b) => freq.get(a)! - freq.get(b)!);

// ---------- saída ----------
const out = join(import.meta.dir, "../data");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "words.txt"), words.map((w, i) => [w, ...forms[i]].join(" ")).join("\n") + "\n");

// vetor de cada palavra-base: word2vec e GloVe unitários lado a lado, em int8 (escala por vetor: só a direção importa no cosseno)
const OUT = 2 * DIM;
const q = new Int8Array(words.length * OUT);
const v = new Float32Array(OUT);
words.forEach((w, i) => {
  [w2v, glove].forEach((m, k) => {
    const row = m.row.get(w)! * DIM;
    let n = 0;
    for (let d = 0; d < DIM; d++) n += m.floats[row + d] ** 2;
    n = Math.sqrt(n) || 1;
    for (let d = 0; d < DIM; d++) v[k * DIM + d] = m.floats[row + d] / n;
  });
  let max = 0;
  for (let d = 0; d < OUT; d++) max = Math.max(max, Math.abs(v[d]));
  for (let d = 0; d < OUT; d++) q[i * OUT + d] = Math.round((v[d] / (max || 1)) * 127);
});
writeFileSync(join(out, "vectors.bin"), q);
console.log(`${words.length} palavras-base (de ${lemmas.length}), ${forms.reduce((n, f) => n + f.length, 0)} formas extras`);
