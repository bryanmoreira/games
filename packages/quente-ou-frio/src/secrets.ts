// Palavras que podem ser a secreta: substantivos comuns, que qualquer pessoa conhece.
// Todas precisam estar no vocabulário como palavra-base (o teste confere). Mudar a lista muda a sequência dos dias;
// os dias já gerados ficam no banco.

export const SECRETS: readonly string[] = `
abacaxi abelha abraço açúcar advogado aeroporto água águia agulha alegria alface algodão alho alma almoço altar aluno
amanhecer amigo amor âncora anel animal aniversário anjo ano antena apartamento aplauso aranha árbitro areia arma armário
arroz arte árvore asa assento ator atleta autor avenida avião avó azeite bagagem baleia banana banco bandeira banheiro
barba barco barriga barulho batata bateria baú bebê beijo beleza berço bicicleta biblioteca bigode bilhete biscoito
boca bola bolo bolsa bombeiro boneca borboleta bosque bota braço brinquedo brisa bruxa burro cabeça cabelo cabra
cachoeira cachorro cadeira caderno café caixa calçada calor cama camelo caminhão caminho camisa campo canção caneca
caneta cantor capacete capitão carne carro carta carteiro casa casamento castelo cavalo caverna cebola cego cemitério
cenoura cereja cérebro céu chá chapéu chave chefe chocolate chuva chuveiro cidade ciência cigarro cinema circo cobra
coelho cofre colher colina comida computador concha confiança coração coragem corda coroa corpo corrida costa cozinha
cozinheiro crença criança crime cruz culpa cupido dança dente deserto desejo destino deus dia diamante dinheiro dinossauro
doce doença dor dragão escada escola escova escudo espada espelho esperança espinho esporte esposa estação estátua
estrada estrela faca família fantasma farinha farol fazenda febre feijão felicidade feriado ferro festa fígado filme
filho fio flor floresta fogão fogo folha fome fonte formiga forno fotografia fruta fumaça futebol galinha garfo garrafa
gato gelo gigante girafa gol golfinho gordura governo grama gravata gripe guarda guerra guitarra helicóptero herói
história homem hospital hotel ilha igreja inferno inimigo inverno irmão janela jardim joelho jogo jornal juiz joia
ladrão lago lágrima lâmpada lança lanche lápis laranja leão leite lenço letra liberdade limão língua livro lixo lobo
loja lua luta luva luz maçã macaco madeira mãe mágica mala mangueira manhã mão mapa máquina mar marido martelo máscara
médico medo mel melancia memória mentira mercado mesa milho moeda montanha morango morcego morte mosca motor moto
mulher mundo muro música navio neve ninho noite noiva nota nuvem óculos olho onda ônibus orelha osso outono ouro ovelha
ovo padaria padre pai palácio palavra palhaço panela pão papel paraíso parede parque passaporte pássaro pato paz peixe
pele pena pente pera perfume pergunta perna pescoço piano pimenta pincel pintura pipoca pirata piscina planeta planta
pneu poeira polícia ponte porco porta praia prato presente primavera princesa prisão professor queijo rádio raiz rainha
rato rede rei relógio remédio revista rio riso roda rosa roupa sabão sal sala sangue sapato sapo saudade segredo selva
semente sereia serpente silêncio sino sofá sol soldado sombra sono sopa sorriso sorvete tartaruga teatro telefone telhado
tempestade templo tempo terra tesoura tesouro tigre tijolo tinta tomate trabalho trem trigo tristeza trovão tubarão
universo urso uva vaca vela veneno vento verão vestido viagem vidro vinho violão vizinho vulcão xadrez zebra
academia açougue adulto agenda agricultor alarme aldeia almofada altura ambulância amizade anão ansiedade apito
aquário arco arquiteto arquivo astronauta atum aula aventura azeitona balança balão balde baleia banda banquete barraca
basquete batalha batom bengala beterraba bezerro bife bispo boi bomba bombom botão brincadeira bússola cadeado cafeteira
caixão calendário cama camarão câmera campainha canoa cansaço capim caracol carnaval carneiro carroça carteira casaco
castanha cavaleiro cegonha celular cera cerveja chaleira chaminé chiclete chinelo churrasco cinto ciúme clima cobertor
cofre cogumelo cola colar colete combustível cometa cometa concerto conselho copo coruja costela couro cova cozinha cravo
crocodilo cume dado dedo degrau delegado dentista desenho diário dicionário disco ditadura doutor dúvida edifício elefante
eleição elevador embaixada encanador enfermeira engenheiro envelope equipe ervilha escorpião escravo escritor escultura
esquilo estádio estômago exército explosão fábrica fada faísca fantasia farmácia favela fazendeiro fechadura feira
ferida ferramenta ferrugem fita foguete fotógrafo fralda freira frango frio fronteira funeral fuzil gaiola gaivota
galáxia galo gaveta geladeira geleia gelo gema general goiaba golpe gorila grávida grilo guarda guerreiro hamster
harpa hino hipopótamo horta igreja ímã imperador incêndio índio infância inseto inveja jacaré jangada jantar jaqueta
javali joaninha jogador jornalista juventude labirinto lagarta lagartixa lagosta lama lanterna lareira lata lavanderia
legume leitão lençol lente lesma leque lhama lição limonada linha liquidificador lírio lixeira locomotiva louça loucura
lucro lustre luto maestro magia mamão manteiga manto marinheiro marmita mármore medalha melodia mendigo mergulho mesquita
meteoro microfone milagre mineiro missa mochila moinho monge monstro mosquito motorista mula músculo museu nariz nascimento
natal naufrágio navalha neblina nervo noivo novela nuca oceano oficina oração orquestra orquídea ovelha pacote padrinho
pagamento palco palmeira pântano papagaio parafuso paraquedas passarinho pastor patins pavão pedra pedreiro peito penhasco
pepino pérola peru pêssego pião picolé pijama pilha piloto pinguim pintor pirâmide pistola placa plateia pneu poema poeta
polvo pomba pombo pomar porão porto poste potro poço pólvora praça prefeito prego príncipe procissão promessa pulmão
pulga pulseira quadro quartel quarto queda queixo quintal rádio raio rapaz rato receita rede relâmpago religião remo
represa restaurante retrato revólver riacho rifle robô rocha romance rua rubi saco safira saia salada salário salgado
salsicha samba sanduíche sapo saúde secretária sela selo semáforo senado serra sinal sobrancelha sobremesa sobrinho
sogra soluço sonho sopro submarino suco suor surfe tabuleiro talher tambor tanque tapete tatu tecido teclado telescópio
televisão tenda tênis terremoto tesoura tia tijolo tinta toalha tomada torneira torre torta touro trator travesseiro
treino tribo trigo trilha troféu trombeta trono tropa túmulo túnel uniforme unha urubu vacina vagão vale vampiro varanda
vassoura vela veludo vendedor verdade verme vespa vestido vilão vinagre violino vírus vitória viúva voo vovó xícara
`
  .trim()
  .split(/\s+/)
  .filter((w, i, all) => all.indexOf(w) === i);
