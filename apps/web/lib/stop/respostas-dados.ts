// Respostas de Stop por categoria e letra, para as páginas /stop/respostas.
// Cada linha: a letra, um espaço e as respostas separadas por ";". Letra sem linha = sem página.
// Ao mudar, rode os testes: cada resposta precisa começar com a letra da linha (sem contar acento).

export const RESPOSTAS: Record<string, string> = {
  nome: `
A Ana; Alice; Amanda; André; Antônio; Arthur; Aline; Adriana; Alexandre; Augusto
B Bruno; Beatriz; Bernardo; Bianca; Bárbara; Benedito; Bruna; Breno
C Carlos; Camila; Cláudia; César; Caio; Carolina; Cecília; Cristiano
D Daniel; Daniela; Diego; Débora; Davi; Diana; Douglas; Denise
E Eduardo; Elisa; Enzo; Eliane; Emanuel; Érica; Everton; Estela
F Fernanda; Felipe; Fábio; Flávia; Francisco; Fátima; Fernando; Fabiana
G Gabriel; Gabriela; Gustavo; Giovana; Guilherme; Gisele; Gilberto; Glória
H Helena; Henrique; Heitor; Hugo; Heloísa; Hélio; Hortência; Humberto
I Isabela; Igor; Ingrid; Ivone; Iara; Ícaro; Isadora; Ivan
J João; Júlia; José; Juliana; Jorge; Joana; Jéssica; Júlio
K Karina; Kevin; Kátia; Kelly; Kaique; Karen; Kauã; Kléber
L Lucas; Larissa; Laura; Leonardo; Luíza; Lorena; Luciano; Letícia
M Maria; Mateus; Mariana; Marcos; Marcela; Miguel; Mônica; Murilo
N Natália; Nicolas; Nathan; Nádia; Nelson; Nicole; Norberto; Noemi
O Otávio; Olívia; Oscar; Odete; Orlando; Osvaldo; Ofélia; Otto
P Pedro; Paula; Paulo; Patrícia; Priscila; Pietro; Pâmela; Paola
Q Quitéria; Quintino; Quésia; Quirino
R Rafael; Renata; Rodrigo; Roberta; Ricardo; Rita; Rebeca; Raul
S Sofia; Samuel; Sandra; Sérgio; Sabrina; Sílvia; Simone; Sebastião
T Tiago; Tatiana; Thaís; Túlio; Teresa; Tomás; Tânia; Talita
U Ubirajara; Úrsula; Ulisses; Uriel; Ubiratan
V Vitória; Vinícius; Valentina; Vanessa; Vítor; Valéria; Vicente; Viviane
W William; Wagner; Wesley; Wanessa; Wellington; Wilson; Walter; Wanda
X Xavier; Ximena; Xênia; Xande
Y Yasmin; Yuri; Yara; Yago; Yolanda
Z Zilda; Zeca; Zuleica; Zacarias; Zélia; Zoe; Zuleide
`,
  cep: `
A Amazonas; Acre; Alagoas; Amapá; Aracaju; Argentina; Alemanha; Angola; Austrália; Atibaia
B Brasil; Bahia; Belém; Belo Horizonte; Brasília; Bolívia; Bélgica; Boa Vista; Bauru
C Curitiba; Ceará; Campinas; Cuiabá; Chile; China; Canadá; Colômbia; Cuba; Campo Grande
D Dinamarca; Diadema; Divinópolis; Dourados; Dubai; Dublin; Duque de Caxias
E Espírito Santo; Espanha; Egito; Equador; Estados Unidos; Escócia; Etiópia
F Fortaleza; Florianópolis; França; Finlândia; Feira de Santana; Foz do Iguaçu; Filipinas
G Goiás; Goiânia; Guarulhos; Grécia; Guatemala; Gana; Gramado; Guarujá
H Holanda; Haiti; Honduras; Hungria; Havana; Hong Kong; Hortolândia
I Itália; Índia; Inglaterra; Irlanda; Israel; Islândia; Itajaí; Ilhéus; Indonésia
J Japão; Jamaica; João Pessoa; Joinville; Juiz de Fora; Jundiaí; Jordânia
K Kuwait; Kosovo; Katmandu; Kyoto; Kuala Lumpur; Kingston
L Londrina; Lisboa; Londres; Líbano; Luxemburgo; Lima; Lages
M Minas Gerais; Maranhão; Mato Grosso; Manaus; Maceió; México; Marrocos; Moçambique; Madri
N Natal; Niterói; Nicarágua; Nigéria; Noruega; Nova Zelândia; Nova York; Nepal
O Osasco; Olinda; Ouro Preto; Omã; Oslo; Orlando; Ourinhos
P Paraná; Pará; Paraíba; Pernambuco; Piauí; Porto Alegre; Portugal; Paraguai; Peru; Paris
Q Quênia; Quixadá; Queimados; Quito; Quebec; Quirguistão
R Rio de Janeiro; Rio Grande do Sul; Rondônia; Roraima; Recife; Rússia; Romênia; Roma; Ribeirão Preto
S São Paulo; Santa Catarina; Sergipe; Salvador; Santos; Suíça; Suécia; Senegal; Sorocaba
T Tocantins; Teresina; Taubaté; Tailândia; Turquia; Tunísia; Tóquio; Toronto
U Uruguai; Uberlândia; Uberaba; Ucrânia; Uganda; Ubatuba; Uruguaiana
V Vitória; Venezuela; Vietnã; Viçosa; Volta Redonda; Viena; Veneza; Valinhos
W Washington; Wellington; Wenceslau Braz; Windhoek; Wuhan
X Xangai; Xique-Xique; Xanxerê; Xinguara; Xapuri
Y York; Yokohama; Yaoundé; Yucatán
Z Zâmbia; Zimbábue; Zurique; Zagreb
`,
  animal: `
A Abelha; Águia; Arara; Avestruz; Anta; Aranha; Alce; Antílope; Atum; Alpaca
B Baleia; Boi; Burro; Borboleta; Búfalo; Bode; Besouro; Bem-te-vi; Bicho-preguiça
C Cachorro; Cavalo; Camelo; Coelho; Cobra; Coruja; Capivara; Canguru; Crocodilo; Cabra
D Dromedário; Dinossauro; Doninha; Dourado; Dálmata; Diabo-da-tasmânia
E Elefante; Ema; Esquilo; Enguia; Escorpião; Estrela-do-mar; Égua
F Foca; Formiga; Furão; Flamingo; Falcão; Faisão; Frango
G Gato; Girafa; Galinha; Gorila; Golfinho; Gavião; Ganso; Gafanhoto; Guepardo
H Hipopótamo; Hiena; Hamster; Harpia; Hipocampo
I Iguana; Impala; Irara; Inhambu; Íbis
J Jacaré; Javali; Jaguar; Jabuti; Joaninha; Jiboia; Jumento; Jacu
K Koala; Kiwi; Krill
L Leão; Lobo; Lagarto; Lhama; Lebre; Leopardo; Lontra; Lagosta; Lula
M Macaco; Morcego; Mosquito; Minhoca; Mula; Mico; Marreco; Mariposa; Mamute
N Naja; Narval; Nhandu; Novilho
O Onça; Ovelha; Orca; Ornitorrinco; Ostra; Ouriço; Orangotango
P Pato; Porco; Pinguim; Papagaio; Pavão; Pantera; Peixe; Pombo; Polvo; Preguiça
Q Quati; Quero-quero; Quatipuru
R Rato; Raposa; Rinoceronte; Rã; Rena; Rouxinol; Raia; Rolinha
S Sapo; Sardinha; Serpente; Siri; Suricato; Sabiá; Salamandra; Sagui; Salmão
T Tigre; Tartaruga; Tubarão; Tucano; Tatu; Tamanduá; Touro; Texugo; Tilápia
U Urso; Urubu; Uirapuru; Urutau
V Vaca; Veado; Vespa; Víbora; Vaga-lume; Vira-lata
W Wallaby; Wombat
X Xexéu; Xaréu
Y Yorkshire; Yak
Z Zebra; Zangão; Zebu; Zorrilho
`,
  fruta: `
A Abacaxi; Abacate; Açaí; Acerola; Amora; Ameixa; Atemoia; Araçá
B Banana; Bacuri; Bergamota; Biribá; Buriti; Bacaba
C Caju; Cereja; Coco; Caqui; Carambola; Cupuaçu; Cajá; Cambuci
D Damasco; Dendê; Durião
F Figo; Framboesa; Fruta-do-conde; Fruta-pão; Feijoa
G Goiaba; Graviola; Groselha; Guaraná; Gabiroba; Grumixama
I Ingá; Imbu; Inajá
J Jabuticaba; Jaca; Jambo; Jenipapo; Jamelão; Jatobá
K Kiwi; Kinkan; Kumquat
L Laranja; Limão; Lichia; Lima; Longan; Lúcuma
M Maçã; Manga; Melancia; Melão; Morango; Mamão; Maracujá; Mexerica; Mangaba; Mirtilo
N Nectarina; Nêspera; Noni; Noz
O Oiti; Oliva; Ouricuri
P Pera; Pêssego; Pitanga; Pitaia; Pequi; Pinha; Physalis; Pupunha; Pitomba
Q Quixaba; Quiuí; Quiabo
R Romã; Rambutã; Rosa-mosqueta
S Seriguela; Sapoti; Saputá; Sorva; Sapucaia; Salak
T Tangerina; Tamarindo; Tâmara; Tucumã; Toranja; Taperebá
U Uva; Umbu; Uvaia; Uxi; Umê
`,
  cor: `
A Azul; Amarelo; Âmbar; Anil; Azul-marinho; Areia; Ameixa; Água-marinha
B Branco; Bege; Bordô; Bronze; Borgonha; Berinjela
C Cinza; Creme; Ciano; Caramelo; Cobre; Coral; Chumbo; Carmim
D Dourado; Damasco; Denim
E Esmeralda; Escarlate; Ébano
F Fúcsia; Ferrugem; Framboesa; Fumê
G Grafite; Gelo; Goiaba; Grená
H Hortelã; Havana; Heliotrópio
J Jade; Jeans; Jabuticaba
L Laranja; Lilás; Lavanda; Lima; Limão
M Marrom; Magenta; Mostarda; Marfim; Musgo; Mel; Malva
N Nude; Neve; Nácar
O Ocre; Oliva; Ouro; Off-white
P Preto; Prata; Pérola; Petróleo; Púrpura; Pêssego; Palha
R Rosa; Roxo; Rubi; Rosé; Rosa-choque
S Salmão; Sépia; Safira; Siena
T Turquesa; Terracota; Telha; Tijolo; Tabaco
U Uva; Ultramarino; Urucum
V Verde; Vermelho; Violeta; Vinho; Verde-limão; Verde-água
`,
  objeto: `
A Agulha; Armário; Abajur; Apito; Anel; Almofada; Apontador; Aspirador; Avental
B Bola; Balde; Banco; Bolsa; Borracha; Bule; Bandeja; Bacia; Bengala
C Cadeira; Caneta; Copo; Celular; Chave; Colher; Caderno; Cama; Cesto
D Dado; Disco; Despertador; Dedal; Dominó; Dicionário; Desentupidor
E Espelho; Escova; Esponja; Estojo; Envelope; Escada; Espátula; Esmalte
F Faca; Fogão; Fone; Funil; Frigideira; Ferro de passar; Fita; Flauta
G Garfo; Guarda-chuva; Garrafa; Gaveta; Grampeador; Geladeira; Gaiola; Globo
H Hidrante; Harpa; Haltere; Hashi
I Isqueiro; Ímã; Impressora; Ioiô; Interruptor
J Jarra; Joia; Jornal; Jaqueta
K Kit; Kazoo
L Lápis; Livro; Lanterna; Luminária; Lixeira; Lençol; Liquidificador; Lupa
M Mesa; Mochila; Martelo; Microfone; Mouse; Meia; Mala; Moeda; Mangueira
N Navalha; Notebook; Nécessaire; Novelo
O Óculos; Órgão; Organizador
P Panela; Pente; Prato; Piano; Pincel; Papel; Pá; Prego; Porta-retrato
Q Quadro; Queijeira; Quebra-cabeça; Quimono
R Relógio; Rádio; Régua; Rede; Rodo; Raquete; Remo; Rolha
S Sofá; Sapato; Sabonete; Secador; Serrote; Sino; Sacola; Saleiro
T Tesoura; Travesseiro; Toalha; Telefone; Tijolo; Tapete; Teclado; Tampa
U Urna; Ursinho de pelúcia; Ukulele
V Vaso; Vela; Violão; Ventilador; Vassoura; Vidro; Videogame
W Walkie-talkie; Wok; Webcam
X Xícara; Xilofone; Xampu; Xadrez
Z Zíper; Zabumba; Zarabatana
`,
  comida: `
A Arroz; Almôndega; Acarajé; Arroz-doce; Abobrinha; Aipim; Alface
B Batata; Bolo; Brigadeiro; Bife; Baião de dois; Biscoito; Bobó; Beterraba
C Coxinha; Cuscuz; Cocada; Canjica; Carne; Cenoura; Churrasco; Croquete
D Doce de leite; Dobradinha; Dadinho de tapioca; Donut
E Empada; Esfiha; Estrogonofe; Escondidinho; Espaguete; Ervilha
F Feijoada; Farofa; Feijão; Frango; Fondue; Fricassê; Filé
G Galinhada; Goiabada; Gelatina; Guisado; Grão-de-bico; Gnocchi
H Hambúrguer; Homus; Hot dog
I Inhame; Iogurte; Isca de peixe
J Jiló; Jujuba; Jardineira
K Kibe; Ketchup; Kafta; Kebab
L Lasanha; Lentilha; Linguiça; Lombo; Lagosta; Lámen
M Macarrão; Moqueca; Mingau; Mousse; Mandioca; Manjar; Mortadela; Milho
N Nhoque; Nuggets; Nachos; Nozes
O Omelete; Ovo; Ostra; Ossobuco
P Pizza; Pastel; Pão de queijo; Pamonha; Panqueca; Pudim; Picanha; Paçoca
Q Queijo; Quindim; Quiche; Quibebe
R Risoto; Rabada; Rapadura; Ravióli; Rocambole; Rosca
S Sushi; Sopa; Salada; Sanduíche; Salsicha; Sagu; Sarapatel
T Tapioca; Torta; Tutu de feijão; Tacacá; Torresmo; Tomate; Talharim
V Vatapá; Virado à paulista; Vagem; Vinagrete
W Waffle; Wrap
X Xinxim de galinha; Xis; Xerém
Y Yakisoba; Yakitori
`,
  profissao: `
A Advogado; Arquiteto; Ator; Açougueiro; Agricultor; Atleta; Astronauta; Administrador
B Bombeiro; Biólogo; Bancário; Barbeiro; Bailarino; Babá; Bibliotecário; Barman
C Cozinheiro; Contador; Cantor; Carpinteiro; Caminhoneiro; Costureira; Cabeleireiro; Corretor
D Dentista; Designer; Delegado; Diarista; Dublador; DJ; Detetive
E Engenheiro; Enfermeiro; Eletricista; Escritor; Economista; Estilista; Encanador
F Farmacêutico; Fotógrafo; Fisioterapeuta; Frentista; Faxineiro; Florista; Fonoaudiólogo
G Garçom; Geólogo; Gari; Guia turístico; Goleiro; Gerente; Guarda
H Historiador; Hoteleiro; Humorista; Hematologista
I Instrutor; Intérprete; Inspetor; Investigador; Ilustrador
J Jornalista; Juiz; Jardineiro; Joalheiro; Jogador de futebol
L Locutor; Lixeiro; Leiloeiro; Lavrador; Lutador
M Médico; Motorista; Mecânico; Músico; Marceneiro; Manicure; Motoboy; Modelo
N Nutricionista; Nadador; Notário; Neurologista
O Oftalmologista; Operário; Ortodontista; Oceanógrafo; Odontólogo
P Professor; Policial; Padeiro; Pedreiro; Piloto; Pintor; Programador; Psicólogo
Q Químico; Quiroprata; Quitandeiro
R Recepcionista; Repórter; Radialista; Relojoeiro; Roteirista
S Sapateiro; Secretário; Soldado; Salva-vidas; Sociólogo; Surfista; Serralheiro
T Taxista; Tradutor; Técnico; Torneiro; Tatuador; Tenista
U Urologista; Ufólogo; Urbanista
V Veterinário; Vendedor; Vigilante; Vereador; Vidraceiro
W Web designer; Webmaster
X Xerife; Xilógrafo
Z Zelador; Zootecnista; Zagueiro; Zoólogo
`,
  marca: `
A Adidas; Apple; Amazon; Avon; Arezzo; Asics; Americanas
B Brahma; Bauducco; Bic; Boticário; Bradesco; Burger King; Brastemp
C Coca-Cola; Colgate; Casas Bahia; Chevrolet; Cacau Show; Consul
D Dell; Danone; Dove; Disney; Duracell
E Electrolux; Elma Chips; Embraer; Epson
F Fiat; Ford; Facebook; Faber-Castell; Ferrari; Fanta
G Google; Gillette; Garoto; Guaraná Antarctica; Gucci
H Havaianas; Honda; Heineken; Hering; Hyundai; HP
I Ipiranga; Itaú; Ikea; Intel; Instagram
J Jeep; Jequiti; JBL; Johnson & Johnson
K Kibon; Kopenhagen; Kia; Kodak; KitKat; Knorr
L Lacta; Lego; LG; Lenovo; Lupo
M McDonald's; Magazine Luiza; Mercado Livre; Microsoft; Motorola; Melissa; Mizuno
N Nike; Nestlé; Natura; Netflix; Nissan; Nubank; Nivea
O Omo; Oi; Olympikus; Oral-B; Ovomaltine
P Pepsi; Petrobras; Puma; Pantene; Philips; Polishop
Q Quaker; Qualy; Quem Disse, Berenice?
R Renault; Riachuelo; Rexona; Red Bull; Ray-Ban
S Samsung; Sadia; Seara; Sony; Sky; Skol
T Toyota; Tramontina; Tigre; Tang; Tok&Stok; Tim
U Uber; Unilever; Uniqlo; Ultrafarma
V Volkswagen; Vivo; Visa; Vans; Vigor
W Whirlpool; WhatsApp; Wickbold; Walmart
X Xerox; Xiaomi; Xbox
Y Yamaha; YouTube; Ypê; Yakult
Z Zara; Zoom; Zé Delivery
`,
  filme: `
A Avatar; Aladdin; Alien; Aquaman; A Bela e a Fera
B Batman; Barbie; Bob Esponja; Breaking Bad; Bacurau; Bridgerton
C Cidade de Deus; Carros; Central do Brasil; Coringa; Cinderela; Chaves
D Dumbo; Duna; Divertida Mente; Deadpool; Dark
E Elementos; Enrolados; Encanto; E.T.
F Frozen; Friends; Forrest Gump; Fantasia
G Gladiador; Grey's Anatomy; Game of Thrones; Godzilla; Gato de Botas
H Harry Potter; Homem-Aranha; Hulk; House; Hércules
I Interestelar; Indiana Jones; It: A Coisa; Irmão Urso
J Jumanji; Jurassic Park; John Wick; Jogos Vorazes
K King Kong; Kung Fu Panda; Karatê Kid
L La Casa de Papel; Lost; Lilo & Stitch; Luca; Lucifer
M Matrix; Moana; Monstros S.A.; Mulan; Mad Max; Minions
N Napoleão; Noé; Norbit; Nosferatu
O O Rei Leão; O Auto da Compadecida; Os Simpsons; O Senhor dos Anéis; Oppenheimer
P Pantera Negra; Pinóquio; Piratas do Caribe; Peaky Blinders; Procurando Nemo
Q Quarteto Fantástico; Que Horas Ela Volta?; Quem Quer Ser um Milionário?
R Rocky; Rambo; Ratatouille; Rio; Round 6
S Shrek; Star Wars; Stranger Things; Superman; Sherlock
T Titanic; Toy Story; Tropa de Elite; Tarzan; Thor; Todo Mundo Odeia o Chris
U Up: Altas Aventuras; Uncharted
V Velozes e Furiosos; Viva: A Vida é uma Festa; Vingadores; Valente
W Wandinha; WALL-E; Wolverine; Westworld
X X-Men; Xuxa e os Duendes
Y Yellowstone; You
Z Zootopia; Zorro
`,
  corpo: `
A Abdômen; Axila; Antebraço; Artéria; Amígdala; Aorta
B Braço; Boca; Barriga; Bochecha; Bexiga; Baço; Bíceps
C Cabeça; Cotovelo; Coração; Costas; Cabelo; Cílio; Calcanhar; Canela; Coxa
D Dedo; Dente; Diafragma; Dorso
E Estômago; Esôfago; Esqueleto; Esterno; Escápula
F Fígado; Face; Fêmur; Faringe
G Garganta; Gengiva; Glúteo; Glândula
H Hipotálamo; Hálux; Hipófise
I Intestino; Íris; Íleo; Ísquio
J Joelho; Jugular; Jejuno
L Língua; Lábio; Laringe; Lombar; Lóbulo
M Mão; Músculo; Medula; Mandíbula; Maxilar; Mamilo
N Nariz; Nuca; Narina; Nádega; Nervo
O Olho; Orelha; Ombro; Osso; Ovário; Ouvido
P Pé; Perna; Pescoço; Pulmão; Pele; Pâncreas; Pálpebra; Pulso
Q Queixo; Quadril
R Rim; Rosto; Retina; Rótula
S Sobrancelha; Seio; Sangue; Sola do pé; Supercílio
T Tornozelo; Testa; Tórax; Tímpano; Traqueia; Tendão; Tíbia
U Unha; Umbigo; Útero; Úvula; Uretra; Úmero
V Veia; Virilha; Vesícula; Vértebra
`,
  famoso: `
A Anitta; Ayrton Senna; Ana Maria Braga; Ana Castela; Albert Einstein
B Bruna Marquezine; Beyoncé; Bill Gates; Bob Marley; Bruno Mars
C Cristiano Ronaldo; Caetano Veloso; Claudia Leitte; Charlie Chaplin; Carmen Miranda
D Dua Lipa; Dercy Gonçalves; Djavan; Drake
E Eliana; Elvis Presley; Elis Regina; Eminem
F Faustão; Fernanda Montenegro; Felipe Neto; Freddie Mercury
G Gisele Bündchen; Gilberto Gil; Galvão Bueno; Gal Costa
H Hebe Camargo; Hortência; Harry Styles
I Ivete Sangalo; Isaac Newton; Ingrid Guimarães
J Jô Soares; Juliette; Justin Bieber; Jorge Ben Jor
K Kaká; Katy Perry; Kim Kardashian
L Luan Santana; Lady Gaga; Lionel Messi; Leonardo DiCaprio; Ludmilla
M Marília Mendonça; Michael Jackson; Madonna; Maradona; Marta
N Neymar; Nando Reis; Natalie Portman; Nicolas Cage
O Oscar Niemeyer; Oprah Winfrey; Oscar Schmidt
P Pelé; Paulo Coelho; Pabllo Vittar; Paulo Gustavo
Q Quentin Tarantino; Quincy Jones
R Roberto Carlos; Rihanna; Ronaldinho; Rita Lee; Rodrigo Faro
S Silvio Santos; Shakira; Sandy; Steve Jobs; Serena Williams
T Taylor Swift; Tom Cruise; Tom Jobim; Tiago Leifert
U Usain Bolt; Uma Thurman
V Vini Jr.; Vanessa da Mata; Vin Diesel
W Walt Disney; Will Smith; Wesley Safadão; Whindersson Nunes
X Xuxa; Xande de Pilares; Xamã
Y Yudi Tamashiro; Yoko Ono
Z Zeca Pagodinho; Zico; Zezé Di Camargo; Zagallo
`,
  bebida: `
A Água; Água de coco; Achocolatado; Absinto; Aperol; Amarula
B Batida; Bourbon; Bellini
C Café; Cerveja; Cachaça; Caipirinha; Chá; Chimarrão; Champanhe; Cappuccino
D Daiquiri; Dry Martini
E Espumante; Expresso; Energético
F Frapê; Fernet; Frisante
G Guaraná; Gim; Garapa; Groselha
H Hidromel; Horchata
I Itubaína; IPA
J Jurubeba; Jägermeister; Julepe
K Kombucha; Kefir; Kir
L Leite; Limonada; Licor; Laranjada; Lassi
M Mate; Milkshake; Mojito; Margarita; Martini; Moscatel
N Néctar; Negroni; Nescau
O Ouzo; Old Fashioned; Ovomaltine
P Pinga; Piña colada; Ponche; Prosecco
Q Quentão; Quinado
R Refrigerante; Rum; Rosé; Ristretto
S Suco; Saquê; Sangria; Smoothie; Soda
T Tequila; Tereré; Tônica; Tubaína
U Uísque; Umbuzada
V Vinho; Vodca; Vitamina; Vermute
W Whisky; White Russian
X Xerez; Xiboquinha
Y Yakult; Yerba mate
`,
  adjetivo: `
A Alegre; Amável; Alto; Atencioso; Animado; Ágil; Ansioso; Amigo
B Bonito; Bom; Bravo; Barulhento; Brilhante; Baixo; Bondoso
C Calmo; Corajoso; Carinhoso; Chato; Charmoso; Criativo; Curioso
D Divertido; Doce; Dedicado; Distraído; Delicado; Dorminhoco
E Esperto; Elegante; Educado; Engraçado; Estudioso; Egoísta
F Feliz; Forte; Fofo; Fiel; Formoso; Folgado; Fraco
G Gentil; Generoso; Gordo; Grande; Gracioso; Guloso
H Honesto; Humilde; Habilidoso; Hilário; Harmonioso
I Inteligente; Interessante; Inocente; Incrível; Irritado; Impaciente
J Justo; Jovem; Jeitoso; Jovial
L Lindo; Legal; Leal; Lento; Leve; Louco; Lerdo
M Meigo; Maluco; Medroso; Magro; Malvado; Maravilhoso
N Nervoso; Natural; Notável; Novo; Nobre
O Organizado; Otimista; Orgulhoso; Ousado; Obediente
P Paciente; Preguiçoso; Perfeito; Prestativo; Pontual; Pequeno
Q Querido; Quieto; Quente; Questionador
R Rápido; Romântico; Responsável; Risonho; Ranzinza
S Simpático; Sincero; Sábio; Sonhador; Sério; Sensível
T Tímido; Tranquilo; Teimoso; Trabalhador; Talentoso
U Útil; Único; Unido; Ultrajante
V Valente; Vaidoso; Veloz; Vibrante; Velho; Verdadeiro
X Xereta; Xucro
Z Zeloso; Zangado; Zen; Zombeteiro
`,
  sogra: `
A Amável; Atrevida; Alegre; Abusada; Arretada; Animada
B Bondosa; Barulhenta; Brava; Bisbilhoteira; Brincalhona
C Chata; Carinhosa; Ciumenta; Controladora; Curiosa
D Divertida; Dramática; Desconfiada; Dorminhoca; Doce
E Encrenqueira; Esperta; Elegante; Exigente; Escandalosa
F Fofoqueira; Fofa; Folgada; Faladeira
G Gentil; Generosa; Gulosa; Gritona; Gente boa
H Hilária; Honesta; Humilde; Habilidosa
I Intrometida; Implicante; Incrível; Irritante; Inteligente
J Jararaca; Jovem; Jeitosa; Justa
L Linda; Legal; Louca; Linguaruda
M Mandona; Maluca; Meiga; Mexeriqueira; Maravilhosa
N Nervosa; Noveleira; Namoradeira; Nobre
O Ousada; Orgulhosa; Organizada; Otimista
P Paciente; Pidona; Perfeita; Preguiçosa; Prestativa
Q Querida; Quieta; Questionadora
R Ranzinza; Resmungona; Rabugenta; Risonha
S Simpática; Sabida; Sincera; Sensacional; Sapeca
T Teimosa; Tagarela; Tranquila; Tinhosa
U Única; Útil; Unha de fome
V Vaidosa; Valente; Vigilante; Venenosa
X Xereta; Xarope; Xucra
Z Zelosa; Zangada; Zoeira; Zen
`,
};
