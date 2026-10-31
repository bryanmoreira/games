import { GAMES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { RESPOSTAS_PATH } from "@/lib/stop/respostas";

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
    "## Instalar",
    "",
    `- [Como instalar o ${SITE_NAME}](${SITE_URL}/instalar): passo a passo para instalar o site como app no iPhone, no Android e no computador. Grátis e sem loja de aplicativos.`,
    "",
    "## Respostas para Stop (Adedonha)",
    "",
    `- [Respostas de A a Z](${SITE_URL}${RESPOSTAS_PATH}): listas de respostas por letra para as 15 categorias do Stop (nome, CEP, animal, fruta, cor, objeto, comida, profissão, marca, filme ou série, parte do corpo, famoso, bebida, adjetivo e "Minha sogra é..."), como ${SITE_URL}${RESPOSTAS_PATH}/fruta-com-a.`,
    "",
    "## Regras e perguntas frequentes",
    "",
    ...GAMES.map((g) => `- [Como jogar ${g.name}](${SITE_URL}${g.path}/como-jogar): ${g.howTo.description}`),
    "",
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
