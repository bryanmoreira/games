import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ChipBalance } from "@/components/chips/ChipBalance";
import { ShopButton } from "@/components/shop/ShopButton";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileNav } from "@/components/profile/ProfileNav";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { countFriendRequests } from "@/lib/friends";
import { loginHref } from "@/lib/login";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: `Perfil · ${SITE_NAME}`, template: `%s · ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session) redirect(loginHref("/perfil"));

  const { name, email, image, username, equippedFrame } = session.user;
  const requests = await countFriendRequests(session.user.id);

  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <BackButton href="/" className="fixed left-4 top-4 z-10" />
      <div className="fixed right-4 top-4 z-10 flex gap-3">
        <ShopButton />
        <ChipBalance />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12 pt-20 sm:gap-10">
        <ProfileHeader user={{ name, email, image: image ?? null, username: username ?? null, equippedFrame: equippedFrame ?? null }} />
        <div className="flex flex-col gap-6 md:grid md:grid-cols-[200px_1fr] md:gap-10">
          <ProfileNav badges={{ "/perfil/amigos": requests }} admin={isAdmin(session.user)} />
          <section className="min-w-0">{children}</section>
        </div>
      </div>
    </div>
  );
}
