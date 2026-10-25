import { describe, expect, test } from "bun:test";
import {
  applyAction,
  cellsOf,
  DIRS,
  generate,
  gameFrom,
  hintable,
  LEVEL_CONF,
  LEVELS,
  lineCells,
  newGame,
  occurrences,
  snap,
  THEMES,
  wordAt,
  type GameState,
} from "../src";

const letters = (s: GameState | ReturnType<typeof generate>, i: number) => cellsOf(s, s.words[i]).map((c) => s.grid[c]).join("");

describe("temas", () => {
  test("palavras sem acento, sem espaço e sem repetir", () => {
    for (const t of THEMES) {
      for (const w of t.words) expect(w).toMatch(/^[A-Z]{3,15}$/);
      expect(new Set(t.words).size).toBe(t.words.length);
    }
  });

  test("todo tema tem palavras de sobra para todos os níveis", () => {
    for (const t of THEMES) {
      expect(t.words.filter((w) => w.length <= LEVEL_CONF.easy.size).length).toBeGreaterThanOrEqual(LEVEL_CONF.easy.words * 2);
      expect(t.words.length).toBeGreaterThanOrEqual(LEVEL_CONF.hard.words + 10);
    }
  });

  test("ids únicos", () => {
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(THEMES.length);
  });
});

describe("linhas", () => {
  test("lineCells: reta, diagonal e fora de linha", () => {
    expect(lineCells(10, 0, 3)).toEqual([0, 1, 2, 3]);
    expect(lineCells(10, 3, 0)).toEqual([3, 2, 1, 0]);
    expect(lineCells(10, 0, 22)).toEqual([0, 11, 22]);
    expect(lineCells(10, 20, 2)).toEqual([20, 11, 2]);
    expect(lineCells(10, 0, 12)).toBeNull();
    expect(lineCells(10, 5, 5)).toEqual([5]);
  });

  test("snap leva o dedo para a direção mais perto e não passa da borda", () => {
    // da casa 0 (centro 0,5 / 0,5)
    expect(snap(10, 0, 0.6, 3.4)).toBe(3); // →
    expect(snap(10, 0, 3.4, 0.4)).toBe(30); // ↓
    expect(snap(10, 0, 2.6, 2.4)).toBe(22); // ↘
    expect(snap(10, 0, 0.5, 0.7)).toBe(0); // em cima da própria casa
    expect(snap(10, 0, 0.5, 40)).toBe(9); // além da borda
    expect(snap(10, 0, -3, 2)).toBe(0); // para cima não tem casa
    // do meio para ↖
    expect(snap(10, 55, 2.4, 2.6)).toBe(22);
    expect(snap(10, 55, 5.4, 8.5)).toBe(58);
  });
});

describe("gerador", () => {
  test("mesmo seed, mesma grade", () => {
    expect(generate("hard", "animais", 42)).toEqual(generate("hard", "animais", 42));
    expect(generate("hard", "animais", 42).grid).not.toBe(generate("hard", "animais", 43).grid);
  });

  test("centenas de grades: tamanho, direções do nível, letras e palavra única", () => {
    let n = 0;
    for (const level of LEVELS) {
      const conf = LEVEL_CONF[level];
      for (const t of THEMES) {
        for (let seed = 1; seed <= 6; seed++) {
          const p = generate(level, t.id, seed * 7919 + n);
          n++;
          expect(p.size).toBe(conf.size);
          expect(p.grid).toMatch(new RegExp(`^[A-Z]{${conf.size * conf.size}}$`));
          expect(p.words.length).toBe(conf.words);
          expect(new Set(p.words.map((w) => w.word)).size).toBe(conf.words);
          // ordem alfabética na lista
          expect(p.words.map((w) => w.word)).toEqual(p.words.map((w) => w.word).sort((a, b) => a.localeCompare(b)));
          p.words.forEach((w, i) => {
            expect(t.words).toContain(w.word);
            expect(conf.dirs).toContain(w.dir);
            expect(letters(p, i)).toBe(w.word);
            expect(occurrences(p.grid, p.size, w.word)).toHaveLength(1);
          });
          // nenhuma palavra dentro de outra
          for (const a of p.words) for (const b of p.words) if (a !== b) expect(a.word.includes(b.word)).toBe(false);
        }
      }
    }
    expect(n).toBe(LEVELS.length * THEMES.length * 6);
  });

  test("o difícil usa as 8 direções", () => {
    const dirs = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) for (const w of generate("hard", "paises", seed).words) dirs.add(w.dir);
    expect(dirs.size).toBe(DIRS.length);
  });

  test("occurrences conta palíndromo uma vez", () => {
    expect(occurrences("OSSOXXXXXXXXXXXX", 4, "OSSO")).toEqual(["0-3"]);
    expect(occurrences("ABCXXXCBA", 3, "ABC")).toHaveLength(2);
  });
});

describe("partida", () => {
  const game = () => gameFrom(generate("easy", "frutas", 5));
  const ends = (s: GameState, i: number) => {
    const c = cellsOf(s, s.words[i]);
    return [c[0], c[c.length - 1]] as const;
  };

  test("achar uma palavra nos dois sentidos", () => {
    const s = game();
    const [a, b] = ends(s, 0);
    expect(wordAt(s, a, b)).toBe(0);
    expect(wordAt(s, b, a)).toBe(0);
    const r = applyAction(s, { type: "select", from: b, to: a });
    expect(r.ok && r.state.found).toEqual([0]);
    expect(r.ok && r.state.last).toEqual({ id: 1, type: "found", word: 0 });
  });

  test("seleção errada é tentativa sem efeito; casa só e fora de linha não contam", () => {
    const s = game();
    const [a, b] = ends(s, 0);
    // um pedaço da palavra
    const part = lineCells(s.size, a, b)!;
    const r = applyAction(s, { type: "select", from: a, to: part[part.length - 2] });
    expect(r.ok && r.state.last?.type).toBe("miss");
    expect(r.ok && r.state.found).toEqual([]);
    expect(applyAction(s, { type: "select", from: a, to: a }).ok).toBe(false);
    expect(applyAction(s, { type: "select", from: 0, to: 12 }).ok).toBe(false);
    expect(applyAction(s, { type: "select", from: -1, to: 3 }).ok).toBe(false);
    expect(applyAction(s, { type: "select", from: 0, to: 1000 }).ok).toBe(false);
  });

  test("palavra já achada não conta de novo", () => {
    let s = game();
    const [a, b] = ends(s, 2);
    s = (applyAction(s, { type: "select", from: a, to: b }) as { state: GameState }).state;
    expect(applyAction(s, { type: "select", from: a, to: b }).ok).toBe(false);
  });

  test("achar todas vence; depois não aceita mais nada", () => {
    let s = game();
    for (let i = 0; i < s.words.length; i++) {
      expect(s.won).toBe(false);
      const [a, b] = ends(s, i);
      const r = applyAction(s, { type: "select", from: a, to: b });
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    expect(s.won).toBe(true);
    expect(s.found).toHaveLength(LEVEL_CONF.easy.words);
    expect(applyAction(s, { type: "hint" }).ok).toBe(false);
  });

  test("dica acende palavras diferentes até acabar e não repete achadas", () => {
    let s = game();
    const [a, b] = ends(s, 0);
    s = (applyAction(s, { type: "select", from: a, to: b }) as { state: GameState }).state;
    const seen = new Set<number>();
    for (let i = 0; i < s.words.length - 1; i++) {
      const r = applyAction(s, { type: "hint" });
      if (!r.ok) throw new Error(r.error);
      s = r.state;
      const last = s.last!;
      expect(last.type).toBe("hint");
      if (last.type !== "hint") return;
      expect(last.word).not.toBe(0);
      expect(seen.has(last.word)).toBe(false);
      seen.add(last.word);
    }
    expect(s.hints).toBe(s.words.length - 1);
    expect(hintable(s)).toEqual([]);
    expect(applyAction(s, { type: "hint" }).ok).toBe(false);
  });

  test("a mesma partida dá as mesmas dicas", () => {
    const h = (s: GameState) => (applyAction(s, { type: "hint" }) as { state: GameState }).state.last;
    expect(h(game())).toEqual(h(game()));
  });

  test("newGame sem tema sorteia um tema que existe", () => {
    const s = newGame("medium");
    expect(THEMES.map((t) => t.id)).toContain(s.theme);
    expect(s.words).toHaveLength(LEVEL_CONF.medium.words);
  });

  test("simulação: centenas de partidas resolvidas por um jogador que só sabe a lista", () => {
    for (let k = 0; k < 300; k++) {
      const level = LEVELS[k % 3];
      let s = newGame(level, THEMES[k % THEMES.length].id, 1000 + k);
      let moves = 0;
      // procura cada palavra lendo a grade, como uma pessoa faria
      for (const w of [...s.words].reverse()) {
        const [occ] = occurrences(s.grid, s.size, w.word);
        const [a, b] = occ.split("-").map(Number);
        if (k % 4 === 0) {
          const miss = applyAction(s, { type: "select", from: a, to: a + 1 });
          if (miss.ok) s = miss.state;
        }
        if (k % 5 === 0 && hintable(s).length) s = (applyAction(s, { type: "hint" }) as { state: GameState }).state;
        const r = applyAction(s, { type: "select", from: a, to: b });
        if (!r.ok) throw new Error(`${r.error}: ${w.word}`);
        s = r.state;
        moves++;
      }
      expect(s.won).toBe(true);
      expect(moves).toBe(LEVEL_CONF[level].words);
    }
  });
});
