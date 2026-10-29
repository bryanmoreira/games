import { plain } from "./game";

// Vocabulário e vetores das palavras (gerados por scripts/build.ts em data/). Só roda no servidor:
// com eles dá para saber a palavra secreta.

/** word2vec e GloVe de 300 dimensões, lado a lado */
export const DIM = 600;

/** Posições de todas as palavras em relação a uma secreta. */
export interface Ranking {
  /** posição de cada palavra (pelo índice), 1 = a secreta */
  rank: Int32Array;
  /** palavra (índice) em cada posição: order[0] é a secreta */
  order: Int32Array;
}

export class Model {
  /** palavras-base, da mais frequente à menos */
  readonly words: string[];
  private readonly exact = new Map<string, number>();
  private readonly loose = new Map<string, number>();
  private readonly norms: Float32Array;
  private readonly cache = new Map<number, Ranking>();

  /**
   * `text`: uma linha por palavra-base, com as outras formas dela depois (`casa casas`).
   * `vectors`: `DIM` números int8 por linha, na mesma ordem.
   */
  constructor(text: string, private readonly vectors: Int8Array, private readonly cacheSize = 64) {
    const lines = text.trim().split("\n");
    if (vectors.length !== lines.length * DIM) throw new Error("vetores e vocabulário não batem");
    this.words = lines.map((l) => l.split(" ")[0]);
    // forma exata primeiro; sem acento, vale a palavra mais frequente com aquela escrita
    lines.forEach((l, i) => {
      for (const f of l.split(" ")) {
        if (!this.exact.has(f)) this.exact.set(f, i);
        const p = plain(f);
        if (!this.loose.has(p)) this.loose.set(p, i);
      }
    });
    this.norms = new Float32Array(lines.length);
    for (let i = 0; i < lines.length; i++) {
      let s = 0;
      for (let d = i * DIM; d < (i + 1) * DIM; d++) s += vectors[d] * vectors[d];
      this.norms[i] = Math.sqrt(s) || 1;
    }
  }

  get size() {
    return this.words.length;
  }

  /** Índice da palavra-base de um chute ("Casas" → casa, "corri" → correr), ou null se não conhece. */
  find(input: string): number | null {
    const w = input.trim().toLowerCase().normalize("NFC");
    if (!w || w.length > 30) return null;
    return this.exact.get(w) ?? this.loose.get(plain(w)) ?? null;
  }

  /** Índice de uma palavra-base exata (como guardada nos chutes), ou null. */
  indexOf(word: string): number | null {
    const i = this.exact.get(word);
    return i !== undefined && this.words[i] === word ? i : null;
  }

  /** Posições de todas as palavras pela similaridade de cosseno com a secreta. Fica em cache. */
  ranking(secret: number): Ranking {
    const hit = this.cache.get(secret);
    if (hit) {
      // mais recente vai para o fim
      this.cache.delete(secret);
      this.cache.set(secret, hit);
      return hit;
    }
    const n = this.size;
    const v = this.vectors;
    const s0 = secret * DIM;
    const sim = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      let dot = 0;
      const a = i * DIM;
      for (let d = 0; d < DIM; d++) dot += v[a + d] * v[s0 + d];
      sim[i] = dot / this.norms[i];
    }
    sim[secret] = Infinity;
    const order = new Int32Array(n);
    for (let i = 0; i < n; i++) order[i] = i;
    // empate (raro): a mais frequente primeiro, para a ordem não depender do motor de JS
    order.sort((a, b) => sim[b] - sim[a] || a - b);
    const rank = new Int32Array(n);
    for (let r = 0; r < n; r++) rank[order[r]] = r + 1;
    const out = { rank, order };
    this.cache.set(secret, out);
    if (this.cache.size > this.cacheSize) this.cache.delete(this.cache.keys().next().value!);
    return out;
  }
}
