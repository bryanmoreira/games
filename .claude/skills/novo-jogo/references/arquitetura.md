# Arquitetura

## Sumário
- Monorepo
- Engine do jogo (`packages/<slug>`)
- Testes da engine
- Servidor de salas
- Vários jogos no servidor
- Cliente web (socket, rotas, páginas)
- Cartas (assets)
- Deploy

## Monorepo

Bun workspaces (`package.json` raiz: `"workspaces": ["apps/*", "packages/*"]`). O Bun 1.3 usa o linker isolado: cada app tem seu `node_modules` com links para os pacotes do workspace. Os pacotes atuais usam o escopo `@truco/*` (`@truco/game`, `@truco/server`, `@truco/web`). Mantenha esse escopo em pacotes novos, a não ser que o usuário peça para renomear (renomear mexe em todos os imports e nos Dockerfiles).

Antes de criar um pacote, veja se o jogo não é uma **variante** de um existente (truco mineiro × paulista): nesse caso, prefira um campo `variant` no `GameState` e uma tabela de regras por variante no mesmo pacote. Para um jogo de outra família, crie um pacote novo:

```jsonc
// packages/<slug>/package.json
{ "name": "@truco/<slug>", "private": true, "type": "module", "main": "src/index.ts", "types": "src/index.ts" }
```

Depois adicione `"@truco/<slug>": "workspace:*"` nas dependências de `apps/web` e `apps/server`, rode `bun install` e inclua o pacote em `transpilePackages` no `apps/web/next.config.ts` (o Next precisa transpilar o TypeScript do pacote). Copie também o `tsconfig.json` do `packages/game`.

Scripts raiz: `bun run dev` (web :3000 + ws :3001), `bun run build`, `bun run start`, `bun test packages/<slug>`.

## Engine do jogo (`packages/<slug>`)

Lógica **pura e determinística**, sem I/O: o servidor e a IA dependem dela, e os testes também. Estrutura (espelhe `packages/game/src`):

- `types.ts` — `Card`, `Seat`, `Team`, `Phase`, `GameState`, `Action` (sempre com `seat`, exceto `advance`), `PlayerView`.
- `deck.ts` — `makeDeck()`, `shuffle(items, rng = Math.random)` (rng injetável para testes), `strength(card, ...)`, `cardImage(card)` que retorna `/cards/<rank>_of_<suit>.png`.
- `rules.ts` — `newGame(rng, dealer)`, `applyAction(state, action, rng)`:
  - Clona com `structuredClone` e devolve `{ ok: true, state } | { ok: false, error }`. Nunca lança exceção por jogada inválida; o servidor repassa o `error` ao cliente.
  - Fases com pausa visual (`roundEnd`, `handEnd`) só avançam com `{ type: "advance" }`, que o **servidor** dispara depois de um tempo. Assim a engine não conhece relógio.
  - Eventos que a UI precisa anunciar ("TRUCO!", "CORRO!") vão num campo `shout: { id, seat, kind, value }` com `id` crescente. A UI usa o `id` para tocar animação e som uma única vez.
- `view.ts` — `viewFor(state, seat)`: devolve só o que aquele jogador pode ver (cartas alheias viram contagem; carta coberta de outro vira `null`) e **pré-calcula as permissões** (`canPlay`, `canHide`, `canTruco`, `mustRespond`, `canRaise`, `mustDecideMao11`, `nextBet`). A UI só lê essas flags; nunca reimplementa regra.
- `ai.ts` — `decide(view, rng)` retorna uma `Action` ou `null`. Recebe a **visão** do bot, não o estado completo, para não trapacear. Heurística simples e legível: força da mão + limiares por valor de aposta + um pouco de aleatoriedade (blefe). Jogada: se o parceiro já ganha, descarta a menor; senão a menor que vence; senão a menor.
- `protocol.ts` — mensagens `ClientMsg` (`hello`, `create`, `join`, `sit`, `stand`, `addBot`, `removeBot`, `start`, `restart`, `leave`, `action`) e `ServerMsg` (`room` com `RoomInfo` + `view`, `created`, `left`, `error`). O cliente manda a ação **sem** `seat`; o servidor injeta o assento (`withSeat`) para ninguém jogar no lugar de outro.
- `index.ts` — reexporta tudo.

Jogos de dupla: assentos 0/2 = time 0, 1/3 = time 1 (`teamOf = seat % 2`), ordem de jogo `seat + 1` (anti-horário na tela). Jogos sem times podem usar `Team` = assento ou remover o conceito.

## Testes da engine

`packages/<slug>/test/*.test.ts` com `bun:test`. Cubra:
- ordem de força / casos de empate / pontuação, com cartas montadas à mão (`makeCard`);
- jogadas inválidas retornando `ok: false`;
- regras especiais (no truco: mão de 11, mão de ferro, truco/aceitar/correr/aumentar). Um helper que cria o estado já no cenário (ex.: placar 11×4 + `advance`) facilita;
- **simulação**: centenas de partidas só com `decide` para os 4 assentos, avançando `roundEnd/handEnd`, com limite de passos. Ela pega travamentos (ninguém pode agir) e regras incoerentes que testes unitários deixam passar.

## Servidor de salas (`apps/server/src/rooms.ts`)

Bun.serve com WebSocket nativo na porta 3001 (`index.ts`). Pontos que já funcionam e devem ser mantidos:

- **Identidade**: o cliente manda `hello { token, name }`. O token fica em `sessionStorage` (uma identidade por aba, o que permite testar multiplayer com várias abas). Uma nova conexão com o mesmo token fecha a antiga com código `4000`, e o cliente não reconecta nesse código, evitando loop entre abas.
- **Sala**: código de 4 letras sem I/O ambíguos; `members` (quem está na sala), `seats` (`empty | human | bot`), `host`. O host adiciona/remove IA e inicia quando a mesa está cheia. O modo solo cria a sala já com IAs e começa direto.
- **Broadcast**: cada membro recebe `room` com o **seu** `viewFor` (quem não está sentado recebe `view: null`).
- **schedule(room)** após cada mudança:
  - `roundEnd`/`handEnd` → `setTimeout(advance, 1400 / 2600 ms)`;
  - senão procura quem precisa agir; se algum dos que podem agir for humano conectado, espera; se não, o bot age após 650–1300 ms **mais** o tempo restante da animação de distribuição (`room.dealUntil`, marcado com `markDeal` quando começa uma mão nova, no início de partida e no "De novo").
- **Desconexão**: durante a partida o lugar continua do humano, mas um bot joga por ele enquanto estiver desconectado; ao reconectar com o mesmo token ele retoma. Antes da partida, o lugar é liberado após 30 s sem voltar. Sala sem ninguém conectado é apagada após alguns minutos.

Para testar cenários difíceis (placar 11×11, fim de jogo), um comando de debug **temporário** no servidor que altera o placar ajuda muito — remova antes do commit.

## Vários jogos no servidor

O `rooms.ts` já usa adaptadores (`apps/server/src/games.ts`, mapa `GAMES`: truco e connect4). Mantenha sempre **um** gerenciador de salas e um único servidor WS. Dimensione a generalização pelo que o jogo novo precisa:

- **Variante da mesma engine** (ex.: truco mineiro): basta `room.variant` vindo do `create`, `RoomInfo.variant` e `newGame(..., variant)`. `applyAction`/`viewFor`/`decide` continuam os mesmos, porque a variante vai dentro do estado. Se alguém abrir um código de sala pela rota do outro jogo, a página redireciona para a rota certa.
- **Jogo de outra família**: extraia a interface abaixo e registre um adaptador por jogo.

```ts
interface GameAdapter<S, A, V> {
  seats: number;                                  // 4 no truco
  newGame(rng: () => number, dealer: number): S;
  applyAction(s: S, a: A): { ok: true; state: S } | { ok: false; error: string };
  viewFor(s: S, seat: number): V;
  decide(v: V): A | null;
  actors(s: S): number[];                         // quem pode agir agora
  pause(s: S): number | null;                     // ms até "advance" automático, ou null
  isNewHand(prev: S, next: S): boolean;           // para marcar dealUntil
}
```

A interface real em `games.ts` também tem `withSeat` (ação do cliente + assento), `over` e `animMs(prev, next)` (no lugar de `isNewHand`: quanto tempo os bots esperam a animação do cliente). Para um jogo novo: acrescente o id em `GameId` (`packages/game/src/protocol.ts`), o adaptador em `GAMES` e a rota em `lib/rooms.ts`. A sala guarda `game` (vindo do `create`) e usa o adaptador correspondente. Registre o adaptador num mapa. Um único servidor WS atende todos os jogos, sem precisar de outro serviço no Easypanel.

Ganchos opcionais do adaptador (criados para o Stop):
- `minSeats`: começa com esse mínimo de lugares ocupados (sem ele, a mesa precisa estar cheia). `newGame(prev, { seats, settings })` recebe os lugares ocupados.
- `bots: false`: o lobby esconde o botão de IA e quem sai da partida não vira bot (o lugar fica `empty` com o nome, e sai do "De novo").
- `settings: { initial, parse }`: opções que o host muda no lobby (mensagem `settings`), validadas pelo jogo; chegam ao cliente em `RoomInfo.settings`.
- `phaseKey(s)`: enquanto a chave for a mesma, o relógio de `pause` não reinicia a cada ação (fase com tempo em que todos digitam). O tempo restante vai em `RoomInfo.timeLeft` (ms, sem depender do relógio do cliente).
- `away(s, seats)`: devolve a ação que avisa o jogo de quem está desconectado (para não esperar por ele no PRONTO e na votação), ou `null` se nada mudou.
- `canStart(seats)` (criado para o Codenames): além do mínimo, valida a composição da mesa (mestre e agente em cada time). Chega ao cliente como `RoomInfo.canStart`, que o `Lobby` usa no botão Começar e o "De novo" respeita.
- Mensagem `lobby` (host, partida encerrada): volta a sala ao lobby para trocar lugares/opções; a partida anterior fica em `room.prev` e o jogo novo continua a sequência (quem começa, palavras já usadas).
- `simultaneous: true` (criado para a Batalha Naval): quando vários lugares podem agir ao mesmo tempo (montar a frota), o bot age sem esperar o humano. Sem ele, o bot espera enquanto algum humano conectado puder agir (no truco, o parceiro humano decide antes da IA).

## Cliente web

- **Socket** (`lib/socket.ts`, compartilhado; `useRoom<View>()`): store global com `useSyncExternalStore`, fila de mensagens enquanto conecta, reconexão com backoff, `hello` a cada conexão. URL do WS: `window.__ENV__.WS_URL` (injetada em runtime pelo `app/layout.tsx`) ou `ws(s)://<host>:3001`.
- **Rotas**: `app/<slug>/page.tsx` (nome, Jogar com IAs, Criar sala, código + Entrar, link "Como jogar", `BackButton` para `/`), `app/<slug>/sala/[code]/page.tsx` (pede nome se não houver, `join`, mostra lobby ou mesa), `app/<slug>/como-jogar/page.tsx`, `app/<slug>/layout.tsx` com `metadata.title`. Centralize o caminho em `lib/<slug>/paths.ts` (`GAME_PATH`, `roomPath(code)`) e use em todos os `router.push`/`href`.
- **Hub** (`app/page.tsx`): adicione o card do jogo (felt + leque de cartas + nome em duas linhas, ex.: "TRUCO" / "PAULISTA"); o card "Em breve" vai para o fim.
- Nome do jogador em `localStorage("truco.name")`; preferências em `localStorage` (`truco.muted`, `truco.tips`). Num jogo novo, reaproveite as chaves de preferência gerais e use prefixo próprio para as específicas.

## Cartas (assets)

`scripts/fetch-cards.ts` baixa PNGs de [Webisso/playing-cards](https://github.com/Webisso/playing-cards) (MIT) para `apps/web/public/cards/<rank>_of_<suit>.png` (500×726). As figuras usam as variantes ilustradas `*2.png`. O truco usa 40 cartas; para jogos com 8/9/10 ou coringas, amplie o script (os arquivos existem no repositório de origem). O verso é CSS (`.card-back` em `globals.css`), porque o repositório não tem verso.

## Deploy

- `apps/web/Dockerfile`: Next `output: "standalone"` com `outputFileTracingRoot` na raiz do monorepo; instalação com `--linker=hoisted` no Docker; runner `oven/bun:1.3-slim` rodando `bun apps/web/server.js` como usuário `bun`, porta 3000.
- `apps/server/Dockerfile`: `bun build` gera um único `dist/index.js` (sem `node_modules`), porta 3001.
- Os dois com contexto de build na **raiz**. A URL do WS é configurada em runtime por `NEXT_PUBLIC_WS_URL` ou `WS_URL`: o layout raiz lê a variável a cada requisição (`await connection()` + chave dinâmica para o Next não embutir no build) e injeta `window.__ENV__`.
- Um jogo novo normalmente não exige mudança nos Dockerfiles. Se adicionar um pacote ao workspace, inclua o `package.json` dele na etapa de cópia de manifests dos dois Dockerfiles.
