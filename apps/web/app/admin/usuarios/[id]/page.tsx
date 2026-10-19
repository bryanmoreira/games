import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldIcon } from "@/components/admin/AdminNav";
import { UserShop } from "@/components/admin/UserShop";
import { ChipsView } from "@/components/chips/ChipsView";
import { CARD, ago, dateFmt, dateTimeFmt, icon } from "@/components/admin/ui";
import { SOCIAL_PROVIDERS } from "@/components/auth/providers";
import { Avatar } from "@/components/profile/ProfileHeader";
import { ProfileStatsView } from "@/components/stats/ProfileStats";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { deviceLabel } from "@/lib/admin-rules";
import { getAdminUser } from "@/lib/admin-stats";
import { chipHistory, chipsState } from "@/lib/chips";
import { prisma } from "@/lib/db";
import { inventory } from "@/lib/shop/shop";
import { GAME_INFO, type StatGame } from "@/lib/stats/games";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const u = await prisma.user.findUnique({ where: { id: (await params).id }, select: { name: true } });
  return { title: u?.name ?? "Usuário" };
}

const OUTCOME: Record<string, { label: string; cls: string }> = {
  win: { label: "V", cls: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30" },
  loss: { label: "D", cls: "bg-red-400/15 text-red-300 ring-red-400/30" },
  draw: { label: "E", cls: "bg-white/10 text-white/60 ring-white/20" },
};
const MODE: Record<string, string> = { online: "Online", ai: "IA", solo: "Solo" };

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-display text-sm text-white/80">
        {title.toUpperCase()}
        {count !== undefined && <span className="text-xs tabular-nums text-white/40">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className={`${CARD} px-4 py-6 text-center text-sm text-white/40`}>{children}</p>;

export default async function AdminUser({ params }: Props) {
  const { id } = await params;
  await requireAdmin(`/admin/usuarios/${id}`);
  const data = await getAdminUser(id);
  if (!data) notFound();
  const { user, stats, recent, friends, pendingFriends } = data;
  const [items, chips, history] = await Promise.all([inventory(id, true), chipsState(id), chipHistory(id, 60)]);
  const now = new Date();

  const facts: [React.ReactNode, string, string][] = [
    [
      icon(
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </>,
      ),
      dateFmt.format(user.createdAt),
      "Cadastro",
    ],
    [
      icon(
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>,
      ),
      user.online ? "online" : user.lastSeenAt ? ago(user.lastSeenAt, now) : "—",
      "Visto por último",
    ],
    [
      user.profilePublic
        ? icon(
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
            </>,
          )
        : icon(
            <>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </>,
          ),
      user.profilePublic ? "público" : "privado",
      "Perfil",
    ],
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className={`${CARD} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5`}>
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="relative">
            <Avatar user={user} className="h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl" />
            {user.online && <span title="Online" className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-emerald-400 ring-2 ring-[#0f1813]" />}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="flex min-w-0 items-center gap-2 font-display text-xl text-gold sm:text-2xl">
              <span className="truncate">{user.name}</span>
              {isAdmin(user) && (
                <span title="Admin">
                  <ShieldIcon className="h-5 w-5" />
                </span>
              )}
            </h1>
            {user.username && (
              <Link href={`/perfil/${user.username}`} className="w-fit text-sm text-white/60 transition hover:text-gold">
                @{user.username}
              </Link>
            )}
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-white/50">
              <span className="truncate">{user.email}</span>
              {user.emailVerified && (
                <span title="E-mail verificado" className="text-emerald-400">
                  {icon(<path d="m5 12 5 5L20 7" />)}
                </span>
              )}
              {user.accounts.map((a) => {
                const p = SOCIAL_PROVIDERS.find((s) => s.id === a.providerId);
                return p ? (
                  <span key={a.providerId} title={p.label}>
                    <p.Logo className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span key={a.providerId}>{a.providerId}</span>
                );
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60">
          {facts.map(([ic, value, label]) => (
            <span key={label} title={label} className="flex items-center gap-1.5">
              {ic}
              {value}
            </span>
          ))}
        </div>
      </header>

      <Section title="Fichas e itens" count={items.filter((i) => !i.removedAt).length}>
        <UserShop userId={user.id} chips={user.chips} items={JSON.parse(JSON.stringify(items))} />
      </Section>

      {chips && (
        <Section title="Histórico de fichas" count={history.length}>
          <ChipsView state={chips} history={history} />
        </Section>
      )}

      <Section title="Partidas recentes" count={recent.length}>
        {recent.length ? (
          <ul className={`${CARD} divide-y divide-white/5`}>
            {recent.map((r) => {
              const o = OUTCOME[r.outcome] ?? OUTCOME.draw;
              return (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${o.cls}`}>
                    {r.placement && r.placement > 1 ? `${r.placement}º` : o.label}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-white/90">{GAME_INFO[r.game as StatGame]?.name ?? r.game}</span>
                  {r.daily && (
                    <span title={`Desafio de ${r.daily.slice(0, 10)}`} className="text-gold">
                      {icon(
                        <>
                          <rect x="3" y="5" width="18" height="16" rx="2" />
                          <path d="M3 10h18M8 3v4M16 3v4" />
                        </>,
                      )}
                    </span>
                  )}
                  <span className="w-12 text-xs text-white/50">{MODE[r.mode] ?? r.mode}</span>
                  <span className="w-20 text-right text-xs tabular-nums text-white/40">{dateTimeFmt.format(r.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Nenhuma partida.</Empty>
        )}
      </Section>

      <Section title="Números">
        <ProfileStatsView stats={stats} />
      </Section>

      <Section title="Amigos" count={friends.length}>
        {pendingFriends > 0 && <span className="-mt-1 text-xs text-white/40">+{pendingFriends} pedido{pendingFriends === 1 ? "" : "s"} esperando</span>}
        {friends.length ? (
          <ul className="flex flex-wrap gap-2">
            {friends.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/admin/usuarios/${f.id}`}
                  className="flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-3 text-sm text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="relative">
                    <Avatar user={f} className="h-7 w-7 text-xs !ring-1" />
                    {f.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0f1813]" />}
                  </span>
                  {f.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nenhum amigo.</Empty>
        )}
      </Section>

      <Section title="Sessões abertas" count={user.sessions.length}>
        {user.sessions.length ? (
          <ul className={`${CARD} divide-y divide-white/5`}>
            {user.sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                <span className="flex min-w-0 flex-1 items-center gap-2 text-white/90" title={s.userAgent ?? undefined}>
                  {icon(
                    <>
                      <rect x="2" y="4" width="20" height="13" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </>,
                    "h-4 w-4 text-white/40",
                  )}
                  {deviceLabel(s.userAgent)}
                </span>
                <span className="font-mono text-xs text-white/50">{s.ipAddress || "—"}</span>
                <span className="text-xs tabular-nums text-white/40" title={`Entrou em ${dateTimeFmt.format(s.createdAt)} · vence ${dateFmt.format(s.expiresAt)}`}>
                  {ago(s.updatedAt, now)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Nenhuma sessão aberta.</Empty>
        )}
      </Section>
    </div>
  );
}
