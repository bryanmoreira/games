import { FRAME_KEYS, frameSvg } from "@/lib/shop/art";
import { frameKey } from "@/lib/shop/catalog";

// /molduras/<moldura>.svg: anel em volta da foto, gerado no build (lib/shop/art.ts).
export const dynamicParams = false;

export function generateStaticParams() {
  return FRAME_KEYS.map((k) => ({ file: `${k}.svg` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const key = frameKey((await params).file.replace(/\.svg$/, ""));
  if (!key) return new Response(null, { status: 404 });
  return new Response(frameSvg(key), { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=604800, immutable" } });
}
