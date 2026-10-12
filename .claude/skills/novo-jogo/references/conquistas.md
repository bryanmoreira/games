# Recordes, conquistas e perfil

Todo jogo novo entra no perfil do jogador com números, recordes e conquistas, como os outros. **Antes de implementar, proponha a lista ao usuário e espere a aprovação**: ele gosta de discutir o que vale salvar e quais conquistas fazem sentido em cada jogo (ex.: pediu vitórias × derrotas nos jogos online, cronômetro no Spider para ter "melhor tempo").

## 1. Proposta (no plano do jogo, junto com as regras)

Mostre ao usuário, por jogo:

- **O que é salvo de cada partida** (`data`): só números que o jogo já tem no fim (tempo, jogadas, pontos, tiros, papel…). Se faltar algo que renderia um recorde bom, sugira acrescentar (o Spider ganhou cronômetro por isso).
- **Recordes** que aparecem no card do jogo no perfil: os chips (ex.: "Vitória mais rápida: 4 peças", "Melhor mira: 72%") e, em jogo com níveis/variantes, uma tabela por variante (Sudoku por nível, Spider por naipes).
- **Conquistas**: 4 a 7 por jogo, misturando:
  - marco de entrada: "Primeira vitória" (`first(game)`);
  - habilidade, algo raro e específico do jogo: Pneu (12 a 0 no truco), Relâmpago (4 peças no Connect 4), Intocável (sem perder navio), Dica de ouro (3+ acertos com uma dica);
  - constância: `streak5(game)` (5 vitórias seguidas) e/ou `wins(game, 10|50|100)`;
  - papel ou variante, quando o jogo tem: vencer como mestre e como agente (Codenames), vencer com 2 e 4 naipes (Spider), vencer em todos os níveis (Sudoku).
  
  Título curto e com graça (Pneu, Embalado, Mão rápida), descrição de uma linha que explica a regra exata ("Vencer com 60% ou mais de acertos").
- **Regras de resultado** que precisam de decisão: o que é vitória quando há mais de dois lados (no Stop, só o 1º lugar sozinho; empate no topo é empate; guarda `placement`), time (a vitória do time conta para todos dele), empate.

Pergunte o que tirar ou trocar antes de escrever código.

## 2. Onde mexer

| Peça | Arquivo | O que fazer |
|---|---|---|
| Lista de jogos com estatística | `apps/web/lib/stats/games.ts` | `ONLINE_GAMES` ou `SOLO_GAMES`, e `GAME_INFO` (nome curto + rota). A ordem é a ordem no perfil. `gameFromPath` usa a rota para filtrar as conquistas na tela de fim |
| Conquistas | `apps/web/lib/stats/achievements.ts` | defs em `ACHIEVEMENTS` (`code` = `"<jogo>:<id>"`, `title`, `desc`, `icon`, `check({ results, bestDays })`). Ajudantes `first`, `streak5`, `wins`. Ícones: `trophy`, `star`, `bolt`, `flame`, `target`, `shield`, `crown`, `calendar` (SVG em `components/stats/AchievementIcon.tsx`; ícone novo entra lá) |
| Recordes no perfil | `apps/web/lib/stats/summary.ts` | `case` em `gameStats()`: `chip(rótulo, valor)` e/ou `stats.table`. Vitórias × derrotas, aproveitamento e sequências por modo já saem prontos |
| Jogo online (servidor de salas) | `apps/server/src/games.ts` | `outcome(s, seat)` no adaptador: `{ outcome: "win" \| "loss" \| "draw", placement?, data }`. O typecheck do servidor falha sem ele. O resto (quem está logado, modo `ai`/`online`, derrota para quem abandona, envio ao site) já é feito por `rooms.ts`/`results.ts` |
| Jogo de um jogador só | `apps/web/app/api/results/route.ts` + a mesa do jogo | validar o `data` do jogo em `parse()` (limites numéricos, para não aceitar lixo) e chamar `reportSoloWin("<jogo>", data)` (`lib/stats/report.ts`) quando a partida é ganha |
| Rota reservada | `apps/web/lib/username.ts` | se o jogo criar rota nova **dentro de `/perfil`**, a palavra entra em `RESERVED` |

Não precisa mexer em banco: tudo vai para `game_result` (com `data` em JSON) e `achievement`. Recordes e conquistas são calculados a partir dessas linhas.

## 3. Cuidados

- **Contra IA e online ficam separados** no perfil (`mode`); conquista de "vencer a IA" filtra `r.mode === "ai"`. Conquista que só faz sentido entre pessoas filtra `"online"`.
- **Resultado online vem do servidor**, nunca do navegador: ninguém inventa vitória. Jogo solo é enviado pelo navegador; por isso valide o `data` em `parse()`.
- `check` recebe **todos** os resultados daquele jogo (do mais antigo ao mais novo), não só a partida atual: dá para somar (`stops` ao longo das partidas) e procurar recordes (`some(...)`).
- Partida abandonada chega como `{ outcome: "loss", data: { abandoned: true } }`, sem os números do jogo. Conquista que olha números deve tolerar campo ausente (o ajudante `num()` devolve `NaN`, e comparações com `NaN` dão falso).
- A tela de fim (`GameEnd`) já mostra as conquistas novas da partida sozinha (`NewAchievements`), sem código no jogo.

## 4. Verificação

- Testes automáticos (rodam com `bun run test` na raiz):
  - `apps/server/test/games.test.ts`: um `describe` para o `outcome` do jogo novo (vitória, derrota, empate se houver e os campos de `data`), com partidas reais montadas pelas funções do pacote.
  - `apps/web/test/achievements.test.ts`: cada conquista nova precisa de uma linha em `CASES`, com o mínimo que destrava e o "quase" que não destrava. O teste falha se faltar.
  - `apps/web/test/stats.test.ts`: os recordes novos de `gameStats` (em `lib/stats/compute.ts`).
  - Jogo solo: os limites do `data` aceito em `lib/stats/solo-result.ts`, em `apps/web/test/solo-result.test.ts`.
- Jogo online: jogue uma partida até o fim logado (contra a IA serve) e confira a linha em `game_result` (modo, resultado e `data` certos). Se der, teste também sair no meio de uma partida online: quem saiu leva derrota.
- Jogo solo: ganhe uma partida (ou chame `POST /api/results` com um `data` válido) e veja a conquista "Primeira vitória" aparecer na tela de fim.
- `/perfil` mostra o card do jogo com os recordes; `/perfil/conquistas` lista o grupo do jogo; a página pública mostra só as desbloqueadas.
- Apague os resultados e conquistas de teste do banco antes de entregar.
