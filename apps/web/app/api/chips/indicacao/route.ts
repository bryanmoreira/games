import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { claimReferral } from "@/lib/chips";

/** Conta nova que chegou por um link com ?ref=<usuario>: paga as fichas da indicação (uma vez só). */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response(null, { status: 401 });
  const ref = (await req.json().catch(() => null))?.ref;
  if (typeof ref !== "string" || !/^[a-zA-Z0-9_.]{1,40}$/.test(ref)) return Response.json({ error: "inválido" }, { status: 400 });
  const r = await claimReferral(session.user.id, ref);
  return r.ok ? Response.json(r) : Response.json({ error: r.error }, { status: 409 });
}
