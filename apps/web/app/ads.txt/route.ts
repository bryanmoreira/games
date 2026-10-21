import { connection } from "next/server";

// Vendedores autorizados (https://iabtechlab.com/ads-txt): o AdSense exige este arquivo na raiz do domínio
export async function GET() {
  await connection();
  const pub = process.env.ADSENSE_CLIENT?.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
