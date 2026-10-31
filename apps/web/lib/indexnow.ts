import { ABOUT_PATH, CONTACT_PATH, INSTALL_PATH, PRIVACY_PATH, TERMS_PATH } from "@/lib/legal";
import { DAILY_SEO, GAMES, SITE_URL } from "@/lib/seo";
import { respostasPaths } from "@/lib/stop/respostas";
import { palavrasPaths } from "@/lib/palavras";
import { imprimirPaths } from "@/lib/imprimir";
import { variationPaths } from "@/lib/variacoes";
import { glossarioPaths } from "@/lib/glossario";

// IndexNow (https://www.indexnow.org): avisa Bing, Yandex, Seznam e Naver na hora em que uma página muda.
// A chave fica em INDEXNOW_KEY e é servida em /indexnow.txt (app/indexnow.txt/route.ts).

export const INDEXNOW_KEY_PATH = "/indexnow.txt";

export function indexNowKey(): string | undefined {
  // chave dinâmica: lida no runtime, não embutida no build
  return process.env[["INDEXNOW", "KEY"].join("_")] || undefined;
}

/** Páginas fixas do site (as mesmas do sitemap, sem os posts), com as variações dos jogos, as folhas para imprimir, as respostas do Stop e as palavras de 5 letras. */
export function publicPaths(): string[] {
  return [
    "/",
    ...GAMES.flatMap((g) => [g.path, `${g.path}/como-jogar`, ...(g.slug in DAILY_SEO ? [`${g.path}/diario`] : [])]),
    ...respostasPaths(),
    ...palavrasPaths(),
    ...variationPaths(),
    ...imprimirPaths(),
    ...glossarioPaths(),
    ABOUT_PATH,
    INSTALL_PATH,
    CONTACT_PATH,
    PRIVACY_PATH,
    TERMS_PATH,
  ];
}

/** Manda as páginas para o IndexNow. Só em produção e com a chave; nunca derruba quem chamou. */
export async function pingIndexNow(paths: string[]): Promise<void> {
  const key = indexNowKey();
  if (!key || process.env.NODE_ENV !== "production" || !paths.length) return;
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key,
        keyLocation: `${SITE_URL}${INDEXNOW_KEY_PATH}`,
        urlList: paths.map((p) => `${SITE_URL}${p === "/" ? "" : p}`),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) console.warn(`IndexNow respondeu ${r.status}`);
  } catch (e) {
    console.warn("IndexNow falhou", e);
  }
}
