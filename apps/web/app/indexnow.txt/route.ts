import { connection } from "next/server";
import { indexNowKey } from "@/lib/indexnow";

// Arquivo da chave do IndexNow: os buscadores conferem que o site é nosso antes de aceitar os avisos
export async function GET() {
  await connection();
  const key = indexNowKey();
  if (!key) return new Response(null, { status: 404 });
  return new Response(key, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
