import type { Metadata } from "next";

export const SITE_URL = "https://mesadejogos.com";
export const SITE_NAME = "Mesa de Jogos";
/** Frase curta exibida na home */
export const SITE_TAGLINE = "Jogos de cartas e de mesa para jogar com os amigos. Grátis e sem cadastro.";
/** Descrição longa (meta tags, JSON-LD, llms.txt): leva os nomes dos jogos para busca */
export const SITE_DESCRIPTION =
  "Jogue Truco, Stop, Codenames, Batalha Naval, Connect 4, Sudoku e Paciência Spider online e grátis, com amigos ou contra o computador. Sem cadastro e sem instalar nada.";

export type GameSeo = {
  slug: string;
  path: string;
  /** Nome curto exibido nos cards e no breadcrumb */
  name: string;
  /** Título da página do jogo (o sufixo do site é acrescentado pelo template) */
  title: string;
  /** Meta description da página do jogo */
  description: string;
  /** Frase curta visível na página do jogo */
  tagline: string;
  keywords: string[];
  genre: string;
  /** Pessoas na partida. `min: 1` = tem modo solo; `max > 1` = multiplayer (selos e filtro da home) */
  players: { min: number; max: number };
  /** O que dá para fazer: usado nos textos de llms.txt */
  modes: string;
  howTo: { title: string; description: string };
  faq: { q: string; a: string }[];
};

export const GAMES: GameSeo[] = [
  {
    slug: "truco-paulista",
    path: "/truco-paulista",
    name: "Truco Paulista",
    title: "Truco Paulista Online Grátis",
    description:
      "Jogue Truco Paulista online grátis: crie uma sala e chame amigos para jogar em duplas, ou treine contra o computador. Sem cadastro, direto no navegador.",
    tagline: "Truco em duplas, online com amigos ou contra o computador.",
    keywords: ["truco online", "truco paulista", "jogar truco online grátis", "truco com amigos", "truco multiplayer", "jogo de cartas"],
    genre: "Jogo de cartas",
    players: { min: 1, max: 4 },
    modes: "Multiplayer online em salas privadas (duplas 2x2 ou 1x1) e modo solo contra o computador.",
    howTo: {
      title: "Como jogar Truco Paulista: regras, manilhas e apostas",
      description: "Aprenda as regras do Truco Paulista: baralho de 40 cartas, ordem das cartas, manilhas, truco, 6, 9 e 12, mão de 11 e mão de ferro.",
    },
    faq: [
      { q: "Quantos jogadores tem o Truco Paulista?", a: "Joga-se em duas duplas (4 jogadores), com parceiros sentados de frente um para o outro. Também dá para jogar 1 contra 1." },
      { q: "Com qual baralho se joga Truco Paulista?", a: "Com o baralho de 40 cartas: o baralho comum sem os 8, 9, 10 e coringas. O naipe não importa nas cartas comuns." },
      { q: "O que são as manilhas?", a: "A manilha é a carta imediatamente acima da carta virada (o vira) e é a mais forte da mão. Entre as manilhas, a ordem é decidida pelo naipe." },
      { q: "Como funciona o pedido de truco?", a: "Na sua vez você pode pedir truco para a mão valer mais pontos. A outra dupla pode aceitar, correr (entregando a mão) ou aumentar a aposta para 6, 9 e 12." },
      { q: "Dá para jogar Truco online com amigos de graça?", a: "Sim. No Mesa de Jogos você cria uma sala, compartilha o código ou o link e joga com seus amigos sem cadastro e sem instalar nada." },
    ],
  },
  {
    slug: "paciencia-spider",
    path: "/paciencia-spider",
    name: "Paciência Spider",
    title: "Paciência Spider Online Grátis",
    description:
      "Jogue Paciência Spider online grátis com 1, 2 ou 4 naipes. Desfaça jogadas, peça dicas e jogue direto no navegador, sem baixar nada.",
    tagline: "Paciência Spider com 1, 2 ou 4 naipes, direto no navegador.",
    keywords: ["paciência spider", "spider solitaire online", "paciência spider grátis", "paciência online", "jogo de paciência", "solitário spider"],
    genre: "Paciência (solitário)",
    players: { min: 1, max: 1 },
    modes: "Jogo solo no navegador, com 1, 2 ou 4 naipes, desfazer jogada e dicas.",
    howTo: {
      title: "Como jogar Paciência Spider: regras e dicas",
      description: "Aprenda a jogar Paciência Spider: monte sequências de K até A no mesmo naipe, use o estoque e complete as 8 sequências para vencer.",
    },
    faq: [
      { q: "Qual é o objetivo da Paciência Spider?", a: "Montar sequências completas do Rei até o Ás, no mesmo naipe, nas colunas da mesa. Cada sequência completa é removida; vence quem remover as oito." },
      { q: "Qual a diferença entre 1, 2 e 4 naipes?", a: "Com 1 naipe o jogo é o mais fácil. Com 2 e 4 naipes fica mais difícil, porque só dá para mover em bloco cartas do mesmo naipe." },
      { q: "Para que serve o estoque?", a: "Quando não houver mais jogadas, você distribui uma carta nova para cada coluna a partir do estoque." },
    ],
  },
  {
    slug: "sudoku",
    path: "/sudoku",
    name: "Sudoku",
    title: "Sudoku Online Grátis",
    description:
      "Jogue Sudoku online grátis em vários níveis, com notas e dicas que explicam o raciocínio. Direto no navegador, sem cadastro.",
    tagline: "Sudoku em vários níveis, com notas e dicas.",
    keywords: ["sudoku online", "sudoku grátis", "jogar sudoku", "sudoku fácil", "sudoku difícil", "sudoku com dicas"],
    genre: "Quebra-cabeça numérico",
    players: { min: 1, max: 1 },
    modes: "Jogo solo no navegador, com níveis de dificuldade, notas e dicas que explicam o raciocínio.",
    howTo: {
      title: "Como jogar Sudoku: regras e técnicas para resolver",
      description: "Aprenda as regras do Sudoku 9×9 e as técnicas para resolver: notas, números únicos e eliminação.",
    },
    faq: [
      { q: "Quais são as regras do Sudoku?", a: "Preencha a grade 9×9 com números de 1 a 9 sem repetir nenhum número na mesma linha, na mesma coluna ou no mesmo bloco 3×3." },
      { q: "Como resolver um Sudoku difícil?", a: "Use as notas para anotar os candidatos de cada casa e elimine possibilidades até restar uma opção. Os níveis mais difíceis pedem técnicas de eliminação mais avançadas." },
      { q: "O nível de dificuldade muda as regras?", a: "Não. O nível muda o quanto você precisa raciocinar para achar a próxima casa, não as regras." },
    ],
  },
  {
    slug: "connect-4",
    path: "/connect-4",
    name: "Connect 4",
    title: "Connect 4 Online Grátis (4 em Linha)",
    description:
      "Jogue Connect 4 (4 em Linha) online grátis contra um amigo ou contra o computador. Crie uma sala e compartilhe o link.",
    tagline: "Alinhe quatro peças antes do adversário.",
    keywords: ["connect 4 online", "4 em linha", "ligue 4", "jogar connect 4 grátis", "connect four", "4 em linha online"],
    genre: "Jogo de tabuleiro (estratégia)",
    players: { min: 1, max: 2 },
    modes: "Multiplayer online 1 contra 1 em salas privadas e modo solo contra o computador.",
    howTo: {
      title: "Como jogar Connect 4 (4 em Linha): regras e estratégia",
      description: "Aprenda as regras do Connect 4 (4 em Linha): como as peças caem, como vencer na horizontal, vertical e diagonal e dicas de estratégia.",
    },
    faq: [
      { q: "Qual é o objetivo do Connect 4?", a: "Ser o primeiro a alinhar quatro peças da sua cor na horizontal, na vertical ou na diagonal." },
      { q: "Como as peças são colocadas?", a: "Você escolhe uma coluna e a peça cai até a casa livre mais baixa. Cada jogador joga uma peça por vez." },
      { q: "Dá para jogar Connect 4 online com um amigo?", a: "Sim. Crie uma sala, envie o código ou o link e jogue 1 contra 1 sem cadastro. Também há modo contra o computador." },
    ],
  },
  {
    slug: "stop",
    path: "/stop",
    name: "Stop (Adedonha)",
    title: "Stop (Adedonha) Online Grátis",
    description:
      "Jogue Stop, também chamado Adedonha, online grátis com amigos. Escolha categorias, rodadas e tempo, e crie sua própria sala.",
    tagline: "Stop (Adedonha) com amigos, com suas próprias categorias.",
    keywords: ["stop online", "adedonha online", "jogo de stop", "stop com amigos", "adedonha com amigos", "jogar stop online grátis", "stop jogo de palavras"],
    genre: "Jogo de palavras",
    players: { min: 2, max: 8 },
    modes: "Multiplayer online em salas privadas, com categorias, número de rodadas e tempo configuráveis.",
    howTo: {
      title: "Como jogar Stop (Adedonha): regras e pontuação",
      description: "Aprenda as regras do Stop (Adedonha): letra sorteada, categorias, como gritar Stop e quais respostas valem ponto.",
    },
    faq: [
      { q: "O que é Stop ou Adedonha?", a: "É um jogo de palavras em que todos recebem uma letra e, ao mesmo tempo, preenchem uma palavra por categoria (nome, animal, cor etc.) começando com essa letra." },
      { q: "Respostas vazias ou com outra letra valem ponto?", a: "Não. Resposta vazia, anulada ou que começa com outra letra não pontua. Acento e maiúscula não contam: \"Banana\" e \"banana\" são a mesma resposta." },
      { q: "Posso criar minhas próprias categorias?", a: "Sim. Quem cria a sala escolhe as categorias entre as prontas ou cria temas novos, além do número de rodadas e do tempo de cada rodada (ou sem limite)." },
    ],
  },
  {
    slug: "batalha-naval",
    path: "/batalha-naval",
    name: "Batalha Naval",
    title: "Batalha Naval Online Grátis",
    description:
      "Jogue Batalha Naval online grátis contra um amigo ou contra o computador. Posicione sua frota, escolha as casas e afunde os navios do adversário.",
    tagline: "Posicione sua frota e afunde a do adversário.",
    keywords: ["batalha naval online", "jogar batalha naval", "batalha naval grátis", "batalha naval com amigos", "battleship online", "jogo de navios"],
    genre: "Jogo de tabuleiro (estratégia)",
    players: { min: 1, max: 2 },
    modes: "Multiplayer online 1 contra 1 em salas privadas e modo solo contra o computador.",
    howTo: {
      title: "Como jogar Batalha Naval: regras e estratégia",
      description: "Aprenda as regras da Batalha Naval: como posicionar a frota, atacar o mar do adversário e afundar todos os navios para vencer.",
    },
    faq: [
      { q: "Qual é o objetivo da Batalha Naval?", a: "Afundar toda a frota do adversário antes que ele afunde a sua." },
      { q: "Qual o tamanho do tabuleiro?", a: "Cada jogador tem um mar de 10 × 10 casas." },
      { q: "Dá para jogar Batalha Naval online com um amigo?", a: "Sim. Crie uma sala, compartilhe o código ou o link e jogue 1 contra 1 sem cadastro. Também há modo contra o computador." },
    ],
  },
  {
    slug: "codenames",
    path: "/codenames",
    name: "Codenames",
    title: "Codenames Online Grátis",
    description:
      "Jogue Codenames online grátis com amigos: dois times, mestres dão dicas de uma palavra e agentes acham as palavras certas. Use sua própria lista de palavras.",
    tagline: "Mestres dão a dica, agentes acham as palavras. Em times, com amigos.",
    keywords: ["codenames online", "jogar codenames", "codenames grátis", "codenames com amigos", "codenames em português", "jogo de palavras em equipe", "agentes secretos jogo"],
    genre: "Jogo de palavras em equipe",
    players: { min: 4, max: 12 },
    modes: "Multiplayer online em salas privadas: dois times com mestres e agentes, lista de palavras própria e tempo por vez opcional.",
    howTo: {
      title: "Como jogar Codenames: regras, dicas e mestres",
      description: "Aprenda as regras do Codenames: times vermelho e azul, mestres e agentes, como dar a dica de uma palavra e um número, os civis e o assassino.",
    },
    faq: [
      { q: "Quantas pessoas precisa para jogar Codenames?", a: "Pelo menos 4: dois times, cada um com 1 mestre e pelo menos 1 agente. Cada time pode ter até 5 agentes, então cabem até 12 pessoas." },
      { q: "Como funciona a dica do mestre?", a: "Na vez do time, o mestre digita uma palavra e um número. O número diz quantas palavras da mesa a dica liga, e os agentes podem tocar em até esse número mais uma. Com 0 ou infinito, não há limite." },
      { q: "O que acontece se tocar no assassino?", a: "O time que revelou o assassino perde na hora. Uma palavra civil ou do outro time só passa a vez." },
      { q: "Posso usar minhas próprias palavras?", a: "Sim. Quem cria a sala cola uma lista com uma palavra por linha. Se tiver menos de 25, o jogo completa com uma lista pronta em português." },
      { q: "Tem tempo para jogar?", a: "É opcional. Quem cria a sala escolhe 1, 1,5, 2 ou 3 minutos, ou sem tempo. O limite vale para o mestre dar a dica e, de novo, para os agentes; quando acaba, a vez passa." },
    ],
  },
];

export function getGame(slug: string): GameSeo {
  const g = GAMES.find((x) => x.slug === slug);
  if (!g) throw new Error(`Jogo desconhecido: ${slug}`);
  return g;
}

export function gameMetadata(slug: string): Metadata {
  const g = getGame(slug);
  return {
    title: g.title, // o template do layout raiz acrescenta o nome do site
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: g.path },
    openGraph: { title: `${g.title} · ${SITE_NAME}`, description: g.description, url: g.path, siteName: SITE_NAME, locale: "pt_BR", type: "website", images: [`${g.path}/opengraph-image`] },
    twitter: { card: "summary_large_image", title: `${g.title} · ${SITE_NAME}`, description: g.description, images: [`${g.path}/opengraph-image`] },
  };
}

export function howToMetadata(slug: string): Metadata {
  const g = getGame(slug);
  const path = `${g.path}/como-jogar`;
  return {
    title: `${g.howTo.title} · ${SITE_NAME}`,
    description: g.howTo.description,
    keywords: [...g.keywords, `como jogar ${g.name.toLowerCase()}`, `regras ${g.name.toLowerCase()}`],
    alternates: { canonical: path },
    openGraph: { title: `${g.howTo.title} · ${SITE_NAME}`, description: g.howTo.description, url: path, siteName: SITE_NAME, locale: "pt_BR", type: "article", images: [`${g.path}/opengraph-image`] },
    twitter: { card: "summary_large_image", title: `${g.howTo.title} · ${SITE_NAME}`, description: g.howTo.description, images: [`${g.path}/opengraph-image`] },
  };
}

/** Telas que não devem ser indexadas (salas e partidas em andamento) */
export const noindex: Metadata = { robots: { index: false, follow: false } };

const abs = (path: string) => `${SITE_URL}${path}`;

const organizationLd = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: abs("/icon.svg"),
  areaServed: { "@type": "Country", name: "Brasil" },
};

const websiteLd = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  inLanguage: "pt-BR",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function homeLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationLd,
      websiteLd,
      {
        "@type": "ItemList",
        name: "Jogos do Mesa de Jogos",
        itemListElement: GAMES.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.name, url: abs(g.path) })),
      },
    ],
  };
}

export function gameLd(slug: string) {
  const g = getGame(slug);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "VideoGame",
        "@id": `${abs(g.path)}#game`,
        name: g.name,
        url: abs(g.path),
        description: g.description,
        inLanguage: "pt-BR",
        genre: g.genre,
        gamePlatform: "Navegador web",
        applicationCategory: "Game",
        operatingSystem: "Qualquer (navegador)",
        isAccessibleForFree: true,
        numberOfPlayers: { "@type": "QuantitativeValue", minValue: g.players.min, maxValue: g.players.max },
        offers: { "@type": "Offer", price: 0, priceCurrency: "BRL", availability: "https://schema.org/InStock" },
        publisher: { "@id": `${SITE_URL}/#organization` },
        isPartOf: { "@id": `${SITE_URL}/#website` },
      },
    ],
  };
}

export function howToLd(slug: string) {
  const g = getGame(slug);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      breadcrumbLd([
        { name: SITE_NAME, path: "/" },
        { name: g.name, path: g.path },
        { name: "Como jogar", path: `${g.path}/como-jogar` },
      ]),
    ],
  };
}
