/** Promoção do dia (sem banco, testada em test/shop.test.ts): um item de cada raridade com 20 a 50% de desconto, troca à meia-noite de Brasília. */
import { ITEMS, type ShopItem, type Tier } from "@/lib/shop/catalog";

export const SALE_TIERS: readonly Tier[] = ["comum", "rara", "epica", "lendaria"];
export const SALE_PCTS = [20, 30, 40, 50] as const;

export interface SaleItem {
  id: string;
  pct: number;
  price: number;
}

/** Número inteiro estável para o texto (FNV-1a). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Sorteio repetível (mulberry32). */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: readonly T[], seed: string): T[] {
  const out = [...list];
  const r = rng(hash(seed));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const dayNumber = (day: string) => Math.floor(Date.parse(`${day}T12:00:00Z`) / 86_400_000);

/**
 * Item da raridade no dia: cada raridade passa por todos os seus itens numa ordem embaralhada (uma volta por ciclo),
 * então nada repete em dias seguidos, nem na virada de uma volta para a outra.
 */
function tierItem(tier: Tier, n: number): ShopItem {
  const list = ITEMS.filter((i) => i.tier === tier);
  const order = (cycle: number): ShopItem[] => {
    const o = shuffle(list, `${tier}:${cycle}`);
    // troca os dois primeiros (o último continua o mesmo, então a volta seguinte confere contra o certo)
    if (cycle > 0 && o[0] === shuffle(list, `${tier}:${cycle - 1}`).at(-1)) [o[0], o[1]] = [o[1], o[0]];
    return o;
  };
  return order(Math.floor(n / list.length))[n % list.length];
}

/** Preço com desconto, de 5 em 5. */
export const salePrice = (price: number, pct: number) => Math.round((price * (100 - pct)) / 100 / 5) * 5;

/** Os 4 itens do dia (AAAA-MM-DD), do comum ao lendário; os descontos 20/30/40/50 trocam de lugar todo dia. */
export function dailySale(day: string): SaleItem[] {
  const n = dayNumber(day);
  const pcts = shuffle(SALE_PCTS, `pct:${day}`);
  return SALE_TIERS.map((tier, i) => {
    const it = tierItem(tier, n);
    return { id: it.id, pct: pcts[i], price: salePrice(it.price, pcts[i]) };
  });
}

/** Quanto o item custa no dia (com a promoção, se estiver nela). */
export function priceOn(item: ShopItem, day: string): number {
  return dailySale(day).find((s) => s.id === item.id)?.price ?? item.price;
}

/** Fim da promoção do dia: meia-noite seguinte em Brasília (UTC-3, sem horário de verão desde 2019). */
export function saleEndsAt(day: string): number {
  return Date.parse(`${day}T00:00:00-03:00`) + 86_400_000;
}
