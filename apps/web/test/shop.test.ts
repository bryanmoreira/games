import { describe, expect, test } from "bun:test";
import { CARD_FILES, DECK_KEYS, FRAME_KEYS, backSvg, faceSvg, frameSvg, parseCardFile } from "@/lib/shop/art";
import { dailySale, priceOn, SALE_PCTS, SALE_TIERS, saleEndsAt, salePrice } from "@/lib/shop/sale";
import { nextDay } from "@/lib/stats/achievements";
import { DEFAULT_DECK, ITEMS, ITEM_BY_ID, TABLE_KEYS, deckKey, frameKey, shopAction, tableClass, tableKey } from "@/lib/shop/catalog";

describe("catálogo", () => {
  test("ids únicos no formato tipo:chave, e todo item tem desenho", () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    for (const i of ITEMS) {
      expect(i.id).toBe(`${i.type}:${i.key}`);
      expect(i.price).toBeGreaterThan(0);
      expect(({ frame: FRAME_KEYS, deck: DECK_KEYS, table: TABLE_KEYS }[i.type]) as readonly string[]).toContain(i.key);
    }
  });

  test("o clássico não se vende: já vem com a conta", () => {
    expect(ITEM_BY_ID.has(`deck:${DEFAULT_DECK}`)).toBe(false);
  });

  test("chave desconhecida: sem moldura e baralho clássico", () => {
    expect(frameKey("coroa")).toBe("coroa");
    expect(frameKey("xyz")).toBeNull();
    expect(frameKey(null)).toBeNull();
    expect(deckKey("noite")).toBe("noite");
    expect(deckKey("<script>")).toBe(DEFAULT_DECK);
    expect(deckKey(undefined)).toBe(DEFAULT_DECK);
  });

  test("mesa: desconhecida vira o feltro verde, conhecida ganha a classe", () => {
    expect(tableKey("marmore")).toBe("marmore");
    expect(tableKey("verde")).toBeNull();
    expect(tableClass(null)).toBe("felt");
    expect(tableClass("x y")).toBe("felt");
    expect(tableClass("holo")).toBe("felt mesa mesa-holo");
  });

  test("botão da loja", () => {
    const it = ITEM_BY_ID.get("frame:ficha")!;
    expect(shopAction(it, true, true, 0)).toBe("equipped");
    expect(shopAction(it, true, false, 0)).toBe("equip");
    expect(shopAction(it, false, false, it.price)).toBe("buy");
    expect(shopAction(it, false, false, it.price - 1)).toBe("poor");
  });
});

describe("desenho", () => {
  test("52 cartas por baralho, nomes iguais aos das PNG", () => {
    expect(CARD_FILES.length).toBe(52);
    expect(CARD_FILES).toContain("king_of_hearts");
    expect(CARD_FILES).toContain("10_of_clubs");
    expect(parseCardFile("ace_of_spades")).toEqual({ rank: "A", suit: "spades" });
    expect(parseCardFile("10_of_diamonds")).toEqual({ rank: "10", suit: "diamonds" });
    expect(parseCardFile("joker_of_hearts")).toBeNull();
    expect(parseCardFile("king_of_stars")).toBeNull();
  });

  test("todo SVG sai completo e sem fonte de fora", () => {
    const all = [
      ...FRAME_KEYS.map(frameSvg),
      ...DECK_KEYS.map(backSvg),
      ...DECK_KEYS.flatMap((d) => CARD_FILES.map((f) => parseCardFile(f)!).map((c) => faceSvg(d, c.rank, c.suit))),
    ];
    for (const s of all) {
      expect(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
      expect(s.endsWith("</svg>")).toBe(true);
      expect(s).not.toContain("undefined");
      expect(s).not.toContain("NaN");
      expect(s).not.toMatch(/Bungee|Playfair|Inter[,"]/);
    }
  });
});

describe("promoção do dia", () => {
  const days = (from: string, n: number) => {
    const out = [from];
    while (out.length < n) out.push(nextDay(out.at(-1)!));
    return out;
  };

  test("um item de cada raridade, com os quatro descontos", () => {
    for (const day of days("2026-01-01", 60)) {
      const sale = dailySale(day);
      expect(sale.map((s) => ITEM_BY_ID.get(s.id)!.tier)).toEqual([...SALE_TIERS]);
      expect([...sale.map((s) => s.pct)].sort()).toEqual([...SALE_PCTS]);
      for (const s of sale) expect(s.price).toBe(salePrice(ITEM_BY_ID.get(s.id)!.price, s.pct));
    }
  });

  test("é a mesma o dia inteiro e não repete item em dias seguidos", () => {
    expect(dailySale("2026-10-28")).toEqual(dailySale("2026-10-28"));
    const list = days("2026-01-01", 400);
    for (let i = 1; i < list.length; i++) {
      const before = new Set(dailySale(list[i - 1]).map((s) => s.id));
      for (const s of dailySale(list[i])) expect(before.has(s.id)).toBe(false);
    }
  });

  test("todo item entra em promoção de tempos em tempos", () => {
    const seen = new Set(days("2026-01-01", 30).flatMap((d) => dailySale(d).map((s) => s.id)));
    expect(seen.size).toBe(ITEMS.length);
  });

  test("preço de 5 em 5 e fora da promoção é o de sempre", () => {
    expect(salePrice(150, 30)).toBe(105);
    expect(salePrice(2500, 50)).toBe(1250);
    expect(salePrice(450, 20)).toBe(360);
    const day = "2026-10-28";
    const on = new Set(dailySale(day).map((s) => s.id));
    const off = ITEMS.find((i) => !on.has(i.id))!;
    expect(priceOn(off, day)).toBe(off.price);
  });

  test("acaba à meia-noite de Brasília", () => {
    expect(new Date(saleEndsAt("2026-10-28")).toISOString()).toBe("2026-10-29T03:00:00.000Z");
  });
});
