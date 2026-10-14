import type { Metadata } from "next";
import { BackButton } from "@/components/BackButton";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: `Admin · ${SITE_NAME}`, template: `%s · Admin · ${SITE_NAME}` },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-[#0f1813]">
      <BackButton href="/perfil" className="fixed left-4 top-4 z-10" />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 pt-20 md:grid md:grid-cols-[200px_1fr] md:gap-10">
        <AdminNav />
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
