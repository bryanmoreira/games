import { describe, expect, test } from "bun:test";
import {
  applyAction,
  arrangements,
  canastraKind,
  cardImage,
  decide,
  makeDeck,
  newGame,
  pickArrangement,
  plan,
  points,
  ctxOf,
  takeOptions,
  validPlayers,
  viewFor,
  wildChoices,
  type Action,
  type Card,
  type GameState,
  type Meld,
  type Rank,
  type Seat,
  type Suit,
  type Team,
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

const S: Record<string, Suit> = { c: "clubs", d: "diamonds", h: "hearts", s: "spades" };

/** "7h" = 7 de copas do baralho 0; "7h1" = do baralho 1; "JK0" = coringa. */
function card(code: string): Card {
  if (code.startsWith("JK")) return { id: code, rank: "JK", suit: null };
  const m = /^(A|10|[2-9JQK])([cdhs])(\d?)$/.exec(code)!;
  return { id: `${m[1]}${m[2]}${m[3] || "0"}`, rank: m[1] as Rank, suit: S[m[2]] };
}
const cards = (s: string) => s.split(" ").map(card);
const ids = (s: string) => cards(s).map((c) => c.id);

function ok(r: ReturnType<typeof applyAction>): GameState {
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
function fail(r: ReturnType<typeof applyAction>): string {
  if (r.ok) throw new Error("devia falhar");
  return r.error;
}

/** Jogo montado à mão: 4 jogadores, vez de `turn` na fase `step`, mãos, jogos e lixo dados. */
function setup(opts: {
  hands: Record<number, string>;
  turn?: Seat;
  step?: "draw" | "play";
  pile?: string;
  stock?: number;
  melds?: { team: Team; cards: string }[];
  mortoTaken?: [boolean, boolean];
  players?: Seat[];
}): GameState {
  const s = newGame(seeded(1), opts.players ?? [0, 1, 2, 3], null, 3000);
  const used = new Set<string>();
  s.hands = [0, 1, 2, 3].map((p) => (opts.hands[p] ? cards(opts.hands[p]) : []));
  s.pile = opts.pile ? cards(opts.pile) : [card("9s")];
  s.melds = [];
  for (const m of opts.melds ?? []) {
    const arr = arrangements([], null, cards(m.cards));
    if (!arr.length) throw new Error(`jogo inválido no setup: ${m.cards}`);
    s.melds.push({ id: `m${s.nextMeld++}`, team: m.team, suit: arr[0].suit, cards: arr[0].cards });
  }
  for (const c of [...s.hands.flat(), ...s.pile, ...s.melds.flatMap((m) => m.cards.map((mc) => mc.card))]) used.add(c.id);
  const rest = makeDeck().filter((c) => !used.has(c.id));
  s.mortos = [rest.splice(0, 11), rest.splice(0, 11)];
  s.stock = rest.splice(0, opts.stock ?? 20);
  s.mortoTaken = opts.mortoTaken ?? [false, false];
  s.turn = opts.turn ?? 0;
  s.step = opts.step ?? "play";
  return s;
}

type Move = Action extends infer A ? (A extends { seat: Seat } ? Omit<A, "seat"> : never) : never;
const act = (s: GameState, a: Move) => applyAction(s, { seat: s.turn, ...a } as Action);

describe("baralho e pontos", () => {
  test("108 cartas sem repetir, 4 coringas e 2 baralhos", () => {
    const deck = makeDeck();
    expect(deck.length).toBe(108);
    expect(new Set(deck.map((c) => c.id)).size).toBe(108);
    expect(deck.filter((c) => c.rank === "JK").length).toBe(4);
  });

  test("valores: 3-7 = 5, 8-K = 10, A = 15, 2 = 20, coringa = 50", () => {
    expect(points(card("3h"))).toBe(5);
    expect(points(card("7h"))).toBe(5);
    expect(points(card("8h"))).toBe(10);
    expect(points(card("Kh"))).toBe(10);
    expect(points(card("Ah"))).toBe(15);
    expect(points(card("2h"))).toBe(20);
    expect(points(card("JK0"))).toBe(50);
  });

  test("imagens: figuras e coringas", () => {
    expect(cardImage(card("Kh"))).toBe("/cards/king_of_hearts.png");
    expect(cardImage(card("10s"))).toBe("/cards/10_of_spades.png");
    expect(cardImage(card("JK0"))).toBe("/cards/black_joker.png");
    expect(cardImage(card("JK3"))).toBe("/cards/red_joker.png");
  });

  test("mesa: 4 jogadores ou 2 em duplas diferentes", () => {
    expect(validPlayers([0, 1, 2, 3])).toBe(true);
    expect(validPlayers([0, 1])).toBe(true);
    expect(validPlayers([1, 2])).toBe(true);
    expect(validPlayers([0, 2])).toBe(false);
    expect(validPlayers([0, 1, 2])).toBe(false);
  });
});

describe("jogos (sequências)", () => {
  const first = (s: string) => arrangements([], null, cards(s))[0];
  const asOf = (s: string) => first(s).cards.map((mc) => mc.as);

  test("sequência simples do mesmo naipe", () => {
    expect(asOf("5h 6h 7h")).toEqual([5, 6, 7]);
    expect(asOf("7h 5h 6h")).toEqual([5, 6, 7]);
  });

  test("precisa de 3 cartas, mesmo naipe e posições seguidas", () => {
    expect(arrangements([], null, cards("5h 6h"))).toEqual([]);
    expect(arrangements([], null, cards("5h 6h 7s"))).toEqual([]);
    expect(arrangements([], null, cards("5h 6h 8h"))).toEqual([]);
    expect(arrangements([], null, cards("5h 5h1 6h"))).toEqual([]);
  });

  test("ás vale 1 ou fica depois do rei, nunca os dois", () => {
    expect(asOf("Ah 2h 3h")).toEqual([1, 2, 3]);
    expect(asOf("Qh Kh Ah")).toEqual([12, 13, 14]);
    expect(arrangements([], null, cards("Kh Ah 3h"))).toEqual([]);
    // o 2 de copas com K e A só serve de curinga
    expect(canastraKind(first("Kh Ah 2h"))).toBeNull();
    expect(first("Ah 2h 3h 4h 5h 6h 7h 8h 9h 10h Jh Qh Kh").cards.length).toBe(13);
  });

  test("um curinga preenche o buraco ou estende a ponta", () => {
    const gap = first("5h JK0 7h");
    expect(gap.cards.map((mc) => mc.as)).toEqual([5, 6, 7]);
    expect(gap.cards[1].card.id).toBe("JK0");
    const end = arrangements([], null, cards("5h 6h 7h JK0"));
    expect(end.map((a) => a.cards.map((mc) => mc.as))).toContainEqual([5, 6, 7, 8]);
    expect(end.map((a) => a.cards.map((mc) => mc.as))).toContainEqual([4, 5, 6, 7]);
    expect(wildChoices(end).sort()).toEqual([4, 8]);
  });

  test("no máximo 1 curinga por jogo", () => {
    expect(arrangements([], null, cards("5h JK0 JK1 8h"))).toEqual([]);
    expect(arrangements([], null, cards("5h 2c 7h JK0"))).toEqual([]);
  });

  test("o 2 do naipe no lugar do 2 é natural; fora dele é curinga", () => {
    const nat = first("Ah 2h 3h");
    expect(canastraKind({ suit: nat.suit, cards: nat.cards })).toBeNull();
    const clean = first("2h 3h 4h 5h 6h 7h 8h");
    expect(canastraKind(clean)).toBe("limpa");
    const wild = first("3h 4h 2h 6h 7h 8h 9h");
    expect(wild.cards.map((mc) => mc.as)).toEqual([3, 4, 5, 6, 7, 8, 9]);
    expect(canastraKind(wild)).toBe("suja");
    // 2 de outro naipe é sempre curinga, até no lugar do 2
    const other = first("Ah 2c 3h 4h 5h 6h 7h");
    expect(canastraKind(other)).toBe("suja");
  });

  test("canastra: 7+ cartas; limpa, suja e real (13 limpas)", () => {
    expect(canastraKind(first("3h 4h 5h 6h 7h 8h"))).toBeNull();
    expect(canastraKind(first("3h 4h 5h 6h 7h 8h 9h"))).toBe("limpa");
    expect(canastraKind(first("3h 4h 5h JK0 7h 8h 9h"))).toBe("suja");
    expect(canastraKind(first("Ah 2h 3h 4h 5h 6h 7h 8h 9h 10h Jh Qh Kh"))).toBe("real");
    expect(canastraKind(first("2h 3h 4h 5h 6h 7h 8h 9h 10h Jh Qh Kh Ah"))).toBe("real");
  });

  test("escolher a posição do curinga", () => {
    const opts = arrangements([], null, cards("5h 6h 7h JK0"));
    expect(pickArrangement(opts, 4)!.cards[0].card.id).toBe("JK0");
    expect(pickArrangement(opts, 8)!.cards[3].card.id).toBe("JK0");
    expect(pickArrangement(opts, 11)).toBeNull();
  });
});

describe("a vez: comprar, baixar, descartar", () => {
  test("começo: 11 cartas, dois mortos de 11, um carta no lixo", () => {
    const s = newGame(seeded(3), [0, 1, 2, 3]);
    expect(s.mode).toBe("duplas");
    for (const p of [0, 1, 2, 3]) expect(s.hands[p].length).toBe(11);
    expect(s.mortos.map((m) => m.length)).toEqual([11, 11]);
    expect(s.pile.length).toBe(1);
    expect(s.stock.length).toBe(108 - 44 - 22 - 1);
    expect(s.step).toBe("draw");
    expect(s.turn).not.toBe(s.dealer);
    const g = newGame(seeded(3), [0, 1]);
    expect(g.mode).toBe("1x1");
    expect(g.stock.length).toBe(108 - 22 - 22 - 1);
  });

  test("comprar do monte", () => {
    const s = setup({ hands: { 0: "3h 9d" }, step: "draw" });
    const n = ok(act(s, { type: "draw" }));
    expect(n.hands[0].length).toBe(3);
    expect(n.stock.length).toBe(s.stock.length - 1);
    expect(n.step).toBe("play");
    expect(fail(act(n, { type: "draw" }))).toContain("já comprou");
  });

  test("não joga fora da vez nem baixa antes de comprar", () => {
    const s = setup({ hands: { 0: "5h 6h 7h 9d", 1: "3h" }, step: "draw" });
    expect(fail(applyAction(s, { type: "draw", seat: 1 }))).toContain("Não é sua vez");
    expect(fail(act(s, { type: "meld", cards: ids("5h 6h 7h") }))).toContain("Compre");
  });

  test("baixar um jogo e acrescentar nele", () => {
    const s = setup({ hands: { 0: "5h 6h 7h 8h 9d Kc" } });
    const a = ok(act(s, { type: "meld", cards: ids("5h 6h 7h") }));
    expect(a.melds.length).toBe(1);
    expect(a.melds[0].team).toBe(0);
    expect(a.hands[0].length).toBe(3);
    const b = ok(act(a, { type: "add", meld: a.melds[0].id, cards: ids("8h") }));
    expect(b.melds[0].cards.length).toBe(4);
    expect(fail(act(b, { type: "add", meld: b.melds[0].id, cards: ids("Kc") }))).toContain("não entram");
  });

  test("cada dupla só acrescenta nos próprios jogos", () => {
    const s = setup({ hands: { 0: "8h 9d Kc" }, melds: [{ team: 1, cards: "5h 6h 7h" }] });
    expect(fail(act(s, { type: "add", meld: s.melds[0].id, cards: ids("8h") }))).toContain("não é da sua dupla");
  });

  test("descartar passa a vez e a carta vai para o lixo", () => {
    const s = setup({ hands: { 0: "3h 9d", 1: "4h" } });
    const n = ok(act(s, { type: "discard", card: "9d0" }));
    expect(n.pile[n.pile.length - 1].id).toBe("9d0");
    expect(n.turn).toBe(1);
    expect(n.step).toBe("draw");
    expect(fail(act(s, { type: "discard", card: "Kc0" }))).toContain("não está na mão");
  });
});

describe("lixo", () => {
  test("pega o lixo todo quando a carta de cima entra num jogo seu", () => {
    const s = setup({
      hands: { 0: "5h 9d Kc" },
      step: "draw",
      pile: "2d 3c 4d 8h",
      melds: [{ team: 0, cards: "5h 6h 7h" }],
    });
    // 8h entra no 5h-6h-7h
    const meld = s.melds[0].id;
    const n = ok(act(s, { type: "take", cards: [], meld }));
    expect(n.pile.length).toBe(0);
    expect(n.hands[0].length).toBe(3 + 3);
    expect(n.melds[0].cards.length).toBe(4);
    expect(n.step).toBe("play");
    expect(n.stats[0].maxPile).toBe(4);
  });

  test("ou com 2 cartas da mão num jogo novo", () => {
    const s = setup({ hands: { 0: "6s 7s Kc 2d" }, step: "draw", pile: "3c 5s" });
    expect(fail(act(s, { type: "take", cards: ids("6s"), meld: null }))).toContain("com 2 da mão");
    expect(fail(act(s, { type: "take", cards: ids("6s Kc"), meld: null }))).toContain("não formam");
    const n = ok(act(s, { type: "take", cards: ids("6s 7s"), meld: null }));
    expect(n.melds[0].cards.map((mc) => mc.as)).toEqual([5, 6, 7]);
    expect(n.hands[0].length).toBe(4 - 2 + 1);
  });

  test("curinga no topo trava o lixo", () => {
    for (const top of ["JK0", "2h"]) {
      const s = setup({ hands: { 0: "5h 6h 7h" }, step: "draw", pile: `3c ${top}`, melds: [{ team: 0, cards: "7h 8h 9h" }] });
      expect(fail(act(s, { type: "take", cards: [], meld: s.melds[0].id }))).toContain("trava");
      expect(takeOptions(ctxOf(s, 0))).toEqual([]);
    }
  });

  test("curinga no meio do lixo não trava", () => {
    const s = setup({ hands: { 0: "9d" }, step: "draw", pile: "JK0 2c 8h", melds: [{ team: 0, cards: "5h 6h 7h" }] });
    const n = ok(act(s, { type: "take", cards: [], meld: s.melds[0].id }));
    expect(n.hands[0].length).toBe(3);
  });

  test("opções de pegar o lixo", () => {
    const s = setup({
      hands: { 0: "6s 7s 9d Kc" },
      step: "draw",
      pile: "3c 5s",
      melds: [{ team: 0, cards: "8h 9h 10h" }],
    });
    const o = takeOptions(ctxOf(s, 0));
    expect(o.length).toBe(1);
    expect(o[0].cards.sort()).toEqual(["6s0", "7s0"]);
    expect(viewFor(s, 0).canTake).toBe(true);
    expect(viewFor(s, 1).canTake).toBe(false);
  });
});

describe("morto e batida", () => {
  test("ficar sem cartas baixando pega o morto e segue jogando", () => {
    const s = setup({ hands: { 0: "5h 6h 7h" } });
    const n = ok(act(s, { type: "meld", cards: ids("5h 6h 7h") }));
    expect(n.mortoTaken).toEqual([true, false]);
    expect(n.hands[0].length).toBe(11);
    expect(n.mortos.length).toBe(1);
    expect(n.turn).toBe(0);
    expect(n.step).toBe("play");
    expect(n.stats[0].mortos).toBe(1);
  });

  test("descartar a última carta pega o morto e passa a vez", () => {
    const s = setup({ hands: { 0: "9d", 1: "4h" } });
    const n = ok(act(s, { type: "discard", card: "9d0" }));
    expect(n.mortoTaken[0]).toBe(true);
    expect(n.hands[0].length).toBe(11);
    expect(n.turn).toBe(1);
  });

  test("quem bate precisa de canastra", () => {
    const s = setup({
      hands: { 0: "9d", 2: "4h" },
      melds: [{ team: 0, cards: "3h 4h 5h" }],
      mortoTaken: [true, false],
    });
    expect(fail(act(s, { type: "discard", card: "9d0" }))).toContain("canastra");
  });

  test("sem canastra não dá para ficar com 1 carta nem esvaziar baixando", () => {
    const s = setup({ hands: { 0: "5h 6h 7h 9d" }, mortoTaken: [true, false] });
    expect(fail(act(s, { type: "meld", cards: ids("5h 6h 7h") }))).toContain("2 cartas");
    const s2 = setup({ hands: { 0: "5h 6h 7h" }, mortoTaken: [true, false] });
    expect(fail(act(s2, { type: "meld", cards: ids("5h 6h 7h") }))).toContain("canastra");
  });

  test("batida: descarta a última carta com canastra e a mão acaba", () => {
    const s = setup({
      hands: { 0: "9d", 1: "Kc Qc", 2: "3d" },
      melds: [
        { team: 0, cards: "3h 4h 5h 6h 7h 8h 9h" },
        { team: 1, cards: "4s 5s 6s" },
      ],
      mortoTaken: [true, true],
    });
    const n = ok(act(s, { type: "discard", card: "9d0" }));
    expect(n.phase).toBe("handEnd");
    expect(n.result!.kind).toBe("batida");
    expect(n.result!.team).toBe(0);
    const [a, b] = n.result!.scores;
    // 7 cartas: 3..9 = 5+5+5+5+5+10+10 = 45; canastra limpa 200; batida 100; sobrou 3d (5) na mão da dupla
    expect(a).toMatchObject({ table: 45, bonus: 200, batida: 100, hand: -5, morto: 0, total: 340 });
    // 4s 5s 6s = 15; sobrou Kc Qc = 20
    expect(b).toMatchObject({ table: 15, bonus: 0, batida: 0, hand: -20, morto: 0, total: -5 });
    expect(n.scores).toEqual([340, -5]);
    expect(n.stats[0].batidas).toBe(1);
  });

  test("batida baixando as últimas cartas", () => {
    const s = setup({
      hands: { 0: "10h", 1: "Kc" },
      melds: [{ team: 0, cards: "3h 4h 5h 6h 7h 8h 9h" }],
      mortoTaken: [true, true],
    });
    const n = ok(act(s, { type: "add", meld: s.melds[0].id, cards: ids("10h") }));
    expect(n.phase).toBe("handEnd");
    expect(n.result!.scores[0].batida).toBe(100);
  });

  test("quem não pegou o morto perde 100; real vale 500", () => {
    const s = setup({
      hands: { 0: "9d", 1: "Kc" },
      melds: [
        { team: 0, cards: "Ah 2h 3h 4h 5h 6h 7h 8h 9h 10h Jh Qh Kh" },
        { team: 1, cards: "4s 5s 6s" },
      ],
      mortoTaken: [true, false],
    });
    const n = ok(act(s, { type: "discard", card: "9d0" }));
    expect(n.result!.scores[0].canastras.real).toBe(1);
    expect(n.result!.scores[0].bonus).toBe(500);
    expect(n.result!.scores[1].morto).toBe(-100);
  });
});

describe("fim da mão e da partida", () => {
  test("monte acabou e a próxima pessoa não pode pegar o lixo: mão acaba sem batida", () => {
    const s = setup({ hands: { 0: "9d Kc", 1: "4h 7c" }, stock: 0, pile: "2d" });
    const n = ok(act(s, { type: "discard", card: "9d0" }));
    expect(n.phase).toBe("handEnd");
    expect(n.result!.kind).toBe("monte");
    expect(n.result!.team).toBeNull();
    expect(n.result!.scores[0].morto).toBe(-100);
    expect(n.result!.scores[1].morto).toBe(-100);
  });

  test("monte vazio mas dá para pegar o lixo: a mão segue", () => {
    const s = setup({ hands: { 0: "3h Kc", 1: "4h 5h" }, stock: 0, pile: "9s" });
    const n = ok(act(s, { type: "discard", card: "3h0" }));
    expect(n.phase).toBe("playing");
    expect(n.turn).toBe(1);
    expect(n.pile[n.pile.length - 1].id).toBe("3h0");
  });

  test("avançar dá a mão seguinte; passar da meta encerra a partida", () => {
    let s = setup({
      hands: { 0: "9d", 1: "Kc" },
      melds: [{ team: 0, cards: "3h 4h 5h 6h 7h 8h 9h" }],
      mortoTaken: [true, true],
    });
    s.scores = [2900, 0];
    s = ok(act(s, { type: "discard", card: "9d0" }));
    expect(s.winner).toBe(0);
    s = ok(applyAction(s, { type: "advance" }));
    expect(s.phase).toBe("gameOver");

    let t = setup({
      hands: { 0: "9d", 1: "Kc" },
      melds: [{ team: 0, cards: "3h 4h 5h 6h 7h 8h 9h" }],
      mortoTaken: [true, true],
    });
    t = ok(act(t, { type: "discard", card: "9d0" }));
    expect(t.winner).toBeNull();
    const dealer = t.dealer;
    t = ok(applyAction(t, { type: "advance" }, seeded(9)));
    expect(t.phase).toBe("playing");
    expect(t.handNo).toBe(2);
    expect(t.dealer).not.toBe(dealer);
    expect(t.hands[0].length).toBe(11);
    expect(t.scores[0]).toBeGreaterThan(0);
  });

  test("meta alcançada pelas duas duplas: ganha a de mais pontos", () => {
    const s = setup({
      hands: { 0: "9d", 1: "Kc" },
      melds: [{ team: 0, cards: "3h 4h 5h 6h 7h 8h 9h" }],
      mortoTaken: [true, true],
    });
    s.scores = [2950, 3500];
    const n = ok(act(s, { type: "discard", card: "9d0" }));
    expect(n.winner).toBe(1);
  });
});

describe("visão", () => {
  test("esconde as mãos dos outros e mostra tudo no fim da mão", () => {
    const s = newGame(seeded(5), [0, 1, 2, 3]);
    const v = viewFor(s, 0);
    expect(v.myHand.length).toBe(11);
    expect(v.handCounts).toEqual([11, 11, 11, 11]);
    expect(v.revealed).toBeNull();
    expect(JSON.stringify(v)).not.toContain(s.hands[1][0].id + '"');
    expect(viewFor(s, 0).team).toBe(0);
    s.phase = "handEnd";
    expect(viewFor(s, 0).revealed!.length).toBe(4);
  });

  test("flags de quem está na vez", () => {
    const s = newGame(seeded(5), [0, 1, 2, 3]);
    const me = s.turn;
    expect(viewFor(s, me).canDraw).toBe(true);
    expect(viewFor(s, me).canPlay).toBe(false);
    expect(viewFor(s, (me + 1) % 4).canDraw).toBe(false);
  });
});

describe("IA e simulação", () => {
  test("a IA só faz jogadas válidas e termina mãos", () => {
    const rng = seeded(11);
    let s = newGame(rng, [0, 1, 2, 3], null, 3000);
    for (let i = 0; i < 4000 && s.phase !== "handEnd"; i++) {
      const a = decide(viewFor(s, s.turn), rng);
      expect(a).not.toBeNull();
      s = ok(applyAction(s, a!, rng));
    }
    expect(s.phase).toBe("handEnd");
    expect(s.result).not.toBeNull();
  });

  test("simulação: partidas só com IAs chegam ao fim (duplas e 1×1)", () => {
    const stats = { hands: 0, batidas: 0, monte: 0, games: 0 };
    for (let g = 0; g < 30; g++) {
      const rng = seeded(100 + g);
      let s = newGame(rng, g % 3 === 0 ? [0, 1] : [0, 1, 2, 3], null, 1500);
      let steps = 0;
      while (s.phase !== "gameOver") {
        if (++steps > 40000) throw new Error(`partida ${g} travou na mão ${s.handNo}: ${JSON.stringify(s.result)}`);
        if (s.phase === "handEnd") {
          stats.hands++;
          if (s.result!.kind === "batida") stats.batidas++;
          else stats.monte++;
          s = ok(applyAction(s, { type: "advance" }, rng));
          continue;
        }
        const a = decide(viewFor(s, s.turn), rng);
        if (!a) throw new Error(`IA sem jogada: assento ${s.turn}, passo ${s.step}, mão ${s.hands[s.turn].map((c) => c.id)}`);
        s = ok(applyAction(s, a, rng));
        // invariantes: 108 cartas em algum lugar, ninguém com mão negativa
        if (steps % 50 === 0) {
          const total =
            s.hands.reduce((n, h) => n + h.length, 0) +
            s.stock.length +
            s.pile.length +
            s.mortos.reduce((n, m) => n + m.length, 0) +
            s.melds.reduce((n, m) => n + m.cards.length, 0);
          expect(total).toBe(108);
        }
      }
      stats.games++;
      expect(s.winner).not.toBeNull();
    }
    expect(stats.games).toBe(30);
    // as IAs também batem, não só esgotam o monte
    expect(stats.batidas).toBeGreaterThan(0);
  }, 120000);
});

test("plan não muda a mão original", () => {
  const s = setup({ hands: { 0: "5h 6h 7h 9d Kc" } });
  const before = JSON.stringify(s.hands[0]);
  const r = plan(ctxOf(s, 0), "meld", ids("5h 6h 7h"), null);
  expect(r.ok).toBe(true);
  expect(JSON.stringify(s.hands[0])).toBe(before);
});

// evita aviso de import não usado
export type _Unused = Meld;
