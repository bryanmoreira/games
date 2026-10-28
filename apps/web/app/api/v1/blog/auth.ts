import { checkApiKey } from "@/lib/blog-admin";

/** Chave da API do blog (criada em /admin/blog): `Authorization: Bearer mj_…` ou `X-API-Key: mj_…`. */
export async function unauthorized(req: Request): Promise<Response | null> {
  if (await checkApiKey(req.headers)) return null;
  return Response.json({ error: "chave da API ausente ou inválida" }, { status: 401, headers: { "www-authenticate": "Bearer" } });
}
