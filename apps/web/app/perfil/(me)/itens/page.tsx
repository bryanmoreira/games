import type { Metadata } from "next";
import { headers } from "next/headers";
import { InventoryPage } from "@/components/shop/Inventory";
import { ShopLink } from "@/components/shop/ItemList";
import { auth } from "@/lib/auth";
import { shopState } from "@/lib/shop/shop";

export const metadata: Metadata = { title: "Itens" };

/** Inventário: molduras e baralhos do jogador, com a data de cada compra ou presente e o botão de usar. */
export default async function ItemsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const state = await shopState(session.user.id);
  if (!state) return null;
  return (
    <div className="flex flex-col gap-6">
      <InventoryPage user={{ name: session.user.name, image: session.user.image ?? null }} initial={JSON.parse(JSON.stringify(state))} />
      <div>
        <ShopLink>Loja</ShopLink>
      </div>
    </div>
  );
}
