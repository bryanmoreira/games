import { imageFromRequest, uploadImage } from "@/lib/blog-admin";
import { unauthorized } from "../auth";

/**
 * Envia uma imagem (PNG, JPEG ou WebP, até 5 MB): corpo cru com `Content-Type: image/…`
 * ou formulário com o campo `file`. `?alt=` monta o Markdown pronto. Volta { src, width, height, markdown }.
 */
export async function POST(req: Request) {
  const denied = await unauthorized(req);
  if (denied) return denied;
  const img = await imageFromRequest(req);
  if (!img) return Response.json({ error: "envie a imagem no corpo ou no campo file" }, { status: 400 });
  const r = await uploadImage(img.bytes, img.alt);
  return r.ok ? Response.json(r.image, { status: 201 }) : Response.json({ error: r.error }, { status: r.status });
}
