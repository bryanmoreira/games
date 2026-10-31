import { GAMES, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { RESPOSTAS_PATH } from "@/lib/stop/respostas";
import { PALAVRAS_PATH } from "@/lib/palavras";
import { CACA_PRINT_PATH, SUDOKU_PRINT_PATH } from "@/lib/imprimir";
import { VARIATIONS } from "@/lib/variacoes";
import { GLOSSARIO_PATH, GLOSSARY, termPath } from "@/lib/glossario";

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
    "## Jogar de um jeito específico",
    "",
    ...VARIATIONS.map((v) => `- [${v.h1}](${SITE_URL}${v.path}): ${v.lead}`),
    "",
    "## Para imprimir",
    "",
    `- [Sudoku para imprimir](${SITE_URL}${SUDOKU_PRINT_PATH}): folhas A4 com 4 sudokus nos níveis fácil, médio, difícil e expert, com gabarito. Também salvam em PDF.`,
    `- [Caça-palavras para imprimir](${SITE_URL}${CACA_PRINT_PATH}): 17 temas (animais, frutas, países, profissões, corpo humano, escola e outros) nos níveis fácil, médio e difícil, com gabarito.`,
    "",
    "## Instalar",
    "",
    `- [Como instalar o ${SITE_NAME}](${SITE_URL}/instalar): passo a passo para instalar o site como app no iPhone, no Android e no computador. Grátis e sem loja de aplicativos.`,
    "",
    "## Respostas para Stop (Adedonha)",
    "",
    `- [Respostas de A a Z](${SITE_URL}${RESPOSTAS_PATH}): listas de respostas por letra para as 15 categorias do Stop (nome, CEP, animal, fruta, cor, objeto, comida, profissão, marca, filme ou série, parte do corpo, famoso, bebida, adjetivo e "Minha sogra é..."), como ${SITE_URL}${RESPOSTAS_PATH}/fruta-com-a.`,
    "",
    "## Palavras de 5 letras",
    "",
    `- [Palavras de 5 letras](${SITE_URL}${PALAVRAS_PATH}): busca de palavras de 5 letras em português por letra em cada posição, letras que a palavra tem e que não tem, com listas fixas como ${SITE_URL}${PALAVRAS_PATH}/comecam-com-a e ${SITE_URL}${PALAVRAS_PATH}/terminam-com-o.`,
    "",
    ...(GLOSSARY.length
      ? ["## Glossário", "", `- [Glossário](${SITE_URL}${GLOSSARIO_PATH}): termos dos jogos explicados em poucas linhas.`, ...GLOSSARY.map((t) => `- [${t.term}](${SITE_URL}${termPath(t.slug)}): ${t.definition}`), ""]
      : []),
    "## Regras e perguntas frequentes",
    "",
    ...GAMES.map((g) => `- [Como jogar ${g.name}](${SITE_URL}${g.path}/como-jogar): ${g.howTo.description}`),
    "",
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
