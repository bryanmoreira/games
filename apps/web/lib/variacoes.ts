import type { Difficulty } from "@mesa/sudoku";
import type { SuitCount } from "@mesa/spider";

// Páginas de variação dos jogos (/sudoku/dificil, /xadrez/contra-o-computador...): a busca de quem já sabe o que quer
// jogar. Cada uma tem texto próprio e um botão que começa a partida já do jeito pedido.

/** Como o botão começa a partida */
export type Start =
  | { kind: "sudoku"; difficulty: Difficulty }
  | { kind: "spider"; suits: SuitCount }
  /** sala solo no servidor de jogos (id do jogo no servidor); com `levels`, escolhe o nível ali mesmo (salvo em `settingsKey`, o mesmo do lobby) */
  | { kind: "solo"; game: string; levels?: { id: string; label: string }[]; settingsKey?: string };

export interface Variation {
  path: string;
  /** slug do jogo em lib/seo.ts (nome, link de volta e JSON-LD) */
  game: string;
  /** título da aba e do Google (o sufixo do site é acrescentado) */
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  /** frase curta logo abaixo do título */
  lead: string;
  /** texto sobre a variação, abaixo do botão */
  about: string[];
  faq: { q: string; a: string }[];
  start: Start;
  /** texto do botão */
  cta: string;
}

const SUDOKU = (slug: string, difficulty: Difficulty, name: string, lead: string, about: string[], faq: Variation["faq"]): Variation => ({
  path: `/sudoku/${slug}`,
  game: "sudoku",
  title: `Sudoku ${name} Online Grátis`,
  h1: `Sudoku ${name}`,
  description: `Jogue Sudoku ${name.toLowerCase()} online grátis, direto no navegador: ${lead.charAt(0).toLowerCase()}${lead.slice(1)} Sem cadastro, com notas e dicas.`,
  keywords: [`sudoku ${name.toLowerCase()}`, `sudoku ${name.toLowerCase()} online`, `jogar sudoku ${name.toLowerCase()}`, `sudoku nível ${name.toLowerCase()}`],
  lead,
  about,
  faq,
  start: { kind: "sudoku", difficulty },
  cta: `Jogar Sudoku ${name.toLowerCase()}`,
});

const SPIDER = (suits: SuitCount, lead: string, about: string[], faq: Variation["faq"]): Variation => {
  const n = suits === 1 ? "1 naipe" : `${suits} naipes`;
  return {
    path: `/paciencia-spider/${suits === 1 ? "1-naipe" : `${suits}-naipes`}`,
    game: "paciencia-spider",
    title: `Paciência Spider ${n} Online Grátis`,
    h1: `Paciência Spider de ${n}`,
    description: `Jogue Paciência Spider de ${n} online grátis, sem cadastro e sem instalar nada: ${lead.charAt(0).toLowerCase()}${lead.slice(1)}`,
    keywords: [`paciência spider ${n}`, `spider ${n}`, `jogar paciência spider ${n}`, `paciência spider ${n} online`],
    lead,
    about,
    faq,
    start: { kind: "spider", suits },
    cta: `Jogar com ${n}`,
  };
};

const LEVELS3 = (hard = "Difícil") => [
  { id: "easy", label: "Fácil" },
  { id: "medium", label: "Médio" },
  { id: "hard", label: hard },
];

const VS_AI = (
  game: string,
  server: string,
  path: string,
  name: string,
  lead: string,
  about: string[],
  faq: Variation["faq"],
  levels?: Pick<Extract<Start, { kind: "solo" }>, "levels" | "settingsKey">,
): Variation => ({
  path,
  game,
  title: `${name} Contra o Computador Online Grátis`,
  h1: `${name} contra o computador`,
  description: `Jogue ${name} contra o computador online grátis: ${lead.charAt(0).toLowerCase()}${lead.slice(1)} Sem cadastro, direto no navegador.`,
  keywords: [`${name.toLowerCase()} contra o computador`, `jogar ${name.toLowerCase()} contra o computador`, `${name.toLowerCase()} contra a máquina`, `${name.toLowerCase()} sozinho`],
  lead,
  about,
  faq,
  start: { kind: "solo", game: server, ...levels },
  cta: "Jogar contra o computador",
});

export const VARIATIONS: Variation[] = [
  SUDOKU(
    "facil",
    "easy",
    "Fácil",
    "Muitas casas já preenchidas e só lógica simples para achar cada número.",
    [
      "O Sudoku fácil começa com 38 números ou mais na grade. Em cada passo existe uma casa onde só cabe um número, ou um número que só cabe numa casa da linha, da coluna ou do bloco: dá para resolver sem chutar.",
      "É o nível certo para aprender as regras, para crianças e para uma partida rápida. Quando ficar fácil demais, passe para o médio.",
    ],
    [
      { q: "Sudoku fácil tem solução única?", a: "Sim. Todo Sudoku do Mesa de Jogos tem uma solução só, e o nível fácil se resolve só com lógica simples, sem precisar chutar." },
      { q: "Quantos números o Sudoku fácil já traz?", a: "Pelo menos 38 das 81 casas já vêm preenchidas." },
    ],
  ),
  SUDOKU(
    "medio",
    "medium",
    "Médio",
    "Menos pistas na grade, mas ainda resolvido só com lógica direta.",
    [
      "O Sudoku médio traz por volta de 31 números iniciais. As técnicas são as mesmas do fácil, mas as casas certas ficam mais escondidas e você precisa olhar a grade inteira.",
      "As notas ajudam a anotar os candidatos de cada casa. É um bom treino antes do difícil.",
    ],
    [
      { q: "Qual a diferença entre Sudoku fácil e médio?", a: "O médio começa com menos números (cerca de 31 contra uns 38), então cada casa certa é mais difícil de achar, mesmo usando as mesmas técnicas." },
      { q: "Preciso usar notas no Sudoku médio?", a: "Não é obrigatório, mas anotar os candidatos de cada casa deixa o médio bem mais rápido." },
    ],
  ),
  SUDOKU(
    "dificil",
    "hard",
    "Difícil",
    "Menos pistas e casas que só saem com técnicas de eliminação.",
    [
      "O Sudoku difícil começa com cerca de 27 números e pede pelo menos uma técnica de eliminação, como pares de candidatos que travam duas casas de uma linha ou de um bloco.",
      "Use as notas: anote os candidatos de cada casa e vá cortando os que não podem ficar. Quando uma casa ficar com um candidato só, ele é o número certo.",
    ],
    [
      { q: "Como resolver um Sudoku difícil?", a: "Anote os candidatos de cada casa e procure pares e grupos de candidatos que se repetem numa linha, coluna ou bloco: eles eliminam esses números das outras casas da mesma região." },
      { q: "Sudoku difícil precisa de chute?", a: "Não. O nível difícil do Mesa de Jogos sempre se resolve por lógica, sem tentativa e erro." },
    ],
  ),
  SUDOKU(
    "expert",
    "expert",
    "Expert",
    "O nível mais difícil: pistas parecidas com o difícil, mas técnicas bem mais avançadas.",
    [
      "O Sudoku expert começa com cerca de 26 números, parecido com o difícil, mas só sai com técnicas avançadas que cruzam várias linhas e colunas. É o mesmo nível do Sudoku diário.",
      "Vá com calma, use as notas em todas as casas e, se travar, peça uma dica: ela mostra a próxima casa que dá para resolver e por quê.",
    ],
    [
      { q: "Qual o nível mais difícil de Sudoku?", a: "No Mesa de Jogos é o expert: começa com cerca de 26 números e pede técnicas avançadas que cruzam várias linhas. O Sudoku diário usa esse nível." },
      { q: "Sudoku expert tem solução única?", a: "Sim, como todos os níveis. A solução é única e sai por lógica." },
    ],
  ),
  SPIDER(
    1,
    "o nível mais fácil, com todas as cartas de espadas.",
    [
      "Na Paciência Spider de 1 naipe as 104 cartas são todas do mesmo naipe, então qualquer sequência em ordem pode ser movida em bloco. É a melhor forma de aprender o jogo.",
      "O objetivo é o mesmo dos outros níveis: montar as oito sequências do Rei ao Ás. Quando não houver jogada, distribua uma carta do estoque em cada coluna.",
    ],
    [
      { q: "Paciência Spider de 1 naipe é fácil?", a: "É o nível mais fácil: como todas as cartas são do mesmo naipe, qualquer sequência em ordem pode ser movida junta, e a maioria das partidas tem solução." },
      { q: "Quantas cartas tem a Paciência Spider?", a: "104 cartas, o equivalente a dois baralhos: 54 na mesa em 10 colunas e 50 no estoque." },
    ],
  ),
  SPIDER(
    2,
    "espadas e copas: pede mais cuidado para montar as sequências.",
    [
      "Na Paciência Spider de 2 naipes as cartas são de espadas e copas. Dá para colocar qualquer carta sobre a seguinte maior, mas só sequências do mesmo naipe andam em bloco e saem da mesa.",
      "Tente montar sequências de um naipe só sempre que puder e libere colunas vazias: elas são a jogada mais valiosa do jogo.",
    ],
    [
      { q: "Qual a diferença entre Spider de 1 e 2 naipes?", a: "Com 2 naipes, só sequências do mesmo naipe se movem juntas e são removidas. Misturar naipes trava colunas, então o jogo fica mais difícil." },
      { q: "Dica para Paciência Spider de 2 naipes?", a: "Esvazie uma coluna o quanto antes e evite cobrir uma carta com outra de naipe diferente quando tiver opção do mesmo naipe." },
    ],
  ),
  SPIDER(
    4,
    "o nível mais difícil, com os quatro naipes.",
    [
      "A Paciência Spider de 4 naipes é o desafio clássico: com espadas, copas, ouros e paus, as sequências do mesmo naipe são raras e cada movimento conta. É o nível do desafio diário.",
      "Planeje antes de distribuir do estoque, use as colunas vazias para reorganizar e desfaça quando precisar.",
    ],
    [
      { q: "Paciência Spider de 4 naipes tem solução?", a: "A maioria das partidas tem, mas exige planejamento. É o nível mais difícil da Spider." },
      { q: "Qual o melhor nível de Paciência Spider?", a: "1 naipe para aprender, 2 naipes para um desafio médio e 4 naipes para quem quer o jogo mais difícil." },
    ],
  ),
  VS_AI(
    "xadrez",
    "xadrez",
    "/xadrez/contra-o-computador",
    "Xadrez",
    "Escolha o nível fácil, médio ou difícil e jogue na hora, com relógio opcional.",
    [
      "O computador tem três níveis: fácil para quem está aprendendo, médio para treinar e difícil para quem quer apanhar um pouco. Você pode jogar sem relógio ou com 3+2, 5+0 ou 10+0.",
      "Todas as regras valem: roque, en passant, promoção, xeque-mate e empates por afogamento, repetição e falta de material.",
    ],
    [
      { q: "Dá para jogar xadrez contra o computador de graça?", a: "Sim. No Mesa de Jogos você joga xadrez contra o computador grátis, sem cadastro e sem instalar nada, nos níveis fácil, médio e difícil." },
      { q: "Qual nível de xadrez contra o computador escolher?", a: "Comece no fácil se está aprendendo. Quando ganhar com frequência, passe para o médio e depois para o difícil." },
    ],
    { levels: LEVELS3(), settingsKey: "xadrez.settings" },
  ),
  VS_AI(
    "damas",
    "damas",
    "/damas/contra-o-computador",
    "Damas",
    "Damas brasileiras contra o computador nos níveis fácil, médio e difícil.",
    [
      "As regras são as das damas brasileiras: tabuleiro 8×8, 12 peças para cada lado, captura obrigatória e dama que anda várias casas.",
      "Comece no fácil para pegar o jeito das capturas obrigatórias e suba de nível quando ganhar com frequência. Bom treino para jogar depois com os amigos.",
    ],
    [
      { q: "Dá para jogar damas contra o computador?", a: "Sim, grátis e sem cadastro, nos níveis fácil, médio e difícil, com as regras brasileiras." },
      { q: "Nas damas a captura é obrigatória?", a: "Sim. Nas regras brasileiras, se você pode capturar, tem que capturar, e pela sequência que pega mais peças." },
    ],
    { levels: LEVELS3(), settingsKey: "damas.settings" },
  ),
  VS_AI(
    "jogo-da-velha",
    "jogo-da-velha",
    "/jogo-da-velha/contra-o-computador",
    "Jogo da Velha",
    "Três níveis, do fácil ao impossível, no modo clássico ou no modo some.",
    [
      "No nível fácil o computador erra de vez em quando; no médio ele bloqueia; no impossível ele joga perfeito e o melhor que você consegue é empatar.",
      "No modo some, cada jogador só pode ter três peças na mesa: a mais antiga some quando você joga a quarta, e o empate fica raro.",
    ],
    [
      { q: "Dá para ganhar do computador no jogo da velha?", a: "Nos níveis fácil e médio, sim. No impossível o computador joga perfeito: jogando bem você empata, mas não ganha." },
      { q: "O que é o jogo da velha modo some?", a: "Cada jogador fica com no máximo três peças: ao jogar a quarta, a mais antiga sai da mesa. Assim a partida quase sempre tem vencedor." },
    ],
    { levels: LEVELS3("Impossível"), settingsKey: "velha.settings" },
  ),
  VS_AI(
    "connect-4",
    "connect4",
    "/connect-4/contra-o-computador",
    "Connect 4",
    "Solte as peças e alinhe quatro antes do computador.",
    [
      "Cada jogada solta uma peça numa coluna, e ela cai até a casa livre mais baixa. Quem alinhar quatro na horizontal, vertical ou diagonal ganha.",
      "Contra o computador, controle o centro do tabuleiro e cuidado com jogadas que entregam a casa de cima para ele.",
    ],
    [
      { q: "Como ganhar no Connect 4?", a: "Jogue pelo centro, crie duas ameaças ao mesmo tempo e evite jogar logo abaixo de uma casa que daria a vitória ao adversário." },
      { q: "Connect 4 é o mesmo que Lig 4?", a: "Sim. É o jogo de soltar peças numa grade de 7 colunas e 6 linhas até alinhar quatro, também chamado de Lig 4 ou 4 em linha." },
    ],
  ),
  VS_AI(
    "truco-paulista",
    "truco-paulista",
    "/truco-paulista/contra-o-computador",
    "Truco",
    "Truco paulista com o computador de parceiro e de adversário, para treinar quando quiser.",
    [
      "No modo solo você joga em dupla com o computador contra outra dupla de computadores, com manilha, pedido de truco, 6, 9 e 12, mão de 11 e mão de ferro.",
      "É o jeito de treinar o blefe e a ordem das cartas antes de chamar os amigos para uma sala.",
    ],
    [
      { q: "Dá para jogar truco sozinho contra o computador?", a: "Sim. No modo solo do Mesa de Jogos você joga truco paulista com e contra o computador, grátis e sem cadastro." },
      { q: "O computador pede truco?", a: "Sim. Ele pede, aceita, corre e aumenta para 6, 9 e 12, como num jogo de verdade." },
    ],
  ),
  VS_AI(
    "buraco",
    "buraco",
    "/buraco/contra-o-computador",
    "Buraco",
    "Buraco fechado em duplas ou mano a mano contra a IA.",
    [
      "Jogue buraco fechado com 108 cartas, curingas, morto e batida, em duplas (com o computador de parceiro) ou mano a mano.",
      "Treine as canastras limpas e sujas, o momento de pegar o lixo e quando vale bater.",
    ],
    [
      { q: "Dá para jogar buraco contra o computador?", a: "Sim, grátis, em duplas ou mano a mano, com as regras do buraco fechado." },
      { q: "Quantos pontos tem uma partida de buraco?", a: "A partida vai até 3000 pontos." },
    ],
  ),
  VS_AI(
    "domino",
    "domino",
    "/domino/contra-o-computador",
    "Dominó",
    "Dominó em duplas ou mano a mano contra o computador, sem esperar ninguém.",
    [
      "Jogue em duplas, com o computador de parceiro contra outra dupla de computadores, ou mano a mano contra um computador, com as 28 pedras do dominó tradicional. Vence quem fizer 6 pontos primeiro.",
      "Bom para treinar a contagem das pedras que já saíram e a hora certa de fechar o jogo.",
    ],
    [
      { q: "Dá para jogar dominó sozinho contra o computador?", a: "Sim. Você joga em duplas ou mano a mano contra o computador, grátis e sem cadastro." },
      { q: "Quantas pedras tem o dominó?", a: "O dominó tradicional tem 28 pedras, do 0-0 ao 6-6." },
    ],
  ),
  VS_AI(
    "ludo",
    "ludo",
    "/ludo/contra-o-computador",
    "Ludo",
    "Ludo contra 1 a 3 computadores, com dado e capturas.",
    [
      "Escolha de 1 a 3 computadores e leve seus quatro peões da base até a chegada antes deles, capturando os peões que pararem na sua casa.",
      "Uma partida rápida para jogar sozinho a qualquer hora, sem esperar os amigos.",
    ],
    [
      { q: "Dá para jogar ludo sozinho contra o computador?", a: "Sim, grátis e sem cadastro, contra 1 a 3 computadores." },
      { q: "Quantos peões cada jogador tem no ludo?", a: "Quatro. Ganha quem levar os quatro até a chegada primeiro." },
    ],
  ),
];

export const variation = (path: string) => VARIATIONS.find((v) => v.path === path)!;
export const variationsOf = (game: string) => VARIATIONS.filter((v) => v.game === game);
export const variationPaths = () => VARIATIONS.map((v) => v.path);
