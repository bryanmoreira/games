import { listAllPosts, savePost } from "@/lib/blog-admin";
import { unauthorized } from "../auth";

/** Todos os posts, rascunhos inclusive (mais novos primeiro). */
export async function GET(req: Request) {
  const denied = await unauthorized(req);
  if (denied) return denied;
  return Response.json({ posts: await listAllPosts() });
}

/** Cria um post. Sem `slug` ele sai do título; sem `date`, hoje; sem `draft`, fica como rascunho. */
export async function POST(req: Request) {
  const denied = await unauthorized(req);
  if (denied) return denied;
  const r = await savePost(null, await req.json().catch(() => null));
  return r.ok ? Response.json(r.post, { status: 201 }) : Response.json({ errors: r.errors }, { status: r.status });
}
