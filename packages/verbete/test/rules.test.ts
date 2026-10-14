import { describe, expect, test } from "bun:test";
import {
  accented,
  boardMarks,
  boardGuesses,
  DAILY_COUNT,
  dailyWords,
  MIN_GAP_DAYS,
  guess,
  isWord,
  letterMarks,
  MAX_GUESSES,
  mulberry32,
  newGame,
  pickWords,
  plain,
  replay,
  score,
  shareText,
  solvedAt,
  status,
  ANSWERS,
  EXTRA,
  isAnswer,
  type GameState,
  type Mark,
  type Mode,
} from "../src";

const R: Mark = "right";
const P: Mark = "place";
const A: Mark = "absent";

/** Joga os chutes em ordem e devolve o estado (falha se algum for recusado). */
function play(s: GameState, ...words: string[]) {
  for (const w of words) {
    const r = guess(s, w);
    if (!r.ok) throw new Error(`${w}: ${r.error}`);
    s = r.state;
  }
  return s;
}

describe("lista de palavras", () => {
  test("todas de 5 letras, sem repetir e sem letras estrangeiras", () => {
    const all = [...ANSWERS, ...EXTRA];
    expect(ANSWERS.length).toBeGreaterThan(1400);
    expect(EXTRA.length).toBeGreaterThan(9000);
    expect(new Set(all.map(plain)).size).toBe(all.length);
    for (const w of all) expect(plain(w)).toMatch(/^[a-z]{5}$/);
    expect(isWord("aioli")).toBe(false);
    expect(isWord("flute")).toBe(false);
  });

  test("respostas são palavras comuns; as raras só valem como chute", () => {
    for (const w of ["livro", "festa", "mundo", "tempo", "suíte"]) expect(isAnswer(w)).toBe(true);
    expect(isWord("ababa")).toBe(true);
    expect(isAnswer("ababa")).toBe(false);
    for (const w of ANSWERS) expect(isWord(w)).toBe(true);
  });

  test("acento e cedilha são preenchidos sozinhos", () => {
    expect(plain("Ábaco")).toBe("abaco");
    expect(plain("aboço")).toBe("aboco");
    expect(accented("abaco")).toBe("ábaco");
    expect(accented("ABOCO")).toBe("aboço");
    expect(accented("amigo")).toBe("amigo");
    expect(accented("suite")).toBe("suíte");
    expect(accented("zzzzz")).toBeNull();
  });
});

describe("marcas", () => {
  test("verde, amarelo e cinza", () => {
    expect(score("porte", "porto")).toEqual([R, R, R, R, A]);
    expect(score("sonho", "amigo")).toEqual([A, A, A, A, R]);
    expect(score("amigo", "gamio")).toEqual([P, P, P, P, R]);
  });

  test("letra repetida no chute só marca quantas vezes aparece na resposta", () => {
    // resposta com um A só: o primeiro A fora do lugar fica amarelo, os outros cinza
    expect(score("ababa", "porta")).toEqual([A, A, A, A, R]);
    expect(score("aaxxx", "baxxx")).toEqual([A, R, R, R, R]);
    expect(score("aaaxx", "xxbba")).toEqual([P, A, A, P, P]);
  });

  test("o verde tem prioridade sobre o amarelo da mesma letra", () => {
    expect(score("aabbb", "ccaab")).toEqual([P, P, A, A, R]);
    expect(score("abbba", "ccccb")).toEqual([A, P, A, A, A]);
  });

  test("letra repetida na resposta marca as duas", () => {
    expect(score("abada", "ababa")).toEqual([R, R, R, A, R]);
    expect(score("aaxxx", "xxxaa")).toEqual([P, P, R, P, P]);
  });

  test("acento não muda as marcas", () => {
    expect(score("ábaco", "abaco")).toEqual([R, R, R, R, R]);
    expect(score("aboço", "aboco")).toEqual([R, R, R, R, R]);
  });
});

describe("partida", () => {
  test("6, 7 e 9 tentativas", () => {
    expect(MAX_GUESSES).toEqual({ 1: 6, 2: 7, 4: 9 });
  });

  test("acerta e vence", () => {
    let s = newGame(1, ["porto"]);
    s = play(s, "porte");
    expect(status(s)).toBe("playing");
    s = play(s, "pórto");
    expect(status(s)).toBe("won");
    expect(solvedAt(s, 0)).toBe(1);
    expect(guess(s, "amigo")).toEqual({ ok: false, error: "over" });
  });

  test("palavra incompleta ou fora da lista não gasta tentativa", () => {
    const s = newGame(1, ["porto"]);
    expect(guess(s, "port")).toEqual({ ok: false, error: "short" });
    expect(guess(s, "")).toEqual({ ok: false, error: "short" });
    expect(guess(s, "zzzzz")).toEqual({ ok: false, error: "unknown" });
    expect(s.guesses).toEqual([]);
  });

  test("perde depois da última tentativa", () => {
    let s = newGame(1, ["porto"]);
    for (let i = 0; i < 5; i++) s = play(s, "amigo");
    expect(status(s)).toBe("playing");
    s = play(s, "sonho");
    expect(status(s)).toBe("lost");
  });

  test("acertar na última tentativa ainda vence", () => {
    let s = newGame(1, ["porto"]);
    for (let i = 0; i < 5; i++) s = play(s, "amigo");
    expect(status(play(s, "porto"))).toBe("won");
  });

  test("dueto: o quadro resolvido para de receber chutes", () => {
    let s = newGame(2, ["porto", "amigo"]);
    s = play(s, "porto", "sonho", "amigo");
    expect(boardGuesses(s, 0)).toEqual(["porto"]);
    expect(boardGuesses(s, 1)).toEqual(["porto", "sonho", "amigo"]);
    expect(status(s)).toBe("won");
  });

  test("dueto: perde se sobrar um quadro no fim", () => {
    let s = newGame(2, ["porto", "amigo"]);
    s = play(s, "porto", ...Array(6).fill("sonho"));
    expect(s.guesses.length).toBe(7);
    expect(status(s)).toBe("lost");
  });

  test("quarteto: 9 tentativas para as quatro", () => {
    let s = newGame(4, ["porto", "amigo", "sonho", "abade"]);
    s = play(s, "abafa", "porto", "amigo", "sonho", "posta", "potes", "aceso", "aceto");
    expect(status(s)).toBe("playing");
    expect(status(play(s, "abade"))).toBe("won");
  });

  test("teclado: melhor marca de cada letra, só até resolver o quadro", () => {
    let s = newGame(2, ["porto", "amigo"]);
    s = play(s, "posta", "porto", "sonho");
    const k0 = letterMarks(s, 0);
    expect(k0.p).toBe("right");
    expect(k0.s).toBe("absent");
    expect(k0.n).toBeUndefined(); // "sonho" veio depois de resolver
    const k1 = letterMarks(s, 1);
    expect(k1.o).toBe("right");
    expect(k1.p).toBe("absent");
  });

  test("número errado de palavras para o modo", () => {
    expect(() => newGame(2, ["porto"])).toThrow();
  });
});

describe("refazer pelos chutes (resultado mandado pelo navegador)", () => {
  test("partida válida", () => {
    const s = replay(2, ["porta", "festa"], ["porta", "festa"]);
    expect(s && status(s)).toBe("won");
  });

  test("recusa chute fora da lista, chute depois do fim e respostas repetidas", () => {
    expect(replay(1, ["porta"], ["zzzzz"])).toBeNull();
    expect(replay(1, ["porta"], ["porta", "amigo"])).toBeNull();
    expect(replay(2, ["porta", "pórta"], ["porta"])).toBeNull();
    expect(replay(1, ["zzzzz"], [])).toBeNull();
    expect(replay(1, ["porta", "festa"], [])).toBeNull();
    expect(replay(1, ["porta"], Array(7).fill("amigo"))).toBeNull();
    // palavra que só vale como chute não pode ser resposta
    expect(replay(1, ["porto"], ["porto"])).toBeNull();
  });
});

describe("sorteio", () => {
  test("palavras do dia: 7 respostas diferentes, sempre as mesmas para o mesmo dia", () => {
    const d = dailyWords(42);
    expect(d[1]).toHaveLength(1);
    expect(d[2]).toHaveLength(2);
    expect(d[4]).toHaveLength(4);
    const all = [...d[1], ...d[2], ...d[4]];
    expect(new Set(all.map(plain)).size).toBe(7);
    for (const w of all) expect(isAnswer(w)).toBe(true);
    expect(dailyWords(42)).toEqual(d);
    expect(dailyWords(43)).not.toEqual(d);
  });

  const day = (d: number) => Object.values(dailyWords(d)).flat();
  const perCycle = Math.floor(ANSWERS.length / DAILY_COUNT);

  test("cada ciclo (206 dias) usa cada resposta uma vez só, somando os três modos", () => {
    for (const c of [0, 1, 5]) {
      const words = Array.from({ length: perCycle }, (_, i) => day(c * perCycle + i)).flat();
      expect(new Set(words).size).toBe(perCycle * DAILY_COUNT);
    }
  });

  test(`na virada do ciclo, nenhuma palavra volta antes de ${MIN_GAP_DAYS} dias`, () => {
    const last = new Map<string, number>();
    let gap = Infinity;
    for (let d = 0; d < perCycle * 8; d++) {
      for (const w of day(d)) {
        if (last.has(w)) gap = Math.min(gap, d - last.get(w)!);
        last.set(w, d);
      }
    }
    expect(gap).toBeGreaterThanOrEqual(MIN_GAP_DAYS);
  });

  test("pickWords respeita o que já saiu", () => {
    const rng = mulberry32(1);
    const skip = ANSWERS.slice(0, ANSWERS.length - 3);
    expect(pickWords(3, rng, skip).sort()).toEqual(ANSWERS.slice(-3).sort());
  });
});

describe("compartilhar", () => {
  test("verbete: tentativas, sequência e grade sem letras", () => {
    const s = play(newGame(1, ["porto"]), "amigo", "porte", "porto");
    expect(shareText(s, "Verbete #3", 2)).toBe("Verbete #3 3/6 🔥 2\n\n⬛⬛⬛⬛🟩\n🟩🟩🟩🟩⬛\n🟩🟩🟩🟩🟩");
    // sem sequência (livre ou sequência zerada): sem 🔥
    expect(shareText(s, "Verbete livre").split("\n")[0]).toBe("Verbete livre 3/6");
    const lost = play(newGame(1, ["porto"]), ...Array(6).fill("amigo"));
    expect(shareText(lost, "Verbete #3").split("\n")[0]).toBe("Verbete #3 X/6");
  });

  test("dueto: tentativa de cada palavra e as duas grades lado a lado", () => {
    const d = play(newGame(2, ["porto", "amigo"]), "amigo", "sonho", "porto");
    // a da direita acabou no 1º chute; a da esquerda segue sozinha
    expect(shareText(d, "Dueto #3", 1)).toBe("Dueto #3 🔥 1\n\n3️⃣1️⃣\n\n⬛⬛⬛⬛🟩 🟩🟩🟩🟩🟩\n⬛🟩⬛⬛🟩\n🟩🟩🟩🟩🟩");
    // a da esquerda acabou antes: o lugar dela fica em branco para a da direita não andar
    const e = play(newGame(2, ["amigo", "porto"]), "amigo", "porto");
    expect(shareText(e, "Dueto").split("\n").slice(-2)).toEqual(["🟩🟩🟩🟩🟩 ⬛⬛⬛⬛🟩", "　".repeat(5) + " 🟩🟩🟩🟩🟩"]);
  });

  test("quarteto: tentativa de cada palavra em 2×2, 🟥 na que faltou (a grade vai na imagem)", () => {
    let q = newGame(4, ["porto", "amigo", "sonho", "abade"]);
    q = play(q, "sonho", "porto", ...Array(7).fill("amigo"));
    expect(status(q)).toBe("lost");
    expect(shareText(q, "Quarteto")).toBe("Quarteto\n\n2️⃣3️⃣\n1️⃣🟥");
  });

  test("marcas por quadro só até o chute que o resolveu", () => {
    const d = play(newGame(2, ["porto", "amigo"]), "amigo", "porto");
    expect(boardMarks(d).map((b) => b.length)).toEqual([2, 1]);
  });
});

describe("simulação", () => {
  test("500 partidas com chutes aleatórios terminam no limite de cada modo", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 500; i++) {
      const mode = ([1, 2, 4] as Mode[])[i % 3];
      let s = newGame(mode, pickWords(mode, rng));
      while (status(s) === "playing") {
        // às vezes chuta uma das respostas, às vezes qualquer palavra
        const w = rng() < 0.3 ? s.answers[Math.floor(rng() * mode)] : pickWords(1, rng)[0];
        s = play(s, w);
      }
      expect(s.guesses.length).toBeLessThanOrEqual(MAX_GUESSES[mode]);
      const again = replay(mode, s.answers, s.guesses);
      expect(again && status(again)).toBe(status(s));
    }
  });
});
