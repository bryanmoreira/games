import type { Metadata } from "next";
import Link from "next/link";
import { ShieldIcon } from "@/components/admin/AdminNav";
import { SOCIAL_PROVIDERS } from "@/components/auth/providers";
import { Avatar } from "@/components/profile/ProfileHeader";
import { type AdminUser, isAdmin, listUsers, requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Usuários" };

const TZ = "America/Sao_Paulo";
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: TZ });

/** "agora", "5 min", "3 h", "2 d", depois a data. */
function ago(d: Date, now: Date): string {
  const min = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  if (min < 60 * 24) return `${Math.floor(min / 60)} h`;
  if (min < 60 * 24 * 30) return `${Math.floor(min / 1440)} d`;
  return dateFmt.format(d);
}

function href(q: string, page: number) {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (page > 1) p.set("p", String(page));
  const s = p.toString();
  return `/admin/usuarios${s ? `?${s}` : ""}`;
}

const icon = (d: React.ReactNode, className = "h-3.5 w-3.5") => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <span className="font-display text-2xl tabular-nums text-gold">{value}</span>
      <span className="text-[11px] uppercase tracking-wider text-white/50">{label}</span>
    </div>
  );
}

function Row({ user, now }: { user: AdminUser; now: Date }) {
  const name = (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-medium text-white">{user.name}</span>
      {isAdmin(user) && (
        <span title="Admin" className="text-gold">
          <ShieldIcon className="h-3.5 w-3.5" />
        </span>
      )}
    </span>
  );

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/10 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative">
          <Avatar user={user} className="h-10 w-10 text-lg !ring-2" />
          {user.online && <span title="Online" className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[#0f1813]" />}
        </div>
        <div className="flex min-w-0 flex-col">
          {user.username ? (
            <Link href={`/perfil/${user.username}`} className="min-w-0 transition hover:text-gold [&_span]:hover:text-gold">
              {name}
            </Link>
          ) : (
            name
          )}
          <span className="truncate text-xs text-white/50">
            {user.username && <>@{user.username} · </>}
            {user.email}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 pl-[52px] text-xs text-white/60 sm:pl-0">
        <span className="flex w-9 items-center gap-1" title="Login">
          {user.providers.map((id) => {
            const p = SOCIAL_PROVIDERS.find((s) => s.id === id);
            return p ? (
              <span key={id} title={p.label}>
                <p.Logo className="h-3.5 w-3.5" />
              </span>
            ) : (
              <span key={id}>{id}</span>
            );
          })}
        </span>
        <span className="flex w-12 items-center gap-1 tabular-nums" title="Partidas jogadas">
          {icon(
            <>
              <rect x="3" y="7" width="18" height="12" rx="3" />
              <path d="M7 13h4M9 11v4M15 12h.01M17 14h.01" />
            </>,
          )}
          {user.games}
        </span>
        <span className="flex w-20 items-center gap-1 tabular-nums" title={`Cadastro: ${dateFmt.format(user.createdAt)}`}>
          {icon(
            <>
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18M8 3v4M16 3v4" />
            </>,
          )}
          {dateFmt.format(user.createdAt)}
        </span>
        <span className={`flex w-16 items-center gap-1 ${user.online ? "text-emerald-400" : ""}`} title="Visto por último">
          {icon(
            <>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </>,
          )}
          {user.online ? "online" : user.lastSeenAt ? ago(user.lastSeenAt, now) : "—"}
        </span>
      </div>
    </li>
  );
}

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; p?: string }> }) {
  await requireAdmin("/admin/usuarios");
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const page = Math.max(1, Number.parseInt(sp.p ?? "1", 10) || 1);
  const { users, total, admins, online, pages } = await listUsers({ q, page });
  const now = new Date();

  const pager = "flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-2xl text-gold drop-shadow-[0_2px_0_#7a4e0c] sm:text-3xl">Usuários</h1>

      <div className="grid grid-cols-3 gap-2 sm:max-w-md">
        <Stat value={total} label={q ? "achados" : "contas"} />
        <Stat value={admins} label="admins" />
        <Stat value={online} label="online" />
      </div>

      <form action="/admin/usuarios" className="flex gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 ring-1 ring-white/10 focus-within:ring-gold/60">
          {icon(
            <>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </>,
            "h-4 w-4 text-white/40",
          )}
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="nome, @ ou e-mail"
            aria-label="Buscar usuário"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-white/30"
          />
        </label>
        <button type="submit" className="rounded-xl bg-gold px-4 font-display text-sm text-[#2a1a04] transition hover:brightness-110">
          Buscar
        </button>
      </form>

      {users.length ? (
        <ul className="flex flex-col gap-2">
          {users.map((u) => (
            <Row key={u.id} user={u} now={now} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-white/40">Ninguém encontrado.</p>
      )}

      {pages > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-center gap-3 text-sm text-white/60">
          {page > 1 ? (
            <Link href={href(q, page - 1)} aria-label="Anterior" title="Anterior" className={`${pager} hover:bg-white/10 hover:text-white`}>
              {icon(<path d="m15 18-6-6 6-6" />, "h-4 w-4")}
            </Link>
          ) : (
            <span className={`${pager} opacity-30`}>{icon(<path d="m15 18-6-6 6-6" />, "h-4 w-4")}</span>
          )}
          <span className="tabular-nums">
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={href(q, page + 1)} aria-label="Próxima" title="Próxima" className={`${pager} hover:bg-white/10 hover:text-white`}>
              {icon(<path d="m9 18 6-6-6-6" />, "h-4 w-4")}
            </Link>
          ) : (
            <span className={`${pager} opacity-30`}>{icon(<path d="m9 18 6-6-6-6" />, "h-4 w-4")}</span>
          )}
        </nav>
      )}
    </div>
  );
}
