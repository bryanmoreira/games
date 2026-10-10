# UI e estilização

## Sumário
- Identidade visual
- Página inicial do jogo e lobby
- Layout da mesa
- Assentos dos outros jogadores
- Sua mão e área de ação
- Topo da tela (placar, rodada, botões)
- Centro da mesa
- Botões e ícones
- Responsividade
- Animações

## Identidade visual

Tokens em `apps/web/app/globals.css` (`@theme` do Tailwind v4): `--color-felt` (#0f5132), `--color-gold` (#f2c14e), `--color-team-a` / `--color-team-b`. Fontes: **Bungee** (`font-display`) para títulos, números e botões; **Inter** para o resto.

- Fundo do site: degradê radial escuro. Páginas longas (como "Como jogar") usam um wrapper com cor sólida `bg-[#0f1813]` e `min-h-dvh`, senão aparece o cinza padrão quando a página passa da altura da tela.
- Mesa: classe `.felt` (feltro verde com borda de madeira via `box-shadow`), cantos `rounded-[48px] sm:rounded-[120px]`, `max-w-[1100px]` centralizada para os laterais não ficarem longe em monitores largos.
- Cores de time: **dourado** para você e seu parceiro (`bg-gold`/`text-gold`), **vermelho** para adversários (`border-red-400/80`, `text-red-400`). Use em avatares, placar, banners de resultado ("+3 NÓS" dourado / "+1 ELES" vermelho).
- Cartas: `CardImg` (PNG com `.card-face`) e `CardBack` (CSS). Proporção 500/726.

## Página inicial do jogo e lobby

- Página do jogo (`app/<slug>/page.tsx`): leque de 4 cartas, título em duas linhas (nome grande dourado + variante pequena espaçada), campo de nome, **Jogar com IAs** (dourado), **Criar sala** (verde), campo de código + **Entrar**, link "Como jogar" com ícone de interrogação, `BackButton` fixo no canto superior esquerdo apontando para `/`.
- Lobby (`components/truco/Lobby.tsx`): código grande clicável que copia o link, uma coluna por time com os lugares (Sentar / 🤖 para o host adicionar IA / ✕ para remover), "espectadores" como chips, botão Começar só para o host e habilitado com a mesa cheia. Escolher o lugar = escolher o time e a dupla.

## Layout da mesa (`components/truco/Table.tsx`)

`main.h-dvh flex-col`: topo → `section` com o feltro (`flex-1`) → sua área (ação + mão). Posição relativa de cada assento: `POS[(seat - me + 4) % 4]` → `bottom` (você), `right`, `top` (parceiro), `left`.

## Assentos dos outros jogadores

Componente padronizado (`Opponent` + `Fan` + `DealerChip`):
- Avatar circular `h-12 sm:h-14 lg:h-16` com borda de 3px na cor do time e inicial do nome (ou 🤖 para IA); nome num selo escuro logo abaixo; opacidade reduzida se desconectado; brilho `turn-glow` quando é a vez dele ou quando o time dele precisa responder.
- **Sentado na borda da mesa**: o assento de cima sobe exatamente meio avatar (`-translate-y-6 sm:-translate-y-7 lg:-translate-y-8`), para o centro do rosto ficar sobre a borda. Não use porcentagem da altura do bloco (que inclui o leque), porque isso já fez o avatar invadir o placar. Os laterais ficam dentro da mesa no celular e montados na borda a partir de `sm`.
- Leque de cartas viradas **apontando para o centro**: horizontal embaixo do avatar de cima; vertical (cartas deitadas, `rotate(90deg)`) ao lado dos laterais.
- Selo **D** branco em quem deu as cartas (no avatar, ou ao lado do seu nome).

## Sua mão e área de ação

- Linha de ações acima da mão (altura mínima fixa para não pular o layout): botões contextuais vindos das flags da view (`TRUCO!/SEIS!/...`, `QUERO`/`CORRO`/aumentar, `BORA`/`CORRO` na mão de 11 com as cartas do parceiro em miniatura). Invisível durante a distribuição.
- Cartas `w-[clamp(72px,21vw,118px)]`; a área tem altura mínima igual a uma carta, para a mesa não crescer quando a mão esvazia.
- **Sua vez**: as cartas sobem um pouco (`-translate-y-2`, hover `-translate-y-5`) e ganham brilho dourado pulsante (`.turn-card` com `drop-shadow`); o seu nome fica dourado com um ponto pulsando. Não use moldura/retângulo em volta da mão (o usuário não gostou).
- **Carta coberta**: ícone redondo (verso da carta, borda dourada) no canto da carta, visível só no hover (`[@media(hover:hover)]:opacity-0 group-hover:opacity-100`; em touch fica sempre visível). Clicar no ícone **vira a carta na mão** com flip 3D (`FlipCard`: `perspective` + `preserve-3d` + `backface-visibility`); com ela virada, o ícone fica dourado com ↺ para desvirar, e clicar na carta joga coberta.
- Ferro / cartas desconhecidas: `myHand` vem com `null` e renderiza verso.

## Topo da tela (placar, rodada, botões)

- Esquerda: placar `NÓS x ELES` (números grandes, rótulos pequenos). O "×" fica num bloco com o mesmo espaçador de rótulo, para alinhar com os números e não com o meio do bloco.
- Centro (`HandInfo`): vazas como mini cartas (✓ dourado ganhou, ✕ vermelho perdeu, = empate, contorno na vaza atual) + divisor + valor da rodada com rótulo (VALE 1 / TRUCO 3 / SEIS 6 ... / MÃO DE 11 / FERRO), dourado quando aumentado, com animação ao mudar.
- Direita: `HelpButton` (?), `TipsButton` (lâmpada, oculto em touch), `MuteButton`, sair (✕), todos redondos `h-8 sm:h-10`. O código da sala aparece só a partir de `sm` e não no solo.
- O cabeçalho é `relative z-40` e hospeda o painel de dicas (`absolute top-full right-*`).

## Centro da mesa

- Área de cartas jogadas `top-[55%]`, `w-[44vw] sm:w-[min(62vw,360px)]`, `h-[min(34vh,320px)]`; cada carta entra vinda do lado do dono e fica inclinada levemente; a vencedora da vaza ganha contorno dourado (`outline`, não `ring`, pois `ring` usa `box-shadow` e a carta já tem sombra).
- Banner central (`CenterStatus`): resultado da mão, aposta pendente pulsando, "⏳ 11".
- Balão de grito (`ShoutBubble`) perto de quem gritou, com animação `.shout`, chave `shout-${id}`.
- Painel da vira no canto inferior esquerdo: "VIRA" com a carta em pé (maço atrás) → seta dourada → "MANILHA" numa mini carta branca com borda dourada (letra grande + ♦♠♥♣ na ordem de força). Jogos sem vira podem usar o mesmo canto para outra informação fixa da mão (trunfo, etc.).
- Fim de jogo: overlay com 🏆/💀, VITÓRIA/DERROTA, placar, sair e "De novo" (host).

## Botões e ícones

- Ações principais: `ActionBtn` com cores sólidas e "sombra de botão" (`shadow-[0_4px_0_...]`, `active:translate-y-1 active:shadow-none`): dourado (aposta), verde (aceitar), vermelho (correr).
- Ícones: SVG inline 24×24, `stroke="currentColor"`, `strokeWidth` 2–2.5, `strokeLinecap="round"`. Botões de ícone redondos com fundo translúcido; o hover só clareia fundo e ícone, sem mover o ícone.
- Sempre `aria-label` e `title` em botões só com ícone.

## Responsividade

Teste 360px, 375px, ~800×600 e desktop largo. Problemas já encontrados e corrigidos:
- O cabeçalho estoura a largura a cada botão novo: meça `header.scrollWidth` e compacte com variantes sem prefixo (mobile) / `sm:`.
- Cartas jogadas pelos laterais cobrindo o leque deles no celular: mantenha a área central estreita no mobile.
- Elementos que só fazem sentido com mouse (dicas, ícone de hover) ficam ocultos com `[@media(hover:none)]:hidden`.
- Use `h-dvh` na mesa e evite rolagem horizontal (`document.documentElement.scrollWidth > innerWidth`).

## Animações (`globals.css`)

`.deal` (entrada das cartas na mão, com `fill-mode: backwards` — **não** `both`, senão o `transform` final trava e o hover deixa de levantar a carta), `.played` (sem opacidade 0 no início, pois a animação pode ficar parada se a aba não estiver sendo renderizada), `.shuffle-card` e `.fly-card` (distribuição), `.turn-glow`, `.turn-card`, `.banner` (entrada com "pop"), `.shout`.

Distribuição (`Deal.tsx`): `useDeal(view)` detecta mão nova (1ª vaza vazia + `handNo` novo) e roda embaralhar (900 ms) e depois 12 cartas, uma a cada 110 ms, voando 350 ms do centro para o destino de cada assento (`TARGET` por posição, começando pelo jogador depois de quem dá). `dealtTo` diz quantas cartas cada assento já recebeu, e a mesa mostra só essas, então a mão aparece carta por carta. O servidor espera `DEAL_MS` antes de os bots agirem. Ao mudar a posição dos assentos, ajuste os `TARGET`.
