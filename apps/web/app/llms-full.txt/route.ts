import { GAMES, SITE_NAME, SITE_URL } from "@/lib/seo";

// Versão completa para IAs: cada jogo com suas perguntas e respostas
export function GET() {
  const body = [
    `# ${SITE_NAME} (${SITE_URL})`,
    "",
    ...GAMES.flatMap((g) => [
      `## ${g.name}`,
      "",
      `${g.description}`,
      "",
      `- Página: ${SITE_URL}${g.path}`,
      `- Regras: ${SITE_URL}${g.path}/como-jogar`,
      `- Tipo: ${g.genre}`,
      `- Jogadores: ${g.players.min === g.players.max ? g.players.min : `${g.players.min} a ${g.players.max}`}`,
      `- Modos: ${g.modes}`,
      "",
      ...g.faq.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    ]),
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
