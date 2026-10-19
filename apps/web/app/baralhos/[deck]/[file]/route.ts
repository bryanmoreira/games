import { CARD_FILES, DECK_KEYS, backSvg, faceSvg, parseCardFile } from "@/lib/shop/art";
import { deckKey } from "@/lib/shop/catalog";

// /baralhos/<baralho>/<carta>.svg e /baralhos/<baralho>/verso.svg: gerados no build a partir do molde (lib/shop/art.ts).
export const dynamicParams = false;

export function generateStaticParams() {
  return DECK_KEYS.flatMap((deck) => ["verso", ...CARD_FILES].map((f) => ({ deck, file: `${f}.svg` })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ deck: string; file: string }> }) {
  const { deck, file } = await params;
  const key = deckKey(deck);
  const name = file.replace(/\.svg$/, "");
  const card = name === "verso" ? null : parseCardFile(name);
  if (key !== deck || !file.endsWith(".svg") || (name !== "verso" && !card)) return new Response(null, { status: 404 });
  const body = card ? faceSvg(key, card.rank, card.suit) : backSvg(key);
  return new Response(body, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=604800, immutable" } });
}
