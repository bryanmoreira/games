import type { Metadata } from "next";
import { headers } from "next/headers";
import { WoodHeader } from "@/components/home/WoodTop";
import { ShopView } from "@/components/shop/ShopView";
import { auth } from "@/lib/auth";
import { chipsState } from "@/lib/chips";
import { prisma } from "@/lib/db";
import { currentSale, shopState } from "@/lib/shop/shop";

export const metadata: Metadata = { title: "Loja", robots: { index: false, follow: false } };

/** Aberta para todo mundo: sem conta é vitrine (comprar leva ao login e volta para o item). */
export default async function ShopPage() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  const id = session?.user.id;
  const [state, chips, unlocked] = id
    ? await Promise.all([shopState(id), chipsState(id), prisma.achievement.findMany({ where: { userId: id }, select: { code: true } })])
    : [null, null, []];
  const user = session && state ? { name: session.user.name, image: session.user.image ?? null } : null;

  return (
    <div className="table-texture min-h-dvh bg-[#0f1813]">
      <WoodHeader title="LOJA" shop={false} />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-8">
        <ShopView
          user={user}
          initial={state ? JSON.parse(JSON.stringify(state)) : null}
          sale={currentSale()}
          streak={chips?.streak ?? 0}
          unlocked={unlocked.map((a) => a.code)}
        />
      </main>
    </div>
  );
}
