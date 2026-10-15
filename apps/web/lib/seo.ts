import type { Metadata } from "next";

export const SITE_URL = "https://mesadejogos.com";
export const SITE_NAME = "Mesa de Jogos";
/** Frase curta exibida na home */
export const SITE_TAGLINE = "Jogos de cartas e de mesa para jogar com os amigos. Grátis e sem cadastro.";
/** Descrição longa (meta tags, JSON-LD, llms.txt): leva os nomes dos jogos para busca */
export const SITE_DESCRIPTION =
  "Jogue Truco, Stop, Codenames, Batalha Naval, Connect 4, Otrio, Jogo da Velha, Sudoku e Paciência Spider online e grátis, com amigos ou contra o computador. Sem cadastro e sem instalar nada.";

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
  {
    slug: "otrio",
    path: "/otrio",
    name: "Otrio",
    title: "Otrio Online Grátis",
    description:
      "Jogue Otrio online grátis: o jogo da velha com anéis de três tamanhos, de 2 a 4 jogadores. Crie uma sala com amigos ou jogue contra o computador.",
    tagline: "O jogo da velha com anéis, de 2 a 4 jogadores.",
    keywords: ["otrio online", "otrio", "jogar otrio grátis", "jogo da velha com anéis", "jogo da velha para 4", "otrio jogo de tabuleiro"],
    genre: "Jogo de tabuleiro (estratégia)",
    players: { min: 1, max: 4 },
    modes: "Multiplayer online de 2 a 4 jogadores em salas privadas, com lugares completados pelo computador, e modo solo contra 1 a 3 IAs.",
    howTo: {
      title: "Como jogar Otrio: regras e formas de vencer",
      description: "Aprenda as regras do Otrio: anéis pequenos, médios e grandes, as três formas de vencer (linha, escada e alvo) e como jogar com 2, 3 ou 4 pessoas.",
    },
    faq: [
      { q: "Qual é o objetivo do Otrio?", a: "Fazer uma trinca com a sua cor: três anéis do mesmo tamanho em linha, três em linha do menor ao maior (ou do maior ao menor), ou os três tamanhos na mesma casa." },
      { q: "Quantas peças cada jogador tem?", a: "Nove por cor: três pequenas, três médias e três grandes. Cada peça ocupa o encaixe do seu tamanho numa casa do tabuleiro 3×3, e uma casa pode ter os três tamanhos." },
      { q: "Como funciona o Otrio com 2 jogadores?", a: "Cada um controla duas cores e as joga em sequência alternada com o adversário. Vence com qualquer das duas, mas a trinca precisa ser de uma cor só." },
      { q: "E se ninguém conseguir jogar?", a: "Quem não tem peça que caiba num encaixe livre passa a vez. Se ninguém mais consegue jogar e não houve trinca, a partida termina empatada." },
      { q: "Dá para jogar Otrio online com amigos?", a: "Sim. Crie uma sala, envie o código ou o link e jogue com até 4 pessoas sem cadastro. Lugares vazios podem ser completados pelo computador, e há modo solo contra 1 a 3 IAs." },
    ],
  },
  {
    slug: "jogo-da-velha",
    path: "/jogo-da-velha",
    name: "Jogo da Velha",
    title: "Jogo da Velha Online Grátis",
    description:
      "Jogue Jogo da Velha online grátis: contra o computador em três níveis (até o impossível) ou com um amigo numa sala. Tem também o modo em que a peça mais antiga some.",
    tagline: "Três em linha vence. Contra a IA ou um amigo.",
    keywords: ["jogo da velha online", "jogo da velha", "jogar jogo da velha grátis", "jogo da velha contra o computador", "jogo da velha 2 jogadores", "tic tac toe online", "jogo da velha impossível"],
    genre: "Jogo de tabuleiro (estratégia)",
    players: { min: 1, max: 2 },
    modes: "Multiplayer online para 2 jogadores em salas privadas e modo solo contra o computador nos níveis fácil, médio e impossível. Modo clássico ou modo some.",
    howTo: {
      title: "Como jogar Jogo da Velha: regras, velha e modo some",
      description: "Aprenda as regras do Jogo da Velha: como fazer 3 em linha, quando dá velha, o modo em que a peça mais antiga some e os níveis da IA.",
    },
    faq: [
      { q: "Qual é o objetivo do Jogo da Velha?", a: "Fazer 3 marcas iguais em linha no tabuleiro 3×3: na horizontal, na vertical ou na diagonal. Cada jogador marca uma casa por vez, e quem começa joga de X." },
      { q: "O que é \"deu velha\"?", a: "É o empate: o tabuleiro enche sem ninguém fazer 3 em linha. Jogando sem errar, as duas pessoas sempre empatam." },
      { q: "Como funciona o modo some?", a: "Cada jogador fica com no máximo 3 peças. Ao colocar a 4ª, a mais antiga dele some do tabuleiro, então a partida não trava. Se ninguém vencer em 30 lances, dá velha." },
      { q: "Dá para ganhar da IA no impossível?", a: "No modo clássico, não: a IA impossível joga perfeito, e o melhor resultado possível é empatar. Nos níveis fácil e médio ela erra, e um garfo (duas ameaças de uma vez) costuma vencer." },
      { q: "Dá para jogar Jogo da Velha online com amigos?", a: "Sim. Crie uma sala, envie o código ou o link e jogue sem cadastro. O placar soma a cada partida e quem começa alterna." },
    ],
  },
  {
    slug: "damas",
    path: "/damas",
    name: "Damas",
    title: "Damas Online Grátis",
    description:
      "Jogue Damas online grátis pelas regras brasileiras: contra o computador em três níveis ou com um amigo numa sala. Captura obrigatória e dama voadora.",
    tagline: "Captura obrigatória e dama voadora, contra a IA ou um amigo.",
    keywords: ["damas online", "jogo de damas", "jogar damas grátis", "damas contra o computador", "damas brasileiras", "jogo de damas online 2 jogadores", "dama voadora"],
    genre: "Jogo de tabuleiro (estratégia)",
    players: { min: 1, max: 2 },
    modes: "Multiplayer online para 2 jogadores em salas privadas e modo solo contra o computador nos níveis fácil, médio e difícil. Regras brasileiras (8×8, 12 peças).",
    howTo: {
      title: "Como jogar Damas: regras brasileiras, captura e dama",
      description: "Aprenda as regras das damas brasileiras: como as pedras andam e capturam, a lei da maioria, quando a pedra vira dama e quando a partida empata.",
    },
    faq: [
      { q: "Quais são as regras do jogo de damas brasileiro?", a: "Tabuleiro 8×8, 12 peças para cada lado nas casas escuras e as brancas começam. A pedra anda uma casa na diagonal para a frente e captura pulando a peça adversária, para a frente e para trás. Vence quem capturar todas as peças do outro ou deixá-lo sem lance." },
      { q: "A captura é obrigatória?", a: "Sim. Se der para capturar, é obrigatório, inclusive em sequência. Pela lei da maioria, entre as capturas possíveis você precisa fazer a que leva mais peças; pedra e dama contam igual." },
      { q: "Como a pedra vira dama?", a: "Terminando o lance na última fileira do outro lado. A dama anda quantas casas quiser na diagonal e captura de longe, pousando em qualquer casa vazia depois da peça capturada. Se a pedra só passar pela última fileira no meio de uma captura e continuar capturando, ela não vira dama." },
      { q: "Quando a partida de damas empata?", a: "Quando a mesma posição aparece pela terceira vez, depois de 20 lances de cada lado só com damas e sem captura, ou depois de 5 lances de cada lado em finais como 2 damas contra 1." },
      { q: "Dá para jogar damas online com amigos?", a: "Sim. Crie uma sala, envie o código ou o link e jogue sem cadastro. O placar soma a cada partida e as cores trocam a cada nova partida." },
    ],
  },
  {
    slug: "xadrez",
    path: "/xadrez",
    name: "Xadrez",
    title: "Xadrez Online Grátis",
    description:
      "Jogue Xadrez online grátis: contra o computador em três níveis ou com um amigo numa sala, com relógio opcional. Roque, en passant, promoção e xeque-mate pelas regras oficiais.",
    tagline: "Contra a IA em três níveis ou com um amigo, com relógio se quiser.",
    keywords: ["xadrez online", "jogar xadrez", "xadrez grátis", "xadrez contra o computador", "xadrez com amigos", "xadrez online 2 jogadores", "jogo de xadrez"],
    genre: "Jogo de tabuleiro (estratégia)",
    players: { min: 1, max: 2 },
    modes: "Multiplayer online para 2 jogadores em salas privadas e modo solo contra o computador nos níveis fácil, médio e difícil. Relógio opcional: 3+2, 5+0 ou 10+0.",
    howTo: {
      title: "Como jogar Xadrez: regras, movimentos das peças e xeque-mate",
      description: "Aprenda as regras do xadrez: como cada peça se move, roque, en passant, promoção do peão, xeque, xeque-mate e quando a partida empata.",
    },
    faq: [
      { q: "Como cada peça do xadrez se move?", a: "O rei anda uma casa em qualquer direção. A dama anda quantas casas quiser em linha reta ou na diagonal; a torre, em linha reta; o bispo, na diagonal. O cavalo anda em L e pode pular peças. O peão anda uma casa para a frente (duas no primeiro lance) e captura na diagonal." },
      { q: "O que é xeque-mate?", a: "É quando o rei está atacado (em xeque) e não há lance que o tire do ataque. Quem dá xeque-mate vence a partida. Nenhum jogador pode fazer um lance que deixe o próprio rei em xeque." },
      { q: "Como funciona o roque?", a: "O rei anda duas casas em direção a uma torre e a torre pula para o outro lado dele. Só vale se nenhum dos dois andou antes, se não há peças entre eles e se o rei não está em xeque nem passa ou para em casa atacada." },
      { q: "O que é en passant e promoção?", a: "En passant: quando um peão adversário anda duas casas e para ao lado do seu, você pode capturá-lo como se tivesse andado uma, mas só no lance seguinte. Promoção: o peão que chega à última fileira vira dama, torre, bispo ou cavalo, à sua escolha." },
      { q: "Quando a partida de xadrez empata?", a: "Por afogamento (quem joga não está em xeque e não tem lance), quando não sobra material para dar mate, quando a mesma posição aparece pela terceira vez, depois de 50 lances de cada lado sem captura nem lance de peão, ou quando os dois combinam o empate." },
      { q: "Dá para jogar xadrez online com amigos?", a: "Sim. Crie uma sala, envie o código ou o link e jogue sem cadastro, com ou sem relógio (3+2, 5+0 ou 10+0). O placar soma a cada partida e as cores trocam a cada nova partida." },
    ],
  },
  {
    slug: "ludo",
    path: "/ludo",
    name: "Ludo",
    title: "Ludo Online Grátis",
    description:
      "Jogue Ludo online grátis, de 2 a 4 jogadores: role o dado, capture as peças dos outros e leve seus 4 peões ao centro. Crie uma sala com amigos ou jogue contra o computador.",
    tagline: "Role o dado e leve seus 4 peões ao centro, de 2 a 4 jogadores.",
    keywords: ["ludo online", "ludo", "jogar ludo grátis", "ludo com amigos", "ludo contra o computador", "jogo de tabuleiro com dado", "ludo 4 jogadores"],
    genre: "Jogo de tabuleiro (sorte e estratégia)",
    players: { min: 1, max: 4 },
    modes: "Multiplayer online de 2 a 4 jogadores em salas privadas, com lugares completados pelo computador, e modo solo contra 1 a 3 IAs.",
    howTo: {
      title: "Como jogar Ludo: regras, captura e casas seguras",
      description: "Aprenda as regras do Ludo: como tirar a peça da base com 1 ou 6, quando jogar de novo, como capturar, as casas seguras e como chegar ao centro.",
    },
    faq: [
      { q: "Qual é o objetivo do Ludo?", a: "Levar as suas 4 peças da base até o centro do tabuleiro, dando a volta no sentido horário e entrando na reta final da sua cor. Vence quem chegar com as 4 primeiro." },
      { q: "Como a peça sai da base?", a: "Com 1 ou 6 no dado. A peça vai para a casa de saída da sua cor e, a partir da próxima jogada, anda o número que sair." },
      { q: "Quando eu jogo de novo?", a: "Ao tirar 6, ao capturar uma peça e ao levar uma peça ao centro. Mas o terceiro 6 seguido na mesma vez perde a vez sem mover." },
      { q: "Como funciona a captura?", a: "Parando numa casa com peça de outra cor, ela volta para a base. Nas casas de saída e nas estrelas não há captura, e na reta final ninguém entra além do dono da cor. Duas peças juntas não formam bloqueio." },
      { q: "Precisa do número exato para chegar ao centro?", a: "Sim. Se o dado passar da chegada, aquela peça não anda; se nenhuma peça puder andar, a vez passa." },
      { q: "Dá para jogar Ludo online com amigos?", a: "Sim. Crie uma sala, envie o código ou o link e jogue com até 4 pessoas sem cadastro. Lugares vazios podem ser completados pelo computador, e há modo solo contra 1 a 3 IAs." },
    ],
  },
  {
    slug: "verbete",
    path: "/verbete",
    name: "Verbete",
    title: "Verbete: Jogo da Palavra do Dia Grátis",
    description:
      "Jogue Verbete grátis: descubra a palavra de 5 letras em 6 chutes, com as cores de cada letra. Tem Dueto, Quarteto, palavra do dia e modo livre.",
    tagline: "Descubra a palavra de 5 letras. Uma nova todo dia.",
    keywords: [
      "verbete",
      "palavra do dia",
      "jogo de palavras",
      "dueto",
      "quarteto",
      "jogo da palavra",
      "palavra de 5 letras",
      "adivinhar palavra",
    ],
    genre: "Jogo de palavras",
    players: { min: 1, max: 1 },
    modes: "Jogo solo no navegador: palavra do dia igual para todos (Verbete com 1 palavra, Dueto com 2 e Quarteto com 4), calendário com os dias anteriores e modo livre com palavras sorteadas.",
    howTo: {
      title: "Como jogar Verbete: regras das cores, Dueto e Quarteto",
      description: "Aprenda as regras do Verbete: o que significam o verde, o amarelo e o cinza, letras repetidas, acentos e como funcionam o Dueto e o Quarteto.",
    },
    faq: [
      { q: "Quais são as regras do Verbete?", a: "Descubra a palavra de 5 letras em até 6 chutes. Depois de cada chute, as letras ficam verdes (lugar certo), amarelas (estão na palavra, em outro lugar) ou cinza (não estão). Cada chute precisa ser uma palavra aceita." },
      { q: "O que significam as cores?", a: "Verde: a letra está na palavra e no lugar certo. Amarelo: a letra está na palavra, mas em outro lugar. Cinza: a letra não está na palavra (ou já foi marcada todas as vezes que aparece)." },
      { q: "Como funcionam o Dueto e o Quarteto?", a: "No Dueto você descobre 2 palavras em 7 chutes e no Quarteto, 4 palavras em 9 chutes. Cada chute vale para todas as palavras ao mesmo tempo, e a que você acertar para de receber chutes." },
      { q: "Preciso digitar acento?", a: "Não. Acentos e cedilha entram sozinhos e não contam nas cores: digitar SUITE vira SUÍTE." },
      { q: "Quando muda a palavra do dia?", a: "À meia-noite de Brasília, com uma palavra nova para cada modo, a mesma para todos os jogadores. Os dias anteriores ficam no calendário, e o modo livre sorteia palavras sem limite." },
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

/** Jogos com desafio diário: página do calendário em `${path}/diario`. */
export const DAILY_SEO: Record<string, { title: string; description: string }> = {
  sudoku: {
    title: "Sudoku Diário: o desafio do dia",
    description: "Um Sudoku expert novo todo dia, o mesmo para todos os jogadores. Resolva o desafio de hoje, mantenha a sequência e rejogue os dias anteriores.",
  },
  "paciencia-spider": {
    title: "Paciência Spider Diária: o desafio do dia",
    description: "Uma Paciência Spider de 4 naipes nova todo dia, a mesma distribuição para todos. Jogue o desafio de hoje e rejogue os dias anteriores.",
  },
  verbete: {
    title: "Verbete: palavra do dia, Dueto e Quarteto",
    description: "Palavras novas todo dia à meia-noite, as mesmas para todos: Verbete, Dueto e Quarteto. Jogue as de hoje e rejogue os dias anteriores no calendário.",
  },
};

export function dailyMetadata(slug: string): Metadata {
  const g = getGame(slug);
  const { title, description } = DAILY_SEO[slug];
  const path = `${g.path}/diario`;
  return {
    title,
    description,
    keywords: [...g.keywords, `${g.name.toLowerCase()} diário`, "desafio diário", "desafio do dia"],
    alternates: { canonical: path },
    openGraph: { title: `${title} · ${SITE_NAME}`, description, url: path, siteName: SITE_NAME, locale: "pt_BR", type: "website", images: [`${g.path}/opengraph-image`] },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: [`${g.path}/opengraph-image`] },
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
