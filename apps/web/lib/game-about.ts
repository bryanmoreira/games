/** Texto "Sobre o jogo" no fim da página de cada jogo: história, o que tem de diferente e por que vale jogar. */
export const GAME_ABOUT: Record<string, string[]> = {
  "jogo-da-memoria": [
    "O jogo da memória combina observação e lembrança das posições: duas cartas de cada fruta ficam escondidas no tabuleiro, e cada tentativa revela duas delas. No Mesa de Jogos são sempre 30 cartas e 15 pares, sem prévia inicial.",
    "Jogue solo para melhorar seu tempo e número de tentativas, enfrente o computador ou dispute com um amigo em uma sala para dois jogadores. Nas disputas, acertar um par mantém a vez; ganha quem encontrar mais pares. A IA joga sempre no fácil e lembra as últimas quatro posições reveladas.",
  ],
  "truco-paulista": [
    "O truco chegou ao Brasil com os imigrantes europeus e virou o jogo de cartas mais barulhento do país. Em São Paulo, Goiás, Mato Grosso do Sul e boa parte do Sul se joga a versão paulista, em que as manilhas mudam a cada mão: vira-se uma carta e a de valor logo acima vira a mais forte. Isso obriga todo mundo a prestar atenção na mesa, porque uma carta fraca na mão anterior pode ser a melhor da rodada seguinte.",
    "A graça do truco está no blefe. Pedir truco com a mão fraca, segurar o 6 com a manilha na mão ou correr na hora certa decide mais partidas do que a sorte das cartas. Aqui você joga em duplas, com o parceiro de frente, ou no mano a mano, e pode treinar contra o computador antes de chamar os amigos.",
    "Para jogar com quem você quiser, crie uma sala e mande o link no WhatsApp. Ninguém precisa criar conta nem instalar nada, e os lugares vazios podem ser ocupados pela IA para a mesa sair na hora.",
  ],
  buraco: [
    "O buraco descende da canastra, criada no Uruguai nos anos 1940, e se espalhou pelo Brasil nas mesas de família de domingo. Usa dois baralhos completos com coringas, 108 cartas ao todo, e cada jogador recebe 11. O objetivo é baixar sequências do mesmo naipe, juntar canastras e bater antes da dupla adversária.",
    "É um jogo de paciência e leitura: pegar o lixo na hora certa pode virar a partida, e bater cedo demais deixa pontos na mão. O morto dá uma segunda leva de cartas para quem esvazia a mão primeiro, e só dá para bater depois de pegar o morto e fechar pelo menos uma canastra.",
    "No Mesa de Jogos o buraco é o fechado, em duplas ou no mano a mano, até 3000 pontos. Dá para jogar sozinho contra a IA nos dois formatos ou criar uma sala para os amigos, com o computador completando a mesa se faltar alguém.",
  ],
  blackjack: [
    "O blackjack, ou vinte e um, vem de jogos de cartas franceses do século XVIII e é o jogo de cassino mais estudado do mundo. A regra é simples: chegar mais perto de 21 que a banca sem passar. A decisão de pedir, parar, dobrar ou dividir é que separa quem joga no palpite de quem joga com estratégia.",
    "Nos anos 1950 e 1960 matemáticos calcularam a melhor jogada para cada combinação de mão e carta da banca, a chamada estratégia básica. Ela não garante vitória, mas reduz bastante a vantagem da casa, e é um ótimo exercício de probabilidade para treinar sem arriscar nada.",
    "Aqui não tem dinheiro de verdade: cada partida começa com 1000 fichas que só existem nela. Você pode jogar sozinho, encher a mesa com IAs ou criar uma sala para até 5 amigos jogarem juntos contra a mesma banca.",
  ],
  "paciencia-spider": [
    "A Paciência Spider ficou famosa quando passou a vir de fábrica no Windows, e desde então é um dos passatempos de cartas mais jogados no computador. Usa dois baralhos, 104 cartas, distribuídas em 10 colunas. O objetivo é montar 8 sequências completas do rei ao ás no mesmo naipe.",
    "O número de naipes muda tudo. Com 1 naipe é um jogo tranquilo para relaxar; com 2 já exige planejamento; com 4 naipes vira um quebra-cabeça difícil em que é preciso abrir colunas vazias e pensar várias jogadas à frente antes de puxar o estoque.",
    "Você joga direto no navegador, com desfazer jogada e dicas quando travar. Todo dia sai também uma Paciência Spider diária de 4 naipes, a mesma distribuição para todos os jogadores, para comparar o resultado com os amigos.",
  ],
  sudoku: [
    "O Sudoku moderno foi publicado nos Estados Unidos no fim dos anos 1970 com o nome de Number Place e ganhou o nome atual no Japão, nos anos 1980. A regra cabe numa linha: preencher a grade 9×9 de modo que cada linha, coluna e quadrado 3×3 tenha os números de 1 a 9 sem repetir.",
    "Não precisa saber matemática, só lógica. Os níveis mais fáceis saem marcando os números que só cabem num lugar; os difíceis pedem anotar os candidatos de cada casa e eliminar possibilidades em pares e trios. Um bom Sudoku tem uma única solução e nunca exige chute.",
    "Aqui você escolhe o nível, usa notas e pede dicas que explicam o raciocínio por trás da próxima jogada, o que ajuda a aprender as técnicas. Há ainda o Sudoku diário, igual para todos, com sequência de dias seguidos e calendário para jogar os dias anteriores.",
  ],
  "connect-4": [
    "O Connect 4, também chamado de 4 em Linha, foi lançado como jogo de tabuleiro em 1974: uma grade de 7 colunas e 6 linhas em que as peças caem até a casa mais baixa livre. Vence quem alinha quatro peças da sua cor na horizontal, na vertical ou na diagonal.",
    "Parece jogo de criança, mas foi resolvido por computador em 1988: com jogadas perfeitas, quem começa jogando na coluna do meio sempre vence. Na prática ninguém joga perfeito, e a disputa está em controlar o centro, criar ameaças duplas e evitar dar a casa de cima para o adversário.",
    "Jogue contra o computador para treinar ou crie uma sala e mande o link para um amigo jogar 1 contra 1. As partidas são rápidas, boas para uma revanche atrás da outra.",
  ],
  stop: [
    "O Stop, também conhecido como Adedonha, é a brincadeira de papel e caneta que quase todo brasileiro jogou na escola. O nome adedonha vem do jeito de sortear a letra: todos mostram os dedos ao mesmo tempo e a soma é contada pelo alfabeto. Com a letra definida, cada um preenche as categorias o mais rápido que puder.",
    "Quem termina primeiro grita Stop e todo mundo para de escrever. Depois a turma confere as respostas: palavra repetida vale menos, palavra única vale mais e resposta que não existe não vale nada. É aí que sai a discussão sobre se aquela fruta existe mesmo.",
    "A versão online cuida do sorteio, do cronômetro e da contagem dos pontos. Você escolhe as categorias, o número de rodadas e o tempo, cria a sala e manda o link para a turma, que entra sem cadastro, do celular ou do computador.",
  ],
  "batalha-naval": [
    "A Batalha Naval começou como jogo de papel quadriculado no começo do século XX e depois virou jogo de tabuleiro com pinos. Cada jogador esconde sua frota num mar de 10×10 e, na sua vez, chuta uma coordenada no mar do outro, tentando acertar e afundar todos os navios antes de perder os seus.",
    "Tem mais estratégia do que parece. Espalhar os tiros em padrão de tabuleiro de xadrez acha os navios grandes mais rápido, e depois de um acerto vale caçar em volta até descobrir a direção do navio. Na hora de posicionar, fugir das bordas e dos padrões óbvios atrasa o adversário.",
    "Aqui o tabuleiro e a contagem de tiros ficam por conta do site: é só posicionar a frota e atirar. Jogue contra o computador ou chame um amigo para uma partida 1 contra 1 pelo link da sala.",
  ],
  codenames: [
    "Codenames é um jogo de palavras em equipe lançado em 2015 que virou um dos jogos de festa mais premiados da década. Dois times, vermelho e azul, disputam uma grade de 25 palavras. Em cada time um mestre conhece a cor de todas as palavras e precisa fazer os agentes acharem as do seu time.",
    "A dica é uma palavra só e um número: \"praia, 3\" pede três palavras ligadas a praia. O desafio é achar a conexão que junta as suas palavras sem levar o time para as do adversário, para os civis ou para o assassino, que encerra a partida na hora.",
    "Aqui a grade, as cores e a vez de cada time ficam no site, então dá para jogar com a turma em lugares diferentes. Cria-se a sala, cada um escolhe o time e o papel e a partida começa, com tempo por vez opcional e lista de palavras própria em português.",
  ],
  otrio: [
    "O Otrio é uma versão moderna do jogo da velha com anéis de três tamanhos: pequeno, médio e grande. Cada casa do tabuleiro 3×3 aceita um anel de cada tamanho ao mesmo tempo, o que abre muito mais jogadas do que o X e a bola tradicionais.",
    "Há três formas de vencer: três anéis do mesmo tamanho em linha, uma escada em linha (pequeno, médio e grande em ordem) ou os três tamanhos empilhados na mesma casa, formando um alvo. Com 3 ou 4 jogadores a mesa fica caótica, e bloquear o vizinho vale tanto quanto avançar seu próprio jogo.",
    "Jogue de 2 a 4 pessoas numa sala online, com o computador completando os lugares vazios, ou sozinho contra 1 a 3 IAs. É um bom jogo para quem já cansou do jogo da velha e quer algo rápido com mais escolha.",
  ],
  "jogo-da-velha": [
    "O jogo da velha é um dos jogos mais antigos de que se tem notícia e o primeiro jogo de estratégia de muita gente. Dois jogadores alternam X e bola num tabuleiro 3×3, e vence quem fizer três em linha na horizontal, na vertical ou na diagonal.",
    "Com as duas pessoas jogando perfeito, a partida sempre empata, ou dá velha. Por isso a IA no nível impossível nunca perde: é um bom jeito de aprender a abrir pelo canto e a se defender das ameaças duplas.",
    "Além do clássico, há o modo some, em que cada jogador tem só três peças em jogo e a mais antiga desaparece ao colocar a quarta. Ele acaba com os empates e muda a estratégia. Jogue contra a IA em três níveis ou com um amigo pelo link da sala.",
  ],
  damas: [
    "As damas brasileiras usam o tabuleiro 8×8 e as 12 pedras por jogador do jogo clássico, mas seguem as regras das damas internacionais: as pedras capturam para frente e para trás, a dama anda várias casas na diagonal e a captura é obrigatória.",
    "A lei da maioria diz que, havendo mais de uma captura possível, é obrigatório escolher a que toma mais peças. É dela que saem os golpes mais bonitos do jogo: sacrificar uma pedra para forçar o adversário a abrir caminho para uma captura múltipla.",
    "Jogue contra o computador nos níveis fácil, médio e difícil ou com um amigo numa sala online. O site mostra as capturas obrigatórias e cuida das regras de empate, então dá para focar só na estratégia.",
  ],
  xadrez: [
    "O xadrez nasceu na Índia por volta do século VI, passou pela Pérsia e pelo mundo árabe e ganhou as regras atuais na Europa do século XV. São 16 peças por jogador, cada uma com seu movimento, e o objetivo é dar xeque-mate: atacar o rei de um jeito que ele não consiga escapar.",
    "É o jogo de estratégia mais estudado da história, com aberturas, táticas e finais que dá para aprender a vida toda. Para quem está começando, o mais importante é desenvolver as peças, controlar o centro, rocar cedo e conferir se a peça que você vai mexer não deixa outra desprotegida.",
    "Aqui você joga contra a IA em três níveis ou com um amigo pelo link da sala, com relógio opcional nos ritmos 3+2, 5+0 ou 10+0. Roque, en passant, promoção e todos os tipos de empate seguem as regras oficiais.",
  ],
  sinuca: [
    "A bola 8 é o jogo de sinuca mais jogado em bares e salões. Um jogador fica com as bolas lisas, de 1 a 7, e o outro com as listradas, de 9 a 15. Quem encaçapar todas as suas e depois a bola 8 na caçapa cantada vence; encaçapar a 8 antes da hora perde a partida.",
    "Acertar a bola é só metade do jogo. A outra metade é deixar a branca bem posicionada para a próxima tacada, usando força e efeito. Bater embaixo da branca faz ela voltar, bater em cima faz ela seguir, e o efeito lateral muda o ângulo depois da tabela.",
    "A mesa daqui tem física de verdade, mira com bola fantasma para mostrar onde a branca vai tocar e controle de efeito. Jogue contra a IA em três níveis ou com amigos no 1×1 ou em duplas, com tempo por tacada opcional.",
  ],
  ludo: [
    "O Ludo descende do pachisi, um jogo de corrida indiano com séculos de história, e chegou ao Brasil como jogo de tabuleiro de família. Cada jogador tem 4 peões que saem da base e dão a volta no tabuleiro até chegar ao centro, e quem leva os quatro primeiro vence.",
    "O dado manda, mas as escolhas contam. É preciso decidir entre tirar um peão novo da base, avançar o que está mais perto de casa ou capturar um adversário e mandá-lo de volta para o início. As casas seguras protegem de captura e mudam a hora certa de arriscar.",
    "Jogue de 2 a 4 pessoas numa sala online, com o computador completando os lugares que faltarem, ou sozinho contra 1 a 3 IAs. As regras de quando tirar com 1 ou 6 e de jogar de novo ficam explicadas na página de como jogar.",
  ],
  domino: [
    "O dominó é presença certa nas praças, botecos e quintais do Brasil, quase sempre em duplas e com muita conversa. O jogo usa 28 peças, do 0-0 ao 6-6, e no dominó de batida cada um recebe 7. Vence a mão quem bater primeiro, ficando sem peças.",
    "Os pontos dependem de como se bate: a batida simples vale 1, a de carroça vale 2, o lá-e-lô, quando a última peça serve nas duas pontas, vale 3, e a cruzada, carroça que serve nas duas pontas, vale 4. Quando ninguém consegue jogar, o jogo fecha e marca a dupla com menos pontos na mão. Vence quem chegar a 6 pontos.",
    "Contar as peças que já saíram e prestar atenção no que o parceiro passa é o que faz a diferença. Jogue em duplas ou no mano a mano, contra a IA ou com amigos pelo link da sala, com o computador completando a mesa.",
  ],
  "futebol-de-botao": [
    "O futebol de botão é uma invenção bem brasileira: as primeiras regras foram publicadas nos anos 1930 e, por décadas, times de botões disputaram campeonatos em mesas de casa e de clube. Cada botão é um jogador e a disputa é levar a bola até o gol adversário.",
    "A versão daqui é em tempo real e arcade. Você controla um botão com as setas, ou com o direcional no celular, e chuta com Espaço. As partidas têm 3 minutos, começam com a saída de bola no meio de campo e, se terminam empatadas, vão para o gol de ouro.",
    "Dá para jogar de 1×1 até 3×3, com amigos numa sala online ou sozinho contra a IA. Nos times maiores, tocar a bola e se posicionar contam mais que correr atrás dela.",
  ],
  tijolada: [
    "A Tijolada é um jogo de blocos que caem, no estilo dos clássicos de videogame dos anos 1980. São 7 peças diferentes, cada uma formada por quatro quadrados, que descem uma a uma. Você move, gira e encaixa as peças para completar linhas inteiras, que somem e liberam espaço.",
    "Limpar várias linhas de uma vez e emendar combos rende muito mais pontos, e a cada 10 linhas o nível sobe e as peças caem mais rápido. Guardar uma peça para depois e usar a queda instantânea são as ferramentas para não deixar buracos no campo.",
    "No modo solo você corre atrás do seu recorde. No 1×1 online os dois jogadores recebem exatamente as mesmas peças, então ganha quem joga melhor, e perde quem deixar o campo encher primeiro.",
  ],
  verbete: [
    "O Verbete é o jogo da palavra do dia em português, no estilo dos jogos de adivinhar palavras que viraram mania nas redes. Você tem 6 tentativas para descobrir uma palavra de 5 letras, e cada palpite pinta as letras de verde, amarelo ou cinza.",
    "Verde é letra certa no lugar certo, amarelo é letra que existe em outro lugar e cinza é letra que não está na palavra. Acentos e cedilha entram sozinhos, então dá para digitar sem eles. Uma boa primeira palavra usa vogais e consoantes comuns para eliminar o máximo de letras.",
    "Toda meia-noite saem palavras novas, iguais para todos: o Verbete com uma, o Dueto com duas ao mesmo tempo e o Quarteto com quatro. Os dias anteriores ficam no calendário e há um modo livre com palavras sorteadas para jogar quanto quiser.",
  ],
  "quente-ou-frio": [
    "Quente ou Frio é um jogo de palavras por proximidade de sentido. Existe uma palavra secreta e, a cada palpite, o jogo diz o quão perto você chegou, não pela grafia, mas pelo significado. \"Areia\" fica perto de \"praia\"; \"livro\" fica longe.",
    "A estratégia é começar com palavras bem diferentes para descobrir o assunto e ir esquentando com palavras do mesmo campo. A distância vem de um modelo que leu mais de um bilhão de palavras de textos em português e aprendeu quais aparecem em contextos parecidos, por isso às vezes a ligação é surpreendente.",
    "A palavra do dia é a mesma para todos e muda à meia-noite. As tentativas são ilimitadas, há dica quando você travar e opção de desistir para ver a resposta. Os dias anteriores ficam no calendário e o modo livre sorteia palavras novas.",
  ],
  "caca-palavras": [
    "O caça-palavras é um dos passatempos mais conhecidos das revistas de banca: uma grade de letras com palavras escondidas em linha reta. O objetivo é achar todas as palavras da lista, e cada uma aparece uma vez só.",
    "A dificuldade vem das direções. No fácil as palavras ficam só para a direita e para baixo, no médio entram as diagonais e no difícil vale tudo, inclusive de trás para frente. Procurar primeiro as letras menos comuns, como Z, X e J, costuma achar as palavras mais rápido.",
    "São 17 temas e três tamanhos de grade, com dica e melhor tempo por nível. Todo dia sai também um caça-palavras difícil com o tema do dia, igual para todos, e o calendário guarda os dias anteriores.",
  ],
  mahjong: [
    "O mahjong nasceu na China no século XIX como jogo de quatro pessoas, parecido com o buraco, e usa peças em vez de cartas: caracteres, círculos e bambus de 1 a 9, ventos, dragões, flores e estações. A paciência com essas mesmas peças surgiu nos computadores dos anos 1980 e virou um dos passatempos mais jogados do mundo, muitas vezes chamada só de mahjong.",
    "A regra cabe numa frase: tire pares de peças iguais que estejam livres, sem nada por cima e com um dos lados vazio. O desafio está na ordem. Tirar o par errado pode prender a última peça de um tipo debaixo de outra, então vale começar pelas pilhas mais altas e pelas pontas compridas, e guardar peças repetidas que já estão livres para depois.",
    "São 32 formatos de 144 peças, da clássica Tartaruga de cinco andares a desenhos de bichos, templos e espirais, e toda mesa sorteada tem solução. Dá para desfazer de graça, pedir dica ou embaralhar, e o melhor tempo de cada formato fica guardado. Todo dia sai também uma mesa nova igual para todos, com calendário dos dias anteriores.",
  ],
};
