import { describe, expect, test } from "bun:test";
import {
  advise,
  applyAction,
  actors,
  cardImage,
  dealerDraws,
  decide,
  handValue,
  isBlackjack,
  isPair,
  makeShoe,
  newGame,
  parseSettings,
  placementOf,
  viewFor,
  BET_MS,
  CUT,
  DEAL_ANIM_MS,
  START_CHIPS,
  TURN_MS,
  type Action,
  type Card,
  type GameState,
  type Rank,
  type Seat,
  type Suit,
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
let uid = 0;
/** "Ah" = ás de copas; "10s" = 10 de espadas. */
function card(code: string): Card {
  const m = /^(A|10|[2-9JQK])([cdhs])$/.exec(code)!;
  return { id: `${code}x${uid++}`, rank: m[1] as Rank, suit: S[m[2]] };
}
const cards = (s: string) => s.split(" ").map(card);

function ok(r: ReturnType<typeof applyAction>): GameState {
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
function fail(r: ReturnType<typeof applyAction>): string {
  if (r.ok) throw new Error("devia falhar");
  return r.error;
}

/**
 * Partida sem relógio com o sapato montado: `order` são as cartas na ordem em que saem
 * (na distribuição: 1ª de cada jogador, 1ª da banca, 2ª de cada jogador, 2ª da banca).
 */
function rigged(players: Seat[], order: string, settings = { rounds: 10 as const, clock: false }) {
  const s = newGame(seeded(1), { players, settings });
  const filler = makeShoe().slice(0, 200);
  s.shoe = [...filler, ...cards(order).reverse()];
  return s;
}

/** Todos apostam `bet`. */
function betAll(s: GameState, bet = 100): GameState {
  for (const p of s.players) s = ok(applyAction(s, { type: "bet", seat: p, amount: bet }));
  return s;
}

/** Banca joga até o acerto. */
function runDealer(s: GameState): GameState {
  let guard = 0;
  while (s.phase === "dealer" && guard++ < 20) s = ok(applyAction(s, { type: "advance" }));
  return s;
}

const chips = (s: GameState, seat: Seat) => s.table[seat]!.chips;

describe("cartas", () => {
  test("valor da mão com ás mole e duro", () => {
    expect(handValue(cards("Ah 6d"))).toEqual({ total: 17, soft: true });
    expect(handValue(cards("Ah 6d 9c"))).toEqual({ total: 16, soft: false });
    expect(handValue(cards("Ah Ad"))).toEqual({ total: 12, soft: true });
    expect(handValue(cards("Ah Ad 9c"))).toEqual({ total: 21, soft: true });
    expect(handValue(cards("Kh Qd"))).toEqual({ total: 20, soft: false });
    expect(handValue(cards("Kh Qd 5c"))).toEqual({ total: 25, soft: false });
  });

  test("blackjack só com 2 cartas e fora de divisão", () => {
    expect(isBlackjack(cards("Ah Kd"))).toBe(true);
    expect(isBlackjack(cards("10h Ad"))).toBe(true);
    expect(isBlackjack(cards("Ah Kd"), true)).toBe(false);
    expect(isBlackjack(cards("7h 7d 7c"))).toBe(false);
  });

  test("par pelo valor: figuras e 10 dividem entre si", () => {
    expect(isPair(cards("Kh 10d"))).toBe(true);
    expect(isPair(cards("8h 8d"))).toBe(true);
    expect(isPair(cards("8h 9d"))).toBe(false);
  });

  test("sapato de 6 baralhos e imagens", () => {
    const shoe = makeShoe();
    expect(shoe.length).toBe(312);
    expect(new Set(shoe.map((c) => c.id)).size).toBe(312);
    expect(cardImage({ rank: "A", suit: "spades" })).toBe("/cards/ace_of_spades.png");
    expect(cardImage({ rank: "10", suit: "hearts" })).toBe("/cards/10_of_hearts.png");
  });

  test("banca compra no 17 mole e para no 17 duro", () => {
    expect(dealerDraws(cards("Ah 6d"))).toBe(true);
    expect(dealerDraws(cards("10h 7d"))).toBe(false);
    expect(dealerDraws(cards("10h 6d"))).toBe(true);
    expect(dealerDraws(cards("Ah 7d"))).toBe(false);
  });

  test("opções da partida", () => {
    expect(parseSettings({ rounds: 20 })).toEqual({ rounds: 20, clock: true });
    expect(parseSettings({ rounds: 7, clock: false })).toEqual({ rounds: 10, clock: false });
  });
});

describe("apostas", () => {
  test("limites e fichas descontadas", () => {
    let s = rigged([0], "9h 6c 8d 10c");
    expect(fail(applyAction(s, { type: "bet", seat: 0, amount: 5 }))).toContain("mínima");
    expect(fail(applyAction(s, { type: "bet", seat: 0, amount: 501 }))).toBe("Aposta inválida");
    expect(fail(applyAction(s, { type: "bet", seat: 0, amount: 505 }))).toBe("Fichas insuficientes");
    expect(fail(applyAction(s, { type: "bet", seat: 1, amount: 50 }))).toBe("Você não está na mesa");
    s = ok(applyAction(s, { type: "bet", seat: 0, amount: 100 }));
    expect(chips(s, 0)).toBe(900);
    expect(s.phase).toBe("play");
    expect(fail(applyAction(s, { type: "bet", seat: 0, amount: 100 }))).toBe("Não é hora de apostar");
  });

  test("a distribuição espera todos apostarem", () => {
    let s = rigged([0, 2], "9h 9d 6c 8d 8s 10c");
    s = ok(applyAction(s, { type: "bet", seat: 2, amount: 50 }));
    expect(s.phase).toBe("bet");
    expect(actors(s)).toEqual([0]);
    s = ok(applyAction(s, { type: "bet", seat: 0, amount: 50 }));
    expect(s.phase).toBe("play");
    // ordem da distribuição: 1ª de cada um, banca, 2ª de cada um, banca
    expect(s.table[0]!.hands[0].cards.map((c) => c.rank)).toEqual(["9", "8"]);
    expect(s.table[2]!.hands[0].cards.map((c) => c.rank)).toEqual(["9", "8"]);
    expect(s.dealer.map((c) => c.rank)).toEqual(["6", "10"]);
  });
});

describe("rodada", () => {
  test("vitória paga 1:1 e a carta fechada fica escondida na visão", () => {
    let s = betAll(rigged([0], "10h 6c 9d 10c 9s"));
    const v = viewFor(s, 0);
    expect(v.dealer[0]?.rank).toBe("6");
    expect(v.dealer[1]).toBeNull();
    expect(v.dealerTotal).toBe(6);
    expect(v.canHit && v.canStand && v.canDouble).toBe(true);
    s = ok(applyAction(s, { type: "stand", seat: 0 }));
    expect(s.phase).toBe("dealer");
    s = runDealer(s); // banca: 6 + 10 = 16, compra 9 = 25, estoura
    expect(s.phase).toBe("settle");
    expect(s.table[0]!.hands[0].result).toBe("win");
    expect(chips(s, 0)).toBe(1100);
    expect(s.table[0]!.net).toBe(100);
  });

  test("estourou perde mesmo se a banca estourar, e a banca não compra", () => {
    let s = betAll(rigged([0], "10h 6c 6d 10c 9s"));
    s = ok(applyAction(s, { type: "hit", seat: 0 })); // 10 + 6 + 9 = 25
    expect(s.table[0]!.hands[0].result).toBe("bust");
    expect(s.phase).toBe("dealer");
    s = runDealer(s);
    expect(s.dealer.length).toBe(2);
    expect(chips(s, 0)).toBe(900);
    expect(s.table[0]!.stats.busts).toBe(1);
  });

  test("blackjack paga 3:2, arredondado para baixo", () => {
    let s = betAll(rigged([0], "Ah 9c Kd 8c"), 25);
    expect(s.phase).toBe("dealer");
    s = runDealer(s);
    expect(s.table[0]!.hands[0].result).toBe("blackjack");
    // 25 + 37 (37,5 para baixo)
    expect(chips(s, 0)).toBe(1000 - 25 + 25 + 37);
    expect(s.table[0]!.stats.blackjacks).toBe(1);
  });

  test("empate devolve a aposta", () => {
    let s = betAll(rigged([0], "10h 10c 8d 8c"));
    s = ok(applyAction(s, { type: "stand", seat: 0 }));
    s = runDealer(s);
    expect(s.table[0]!.hands[0].result).toBe("push");
    expect(chips(s, 0)).toBe(1000);
  });

  test("banca com figura à mostra e blackjack encerra a rodada na hora", () => {
    let s = betAll(rigged([0], "10h Kc 9d Ac"));
    expect(s.phase).toBe("settle");
    expect(s.hidden).toBe(false);
    expect(s.table[0]!.hands[0].result).toBe("loss");
    expect(chips(s, 0)).toBe(900);
  });

  test("blackjack contra blackjack da banca é empate", () => {
    let s = betAll(rigged([0], "Ah Ac Kd Kc"));
    expect(s.phase).toBe("insurance");
    s = ok(applyAction(s, { type: "insurance", seat: 0, take: false }));
    expect(s.phase).toBe("settle");
    expect(s.table[0]!.hands[0].result).toBe("push");
    expect(chips(s, 0)).toBe(1000);
  });

  test("banca compra no 17 mole (H17)", () => {
    // banca: A + 6 = 17 mole, compra 4 = 21
    let s = betAll(rigged([0], "10h Ac 9d 6c 4s"));
    s = ok(applyAction(s, { type: "insurance", seat: 0, take: false }));
    expect(s.phase).toBe("play");
    s = ok(applyAction(s, { type: "stand", seat: 0 }));
    s = runDealer(s);
    expect(s.dealer.map((c) => c.rank)).toEqual(["A", "6", "4"]);
    expect(s.table[0]!.hands[0].result).toBe("loss");
  });

  test("21 para sozinho", () => {
    let s = betAll(rigged([0, 1], "5h 9h 6c 6d 8s 10c 10d"));
    s = ok(applyAction(s, { type: "hit", seat: 0 })); // 5 + 6 + 10 = 21
    expect(s.table[0]!.hands[0].done).toBe(true);
    expect(s.turn).toEqual({ seat: 1, hand: 0 });
  });
});

describe("seguro", () => {
  test("paga 2:1 quando a banca tem blackjack", () => {
    let s = betAll(rigged([0], "10h Ac 9d Kc"));
    expect(viewFor(s, 0).mustInsure).toBe(true);
    expect(viewFor(s, 0).insuranceCost).toBe(50);
    s = ok(applyAction(s, { type: "insurance", seat: 0, take: true }));
    expect(s.phase).toBe("settle");
    // perdeu 100 da mão, seguro de 50 voltou com 100 de prêmio
    expect(chips(s, 0)).toBe(1000);
    expect(s.table[0]!.net).toBe(0);
  });

  test("perde o seguro quando a banca não tem blackjack", () => {
    let s = betAll(rigged([0], "10h Ac 9d 7c"));
    s = ok(applyAction(s, { type: "insurance", seat: 0, take: true }));
    expect(s.phase).toBe("play");
    expect(chips(s, 0)).toBe(850);
    s = ok(applyAction(s, { type: "stand", seat: 0 }));
    s = runDealer(s); // banca 18, jogador 19
    expect(s.table[0]!.hands[0].result).toBe("win");
    expect(chips(s, 0)).toBe(1050);
    expect(s.table[0]!.net).toBe(50);
  });
});

describe("dobrar e dividir", () => {
  test("dobra: aposta em dobro e uma carta só", () => {
    let s = betAll(rigged([0], "6h 5c 5d 10c 10s 9s"));
    s = ok(applyAction(s, { type: "double", seat: 0 }));
    expect(s.table[0]!.hands[0].cards.length).toBe(3);
    expect(s.table[0]!.hands[0].bet).toBe(200);
    expect(s.phase).toBe("dealer");
    s = runDealer(s); // 21 contra 15 + 9 = 24
    expect(chips(s, 0)).toBe(1200);
    expect(s.table[0]!.stats.doublesWon).toBe(1);
  });

  test("não dobra com 3 cartas", () => {
    let s = betAll(rigged([0], "2h 5c 3d 10c 2s"));
    s = ok(applyAction(s, { type: "hit", seat: 0 }));
    expect(fail(applyAction(s, { type: "double", seat: 0 }))).toBe("Não dá para dobrar");
  });

  test("divide: duas mãos, a segunda recebe carta na vez dela, e pode dobrar depois", () => {
    let s = betAll(rigged([0], "8h 6c 8d 10c 3s 9s 10h 9d"));
    expect(viewFor(s, 0).canSplit).toBe(true);
    s = ok(applyAction(s, { type: "split", seat: 0 }));
    const hands = s.table[0]!.hands;
    expect(hands.length).toBe(2);
    expect(hands[0].cards.map((c) => c.rank)).toEqual(["8", "3"]);
    expect(hands[1].cards.map((c) => c.rank)).toEqual(["8"]);
    expect(chips(s, 0)).toBe(800);
    expect(viewFor(s, 0).canDouble).toBe(true);
    expect(viewFor(s, 0).canSplit).toBe(false);
    s = ok(applyAction(s, { type: "double", seat: 0 })); // 8 + 3 + 9 = 20
    expect(s.turn).toEqual({ seat: 0, hand: 1 });
    expect(s.table[0]!.hands[1].cards.map((c) => c.rank)).toEqual(["8", "10"]);
    s = ok(applyAction(s, { type: "stand", seat: 0 }));
    s = runDealer(s); // banca 16 + 9 = 25
    expect(s.table[0]!.hands.map((h) => h.result)).toEqual(["win", "win"]);
    expect(chips(s, 0)).toBe(1000 + 200 + 100);
    expect(s.table[0]!.stats.splitSweeps).toBe(1);
    expect(s.table[0]!.stats.splits).toBe(1);
  });

  test("ases divididos: uma carta cada e 21 não é blackjack", () => {
    let s = betAll(rigged([0], "Ah 9c Ad 9d Kh 5s"));
    s = ok(applyAction(s, { type: "split", seat: 0 }));
    const hands = s.table[0]!.hands;
    expect(hands.map((h) => h.cards.length)).toEqual([2, 2]);
    expect(hands.every((h) => h.done)).toBe(true);
    expect(s.phase).toBe("dealer");
    s = runDealer(s); // banca 18
    expect(s.table[0]!.hands.map((h) => h.result)).toEqual(["win", "loss"]);
    expect(s.table[0]!.stats.blackjacks).toBe(0);
    expect(chips(s, 0)).toBe(1000);
  });
});

describe("relógio", () => {
  test("aposta: quem não apostou fica de fora; vez: para sozinho", () => {
    const settings = { rounds: 5 as const, clock: true };
    let s = newGame(seeded(2), { players: [0, 1], settings }, null, 1000);
    expect(s.deadline).toBe(1000 + BET_MS);
    s = ok(applyAction(s, { type: "bet", seat: 0, amount: 50, at: 2000 }));
    expect(fail(applyAction(s, { type: "advance", at: 3000 }))).toBe("Ainda não");
    s = ok(applyAction(s, { type: "advance", at: 1000 + BET_MS }));
    expect(s.table[1]!.bet).toBe(0);
    expect(s.table[1]!.hands.length).toBe(0);
    if (s.phase === "play") {
      expect(s.deadline).toBe(1000 + BET_MS + DEAL_ANIM_MS + TURN_MS);
      s = ok(applyAction(s, { type: "advance", at: s.deadline! }));
      expect(s.table[0]!.hands[0].done).toBe(true);
    }
  });

  test("ninguém apostou: a rodada passa", () => {
    let s = newGame(seeded(3), { players: [0], settings: { rounds: 5, clock: true } }, null, 0);
    s = ok(applyAction(s, { type: "advance", at: BET_MS }));
    expect(s.round).toBe(2);
    expect(s.phase).toBe("bet");
  });
});

describe("partida", () => {
  test("sem fichas assiste; todos sem fichas acaba", () => {
    let s = rigged([0], "10h 6c 6d 10c 9s", { rounds: 10, clock: false });
    s.table[0]!.chips = 100;
    s = ok(applyAction(s, { type: "bet", seat: 0, amount: 100 }));
    s = ok(applyAction(s, { type: "hit", seat: 0 }));
    s = runDealer(s);
    expect(chips(s, 0)).toBe(0);
    s = ok(applyAction(s, { type: "advance" }));
    expect(s.phase).toBe("gameOver");
  });

  test("acaba depois da última rodada e reembaralha no corte", () => {
    let s = newGame(seeded(4), { players: [0], settings: { rounds: 5, clock: false } });
    const shuffles = s.shuffleNo;
    s.shoe = s.shoe.slice(0, CUT - 1);
    for (let guard = 0; s.phase !== "gameOver" && guard < 200; guard++) {
      const a = decide(viewFor(s, 0), seeded(guard)) ?? ({ type: "advance" } as Action);
      s = ok(applyAction(s, a, seeded(guard)));
      if (guard === 0) expect(s.shuffleNo).toBe(shuffles);
    }
    expect(s.phase).toBe("gameOver");
    expect(s.round).toBe(5);
    expect(s.table[0]!.stats.rounds).toBe(5);
  });

  test("colocação pelo saldo", () => {
    const s = newGame(seeded(5), { players: [0, 1, 2] });
    s.table[0]!.chips = 1200;
    s.table[1]!.chips = 800;
    s.table[2]!.chips = 1200;
    expect(placementOf(s, 0)).toBe(1);
    expect(placementOf(s, 2)).toBe(1);
    expect(placementOf(s, 1)).toBe(3);
  });
});

describe("estratégia básica", () => {
  const a = (hand: string, up: Rank, canDouble = true, canSplit = true) => advise(cards(hand), up, { canDouble, canSplit });
  test("totais duros", () => {
    expect(a("10h 6d", "10")).toBe("hit");
    expect(a("10h 6d", "6")).toBe("stand");
    expect(a("10h 2d", "3")).toBe("hit");
    expect(a("10h 2d", "4")).toBe("stand");
    expect(a("6h 5d", "A")).toBe("double"); // H17
    expect(a("6h 4d", "10")).toBe("hit");
    expect(a("5h 4d", "3")).toBe("double");
    expect(a("10h 7d", "A")).toBe("stand");
  });
  test("totais moles", () => {
    expect(a("Ah 7d", "2")).toBe("double"); // H17
    expect(a("Ah 7d", "2", false)).toBe("stand");
    expect(a("Ah 7d", "9")).toBe("hit");
    expect(a("Ah 8d", "6")).toBe("double");
    expect(a("Ah 2d", "5")).toBe("double");
    expect(a("Ah 2d", "4")).toBe("hit");
  });
  test("pares", () => {
    expect(a("8h 8d", "10")).toBe("split");
    expect(a("Ah Ad", "A")).toBe("split");
    expect(a("Kh Qd", "6")).toBe("stand");
    expect(a("5h 5d", "6")).toBe("double");
    expect(a("9h 9d", "7")).toBe("stand");
    expect(a("9h 9d", "8")).toBe("split");
    expect(a("8h 8d", "10", true, false)).toBe("hit");
  });
});

describe("simulação só com IAs", () => {
  test("200 partidas terminam sem travar e as fichas fecham", () => {
    const rng = seeded(42);
    for (let g = 0; g < 200; g++) {
      const n = 1 + Math.floor(rng() * 5);
      const players = [0, 1, 2, 3, 4].slice(0, n);
      let s = newGame(rng, { players, settings: { rounds: 10, clock: g % 2 === 0 } }, null, 0);
      let now = 0;
      let steps = 0;
      while (s.phase !== "gameOver") {
        if (++steps > 2000) throw new Error(`travou na partida ${g}: ${s.phase}`);
        now += 500;
        const who = actors(s);
        let a: Action | null = null;
        if (who.length) {
          // às vezes alguém deixa o relógio acabar
          if (s.settings.clock && rng() < 0.05) a = { type: "advance", at: s.deadline ?? now };
          else a = decide(viewFor(s, who[Math.floor(rng() * who.length)]), rng);
          if (!a) throw new Error(`IA sem lance em ${s.phase}`);
        } else a = { type: "advance" };
        s = ok(applyAction(s, { ...a, at: (a as { at?: number }).at ?? now }, rng));
        // fichas nunca negativas; o que está na mesa + saldo nunca some
        for (const p of s.players) expect(s.table[p]!.chips).toBeGreaterThanOrEqual(0);
      }
      expect(s.round).toBeLessThanOrEqual(10);
      expect(actors(s)).toEqual([]);
      for (const p of s.players) {
        const st = s.table[p]!.stats;
        expect(st.peak).toBeGreaterThanOrEqual(START_CHIPS);
        expect(st.low).toBeLessThanOrEqual(START_CHIPS);
        expect(st.handsWon).toBeLessThanOrEqual(st.handsPlayed);
      }
    }
  }, 30_000);

  test("lucro de cada rodada bate com o saldo", () => {
    const rng = seeded(7);
    let s = newGame(rng, { players: [0, 1, 2], settings: { rounds: 20, clock: false } });
    const before: Record<number, number> = {};
    while (s.phase !== "gameOver") {
      if (s.phase === "bet" && s.players.every((p) => s.table[p]!.bet === null)) for (const p of s.players) before[p] = s.table[p]!.chips;
      const who = actors(s);
      const a = who.length ? decide(viewFor(s, who[0]), rng)! : ({ type: "advance" } as Action);
      s = ok(applyAction(s, a, rng));
      if (s.phase === "settle")
        for (const p of s.players) if (s.table[p]!.net !== null) expect(s.table[p]!.chips).toBe(before[p] + s.table[p]!.net!);
    }
  });
});
