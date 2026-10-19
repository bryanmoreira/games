import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ChipBalance } from "@/components/chips/ChipBalance";
import { ShopView } from "@/components/shop/ShopView";
import { auth } from "@/lib/auth";
import { loginHref } from "@/lib/login";
import { shopState } from "@/lib/shop/shop";

export const metadata: Metadata = { title: "Loja", robots: { index: false, follow: false } };

/** Só para quem está logado: sem conta vai para o login e volta para cá. */
export default async function ShopPage() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session) redirect(loginHref("/loja"));
  const state = await shopState(session.user.id);
  if (!state) redirect(loginHref("/loja"));
  const user = { name: session.user.name, image: session.user.image ?? null };

  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <BackButton href="/" className="fixed left-4 top-4 z-10" />
      <div className="fixed right-4 top-4 z-10">
        <ChipBalance />
      </div>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-20">
        <ShopView user={user} initial={JSON.parse(JSON.stringify(state))} />
      </main>
    </div>
  );
}
