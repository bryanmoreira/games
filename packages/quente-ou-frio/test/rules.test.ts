import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  attempts,
  barPct,
  best,
  closest,
  dailySecret,
  DIM,
  FIRST_HINT,
  freeSecret,
  guess,
  heat,
  hint,
  hintRank,
  hintsUsed,
  MIN_GAP_DAYS,
  Model,
  newGame,
  replay,
  SECRETS,
  shareText,
  status,
  type GameState,
} from "../src";

const data = join(import.meta.dir, "../data");
const buf = readFileSync(join(data, "vectors.bin"));
const model = new Model(readFileSync(join(data, "words.txt"), "utf8"), new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength));
const idx = (w: string) => model.indexOf(w)!;

/** Modelo pequeno: palavra i aponta para um ângulo, então a ordem é conhecida. */
function tiny(words: string[]) {
  const v = new Int8Array(words.length * DIM);
  words.forEach((_, i) => {
    v[i * DIM] = Math.round(127 * Math.cos(i * 0.1));
    v[i * DIM + 1] = Math.round(127 * Math.sin(i * 0.1));
  });
  return new Model(words.join("\n"), v);
}

describe("vocabulário", () => {
  test("toda secreta é palavra-base", () => {
    for (const w of SECRETS) expect(model.indexOf(w)).not.toBeNull();
    expect(new Set(SECRETS).size).toBe(SECRETS.length);
  });

  test("acento, maiúscula, plural e conjugação levam à palavra-base", () => {
    const base = (w: string) => model.words[model.find(w)!];
    expect(base("Casas")).toBe("casa");
    expect(base("musica")).toBe("música");
    expect(base("MÚSICA")).toBe("música");
    expect(base("corri")).toBe("correr");
    expect(base("correndo")).toBe("correr");
    expect(base("foi")).toBe("ser");
    expect(base("cães")).toBe("cão");
    expect(base("olhos")).toBe("olho");
    expect(base("  pão ")).toBe("pão");
    expect(base("meninas")).toBe("menina");
    expect(base("animais")).toBe("animal");
    expect(base("países")).toBe("país");
    expect(base("pais")).toBe("pai");
    expect(base("meses")).toBe("mês");
    expect(base("bebês")).toBe("bebê");
    // grafia de Portugal vira a brasileira
    expect(base("bebé")).toBe("bebê");
    expect(base("ténis")).toBe("tênis");
  });

  test("palavra terminada em s que não é plural continua igual", () => {
    for (const w of ["três", "mês", "lápis", "férias", "óculos", "ônibus"]) expect(model.words[model.find(w)!]).toBe(w);
  });

  test("palavras gramaticais ficam fora", () => {
    for (const w of ["ela", "dela", "que", "para", "mais", "antes"]) expect(model.indexOf(w)).toBeNull();
    for (const w of ["bem", "mal", "caso", "segundo"]) expect(model.find(w)).not.toBeNull();
  });

  test("substantivo que também é verbo conjugado continua substantivo", () => {
    for (const w of ["casa", "jogo", "olho", "luz", "termo", "estado", "saída", "conta"]) expect(model.words[model.find(w)!]).toBe(w);
  });

  test("palavra desconhecida", () => {
    expect(model.find("xyzwk")).toBeNull();
    expect(model.find("")).toBeNull();
    expect(model.find("a".repeat(40))).toBeNull();
  });
});

describe("posições", () => {
  test("a secreta é a 1 e as posições são uma permutação", () => {
    const s = idx("cachorro");
    const { rank, order } = model.ranking(s);
    expect(rank[s]).toBe(1);
    expect(order[0]).toBe(s);
    for (let r = 0; r < 1000; r++) expect(rank[order[r]]).toBe(r + 1);
  });

  test("palavra parecida fica perto, palavra sem relação fica longe", () => {
    const { rank } = model.ranking(idx("cachorro"));
    expect(rank[idx("cão")]).toBeLessThan(20);
    expect(rank[idx("gato")]).toBeLessThan(300);
    expect(rank[idx("imposto")]).toBeGreaterThan(5000);
  });

  test("cache devolve a mesma ordem", () => {
    const a = model.ranking(idx("praia"));
    expect(model.ranking(idx("praia"))).toBe(a);
  });

  test("calcular as posições é rápido", () => {
    const t = performance.now();
    model.ranking(idx("vulcão"));
    expect(performance.now() - t).toBeLessThan(1500);
  });

  test("calor e barra", () => {
    expect(heat(1)).toBe("hot");
    expect(heat(300)).toBe("hot");
    expect(heat(301)).toBe("warm");
    expect(heat(1500)).toBe("warm");
    expect(heat(1501)).toBe("cold");
    expect(barPct(1, 50000)).toBe(100);
    expect(barPct(50000, 50000)).toBe(2);
    expect(barPct(10, 50000)).toBeGreaterThan(barPct(100, 50000));
  });
});

describe("partida", () => {
  const words = ["sol", "lua", "mar", "rio", "céu", "luz", "dia", "fim"];
  const m = tiny(words);
  const secret = 0; // "sol": a posição de cada palavra é o índice + 1

  test("chute, repetido, desconhecido e vitória", () => {
    let s = newGame();
    const a = guess(m, secret, s, "rio");
    expect(a.ok && a.move).toEqual({ word: "rio", rank: 4 });
    s = (a as { state: GameState }).state;
    expect(guess(m, secret, s, "RIO")).toEqual({ ok: false, error: "repeat", word: "rio" });
    expect(guess(m, secret, s, "xis")).toEqual({ ok: false, error: "unknown" });
    const w = guess(m, secret, s, "Sol");
    expect(w.ok).toBe(true);
    s = (w as { state: GameState }).state;
    expect(status(s)).toBe("won");
    expect(attempts(s)).toBe(2);
    expect(guess(m, secret, s, "mar")).toEqual({ ok: false, error: "over" });
  });

  test("dica: primeira na 300 (ou a última), depois a metade da melhor, nunca a secreta", () => {
    expect(hintRank(newGame(), 50000)).toBe(FIRST_HINT);
    expect(hintRank(newGame(), 8)).toBe(8);
    expect(hintRank({ moves: [{ word: "x", rank: 41 }] }, 50000)).toBe(20);
    expect(hintRank({ moves: [{ word: "x", rank: 3 }] }, 50000)).toBe(2);
    // melhor na 2: a próxima livre depois dela
    expect(hintRank({ moves: [{ word: "x", rank: 2 }, { word: "y", rank: 3 }] }, 50000)).toBe(4);
    expect(hintRank({ moves: [{ word: "x", rank: 1 }] }, 50000)).toBeNull();

    let s = newGame();
    for (let k = 0; k < words.length - 1; k++) {
      const r = hint(m, secret, s);
      expect(r.ok).toBe(true);
      if (!r.ok) break;
      expect(r.move.rank).toBeGreaterThan(1);
      expect(s.moves.some((x) => x.word === r.move.word)).toBe(false);
      s = r.state;
    }
    expect(hint(m, secret, s).ok).toBe(false);
    expect(hintsUsed(s)).toBe(words.length - 1);
    expect(attempts(s)).toBe(0);
    expect(status(s)).toBe("playing");
  });

  test("replay confere as dicas e os chutes", () => {
    let s = newGame();
    for (const step of ["fim", "?", "mar", "?"]) {
      const r = step === "?" ? hint(m, secret, s) : guess(m, secret, s, step);
      if (r.ok) s = r.state;
    }
    const sent = s.moves.map((x) => ({ word: x.word, hint: x.hint }));
    expect(replay(m, secret, sent)).toEqual(s);
    expect(replay(m, secret, sent, true)?.gaveUp).toBe(true);
    // dica trocada, palavra que não é base, repetida, depois do fim
    expect(replay(m, secret, [{ word: "lua", hint: true }])).toBeNull();
    expect(replay(m, secret, [{ word: "SOL" }])).toBeNull();
    expect(replay(m, secret, [{ word: "mar" }, { word: "mar" }])).toBeNull();
    expect(replay(m, secret, [{ word: "sol" }, { word: "mar" }])).toBeNull();
    expect(replay(m, secret, [{ word: "sol" }], true)).toBeNull();
  });

  test("melhor posição, mais próximas e texto para compartilhar", () => {
    const s: GameState = { moves: [{ word: "fim", rank: 8 }, { word: "lua", rank: 2, hint: true }, { word: "sol", rank: 1 }] };
    expect(best(s)).toBe(1);
    expect(closest(m, secret, 3)).toEqual([
      { word: "sol", rank: 1 },
      { word: "lua", rank: 2 },
      { word: "mar", rank: 3 },
    ]);
    expect(shareText(s, "Quente ou Frio #3")).toBe("Quente ou Frio #3\n2 tentativas · 1 dica\n🟩 3");
    expect(shareText({ moves: [{ word: "x", rank: 9000 }], gaveUp: true }, "T")).toBe("T\nDesisti\n🟥 1");
  });
});

describe("sorteio", () => {
  test("livre: o mesmo número dá a mesma palavra", () => {
    expect(freeSecret(123)).toBe(freeSecret(123));
    expect(SECRETS).toContain(freeSecret(987654));
  });

  test("palavra do dia: todas as secretas num ciclo, sem repetir perto da virada", () => {
    const n = SECRETS.length;
    const first = Array.from({ length: n }, (_, d) => dailySecret(d));
    expect(new Set(first).size).toBe(n);
    const days = Array.from({ length: 3 * n }, (_, d) => dailySecret(d));
    const last = new Map<string, number>();
    days.forEach((w, d) => {
      if (last.has(w)) expect(d - last.get(w)!).toBeGreaterThanOrEqual(MIN_GAP_DAYS);
      last.set(w, d);
    });
  });
});
