import { headers } from "next/headers";
import { isAdmin } from "@/lib/admin";
import { auth } from "@/lib/auth";

/** Admin logado (sem cache do cookie) ou null. Quem não é admin recebe 404 nas rotas. */
export async function adminSession() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  return session && isAdmin(session.user) ? session : null;
}

export const notFound = () => new Response(null, { status: 404 });
