/** Itens da loja (sem banco, para testar). Desenho em lib/shop/art.ts (mesas: .mesa-* em app/globals.css); compra e inventário em lib/shop/shop.ts. */

export type ItemType = "frame" | "deck" | "table";
export type Tier = "comum" | "rara" | "epica" | "lendaria";

export interface ShopItem {
  /** "frame:madeira", "deck:noite", "table:ouro" — é o que fica no banco */
  id: string;
  type: ItemType;
  /** chave do desenho (lib/shop/art.ts) */
  key: string;
  name: string;
  tier: Tier;
  price: number;
}

export const TIERS: Record<Tier, { label: string; color: string }> = {
  comum: { label: "Comum", color: "#a8a29e" },
  rara: { label: "Rara", color: "#60a5fa" },
  epica: { label: "Épica", color: "#c084fc" },
  lendaria: { label: "Lendária", color: "#f2c14e" },
};

export const FRAME_KEYS = ["madeira", "prata", "feltro", "ficha", "naipes", "neon", "coroa", "fogo", "royal"] as const;
export const DECK_KEYS = ["classico", "azul", "feltro", "xadrez", "naipes", "retro", "deco", "noite", "neon", "holo", "ouro"] as const;
/** Mesa do perfil (atrás da moldura). O feltro verde é o padrão (null). */
export const TABLE_KEYS = ["vinho", "azul", "grafite", "madeira", "couro", "naipes", "cassino", "marmore", "noite", "neon", "ouro", "holo"] as const;
export type FrameKey = (typeof FRAME_KEYS)[number];
export type DeckKey = (typeof DECK_KEYS)[number];
export type TableKey = (typeof TABLE_KEYS)[number];

/** Todo mundo tem: a ficha vermelha (moldura null), o baralho clássico e o feltro verde (mesa null). */
export const DEFAULT_DECK: DeckKey = "classico";

const item = (type: ItemType, key: string, name: string, tier: Tier, price: number): ShopItem => ({ id: `${type}:${key}`, type, key, name, tier, price });

export const ITEMS: readonly ShopItem[] = [
  item("frame", "madeira", "Madeira", "comum", 150),
  item("frame", "prata", "Prata", "comum", 150),
  item("frame", "feltro", "Feltro", "comum", 200),
  item("frame", "ficha", "Ficha", "rara", 450),
  item("frame", "naipes", "Naipes", "rara", 450),
  item("frame", "neon", "Neon", "rara", 500),
  item("frame", "coroa", "Coroa", "epica", 1000),
  item("frame", "fogo", "Fogo", "epica", 1200),
  item("frame", "royal", "Royal Flush", "lendaria", 2500),

  item("deck", "azul", "Azul", "comum", 150),
  item("deck", "feltro", "Mesa verde", "comum", 150),
  item("deck", "xadrez", "Xadrez", "comum", 200),
  item("deck", "naipes", "Naipes", "rara", 450),
  item("deck", "retro", "Anos 70", "rara", 450),
  item("deck", "deco", "Art déco", "rara", 500),
  item("deck", "noite", "Noite", "epica", 1000),
  item("deck", "neon", "Neon", "epica", 1200),
  item("deck", "holo", "Holográfico", "lendaria", 2500),
  item("deck", "ouro", "Ouro", "lendaria", 2500),

  item("table", "vinho", "Vinho", "comum", 150),
  item("table", "azul", "Azul", "comum", 150),
  item("table", "grafite", "Grafite", "comum", 200),
  item("table", "madeira", "Madeira", "rara", 450),
  item("table", "couro", "Couro", "rara", 450),
  item("table", "naipes", "Naipes", "rara", 500),
  item("table", "cassino", "Cassino", "epica", 1000),
  item("table", "marmore", "Mármore", "epica", 1000),
  item("table", "noite", "Noite", "epica", 1200),
  item("table", "neon", "Neon", "lendaria", 2500),
  item("table", "ouro", "Ouro", "lendaria", 2500),
  item("table", "holo", "Holográfica", "lendaria", 2500),
];

export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

/** Itens grátis que já vêm com a conta (não ficam no banco). */
export const DEFAULT_NAMES: Record<ItemType, string> = { frame: "Ficha vermelha", deck: "Clássico", table: "Feltro verde" };

/** Chave válida de moldura (ou null = ficha vermelha). Qualquer outra coisa vira null. */
export const frameKey = (k: unknown): FrameKey | null => (FRAME_KEYS as readonly unknown[]).includes(k) ? (k as FrameKey) : null;
/** Chave válida de mesa (ou null = feltro verde). */
export const tableKey = (k: unknown): TableKey | null => ((TABLE_KEYS as readonly unknown[]).includes(k) ? (k as TableKey) : null);
/** Classes da mesa do perfil: o feltro de sempre e, por cima, a mesa da loja. */
export const tableClass = (k: unknown) => {
  const key = tableKey(k);
  return key ? `felt mesa mesa-${key}` : "felt";
};
/** Chave válida de baralho; desconhecido vira o clássico. */
export const deckKey = (k: unknown): DeckKey => ((DECK_KEYS as readonly unknown[]).includes(k) ? (k as DeckKey) : DEFAULT_DECK);

/** O que o jogador pode fazer com o item na loja. */
export function shopAction(it: ShopItem, owned: boolean, equipped: boolean, balance: number): "equipped" | "equip" | "buy" | "poor" {
  if (equipped) return "equipped";
  if (owned) return "equip";
  return balance >= it.price ? "buy" : "poor";
}
