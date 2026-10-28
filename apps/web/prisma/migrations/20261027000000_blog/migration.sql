-- CreateTable
CREATE TABLE "blog_post" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "game" TEXT NOT NULL DEFAULT 'home',
    "keyword" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "draft" BOOLEAN NOT NULL DEFAULT true,
    "cover" TEXT,
    "coverAlt" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_image" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "api_key_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_slug_key" ON "blog_post"("slug");

-- CreateIndex
CREATE INDEX "blog_post_draft_date_idx" ON "blog_post"("draft", "date");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_hash_key" ON "api_key"("hash");


-- Posts que estavam em content/blog (o mais antigo na ordem dos arquivos fica por último no mesmo dia)
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-buraco-ou-canastra-diferenca$md$, $md$buraco-ou-canastra-diferenca$md$, $md$Buraco ou Canastra: qual é a diferença?$md$, $md$Buraco e canastra são parecidos e muita gente usa os dois nomes para o mesmo jogo. Veja o que muda e onde jogar buraco online grátis.$md$, $md$buraco$md$, $md$buraco e canastra diferença$md$, $md$2026-10-24$md$, false, $md$/blog/capa-buraco.png$md$, $md$Cartas de buraco em leque: 6, 7 e 9 de copas com um coringa no meio$md$, $md$Se você já discutiu na mesa se o jogo é "buraco" ou "canastra", saiba que o nome varia de região para região. Os dois jogos fazem parte da mesma família: juntar cartas em jogos, formar canastras e bater.

## Por que o nome muda?

No Brasil, "canastra" e "buraco" costumam ser usados como sinônimos, e as regras em casa mudam de família para família. Por isso não existe uma versão única: o que importa é combinar as regras antes de começar.

## O que costuma variar

- **Curingas:** quais cartas valem como curinga e quantos cabem num jogo.
- **Lixo:** quando é permitido pegar as cartas descartadas.
- **Pontuação:** valor de cada canastra, da batida e das cartas.
- **Duplas ou individual:** o mais comum é em duplas.

## Qual versão o Mesa de Jogos usa?

No Mesa de Jogos você joga **buraco fechado**, em duplas ou no 1×1, direto no navegador e sem cadastro. As regras principais:

- **Baralho:** 108 cartas (dois baralhos com coringas). Cada jogador recebe 11 e há dois mortos de 11 cartas.
- **Jogos:** só sequências de 3 ou mais cartas do mesmo naipe.
- **Curingas:** o coringa e o 2, no máximo um por jogo.
- **Canastra:** jogo com 7 ou mais cartas. Limpa vale 200, suja (com curinga) vale 100 e a real (limpa, do ás ao rei) vale 500.
- **Lixo:** dá para pegar o lixo todo se a carta de cima entrar na hora num jogo seu, ou num jogo novo com 2 ou mais cartas da mão. Curinga no topo trava o lixo.
- **Batida:** só depois de pegar o morto e com pelo menos uma canastra. Vale 100. A dupla que não pegou o morto perde 100.
- **Partida:** vence quem chegar a 3000 pontos.

![Três canastras de copas: limpa de 3 a 9, suja com um coringa no lugar do 6 e real do ás ao rei](/blog/buraco-canastras.png "Canastra limpa, suja e real, com os pontos de cada uma")

Os detalhes, com exemplos, estão em [Como jogar Buraco](/buraco/como-jogar).

![Sequências de copas com curinga: um coringa fazendo o papel do 7 e um 2 de paus no lugar do 5](/blog/buraco-curingas.png "Coringa e 2 entram no lugar de qualquer carta, um por jogo")

## Jogue agora

Crie a sala, chame os amigos pelo WhatsApp e comece em segundos. Lugar vazio pode ficar com o computador: [Jogar Buraco grátis](/buraco).$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '0 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-dicas-para-ganhar-no-buraco$md$, $md$dicas-para-ganhar-no-buraco$md$, $md$10 dicas para ganhar mais no Buraco$md$, $md$Dicas práticas de buraco para jogar melhor em dupla: o que guardar, o que descartar e quando bater.$md$, $md$buraco$md$, $md$dicas de buraco$md$, $md$2026-10-24$md$, false, $md$/blog/capa-buraco-partida.png$md$, $md$Partida de buraco em duplas no Mesa de Jogos, com a mão de 11 cartas aberta, o monte e o lixo na mesa$md$, $md$Buraco combina memória, paciência e trabalho em dupla. Estas dicas seguem as regras do Mesa de Jogos, mas servem para a maioria das mesas.

![Os três passos da vez no buraco: comprar do monte ou pegar o lixo, baixar jogos e descartar uma carta](/blog/buraco-a-vez.png)

1. **Preste atenção no lixo.** O que o adversário descarta mostra o que ele não quer, e o que ele pega mostra o que está juntando.
2. **Não descarte cartas que ajudam o adversário.** Se alguém já baixou uma sequência, evite soltar a carta que encaixa nela: com isso ele pega o lixo todo.
3. **Pense na dupla.** Descartar uma carta que o parceiro está esperando vale mais do que pontuar sozinho.
4. **Cuidado com o lixo grande.** Pegar muitas cartas ajuda a montar jogos, mas também enche a sua mão.
5. **Use curinga no topo do lixo para travar.** Com um curinga em cima, ninguém pega o lixo.
6. **Baixe com planejamento.** Jogar tudo cedo mostra suas cartas e facilita a vida do adversário.
7. **Prefira canastras limpas.** No Mesa de Jogos a limpa vale 200 e a suja, 100. A real, do ás ao rei sem curinga, vale 500.
8. **Conte as cartas.** Saber o que já saiu ajuda a decidir o que descartar.
9. **Pegue o morto.** Sem ele a dupla não bate e ainda perde 100 pontos no fim da mão.
10. **Bata na hora certa.** A batida vale 100 e exige pelo menos uma canastra. Às vezes vale esperar para pontuar mais; às vezes é melhor encerrar antes que o adversário se aproxime.

![Tabela de pontos do buraco: 3 a 7 valem 5, 8 a K valem 10, ás 15, 2 vale 20 e coringa 50](/blog/buraco-pontos.png "Quanto vale cada carta no fim da mão")

## Treine de graça

Coloque as dicas em prática agora, sem cadastro, contra o computador ou com amigos: [Jogar Buraco online](/buraco). Dúvida sobre regras? Veja [Como jogar Buraco](/buraco/como-jogar).$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '1 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-truco-paulista-x-truco-mineiro$md$, $md$truco-paulista-x-truco-mineiro$md$, $md$Truco Paulista x Truco Mineiro: as diferenças$md$, $md$Entenda o que muda entre o truco paulista e o truco mineiro: manilhas, cartas e jeito de jogar.$md$, $md$truco-paulista$md$, $md$truco paulista e mineiro diferença$md$, $md$2026-10-24$md$, false, $md$/blog/capa-truco-paulista.png$md$, $md$Três cartas de truco em leque: 4 de paus, 7 de copas e ás de espadas$md$, $md$O truco é jogado no Brasil inteiro, mas cada região tem seu jeito. As duas versões mais conhecidas são o truco paulista e o truco mineiro.

## A grande diferença: a manilha

- **Paulista:** a manilha muda a cada mão. Vira-se uma carta (o "vira") e as manilhas são as cartas logo acima dela na ordem de força.
- **Mineiro:** na variante mineira tradicional, as manilhas são fixas (não dependem da vira): zap, copas, espadilha e pica-fumo, nessa ordem de força.

Isso muda bastante a estratégia: no mineiro você sabe de antemão quais são as cartas mais fortes; no paulista a força muda o tempo todo.

![Vira 7 de ouros e as quatro damas que viram manilhas, da mais fraca à mais forte: pica-fumo, espadilha, copas e zap](/blog/truco-vira-e-manilhas.png "No paulista, com vira 7, as damas viram manilhas")

## Como é o Truco Paulista do Mesa de Jogos

- **Baralho de 40 cartas:** sem 8, 9, 10 e coringas.
- **Força das cartas comuns:** 4, 5, 6, 7, Q, J, K, A, 2 e 3. O naipe não importa.
- **Manilhas:** entre elas, ganha o naipe: paus (zap), copas, espadas e ouros.
- **Mão:** cada um recebe 3 cartas e quem fizer 2 vazas ganha a mão.
- **Apostas:** a mão vale 1. Com o truco passa a 3, e pode subir para 6, 9 e 12.
- **Mão de 11:** a dupla com 11 pontos vê as cartas do parceiro (no 1×1, só as suas) e decide se joga (a mão vale 3) ou corre (o adversário ganha 1).
- **Mão de ferro:** no 11 a 11, todos jogam sem ver as próprias cartas.
- **Partida:** vence quem fizer 12 pontos, em duplas ou no 1×1.

![Ordem de força das cartas comuns do truco, do 4 mais fraco ao 3 mais forte](/blog/truco-forca-das-cartas.png "Força das cartas comuns, sem contar as manilhas")

![Escada de apostas do truco: vale 1, truco 3, seis, nove e doze, com os botões quero, corro e seis](/blog/truco-apostas.png "Pedido de truco e as respostas possíveis")

## Jogue o Truco Paulista

No Mesa de Jogos você joga truco paulista online, grátis e sem cadastro, com amigos ou contra o computador: [Jogar Truco](/truco-paulista). Para rever as regras: [Como jogar Truco Paulista](/truco-paulista/como-jogar).$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '2 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-dicas-de-truco$md$, $md$dicas-de-truco$md$, $md$Como jogar melhor no Truco: blefe, marcação e parceria$md$, $md$Dicas de truco para jogar em dupla: quando pedir truco, como blefar e como combinar jogadas com o parceiro.$md$, $md$truco-paulista$md$, $md$dicas de truco$md$, $md$2026-10-24$md$, false, $md$/blog/capa-truco-partida.png$md$, $md$Mão de truco paulista no Mesa de Jogos: vira ás de copas, manilha 2 e três cartas na mão com o botão de truco$md$, $md$Truco é jogo de leitura: de cartas, de adversários e do parceiro. Veja o que ajuda.

## 1. Conheça a força das cartas
Saber a ordem das cartas e quais manilhas estão em jogo é o básico. Sem isso, o blefe vira chute. No paulista, olhe o vira antes de tudo: as manilhas mudam a cada mão.

## 2. Blefe com critério
Pedir truco com mão fraca funciona quando o adversário parece inseguro. Se você blefa em toda mão, logo percebem. Misture jogadas fortes e fracas para não ficar previsível.

## 3. Jogue a primeira vaza com intenção
Quem ganha a primeira vaza ganha pressão: se a segunda empatar, leva a mão. Decida se vale gastar sua carta forte logo ou guardá-la para a segunda.

![Exemplo de vaza com vira 7: a dama de ouros do parceiro é manilha e ganha do 3, do rei e do 2](/blog/truco-a-mao.png "Com vira 7, a dama é manilha e leva a vaza")

## 4. Use a carta coberta
A partir da segunda vaza dá para jogar uma carta virada para baixo. Ela não vale nada, mas esconde o que você tem.

![Um 4 de paus sendo jogado virado para baixo como carta coberta](/blog/truco-carta-coberta.png)

## 5. Trabalhe em dupla
Em jogos em dupla, o parceiro é metade da estratégia. Se o parceiro já está ganhando a vaza, não gaste carta forte por cima: guarde para a próxima.

## 6. Calma na mão de onze
Com 11 pontos, sua dupla vê as cartas do parceiro e decide se joga a mão valendo 3 ou corre e entrega 1 ponto. Pense no placar antes de responder.

## 7. Aprenda perdendo
Cada mão mostra algo do estilo do adversário. Anote mentalmente quem blefa muito e quem só pede truco com carta boa.

## Treine agora
Chame seus amigos pelo WhatsApp ou treine contra o computador: [Jogar Truco Paulista grátis](/truco-paulista).$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '3 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-estrategias-de-domino$md$, $md$estrategias-de-domino$md$, $md$Dominó: 7 estratégias para ganhar mais partidas$md$, $md$Estratégias de dominó para jogar melhor: contagem de peças, controle das pontas e como fechar o jogo a seu favor.$md$, $md$domino$md$, $md$estratégia de dominó$md$, $md$2026-10-24$md$, false, $md$/blog/capa-domino.png$md$, $md$Peças de dominó em cruz sobre o feltro verde, com uma carroça de seis no centro$md$, $md$Dominó parece só sorte, mas quem presta atenção ganha mais. Estas estratégias pensam no dominó de batida em duplas, o mesmo do Mesa de Jogos.

1. **Conte as peças.** São 28 peças e cada número aparece em 7 delas. Saber quantas de cada número já saíram mostra o que sobra nas mãos dos outros.
2. **Observe quem passa.** Se um jogador passou, ele não tem nenhum dos dois números das pontas.
3. **Guarde o número em que você tem muitas peças.** Controlar uma ponta dá poder de decidir o rumo do jogo.
4. **Jogue cedo as peças difíceis.** Carroças e peças de números que já saíram muito ficam complicadas de encaixar depois.
5. **Ajude o parceiro.** Em duplas, evite fechar o número que ele mostrou que tem e repita o número em que ele jogou.
6. **Saiba quando fechar.** Se ninguém consegue jogar, o jogo fecha e marca a dupla com menos pontos na mão. Feche quando a sua dupla tiver menos pontos; se tiver mais, evite.
7. **Não entregue sua mão.** Variar as jogadas evita que o adversário descubra o que você tem.

![Tabela de batidas do dominó: simples vale 1, carroça 2, lá-e-lô 3 e cruzada 4](/blog/domino-batida.png "Quanto vale cada tipo de batida")

## Jogue agora
Crie uma sala, chame os amigos e jogue de graça, sem cadastro, ou treine contra o computador: [Jogar Dominó](/domino). Regras detalhadas em [Como jogar Dominó](/domino/como-jogar).$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '4 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-xadrez-erros-de-iniciantes$md$, $md$xadrez-erros-de-iniciantes$md$, $md$Xadrez para iniciantes: 8 erros comuns e como evitá-los$md$, $md$Os erros mais comuns de quem está começando no xadrez e como corrigir cada um para melhorar rápido.$md$, $md$xadrez$md$, $md$xadrez para iniciantes$md$, $md$2026-10-24$md$, false, $md$/blog/capa-xadrez.png$md$, $md$Tabuleiro de xadrez no começo da partida, com cavalos e bispos já desenvolvidos para o centro$md$, $md$Todo mundo começa errando. Estes são erros comuns de iniciantes e como evitá-los.

1. **Mexer a mesma peça várias vezes na abertura.** Desenvolva cavalos e bispos antes de repetir movimentos.
2. **Sair com a dama cedo demais.** Ela fica exposta e você perde tempo fugindo.
3. **Ignorar o centro.** Peões e peças no centro dão mais espaço e opções.
4. **Esquecer de proteger o rei.** Faça o roque cedo para deixar o rei seguro.
5. **Não olhar o que o adversário ameaça.** Antes de cada lance, pergunte: "o que ele quer fazer?"
6. **Trocar peças sem pensar.** Troque quando for vantajoso, não por reflexo.
7. **Deixar peças desprotegidas.** Verifique se cada peça tem apoio.
8. **Jogar rápido demais.** Respire e confira o lance antes de soltar a peça.

![Três exemplos de lances especiais: roque do rei com a torre, captura en passant e promoção do peão a dama](/blog/xadrez-lances-especiais.png "Roque, en passant e promoção")

![Mate na última fileira: a torre branca dá xeque e o rei preto, preso atrás dos próprios peões, não tem saída](/blog/xadrez-xeque-e-mate.png "Rei sem saída atrás dos peões: um mate comum de iniciantes")

## Pratique
A melhor forma de melhorar é jogar muitas partidas. No Mesa de Jogos você joga xadrez no navegador, sem cadastro: contra o computador nos níveis fácil, médio e difícil, ou com um amigo numa sala. Comece sem relógio e, quando ganhar confiança, experimente o 10+0: [Jogar Xadrez](/xadrez). Revise as regras em [Como jogar Xadrez](/xadrez/como-jogar).$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '5 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-damas-brasileiras-x-internacionais$md$, $md$damas-brasileiras-x-internacionais$md$, $md$Damas brasileiras x damas internacionais$md$, $md$Veja o que muda entre as damas brasileiras e as damas internacionais: tabuleiro, peças e regras de captura.$md$, $md$damas$md$, $md$damas brasileiras e internacionais$md$, $md$2026-10-24$md$, false, $md$/blog/capa-damas.png$md$, $md$Tabuleiro de damas 8×8 com pedras brancas e pretas e uma dama coroada de cada cor$md$, $md$Quando alguém diz "vamos jogar damas", nem sempre está falando do mesmo jogo. Há mais de uma versão.

## Tabuleiro e peças
- **Damas brasileiras:** tabuleiro 8×8, o mesmo do xadrez, com 12 peças para cada lado.
- **Damas internacionais:** tabuleiro 10×10, com 20 peças para cada lado.

As duas versões jogam só nas casas escuras.

## As regras das damas brasileiras

O Mesa de Jogos usa as damas brasileiras:

- **Pedra:** anda uma casa na diagonal, para a frente.
- **Captura obrigatória:** se dá para capturar, tem que capturar, inclusive para trás e em sequência.
- **Lei da maioria:** com mais de um jeito de capturar, é obrigatório o que leva mais peças. Pedra e dama contam igual.
- **Dama:** anda várias casas na diagonal e captura de longe.
- **Promoção:** a pedra vira dama quando termina o lance na última fileira. Se só passar por ela no meio de uma captura, continua pedra.
- **Fim:** vence quem capturar todas as peças do outro ou deixá-lo sem lance.

![Duas capturas nas damas: uma pedra branca pulando duas pretas em sequência e uma dama capturando de longe na diagonal](/blog/damas-capturar.png "Captura em sequência e captura da dama")

![Pedra branca com dois caminhos de captura, marcando o que leva mais peças pretas](/blog/damas-lei-da-maioria.png "Lei da maioria: vale o caminho que captura mais")

![Pedra branca chegando à última fileira e virando dama](/blog/damas-dama.png "A pedra que termina o lance na última fileira vira dama")

## Jogue damas agora
Sem cadastro, direto no navegador, contra o computador ou com um amigo: [Jogar Damas](/damas). Regras do site, com exemplos: [Como jogar Damas](/damas/como-jogar).$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '6 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-dicas-paciencia-spider$md$, $md$dicas-paciencia-spider$md$, $md$Paciência Spider: dicas para vencer mais jogos$md$, $md$Dicas de Paciência Spider para quem quer ganhar mais: como organizar colunas, abrir cartas e evitar travar o jogo.$md$, $md$paciencia-spider$md$, $md$dicas paciência spider$md$, $md$2026-10-24$md$, false, $md$/blog/capa-paciencia-spider.png$md$, $md$Sequência de espadas do rei ao 10 na Paciência Spider$md$, $md$Paciência Spider é um jogo de planejamento. Uma jogada apressada pode travar toda a mesa. Dicas para jogar melhor:

![Mesa da Paciência Spider de 1 naipe no começo do jogo, com dez colunas de cartas e o monte no canto](/blog/spider-mesa.png "Começo de jogo no nível fácil, com 1 naipe")

1. **Abra colunas vazias.** Uma coluna livre dá espaço para reorganizar cartas.
2. **Revele as cartas viradas primeiro.** Priorize colunas com mais cartas escondidas.
3. **Monte sequências do mesmo naipe.** Misturar naipes atrapalha na hora de completar.
4. **Não distribua novas cartas cedo demais.** Antes de comprar mais, use todos os movimentos possíveis.
5. **Planeje antes de mover.** Olhe duas ou três jogadas à frente.
6. **Evite cobrir cartas importantes.** Pense no que fica escondido depois do movimento.
7. **Use o desfazer para aprender.** No Mesa de Jogos dá para desfazer jogadas e pedir dicas.
8. **Comece com 1 naipe.** Quando ganhar com facilidade, passe para 2 e depois 4 naipes.

![Exemplos de movimento na Paciência Spider: 7 sobre 8 pode, 6 sobre 8 não, e só sequências do mesmo naipe andam juntas](/blog/spider-mover-cartas.png "O que pode e o que não pode mover")

![Níveis da Paciência Spider: fácil com 1 naipe, médio com 2 e difícil com 4](/blog/spider-dificuldade.png)

## Jogue agora
Sem baixar nada e sem cadastro: [Jogar Paciência Spider](/paciencia-spider). Também tem um [desafio diário](/paciencia-spider/diario), igual para todos.$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '7 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-jogos-online-com-amigos-gratis$md$, $md$jogos-online-com-amigos-gratis$md$, $md$10 jogos para jogar online com amigos, grátis e sem cadastro$md$, $md$Lista de jogos de cartas e tabuleiro para jogar online com amigos, direto no navegador, grátis e sem cadastro.$md$, $md$home$md$, $md$jogos online com amigos$md$, $md$2026-10-24$md$, false, $md$/blog/capa-jogos-com-amigos.png$md$, $md$Cartas de truco, um tabuleiro de xadrez e um tabuleiro de ludo com um dado sobre o feltro verde$md$, $md$Quer jogar com a galera sem instalar nada? Estes são alguns jogos disponíveis no Mesa de Jogos, direto no navegador.

- **[Truco Paulista](/truco-paulista):** o clássico em duplas ou no 1×1.
- **[Buraco](/buraco):** sequências e canastras, em duplas ou no 1×1.
- **[Dominó](/domino):** dominó de batida, em duplas ou no 1×1.
- **[Damas](/damas):** damas brasileiras para 2 jogadores.
- **[Xadrez](/xadrez):** o jogo de estratégia mais famoso, com relógio opcional.
- **[Batalha Naval](/batalha-naval):** ache a frota do adversário, 1 contra 1.
- **[Ludo](/ludo):** corrida de peões e dados, de 2 a 4 jogadores.
- **[Stop (Adedonha)](/stop):** rapidez e vocabulário, de 2 a 8 jogadores.
- **[Codenames](/codenames):** dicas em equipe, de 4 a 12 jogadores.
- **[Jogo da Velha](/jogo-da-velha):** partida rápida para qualquer hora.

Em vários deles, se faltar gente, o computador completa os lugares vazios.

![Página inicial do Mesa de Jogos com os cartões de Truco, Buraco, Paciência Spider, Sudoku, Verbete e Connect 4](/blog/home-jogos.png "Todos os jogos ficam na página inicial")

## Como começar
Escolha o jogo, crie a sala e mande o link para os amigos. Ninguém precisa criar conta.$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '8 seconds', CURRENT_TIMESTAMP);
INSERT INTO "blog_post" ("id", "slug", "title", "description", "game", "keyword", "date", "draft", "cover", "coverAlt", "body", "createdAt", "updatedAt") VALUES ($md$seed-convidar-amigos-whatsapp$md$, $md$convidar-amigos-whatsapp$md$, $md$Como convidar amigos para jogar pelo WhatsApp (sem baixar nada)$md$, $md$Passo a passo para criar uma sala no Mesa de Jogos e chamar os amigos pelo WhatsApp, sem instalar nada e sem cadastro.$md$, $md$home$md$, $md$jogar online pelo whatsapp$md$, $md$2026-10-24$md$, false, $md$/blog/capa-convite-whatsapp.png$md$, $md$Peças de dominó, um tabuleiro de Codenames e um tabuleiro de Batalha Naval sobre o feltro verde$md$, $md$Juntar a turma para uma partida não precisa ser complicado. Veja como fazer em poucos passos.

1. **Escolha o jogo** na página inicial do Mesa de Jogos.
2. **Digite seu nome** e toque em **Criar sala**. Não precisa de cadastro.
3. **Toque em Convidar.** O WhatsApp abre com uma mensagem pronta e o link da sala; é só escolher o grupo. Se preferir, toque no código da sala para copiar o link.
4. **Os amigos abrem o link** no celular ou no computador, digitam o nome e entram. Quem já está no jogo também pode digitar o código de 4 letras e tocar em **Entrar**.
5. **Toque em Começar** quando todos estiverem na sala.

![Tela do Buraco no celular com o nome preenchido e os botões Jogar com IA, Criar sala e Entrar com código](/blog/convite-criar-sala.png "Digite o nome e toque em Criar sala")

![Sala criada no celular com o código de 4 letras, o botão verde Convidar e os lugares dos dois times](/blog/convite-sala.png "Na sala, toque em Convidar para abrir o WhatsApp")

## Dicas
- Funciona no celular, direto no navegador.
- Faltou gente? Em vários jogos dá para colocar o computador nos lugares vazios.
- Combine as regras antes de começar, principalmente em jogos com variantes como Buraco e Truco.$md$, TIMESTAMP '2026-10-27 12:00:00' - INTERVAL '9 seconds', CURRENT_TIMESTAMP);
