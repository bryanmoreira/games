import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ONLINE_MS, isOnline } from "@/lib/friends-rules";
import { loginHref } from "@/lib/login";

export const ADMIN_ROLE = "admin";

export function isAdmin(user: { role?: string | null } | null | undefined): boolean {
  return user?.role === ADMIN_ROLE;
}

/** Páginas de /admin: sem login vai para o login; logado sem ser admin vê 404 (a área não "existe" para ele). */
export async function requireAdmin(from = "/admin") {
  // sem o cache do cookie: tirar o admin de alguém vale na hora
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (!session) redirect(loginHref(from));
  if (!isAdmin(session.user)) notFound();
  return session;
}

export const ADMIN_PAGE_SIZE = 25;

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  username: string | null;
  role: string;
  equippedFrame: string | null;
  chips: number;
  providers: string[];
  games: number;
  createdAt: Date;
  lastSeenAt: Date | null;
  online: boolean;
};

/** Usuários mais novos primeiro; `q` procura no nome, @ e e-mail. `page` começa em 1. admins/online contam o site todo. */
export async function listUsers({ q = "", page = 1 }: { q?: string; page?: number }) {
  const term = q.trim().replace(/^@/, "");
  const where = term
    ? {
        OR: (["name", "username", "email"] as const).map((f) => ({ [f]: { contains: term, mode: "insensitive" as const } })),
      }
    : {};
  const now = new Date();
  const [total, admins, online, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { role: ADMIN_ROLE } }),
    prisma.user.count({ where: { lastSeenAt: { gte: new Date(now.getTime() - ONLINE_MS) } } }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        role: true,
        equippedFrame: true,
        chips: true,
        createdAt: true,
        lastSeenAt: true,
        accounts: { select: { providerId: true } },
        _count: { select: { results: true } },
      },
    }),
  ]);
  const users: AdminUser[] = rows.map(({ accounts, _count, ...u }) => ({
    ...u,
    providers: [...new Set(accounts.map((a) => a.providerId))],
    games: _count.results,
    online: isOnline(u.lastSeenAt, now),
  }));
  return { users, total, admins, online, pages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}
