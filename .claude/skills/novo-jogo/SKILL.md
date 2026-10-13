---
name: novo-jogo
description: Monta um novo jogo de cartas (ou outro jogo de mesa por turnos) neste monorepo de jogos (Bun + Next.js + WebSocket), seguindo exatamente os padrões do Truco Paulista já implementado — engine de regras pura e testada, IA, salas multiplayer com escolha de time, mesa com assentos na borda, animação de embaralhar/distribuir, sons sintetizados, dicas no hover, página e modal "Como jogar", recordes e conquistas no perfil, SEO e prévia de link por jogo, convite pelo WhatsApp, estilização, responsividade e deploy Docker/Easypanel. Use sempre que o usuário pedir para criar, montar, adicionar ou começar um jogo novo (ex.: "monta o truco mineiro", "adiciona buraco", "cria um jogo de fodinha", "quero um novo jogo na página de jogos"), e também ao estender um jogo existente com recursos que o truco já tem (IA, salas, sons, dicas, como jogar, distribuição animada), mesmo que o usuário não fale em "skill" ou "padrão".
---

# Novo jogo no monorepo de jogos

Este repositório é o **Mesa de Jogos** (`mesadejogos.com`), um site com vários jogos. O **Truco Paulista** é a implementação de referência: todo jogo novo deve parecer e se comportar como irmão dele. Antes de escrever código, abra os arquivos de referência citados abaixo — copiar a estrutura que já funciona é muito mais rápido e consistente do que reinventar.

## Como o usuário gosta de trabalhar

Isto veio de várias rodadas de feedback; respeitar evita retrabalho:

- **Pouco texto na UI.** Rótulos curtos (QUERO, CORRO, BORA), ícones e cores no lugar de frases. Textos explicativos só na página "Como jogar".
- **Interface em português (pt-BR).** Respostas ao usuário também em português.
- **Ícones em SVG** (traço arredondado, `stroke="currentColor"`), não emoji nem caracteres como "←" (exceção: 🏆/💀 da tela de fim, que o usuário quis igual ao truco). Hover só clareia o botão — o ícone não se mexe.
- **Sem voz sintetizada.** Sons só com Web Audio (o usuário rejeitou `speechSynthesis`).
- **Commit e push só quando pedido.** Ao terminar uma mudança, pergunte se quer commit e push. Mensagens de commit em português, com a linha `Co-Authored-By` exigida pelo ambiente.
- **Verificar no navegador antes de dizer que está pronto**, inclusive em celular (360px e 375px de largura).

## Fluxo

1. **Regras primeiro.** Confirme com o usuário a variante exata (ex.: truco mineiro vs paulista: manilhas, valores das apostas, pontuação, número de jogadores, regras especiais). Se houver dúvida real sobre uma regra, pergunte — regra errada é o bug mais caro. Registre as regras no topo do arquivo de regras e na página "Como jogar".
   - **No mesmo plano, proponha os recordes e as conquistas do jogo** (o que salvar de cada partida, recordes do perfil, 4 a 7 conquistas) e espere o usuário aprovar ou trocar. Ele quer pensar nisso junto em todo jogo novo. Roteiro: [references/conquistas.md](references/conquistas.md).
2. **Engine pura + testes** (`packages/<slug>`): tipos, baralho, reducer `applyAction`, projeção por jogador `viewFor`, IA `decide`, protocolo. Escreva os testes junto, incluindo a simulação de centenas de partidas só com IAs. Detalhes: [references/arquitetura.md](references/arquitetura.md).
3. **Servidor**: plugue o jogo no servidor de salas (bots, timers, reconexão, atraso da animação de distribuição), sempre com **um único** `rooms.ts`/servidor WS. Variante da mesma engine pede só um campo `variant` na sala; jogo de outra família pede um adaptador por jogo. Veja "Vários jogos no servidor" em arquitetura.md.
   - Variante de jogo existente: antes de mexer na UI, procure valores fixos da variante original (no truco: `BET_NAME` por valor, `bet.value + 3`, `[3,6,9,12]` no som, "MÃO DE 11", `value > 1`) e faça-os virem da engine/view (ex.: `raiseTo`, degrau da aposta, rótulos por variante).
4. **Web**: rota própria `/<slug>` (ex.: `/truco-mineiro`), card na página inicial de jogos, lobby, mesa, "Como jogar". Padrões visuais e componentes: [references/ui.md](references/ui.md).
5. **SEO e prévia de link**: entrada em `GAMES` (`lib/seo.ts`), metadados e JSON-LD no layout, FAQ no "Como jogar", `noindex` nas salas/partidas, arte da prévia em `lib/og.tsx` e chamada do convite no `Lobby`. Passo a passo: [references/seo.md](references/seo.md).
6. **Recordes e conquistas**: os aprovados no passo 1. Jogo online: `outcome()` no adaptador do servidor; jogo solo: `reportSoloWin` + validação em `/api/results`. Conquistas em `lib/stats/achievements.ts`, recordes em `lib/stats/summary.ts`. Passo a passo: [references/conquistas.md](references/conquistas.md).
7. **Polimento**: distribuição animada, sons, dicas no hover, destaque de vez, placar da mão. Sons: [references/som.md](references/som.md). "Como jogar" e dicas: [references/como-jogar.md](references/como-jogar.md).
8. **Verificação**: testes, typecheck, navegador (solo, multiplayer com 2 abas, celular), Docker se mexeu em build. Roteiro e armadilhas conhecidas: [references/verificacao.md](references/verificacao.md).

## Mapa do código de referência (Truco Paulista)

| Camada | Arquivo | O que reaproveitar |
|---|---|---|
| Tipos | `packages/game/src/types.ts` | `GameState`, `Action`, `PlayerView` com flags `canPlay/mustRespond/...` |
| Baralho | `packages/game/src/deck.ts` | `makeDeck`, `shuffle(rng)`, `strength`, `cardImage` |
| Regras | `packages/game/src/rules.ts` | reducer imutável `applyAction(state, action) → {ok, state} \| {ok:false, error}`, fase `advance` |
| Visão | `packages/game/src/view.ts` | esconde cartas alheias; calcula o que cada jogador pode fazer |
| IA | `packages/game/src/ai.ts` | `decide(view)` usando só a visão do bot (sem trapaça) |
| Protocolo | `packages/game/src/protocol.ts` | `ClientMsg`/`ServerMsg`, `RoomInfo`, `withSeat` |
| Testes | `packages/game/test/rules.test.ts` | casos de regra + simulação de 300 partidas |
| Salas | `apps/server/src/rooms.ts` | lobby, assentos, bots, `schedule`, `dealUntil`, reconexão |
| Mesa | `apps/web/components/truco/Table.tsx` | layout, assentos, placar, botões, área de ação |
| Distribuição | `apps/web/components/truco/Deal.tsx` | `useDeal`, `dealtTo`, `DealAnimation` |
| Dicas | `apps/web/components/truco/CardInfo.tsx` | painel no hover (`useTips`/`TipsButton` ficam em `components/ui/buttons.tsx`) |
| Como jogar | `components/truco/HowToPlay.tsx`, `app/truco-paulista/como-jogar/page.tsx` | conteúdo compartilhado entre página e modal |
| Som | `apps/web/lib/sound.ts` (núcleo) + `lib/truco/sound.ts` | Web Audio, mudo persistido, `useAudioUnlock`; sons próprios de cada jogo em `lib/<slug>/sound.ts` |
| Socket | `apps/web/lib/socket.ts` (compartilhado) | `useRoom<View>()`, `send`, token em `sessionStorage` |
| Rotas | `apps/web/lib/truco/paths.ts` | constante da rota do jogo |
| Hub | `apps/web/app/page.tsx` | card de cada jogo |
| SEO | `apps/web/lib/seo.ts` (`GAMES`), `app/truco-paulista/layout.tsx` | textos de busca, FAQ, metadados, JSON-LD |
| Prévia de link | `apps/web/lib/og.tsx`, `app/truco-paulista/opengraph-image.tsx` | arte do jogo na imagem de compartilhamento |
| Botão voltar | `apps/web/components/BackButton.tsx` | já compartilhado |

### Já compartilhado entre os jogos

| O quê | Arquivo |
|---|---|
| Carta (PNG) e verso | `components/cards/Card.tsx` (`CardImg` aceita valor em texto ou 1-13) |
| Botões redondos do topo | `components/ui/buttons.tsx` (`IconButton`, `Icon`, `HelpButton`, `MuteButton`, `TipsButton` + `useTips`, `ExitButton`) |
| Tela de fim (vitória/derrota) | `components/ui/GameEnd.tsx` (`GameEnd` + `EndStat`) — padrão do truco: 🏆 VITÓRIA! / 💀 DERROTA, selo opcional (nível, naipes), números do jogo como filhos, ✕ sair + "De novo"; botões extras em `actions` |
| Sair com confirmação ("SAIR?" ✕ / SAIR abaixo do topo) | `components/ui/ExitConfirm.tsx` — use sempre no lugar do `ExitButton` na partida; `ask={false}` quando a partida já acabou |
| Modal "Como jogar" | `components/ui/HowToPlayModal.tsx` (casca; o conteúdo vem como filho) |
| Cartão numerado do "Como jogar" | `components/ui/HowToSection.tsx` |
| Ícones de ferramenta (desfazer, dica, lápis, apagar) | `components/ui/icons.tsx` |
| Nota sintetizada curta, vitória e derrota | `tone()`, `playWinSound`, `playLoseSound` em `lib/sound.ts` |
| Conexão com o servidor de salas | `lib/socket.ts` (`useRoom<View>()`, `send`) |
| Lobby da sala (lugares em colunas, IA, Começar) | `components/ui/Lobby.tsx` (`groups`, `exitPath`; `TEAMS_2X2` do truco) |
| Rota da sala de cada jogo online | `lib/rooms.ts` (`GAME_ROOM_PATH`, para redirecionar código de outro jogo) |
| Empate na tela de fim | `GameEnd` com `draw` (🤝 EMPATE) |
| SEO do jogo (metadados, JSON-LD, frase sob o título, FAQ) | `lib/seo.ts` (`gameMetadata`, `howToMetadata`, `gameLd`, `howToLd`, `noindex`) + `components/seo.tsx` (`JsonLd`, `GameIntro`, `GameFaq`) |
| Prévia de link 1200×630 | `lib/og.tsx` (`gameOgImage`, arte por jogo em `art()`) |
| Convite pelo WhatsApp (só no lobby de jogo online) | `components/ui/WhatsAppInvite.tsx`, mensagens em `INVITE` no `Lobby.tsx` |
| Resultados, recordes e conquistas no perfil | `lib/stats/` (`games.ts`, `achievements.ts`, `summary.ts`, `record.ts`, `report.ts`), `outcome()` em `apps/server/src/games.ts`; a tela de fim já mostra as conquistas novas (`NewAchievements` no `GameEnd`) |
| Cronômetro que pausa com a aba oculta | `lib/useClock.ts` (Sudoku e Spider) |
| Nome do jogador antes da sala | `components/ui/PlayerName.tsx`: campo para visitante; logado, nome e foto da conta travados (só mudam no perfil). Use na página do jogo e no "Seu nome" da sala — nunca um `<input>` próprio |
| Rosto do jogador na mesa e no lobby | `components/ui/SeatFace.tsx` dentro do círculo do lugar (com `overflow-hidden`): foto da conta, 🤖 ou inicial. O servidor manda `image`/`username` em `SeatInfo` e usa o nome da conta (ticket assinado), ignorando o que o navegador mandar |

### Jogo de um jogador só (ex.: Paciência Spider)

Sem adversário nem informação escondida, não precisa de servidor, sala nem lobby: a engine roda no navegador e a partida fica no `localStorage` (recarregar continua). Referência: `packages/spider` (regras, `bestHint` com função de progresso que nunca entra em ciclo) e `components/spider/Table.tsx` (as cartas numa camada única com posição absoluta; mover, distribuir e desfazer viram transições de CSS; arrastar com Pointer Events). Abaixo de ~64 px de largura o índice das PNGs fica ilegível: use uma face compacta (`SpiderCard`).

Jogo online sem cartas (ex.: Connect 4): `packages/connect4` (IA negamax com poda alfa-beta em tabuleiro plano, ~100 ms por lance) e `components/connect4/` (`Board` com placa SVG por cima das peças e queda em CSS; `StaticBoard` para ilustrações). Dicas que ajudam a ganhar (ex.: ameaças de 4) só contra a IA, nunca entre pessoas.

Jogo sem cartas (ex.: Sudoku): `packages/sudoku` (gerador por `seed` que garante solução única via solver lógico, dificuldade pela técnica mais difícil exigida, dica com o motivo) e `components/sudoku/Table.tsx` (grade com bordas de madeira, teclado numérico, cronômetro que pausa com a aba oculta). Gerar puzzle difícil pode levar ~1 s: mostre um spinner no botão e gere num `setTimeout`.

Jogo online simultâneo e sem IA (ex.: Stop): `packages/stop` (todos agem ao mesmo tempo; fases com relógio avançadas pelo servidor com `advance`; ausentes via ação `away`) e `components/stop/` (folha de respostas com envio em debounce, correção por votos, opções do host no lobby em `Settings.tsx` passadas como filho do `Lobby`). O adaptador usa `minSeats`, `bots: false`, `settings` e `phaseKey`; veja "Vários jogos no servidor" em arquitetura.md.

Jogo online com informação escondida e fase simultânea (ex.: Batalha Naval): `packages/batalha-naval` (`viewFor` só revela navios inimigos afundados, e todos no fim; IA por mapa de probabilidade que caça e depois segue a linha do navio) e `components/batalha-naval/` (`Sea` com itens posicionados por `cellStyle`, navios em SVG por `ShipShape`, `Placement` com arrastar/girar por Pointer Events e frota guardada no `sessionStorage`; mares lado a lado ou empilhados por container query em `.bn-layout`). O adaptador usa `simultaneous: true` para o bot montar a frota sem esperar o humano.

Jogo online em times com papéis (ex.: Codenames): `packages/codenames` (papel e time saem do número do lugar; `canStart` exige mestre e agente em cada time; `viewFor` esconde o mapa dos agentes) e `components/codenames/` (`WordCard` com letra que se ajusta por container query no próprio cartão; times em `.cn-layout`, em cima da mesa no celular e dos lados no desktop; lista de palavras do host em textarea com envio em debounce). No lobby, `SeatGroup.sections` divide a coluna do time em partes (MESTRE / AGENTES) mostrando só quem sentou e um "Sentar". Fim de jogo com "Ver mapa"; o "De novo" leva todos ao lobby (mensagem `lobby`) para trocar de time. Quem entra com a partida rolando assiste (`spectate` no adaptador, visão de agente). Agentes marcam várias palavras e revelam uma por vez no ✓ do cartão.

## Reaproveitar sem duplicar

Quando um jogo novo precisar de algo que ainda está em `components/truco/` ou `lib/truco/` e que **não é específico do truco** (ex.: `socket.ts`, `Deal.tsx`), mova para um lugar compartilhado (`components/cards/`, `components/ui/`, `lib/`) e atualize os imports dos dois jogos. Duplicar arquivos faz os jogos divergirem visualmente na primeira correção. Variantes da mesma família (truco mineiro/paulista) podem compartilhar ainda mais — por exemplo, o mesmo pacote de engine com uma opção de variante, se as regras forem quase iguais. Decida olhando o tamanho da diferença e explique a escolha ao usuário.

## Checklist de entrega

Use como lista de tarefas; cada item existe porque já deu problema antes:

- [ ] Regras confirmadas e documentadas; testes cobrindo regras, empates/casos especiais e simulação com IAs (`bun test`)
- [ ] Typecheck limpo (`node_modules/.bin/tsc.exe --noEmit -p apps/web`, `-p apps/server`, `-p packages/<slug>`)
- [ ] Rota `/<slug>` + constante em `lib/<slug>/paths.ts`; card no hub; `layout.tsx` com `gameMetadata` e `gameLd`
- [ ] SEO: entrada em `GAMES` com textos conferidos no código, `GameIntro` na página do jogo, `GameFaq` + `howToLd` no "Como jogar", `noindex` em `sala/` ou `jogo/` ([references/seo.md](references/seo.md))
- [ ] Prévia de link: `TITLES` + `art()` em `lib/og.tsx` e `app/<slug>/opengraph-image.tsx`; PNG conferido a olho
- [ ] Jogo online: chamada do convite em `INVITE` (`Lobby.tsx`); jogo de um jogador só não tem convite
- [ ] Lobby com escolha de lugar/time, host adiciona IA, modo solo com IAs
- [ ] Mesa: assentos na borda, leques virados ao centro, selo "D" de quem dá, destaque de vez nas cartas, placar e valor da rodada
- [ ] Distribuição animada a cada mão; bots esperam a animação (`dealUntil` no servidor)
- [ ] Recordes e conquistas aprovados pelo usuário e implementados, com testes (`outcome` no servidor, `CASES` das conquistas); partida até o fim logado grava em `game_result`, aparece no `/perfil` e em `/perfil/conquistas`; dados de teste apagados ([references/conquistas.md](references/conquistas.md))
- [ ] Vitória e derrota com `GameEnd` (mesmos ícones, títulos e botões em todos os jogos; só os números e o selo mudam)
- [ ] Botão de sair da partida pede confirmação (`ExitConfirm`), em todo jogo, inclusive os de um jogador só
- [ ] Sons (carta jogada + eventos principais), botão de mudo; dicas no hover com botão para desligar (ocultas em touch)
- [ ] "Como jogar": página `/<slug>/como-jogar` com imagens das cartas + botão "?" que abre o mesmo conteúdo em modal na partida
- [ ] Navegador: solo, multiplayer em 2 abas, reconexão (recarregar), fim de jogo, celular 360/375px sem rolagem horizontal, console sem erros
- [ ] Docker: se mudou dependências/build, `docker build` dos dois Dockerfiles a partir da raiz
- [ ] Perguntar ao usuário se quer commit e push
