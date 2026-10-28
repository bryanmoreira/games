import { deletePost, findPost, savePost } from "@/lib/blog-admin";
import { unauthorized } from "../../auth";

type Ctx = { params: Promise<{ slug: string }> };

const missing = () => Response.json({ error: "post não existe" }, { status: 404 });

export async function GET(req: Request, { params }: Ctx) {
  const denied = await unauthorized(req);
  if (denied) return denied;
  const post = await findPost({ slug: (await params).slug });
  return post ? Response.json(post) : missing();
}

/** Edita: só os campos enviados mudam (`{ "draft": false }` publica). */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await unauthorized(req);
  if (denied) return denied;
  const post = await findPost({ slug: (await params).slug });
  if (!post) return missing();
  const r = await savePost(post.id, await req.json().catch(() => null));
  return r.ok ? Response.json(r.post) : Response.json({ errors: r.errors }, { status: r.status });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await unauthorized(req);
  if (denied) return denied;
  const post = await findPost({ slug: (await params).slug });
  if (!post) return missing();
  await deletePost(post.id);
  return new Response(null, { status: 204 });
}
