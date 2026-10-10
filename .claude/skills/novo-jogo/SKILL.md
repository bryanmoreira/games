---
name: novo-jogo
description: Monta um novo jogo de cartas (ou outro jogo de mesa por turnos) neste monorepo de jogos (Bun + Next.js + WebSocket), seguindo exatamente os padrões do Truco Paulista já implementado — engine de regras pura e testada, IA, salas multiplayer com escolha de time, mesa com assentos na borda, animação de embaralhar/distribuir, sons sintetizados, dicas no hover, página e modal "Como jogar", estilização, responsividade e deploy Docker/Easypanel. Use sempre que o usuário pedir para criar, montar, adicionar ou começar um jogo novo (ex.: "monta o truco mineiro", "adiciona buraco", "cria um jogo de fodinha", "quero um novo jogo na página de jogos"), e também ao estender um jogo existente com recursos que o truco já tem (IA, salas, sons, dicas, como jogar, distribuição animada), mesmo que o usuário não fale em "skill" ou "padrão".
---

# Novo jogo no monorepo de jogos

Este repositório é um site com vários jogos. O **Truco Paulista** é a implementação de referência: todo jogo novo deve parecer e se comportar como irmão dele. Antes de escrever código, abra os arquivos de referência citados abaixo — copiar a estrutura que já funciona é muito mais rápido e consistente do que reinventar.

## Como o usuário gosta de trabalhar

Isto veio de várias rodadas de feedback; respeitar evita retrabalho:

- **Pouco texto na UI.** Rótulos curtos (QUERO, CORRO, BORA), ícones e cores no lugar de frases. Textos explicativos só na página "Como jogar".
- **Interface em português (pt-BR).** Respostas ao usuário também em português.
- **Ícones em SVG** (traço arredondado, `stroke="currentColor"`), não emoji nem caracteres como "←". Hover só clareia o botão — o ícone não se mexe.
- **Sem voz sintetizada.** Sons só com Web Audio (o usuário rejeitou `speechSynthesis`).
- **Commit e push só quando pedido.** Ao terminar uma mudança, pergunte se quer commit e push. Mensagens de commit em português, com a linha `Co-Authored-By` exigida pelo ambiente.
- **Verificar no navegador antes de dizer que está pronto**, inclusive em celular (360px e 375px de largura).

## Fluxo

1. **Regras primeiro.** Confirme com o usuário a variante exata (ex.: truco mineiro vs paulista: manilhas, valores das apostas, pontuação, número de jogadores, regras especiais). Se houver dúvida real sobre uma regra, pergunte — regra errada é o bug mais caro. Registre as regras no topo do arquivo de regras e na página "Como jogar".
2. **Engine pura + testes** (`packages/<slug>`): tipos, baralho, reducer `applyAction`, projeção por jogador `viewFor`, IA `decide`, protocolo. Escreva os testes junto, incluindo a simulação de centenas de partidas só com IAs. Detalhes: [references/arquitetura.md](references/arquitetura.md).
3. **Servidor**: plugue o jogo no servidor de salas (bots, timers, reconexão, atraso da animação de distribuição), sempre com **um único** `rooms.ts`/servidor WS. Variante da mesma engine pede só um campo `variant` na sala; jogo de outra família pede um adaptador por jogo. Veja "Vários jogos no servidor" em arquitetura.md.
   - Variante de jogo existente: antes de mexer na UI, procure valores fixos da variante original (no truco: `BET_NAME` por valor, `bet.value + 3`, `[3,6,9,12]` no som, "MÃO DE 11", `value > 1`) e faça-os virem da engine/view (ex.: `raiseTo`, degrau da aposta, rótulos por variante).
4. **Web**: rota própria `/<slug>` (ex.: `/truco-mineiro`), card na página inicial de jogos, lobby, mesa, "Como jogar". Padrões visuais e componentes: [references/ui.md](references/ui.md).
5. **Polimento**: distribuição animada, sons, dicas no hover, destaque de vez, placar da mão. Sons: [references/som.md](references/som.md). "Como jogar" e dicas: [references/como-jogar.md](references/como-jogar.md).
6. **Verificação**: testes, typecheck, navegador (solo, multiplayer com 2 abas, celular), Docker se mexeu em build. Roteiro e armadilhas conhecidas: [references/verificacao.md](references/verificacao.md).

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
| Dicas | `apps/web/components/truco/CardInfo.tsx` | painel no hover + `useTips`/`TipsButton` |
| Como jogar | `components/truco/HowToPlay.tsx`, `HowToPlayModal.tsx`, `app/truco-paulista/como-jogar/page.tsx` | conteúdo compartilhado entre página e modal |
| Som | `apps/web/lib/truco/sound.ts` | Web Audio, mudo persistido, desbloqueio no gesto |
| Socket | `apps/web/lib/truco/socket.ts` | store com `useSyncExternalStore`, token em `sessionStorage` |
| Rotas | `apps/web/lib/truco/paths.ts` | constante da rota do jogo |
| Hub | `apps/web/app/page.tsx` | card de cada jogo |
| Botão voltar | `apps/web/components/BackButton.tsx` | já compartilhado |

## Reaproveitar sem duplicar

Quando um segundo jogo precisar de algo que hoje está em `components/truco/` ou `lib/truco/` e que **não é específico do truco** (ex.: `Card.tsx`, `sound.ts`, `socket.ts`, `Deal.tsx`, a casca do `HowToPlayModal`, `TipsButton`, `MuteButton`, `HelpButton`), mova para um lugar compartilhado (`components/cards/`, `components/ui/`, `lib/`) e atualize os imports dos dois jogos. Duplicar arquivos faz os jogos divergirem visualmente na primeira correção. Variantes da mesma família (truco mineiro/paulista) podem compartilhar ainda mais — por exemplo, o mesmo pacote de engine com uma opção de variante, se as regras forem quase iguais. Decida olhando o tamanho da diferença e explique a escolha ao usuário.

## Checklist de entrega

Use como lista de tarefas; cada item existe porque já deu problema antes:

- [ ] Regras confirmadas e documentadas; testes cobrindo regras, empates/casos especiais e simulação com IAs (`bun test`)
- [ ] Typecheck limpo (`node_modules/.bin/tsc.exe --noEmit -p apps/web`, `-p apps/server`, `-p packages/<slug>`)
- [ ] Rota `/<slug>` + constante em `lib/<slug>/paths.ts`; card no hub; título da aba (`layout.tsx` com `metadata`)
- [ ] Lobby com escolha de lugar/time, host adiciona IA, modo solo com IAs
- [ ] Mesa: assentos na borda, leques virados ao centro, selo "D" de quem dá, destaque de vez nas cartas, placar e valor da rodada
- [ ] Distribuição animada a cada mão; bots esperam a animação (`dealUntil` no servidor)
- [ ] Sons (carta jogada + eventos principais), botão de mudo; dicas no hover com botão para desligar (ocultas em touch)
- [ ] "Como jogar": página `/<slug>/como-jogar` com imagens das cartas + botão "?" que abre o mesmo conteúdo em modal na partida
- [ ] Navegador: solo, multiplayer em 2 abas, reconexão (recarregar), fim de jogo, celular 360/375px sem rolagem horizontal, console sem erros
- [ ] Docker: se mudou dependências/build, `docker build` dos dois Dockerfiles a partir da raiz
- [ ] Perguntar ao usuário se quer commit e push
