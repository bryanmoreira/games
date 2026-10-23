<div align="center">

<pre>
       #############################
    ###################################
  ####...............................####
 ###....................@@@@...........###
 ##..............@@@@@@@@@@@@...........##
###.......@@@@@@@@@@@@@@@@@@@@..........###
###......@@@@@@@@@@@@@@@@@@@@@..........###
###.....@@@@@@@@@@@@@@@@@@@@@@..........###
###......@@@@@@@@@@@@@@@@@@@@@@.........###
###......@@@@@@@@@@   @@@@@@@@@.........###
###......@@@@@@@@@      @@@@@@@.........###
###.......@@@@@@@         @@@@@@........###
###.......@@@@@@           @@@@@........###
###........@@@@@            @@@@........###
###........@@@@             @@@@@.......###
###........@@@@@            @@@@@.......###
###.........@@@@           @@@@@@@......###
###.........@@@@@@@ @@  @@@@@@@@@@......###
###.........@@@@@@@@@@   @@@@@@@@@......###
###..........@@@@@@@@@   @@@@@@@@@@.....###
###..........@@@@@@@@@@@@@@@@@@@@@@.....###
 ##..........@@@@@@@@@@@@@@@@@@@@.......##
 ###..........@@@@@@@@@@@@@@...........###
  ####.........@@@@@.................####
    ###################################
       #############################
</pre>

# Mesa de Jogos

**Jogos de cartas e de mesa, grátis, no navegador. Sem cadastro, com salas privadas para jogar com os amigos.**

[mesadejogos.com](https://mesadejogos.com)

![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff)
![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=fff)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=fff)
![Postgres](https://img.shields.io/badge/Postgres-336791?logo=postgresql&logoColor=fff)

</div>

## Jogos

| Cartas e tabuleiro | Palavras e dedução | Outros |
|---|---|---|
| Truco Paulista | Stop (Adedonha) | Futebol de Botão |
| Buraco | Codenames | Sudoku |
| Paciência Spider | Verbete (Termo, Dueto, Quarteto) | Batalha Naval |
| Dominó | | Ludo |
| Xadrez | | Otrio |
| Damas | | Jogo da Velha |
| Connect 4 | | |

A maioria tem **multiplayer online em salas privadas** (com lugares completados pelo computador) e **modo solo contra a IA**. Spider, Sudoku e Verbete rodam só no navegador.

## Estrutura

Monorepo [Bun](https://bun.sh):

```
apps/web        Next.js: site, telas dos jogos, contas, loja e admin
apps/server     WebSocket em Bun: salas e partidas online
packages/*      Regras de cada jogo (puras e testadas): game (Truco), spider, sudoku, xadrez, ...
```

Cartas: [Webisso/playing-cards](https://github.com/Webisso/playing-cards) (MIT).

## Começando

```bash
bun install
cp apps/web/.env.example apps/web/.env         # preencha as variáveis
cp apps/server/.env.example apps/server/.env   # mesmo GAME_SECRET do site
bun run --cwd apps/web db:migrate              # cria/atualiza as tabelas
bun run dev                                    # web :3000, ws :3001
bun run test                                   # regras, servidor de salas e site
```

## Contas e perfil

[Better Auth](https://better-auth.com) + Prisma + Postgres, com login por Google e Discord (mesmo e-mail vira uma conta só). Config em `apps/web/lib/auth.ts`, schema em `apps/web/prisma/schema.prisma`.

- **Telas**: `/login`, `/perfil` (área do jogador) e `/perfil/<username>` (perfil público). Rota nova dentro de `/perfil` precisa entrar na lista de reservadas de `lib/username.ts`.
- **Recordes e conquistas**: cada partida terminada vira uma linha em `game_result` (`lib/stats/`). Sudoku, Spider e Verbete mandam pelo navegador; os jogos online são registrados pelo servidor de salas, que identifica o jogador por um ticket assinado com `GAME_SECRET`. Conquistas novas: `lib/stats/achievements.ts`.
- **Admin**: coluna `role` (`user` | `admin`). Admin acessa `/admin`; os outros recebem 404. Promover: `bun run --cwd apps/web admin <email>` (`--remove` tira).
- **Redirects OAuth**: adicione `/api/auth/callback/google` e `/api/auth/callback/discord` em `http://localhost:3000` e `https://mesadejogos.com`.
- **Schema**: mudou? `bun run --cwd apps/web db:migrate`. Em produção a migração roda sozinha na subida do container.

## Montando um jogo novo com Claude Code

O repositório tem a skill **`novo-jogo`** ([.claude/skills/novo-jogo](.claude/skills/novo-jogo/SKILL.md)), que monta jogos seguindo os padrões do projeto: regras e IA testadas, salas multiplayer, sons, "Como jogar", recordes, conquistas, SEO e celular.

1. **Peça o plano**: `/novo-jogo quero o truco mineiro. faz o plano antes de começar`.
2. **Responda as regras**: é a etapa mais importante, regra errada é o bug mais caro.
3. **Aprove e acompanhe**: regras e testes, servidor, telas, acabamento.
4. **Commit e push**: o Claude só commita quando você pedir.

Uma correção que deve valer para todos os jogos? Peça `atualiza a skill novo-jogo com isso`.

## Produção

```bash
bun run build
bun run start
```

### Docker / Easypanel

Dois serviços, ambos com **contexto de build na raiz do repositório**:

| Serviço | Dockerfile | Porta |
|---|---|---|
| web | `apps/web/Dockerfile` | 3000 |
| ws | `apps/server/Dockerfile` | 3001 |

Variáveis de ambiente (em runtime, sem rebuildar):

| Serviço | Variável | Exemplo |
|---|---|---|
| web | `NEXT_PUBLIC_WS_URL` (ou `WS_URL`) | `wss://ws.seudominio.com` |
| web | `DATABASE_URL` | `postgresql://user:senha@host:5432/mesadejogos` |
| web | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| web | `BETTER_AUTH_URL` | `https://mesadejogos.com` |
| web | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud |
| web | `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord Developer Portal |
| web | `GAME_SECRET` | `openssl rand -hex 32` (o mesmo no `ws`) |
| ws | `GAME_SECRET` | o mesmo do `web` |
| ws | `WEB_URL` | endereço interno do web, ex.: `http://web:3000` |
| ws | `PORT` (opcional) | `3001` |

Sem `NEXT_PUBLIC_WS_URL`, o cliente tenta `ws(s)://<host da página>:3001`.
