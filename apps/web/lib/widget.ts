import { DAILY_SEO, getGame, SITE_URL } from "@/lib/seo";

// Widget do desafio do dia para outros sites: um iframe (/embed/<jogo>) e um link de texto logo abaixo.
// O link é o que conta como link de volta para o Google; o iframe sozinho não passa autoridade.

export const WIDGET_PATH = "/widget";
export const embedPath = (game: string) => `/embed/${game}`;
export const WIDGET_GAMES = Object.keys(DAILY_SEO);
export const WIDGET_SIZE = { width: 320, height: 180 };

/** Código para colar no site: iframe + link */
export function widgetCode(game: string): string {
  const g = getGame(game);
  const { width, height } = WIDGET_SIZE;
  return [
    `<iframe src="${SITE_URL}${embedPath(game)}" width="${width}" height="${height}" style="border:0;border-radius:16px;max-width:100%" loading="lazy" title="${g.name} do dia"></iframe>`,
    `<p style="margin:4px 0 0;font:12px sans-serif"><a href="${SITE_URL}${g.path}/diario">${g.name} do dia</a> no <a href="${SITE_URL}">Mesa de Jogos</a></p>`,
  ].join("\n");
}
