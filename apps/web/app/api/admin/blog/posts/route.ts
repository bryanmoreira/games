import { savePost } from "@/lib/blog-admin";
import { adminSession, notFound } from "../auth";

/** Admin cria um post. Corpo: campos do post (ver lib/blog-rules.ts). */
export async function POST(req: Request) {
  if (!(await adminSession())) return notFound();
  const r = await savePost(null, await req.json().catch(() => null));
  return r.ok ? Response.json(r.post, { status: 201 }) : Response.json({ errors: r.errors }, { status: r.status });
}
