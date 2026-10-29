import { ImageResponse } from "next/og";

const CARD = `<g transform="translate(32 33) rotate(-12)"><rect x="-13" y="-19" width="26" height="38" rx="4" fill="#fffdf6"/><path d="M0 -10 C 9 -2 10 4 5 7 C 3.500 8 1.500 7.500 0.800 6 L 2 13 H -2 L -0.800 6 C -1.500 7.500 -3.500 8 -5 7 C -10 4 -9 -2 0 -10 Z" fill="#14181a"/></g>`;

/** Ícone normal: o mesmo do favicon, com cantos arredondados. */
const ANY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0b120e"/><rect x="8" y="8" width="48" height="48" rx="10" fill="#14452b"/>${CARD}<rect x="8" y="8" width="48" height="48" rx="10" fill="none" stroke="#f5b942" stroke-width="3"/></svg>`;
/** Maskable/Apple: sem cantos, o sistema recorta; a carta fica dentro da zona segura (80%). */
const FULL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#14452b"/><g transform="translate(32 32) scale(0.92) translate(-32 -32)">${CARD}</g></svg>`;

const ICONS: Record<string, { size: number; svg: string }> = {
  "192": { size: 192, svg: ANY },
  "512": { size: 512, svg: ANY },
  maskable: { size: 512, svg: FULL },
  apple: { size: 180, svg: FULL },
};

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const icon = ICONS[(await ctx.params).name];
  if (!icon) return new Response("Not found", { status: 404 });
  const src = `data:image/svg+xml;base64,${Buffer.from(icon.svg).toString("base64")}`;
  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={icon.size} height={icon.size} alt="" />,
    { width: icon.size, height: icon.size, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
