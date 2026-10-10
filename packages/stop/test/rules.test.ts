import { describe, expect, test } from "bun:test";
import {
  applyAction,
  canStop,
  categoryDefs,
  categoryPoints,
  DEFAULT_SETTINGS,
  isAnnulled,
  LETTERS,
  matchesLetter,
  newGame,
  normalize,
  parseSettings,
  viewFor,
  winners,
  type Action,
  type GameState,
  type Seat,
  type Settings,
} from "../src";

/** rng determinístico (mulberry32) */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SETTINGS: Settings = { categories: ["nome", "animal", "fruta"], custom: [], rounds: 3, time: 60 };

function apply(s: GameState, a: Action): GameState {
  const r = applyAction(s, a, seeded(1));
  if (!r.ok) throw new Error(`${a.type}: ${r.error}`);
  return r.state;
}

/** Partida já na fase de escrita, com a letra escolhida. */
function writing(players: Seat[] = [0, 1, 2], letter = "B", settings = SETTINGS): GameState {
  const s = newGame(seeded(7), { players, settings });
  s.letters = [letter];
  return apply(s, { type: "advance" });
}

/** Escreve as respostas de cada jogador (uma lista por lugar). */
function write(s: GameState, answers: Record<Seat, string[]>): GameState {
  for (const [seat, list] of Object.entries(answers)) {
    list.forEach((text, cat) => (s = apply(s, { type: "write", seat: Number(seat), cat, text })));
  }
  return s;
}

describe("texto", () => {
  test("normaliza acento, maiúscula e espaços", () => {
    expect(normalize("  Água   Viva ")).toBe("agua viva");
    expect(normalize("ÉDSON")).toBe("edson");
  });

  test("letra inicial ignora acento", () => {
    expect(matchesLetter("Árvore", "A")).toBe(true);
    expect(matchesLetter("  baleia", "B")).toBe(true);
    expect(matchesLetter("Cobra", "B")).toBe(false);
    expect(matchesLetter("", "B")).toBe(false);
    expect(matchesLetter("   ", "B")).toBe(false);
  });

  test("sem K, W, X e Y", () => {
    for (const l of "KWXY") expect(LETTERS).not.toContain(l);
    expect(LETTERS).toHaveLength(22);
  });
});

describe("configuração", () => {
  test("valores inválidos voltam ao padrão", () => {
    expect(parseSettings({ categories: ["nome"], rounds: 7, time: 45 })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  test("categorias seguem a ordem da lista e ignoram ids desconhecidos", () => {
    const s = parseSettings({ categories: ["fruta", "xyz", "nome", "cor"], rounds: 10, time: 0 });
    expect(s).toEqual({ categories: ["nome", "fruta", "cor"], custom: [], rounds: 10, time: 0 });
  });

  test("temas criados: limpa, tira repetidos e os iguais às categorias prontas", () => {
    const s = parseSettings({
      categories: ["nome", "c:time de futebol", "c:pokemon", "c:cor"],
      custom: ["  Time   de futebol ", "time de futebol", "Pokémon", "", "COR", "x".repeat(40)],
    });
    expect(s.custom).toEqual(["Time de futebol", "Pokémon", "x".repeat(24)]);
    // ordem: prontas e depois os temas, na ordem em que foram criados
    expect(s.categories).toEqual(["nome", "c:time de futebol", "c:pokemon"]);
    expect(categoryDefs(s).map((c) => c.name)).toEqual(["Nome", "Time de futebol", "Pokémon"]);
  });

  test("no máximo 10 temas criados", () => {
    const custom = Array.from({ length: 14 }, (_, i) => `Tema ${i}`);
    expect(parseSettings({ ...DEFAULT_SETTINGS, custom }).custom).toHaveLength(10);
  });

  test("apagar um tema escolhido tira ele das categorias; abaixo de 3 a mudança é recusada", () => {
    const prev = parseSettings({ categories: ["nome", "animal", "c:carro", "c:doce"], custom: ["Carro", "Doce"] });
    expect(prev.categories).toHaveLength(4);
    const next = parseSettings({ ...prev, custom: ["Doce"] }, prev);
    expect(next.categories).toEqual(["nome", "animal", "c:doce"]);
    expect(parseSettings({ ...next, custom: [] }, next)).toEqual(next);
  });

  test("partida com tema criado usa o nome dele", () => {
    const settings = parseSettings({ categories: ["nome", "animal", "c:carro"], custom: ["Carro"] });
    const s = newGame(seeded(1), { players: [0, 1], settings });
    expect(viewFor(s, 0).categories.map((c) => c.name)).toEqual(["Nome", "Animal", "Carro"]);
    expect(s.answers[0]).toHaveLength(3);
  });
});

describe("rodada", () => {
  test("começa sorteando a letra; a visão esconde a letra até a roleta parar", () => {
    const s = newGame(seeded(3), { players: [0, 1], settings: SETTINGS });
    expect(s.phase).toBe("letter");
    expect(viewFor(s, 0).letter).toBeNull();
    expect(applyAction(s, { type: "write", seat: 0, cat: 0, text: "x" }).ok).toBe(false);
    const w = apply(s, { type: "advance" });
    expect(w.phase).toBe("writing");
    expect(viewFor(w, 0).letter).toBe(w.letters[0]);
  });

  test("letras não se repetem na partida", () => {
    let s = newGame(seeded(9), { players: [0, 1], settings: { ...SETTINGS, rounds: 10 } });
    while (s.phase !== "gameOver") s = apply(s, { type: "advance" });
    expect(new Set(s.letters).size).toBe(10);
  });

  test("STOP só com tudo preenchido com a letra", () => {
    let s = writing();
    s = write(s, { 0: ["Bruno", "Baleia", ""] });
    expect(viewFor(s, 0).canStop).toBe(false);
    expect(applyAction(s, { type: "stop", seat: 0 }).ok).toBe(false);
    s = write(s, { 0: ["Bruno", "Baleia", "Cereja"] });
    expect(applyAction(s, { type: "stop", seat: 0 }).ok).toBe(false);
    s = write(s, { 0: ["Bruno", "Baleia", "Banana"] });
    expect(viewFor(s, 0).canStop).toBe(true);
    s = apply(s, { type: "stop", seat: 0 });
    expect(s.phase).toBe("review");
    expect(s.stoppedBy).toBe(0);
    expect(applyAction(s, { type: "write", seat: 1, cat: 0, text: "Bia" }).ok).toBe(false);
  });

  test("STOP pode levar as respostas junto (a última digitação não se perde)", () => {
    const s = apply(writing(), { type: "stop", seat: 1, answers: ["Beto", "Boi", "Banana"] });
    expect(s.answers[1]).toEqual(["Beto", "Boi", "Banana"]);
    expect(s.phase).toBe("review");
  });

  test("tempo esgotado trava sem ninguém ter apertado STOP", () => {
    const s = apply(write(writing(), { 0: ["Bia"] }), { type: "advance" });
    expect(s.phase).toBe("review");
    expect(s.stoppedBy).toBeNull();
  });

  test("respostas dos outros só aparecem depois do STOP", () => {
    let s = write(writing(), { 0: ["Bia", "Boi", ""], 1: ["Beto", "", "Cereja"] });
    const v = viewFor(s, 0);
    expect(v.answers).toBeNull();
    expect(v.myAnswers).toEqual(["Bia", "Boi", ""]);
    expect(v.progress).toEqual({ 0: 2, 1: 1, 2: 0 });
    s = apply(s, { type: "advance" });
    expect(viewFor(s, 0).answers![1]).toEqual(["Beto", "", "Cereja"]);
  });

  test("texto longo é cortado", () => {
    const s = write(writing(), { 0: ["B" + "a".repeat(100)] });
    expect(s.answers[0][0]).toHaveLength(40);
  });
});

describe("pontos", () => {
  test("10 única, 5 repetida (sem acento/maiúscula), 0 vazia ou com outra letra", () => {
    let s = write(writing([0, 1, 2]), {
      0: ["Bruno", "Baleia", "Banana"],
      1: ["bruno", "Búfalo", "Cereja"],
      2: ["Bia", "", "  BANANA "],
    });
    s = apply(s, { type: "advance" });
    expect(categoryPoints(s, 0)).toEqual({ 0: 5, 1: 5, 2: 10 });
    expect(categoryPoints(s, 1)).toEqual({ 0: 10, 1: 10, 2: 0 });
    expect(categoryPoints(s, 2)).toEqual({ 0: 5, 1: 0, 2: 5 });
  });

  test("soma da rodada vai para o placar e para o histórico", () => {
    let s = write(writing([0, 1]), { 0: ["Bruno", "Baleia", "Banana"], 1: ["Bruno", "Boi", ""] });
    s = apply(s, { type: "advance" });
    for (let c = 0; c < 3; c++) s = apply(s, { type: "advance" });
    expect(s.phase).toBe("roundEnd");
    expect(s.scores).toEqual({ 0: 25, 1: 15 });
    expect(s.history[0].points).toEqual({ 0: [5, 10, 10], 1: [5, 10, 0] });
    expect(s.history[0].letter).toBe("B");
  });
});

describe("correção", () => {
  function reviewing(players: Seat[] = [0, 1, 2, 3]) {
    let s = writing(players);
    s = write(s, Object.fromEntries(players.map((p) => [p, [`Bxx${p}`, "Boi", "Banana"]])));
    return apply(s, { type: "advance" });
  }

  test("maioria dos outros anula; empate mantém", () => {
    let s = reviewing(); // 4 jogadores: 3 votam no alvo, precisa de 2
    s = apply(s, { type: "vote", seat: 1, target: 0, against: true });
    expect(isAnnulled(s, 0, 0)).toBe(false);
    s = apply(s, { type: "vote", seat: 2, target: 0, against: true });
    expect(isAnnulled(s, 0, 0)).toBe(true);
    expect(viewFor(s, 3).points![0]).toBe(0);
    s = apply(s, { type: "vote", seat: 2, target: 0, against: false });
    expect(isAnnulled(s, 0, 0)).toBe(false);
  });

  test("com 2 jogadores, um voto anula", () => {
    let s = reviewing([0, 1]);
    s = apply(s, { type: "vote", seat: 1, target: 0, against: true });
    expect(isAnnulled(s, 0, 0)).toBe(true);
  });

  test("com 3 jogadores, empate (1 de 2) mantém", () => {
    let s = reviewing([0, 1, 2]);
    s = apply(s, { type: "vote", seat: 1, target: 0, against: true });
    expect(isAnnulled(s, 0, 0)).toBe(false);
  });

  test("anulada não conta como repetida para os outros", () => {
    let s = reviewing([0, 1]);
    s = apply(s, { type: "advance" }); // categoria 1: os dois escreveram "Boi"
    expect(categoryPoints(s, 1)).toEqual({ 0: 5, 1: 5 });
    s = apply(s, { type: "vote", seat: 1, target: 0, against: true });
    expect(categoryPoints(s, 1)).toEqual({ 0: 0, 1: 10 });
  });

  test("não vota em si mesmo nem em resposta já zerada", () => {
    let s = writing([0, 1]);
    s = write(s, { 0: ["Bia", "", "Banana"], 1: ["Beto", "Boi", "Banana"] });
    s = apply(s, { type: "advance" });
    expect(applyAction(s, { type: "vote", seat: 0, target: 0, against: true }).ok).toBe(false);
    s = apply(s, { type: "advance" });
    expect(viewFor(s, 1).votable).toEqual([]);
    expect(applyAction(s, { type: "vote", seat: 1, target: 0, against: true }).ok).toBe(false);
  });

  test("todos PRONTO avança a categoria; ausente não é esperado", () => {
    let s = reviewing([0, 1, 2]);
    s = apply(s, { type: "ready", seat: 0 });
    s = apply(s, { type: "ready", seat: 1 });
    expect(s.review).toBe(0);
    s = apply(s, { type: "away", seats: [2] });
    expect(s.review).toBe(1);
    expect(s.ready).toEqual([]);
  });

  test("ausente não conta na maioria", () => {
    let s = reviewing([0, 1, 2]);
    s = apply(s, { type: "vote", seat: 1, target: 0, against: true });
    expect(isAnnulled(s, 0, 0)).toBe(false);
    s = apply(s, { type: "away", seats: [2] });
    expect(isAnnulled(s, 0, 0)).toBe(true);
  });

  test("última categoria leva ao placar da rodada e depois à próxima letra", () => {
    let s = reviewing([0, 1]);
    for (let c = 0; c < 3; c++) {
      s = apply(s, { type: "ready", seat: 0 });
      s = apply(s, { type: "ready", seat: 1 });
    }
    expect(s.phase).toBe("roundEnd");
    s = apply(s, { type: "ready", seat: 0 });
    s = apply(s, { type: "ready", seat: 1 });
    expect(s.phase).toBe("letter");
    expect(s.round).toBe(2);
    expect(s.answers[0]).toEqual(["", "", ""]);
  });
});

describe("fim", () => {
  test("depois da última rodada a partida acaba", () => {
    let s = newGame(seeded(2), { players: [0, 1], settings: SETTINGS });
    while (s.phase !== "gameOver") s = apply(s, { type: "advance" });
    expect(s.round).toBe(3);
    expect(s.history).toHaveLength(3);
    expect(applyAction(s, { type: "advance" }).ok).toBe(false);
  });

  test("vencedor é a maior soma; empate no topo devolve todos", () => {
    const s = newGame(seeded(2), { players: [0, 3, 5], settings: SETTINGS });
    s.scores = { 0: 40, 3: 55, 5: 55 };
    expect(winners(s)).toEqual([3, 5]);
    s.scores[5] = 10;
    expect(winners(s)).toEqual([3]);
  });

  test("quem não joga não age", () => {
    const s = writing([0, 2]);
    expect(applyAction(s, { type: "write", seat: 1, cat: 0, text: "Bia" }).ok).toBe(false);
  });
});

describe("simulação", () => {
  const WORDS = ["Bola", "Bia", "bola", "Casa", "", "Bolo", "Banana", "barco"];

  test("300 partidas com jogadores aleatórios terminam sem travar", () => {
    const rng = seeded(42);
    const pick = <T>(xs: T[]) => xs[Math.floor(rng() * xs.length)];
    for (let g = 0; g < 300; g++) {
      const n = 2 + Math.floor(rng() * 7);
      const players = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => rng() - 0.5).slice(0, n);
      const settings = parseSettings({
        categories: ["nome", "cep", "animal", "fruta", "cor", "objeto", "marca"].filter(() => rng() < 0.7),
        rounds: pick([3, 5, 10]),
        time: pick([60, 0]),
      });
      let s = newGame(rng, { players, settings });
      let steps = 0;
      while (s.phase !== "gameOver") {
        if (++steps > 20_000) throw new Error("travou");
        const seat = pick(players);
        const letter = s.letters.at(-1)!;
        const roll = rng();
        let a: Action;
        if (roll < 0.12) a = { type: "advance" };
        else if (roll < 0.16) a = { type: "away", seats: players.filter(() => rng() < 0.2) };
        else if (s.phase === "writing") {
          if (canStop(s, seat) && rng() < 0.3) a = { type: "stop", seat };
          else {
            const w = pick(WORDS);
            a = { type: "write", seat, cat: Math.floor(rng() * settings.categories.length), text: w && rng() < 0.8 ? letter + w.slice(1) : w };
          }
        } else if (s.phase === "review" && rng() < 0.5) a = { type: "vote", seat, target: pick(players), against: rng() < 0.6 };
        else a = { type: "ready", seat };
        const r = applyAction(s, a, rng);
        if (r.ok) s = r.state;
      }
      // placar = soma do histórico; pontos só 0/5/10
      for (const p of players) {
        expect(s.scores[p]).toBe(s.history.reduce((t, h) => t + h.points[p].reduce((x, y) => x + y, 0), 0));
      }
      expect(s.history).toHaveLength(settings.rounds);
      for (const h of s.history) for (const p of players) for (const pt of h.points[p]) expect([0, 5, 10]).toContain(pt);
    }
  }, 60_000);
});
