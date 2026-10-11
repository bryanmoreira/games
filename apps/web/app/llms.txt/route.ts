import { GAMES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";

// Resumo do site para assistentes de IA e buscadores generativos (https://llmstxt.org)
export function GET() {
  const body = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Site brasileiro (português do Brasil) de jogos de cartas e de mesa. Todos os jogos são gratuitos, rodam no navegador (celular e computador) e não exigem cadastro. Os jogos online usam salas privadas: o criador compartilha o código ou o link da sala com os amigos.",
    "",
    "## Jogos",
    "",
    ...GAMES.map((g) => `- [${g.name}](${SITE_URL}${g.path}): ${g.description} ${g.modes}`),
    "",
    "## Regras e perguntas frequentes",
    "",
    ...GAMES.map((g) => `- [Como jogar ${g.name}](${SITE_URL}${g.path}/como-jogar): ${g.howTo.description}`),
    "",
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
