import { deleteApiKey } from "@/lib/blog-admin";
import { adminSession, notFound } from "../../auth";

/** Admin revoga uma chave: para de funcionar na hora. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminSession())) return notFound();
  return new Response(null, { status: (await deleteApiKey((await params).id)) ? 204 : 404 });
}
