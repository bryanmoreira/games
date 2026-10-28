import { imageFromRequest, uploadImage } from "@/lib/blog-admin";
import { adminSession, notFound } from "../auth";

/** Admin envia uma imagem (formulário com `file`). Volta { src, width, height, markdown }. */
export async function POST(req: Request) {
  if (!(await adminSession())) return notFound();
  const img = await imageFromRequest(req);
  if (!img) return Response.json({ error: "envie a imagem no campo file" }, { status: 400 });
  const r = await uploadImage(img.bytes, img.alt);
  return r.ok ? Response.json(r.image, { status: 201 }) : Response.json({ error: r.error }, { status: r.status });
}
