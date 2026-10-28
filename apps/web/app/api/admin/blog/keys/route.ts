import { createApiKey } from "@/lib/blog-admin";
import { adminSession, notFound } from "../auth";

/** Admin cria uma chave da API: { name }. A chave inteira só aparece nesta resposta. */
export async function POST(req: Request) {
  const session = await adminSession();
  if (!session) return notFound();
  const body = (await req.json().catch(() => null)) as { name?: unknown } | null;
  return Response.json(await createApiKey(typeof body?.name === "string" ? body.name : "", session.user.id), { status: 201 });
}
