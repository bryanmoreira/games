import type { Metadata } from "next";
import { headers } from "next/headers";
import { LinkedAccounts } from "@/components/profile/LinkedAccounts";
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

/** Erros que o Better Auth manda em ?error= quando "Conectar" falha. */
function linkError(code: string): string {
  if (code === "account_already_linked_to_different_user") return "Essa conta já está ligada a outro jogador.";
  if (code === "access_denied") return "Conexão cancelada.";
  return "Não deu para conectar. Tente de novo.";
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const h = await headers();
  const session = await auth.api.getSession({ headers: h, query: { disableCookieCache: true } });
  if (!session) return null;
  const accounts = await auth.api.listUserAccounts({ headers: h });

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

      <div className="rounded-2xl bg-white/5 ring-1 ring-white/10">
        <h2 className="px-4 pb-1 pt-4 text-sm text-white/50 sm:px-5">Formas de entrar</h2>
        {error && (
          <p role="alert" className="mx-4 my-2 rounded-xl bg-red-950/60 px-3 py-2 text-xs text-red-200 ring-1 ring-red-500/30 sm:mx-5">
            {linkError(error)}
          </p>
        )}
        <LinkedAccounts linked={accounts.map((a) => ({ id: a.id, providerId: a.providerId }))} />
      </div>

      <div className="divide-y divide-white/10 rounded-2xl bg-white/5 ring-1 ring-white/10">
        <Row label="E-mail">{session.user.email}</Row>
        <Row label="Membro desde">{since}</Row>
      </div>
    </div>
  );
}
