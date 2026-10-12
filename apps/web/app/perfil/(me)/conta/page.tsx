import type { Metadata } from "next";
import { headers } from "next/headers";
import { SOCIAL_PROVIDERS } from "@/components/auth/providers";
import { PrivacyToggle } from "@/components/profile/PrivacyToggle";
import { UsernameField } from "@/components/profile/UsernameField";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Conta" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
      <span className="text-sm text-white/50">{label}</span>
      <span className="min-w-0 truncate text-right text-sm text-white/90">{children}</span>
    </div>
  );
}

export default async function AccountPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h, query: { disableCookieCache: true } });
  if (!session) return null;
  const accounts = await auth.api.listUserAccounts({ headers: h });
  const linked = new Set(accounts.map((a) => a.providerId));

  const since = new Date(session.user.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:p-5">
        <h2 className="mb-3 text-sm text-white/50">Nome de usuário</h2>
        <UsernameField current={session.user.username ?? null} />
      </div>

      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10">
        <PrivacyToggle initial={session.user.profilePublic ?? true} />
      </div>

      <div className="divide-y divide-white/10 rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Row label="E-mail">{session.user.email}</Row>
        <Row label="Membro desde">{since}</Row>
        <Row label="Login">
          <span className="flex items-center justify-end gap-2">
            {SOCIAL_PROVIDERS.filter((p) => linked.has(p.id)).map(({ id, label, Logo }) => (
              <span key={id} className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-neutral-800">
                <Logo className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </span>
        </Row>
      </div>
    </div>
  );
}
