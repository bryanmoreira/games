import { deletePost, savePost } from "@/lib/blog-admin";
import { adminSession, notFound } from "../../auth";

type Ctx = { params: Promise<{ id: string }> };

/** Admin edita um post: só os campos enviados mudam. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await adminSession())) return notFound();
  const r = await savePost((await params).id, await req.json().catch(() => null));
  return r.ok ? Response.json(r.post) : Response.json({ errors: r.errors }, { status: r.status });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await adminSession())) return notFound();
  return new Response(null, { status: (await deletePost((await params).id)) ? 204 : 404 });
}
