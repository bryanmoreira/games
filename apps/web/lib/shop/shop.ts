import { prisma } from "@/lib/db";
import { deckKey, frameKey, ITEM_BY_ID, type DeckKey, type FrameKey, type ItemType } from "@/lib/shop/catalog";

// Loja no banco: inventário (user_item), o que está em uso (user.equippedFrame/Deck) e as fichas da compra.

export interface Equipped {
  frame: FrameKey | null;
  deck: DeckKey;
}

export const equippedOf = (u: { equippedFrame?: string | null; equippedDeck?: string | null }): Equipped => ({
  frame: frameKey(u.equippedFrame),
  deck: deckKey(u.equippedDeck),
});

/** Linha do inventário: quando e como o item chegou (e, para o admin, quando saiu). */
export interface OwnedItem {
  itemId: string;
  source: "purchase" | "admin";
  price: number | null;
  acquiredAt: Date;
  removedAt: Date | null;
}

export type ShopError = "unknown" | "owned" | "poor" | "not_owned" | "no_user" | "negative";
export type ShopResult = { ok: true } | { ok: false; error: ShopError };
const fail = (error: ShopError): ShopResult => ({ ok: false, error });

/** Itens do jogador, mais novos primeiro. `all`: inclui os que o admin tirou. */
export async function inventory(userId: string, all = false): Promise<OwnedItem[]> {
  const rows = await prisma.userItem.findMany({
    where: { userId, ...(all ? {} : { removedAt: null }) },
    orderBy: { acquiredAt: "desc" },
    select: { itemId: true, source: true, price: true, acquiredAt: true, removedAt: true },
  });
  return rows.filter((r) => ITEM_BY_ID.has(r.itemId)) as OwnedItem[];
}

/** Saldo, o que tem e o que usa (a página da loja). */
export async function shopState(userId: string) {
  const [user, items] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { chips: true, equippedFrame: true, equippedDeck: true } }),
    inventory(userId),
  ]);
  if (!user) return null;
  return { chips: user.chips, equipped: equippedOf(user), items };
}

const field = (type: ItemType) => (type === "frame" ? "equippedFrame" : "equippedDeck");

/** Compra com as fichas do jogador e já passa a usar. Saldo conferido no próprio UPDATE (duas compras juntas não passam do saldo). */
export async function buyItem(userId: string, itemId: string): Promise<ShopResult> {
  const it = ITEM_BY_ID.get(itemId);
  if (!it) return fail("unknown");
  return prisma.$transaction(async (tx) => {
    const has = await tx.userItem.findUnique({ where: { userId_itemId: { userId, itemId } }, select: { removedAt: true } });
    if (has && !has.removedAt) return fail("owned");
    const paid = await tx.user.updateMany({
      where: { id: userId, chips: { gte: it.price } },
      data: { chips: { decrement: it.price }, [field(it.type)]: it.key },
    });
    if (!paid.count) return fail("poor");
    const data = { source: "purchase", price: it.price, grantedById: null, acquiredAt: new Date(), removedAt: null, removedById: null };
    await tx.userItem.upsert({ where: { userId_itemId: { userId, itemId } }, create: { userId, itemId, ...data }, update: data });
    await tx.chipTransaction.create({ data: { userId, delta: -it.price, reason: "purchase", ref: `${itemId}:${Date.now()}` } });
    return { ok: true };
  });
}

/** Passa a usar um item que tem (key null = volta ao padrão: ficha vermelha / clássico). */
export async function equipItem(userId: string, type: ItemType, key: string | null): Promise<ShopResult> {
  if (key !== null) {
    const it = ITEM_BY_ID.get(`${type}:${key}`);
    if (!it) return fail("unknown");
    const has = await prisma.userItem.findUnique({ where: { userId_itemId: { userId, itemId: it.id } }, select: { removedAt: true } });
    if (!has || has.removedAt) return fail("not_owned");
  }
  await prisma.user.update({ where: { id: userId }, data: { [field(type)]: key } });
  return { ok: true };
}

/** Admin dá um item (de graça). Quem já tem fica como está. */
export async function grantItem(adminId: string, userId: string, itemId: string): Promise<ShopResult> {
  if (!ITEM_BY_ID.has(itemId)) return fail("unknown");
  if (!(await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }))) return fail("no_user");
  const has = await prisma.userItem.findUnique({ where: { userId_itemId: { userId, itemId } }, select: { removedAt: true } });
  if (has && !has.removedAt) return fail("owned");
  const data = { source: "admin", price: null, grantedById: adminId, acquiredAt: new Date(), removedAt: null, removedById: null };
  await prisma.userItem.upsert({ where: { userId_itemId: { userId, itemId } }, create: { userId, itemId, ...data }, update: data });
  return { ok: true };
}

/** Admin tira um item (as fichas de uma compra não voltam). Se estava em uso, volta ao padrão. */
export async function revokeItem(adminId: string, userId: string, itemId: string): Promise<ShopResult> {
  const it = ITEM_BY_ID.get(itemId);
  if (!it) return fail("unknown");
  return prisma.$transaction(async (tx) => {
    const done = await tx.userItem.updateMany({ where: { userId, itemId, removedAt: null }, data: { removedAt: new Date(), removedById: adminId } });
    if (!done.count) return fail("not_owned");
    await tx.user.updateMany({ where: { id: userId, [field(it.type)]: it.key }, data: { [field(it.type)]: null } });
    return { ok: true };
  });
}

/** Admin dá (delta > 0) ou tira (delta < 0) fichas. Não deixa o saldo ficar negativo. */
export async function adjustChips(adminId: string, userId: string, delta: number, note: string | null): Promise<ShopResult> {
  if (!Number.isInteger(delta) || delta === 0) return fail("unknown");
  return prisma.$transaction(async (tx) => {
    const done = await tx.user.updateMany({
      where: { id: userId, ...(delta < 0 ? { chips: { gte: -delta } } : {}) },
      data: { chips: { increment: delta } },
    });
    if (!done.count) return fail((await tx.user.count({ where: { id: userId } })) ? "negative" : "no_user");
    await tx.chipTransaction.create({ data: { userId, delta, reason: "admin", ref: crypto.randomUUID(), byId: adminId, note: note?.trim().slice(0, 120) || null } });
    return { ok: true };
  });
}
