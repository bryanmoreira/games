# Mesa de Jogos

[mesadejogos.com](https://mesadejogos.com) — site com vários jogos de cartas e de mesa. Hoje: **Truco Paulista** (`/truco-paulista`), **Paciência Spider** (`/paciencia-spider`), **Sudoku** (`/sudoku`), **Connect 4** (`/connect-4`), **Stop** (`/stop`) e **Batalha Naval** (`/batalha-naval`). Spider e Sudoku rodam só no navegador.

Monorepo Bun: `apps/web` (Next.js), `apps/server` (WebSocket em Bun), `packages/game` (regras do Truco Paulista), `packages/spider` (regras da Paciência Spider), `packages/sudoku` (gerador, solver lógico e regras do Sudoku).
Cartas: [Webisso/playing-cards](https://github.com/Webisso/playing-cards) (MIT).

## Montando um jogo novo (com Claude Code)

O repositório tem a skill de projeto **`novo-jogo`** ([.claude/skills/novo-jogo](.claude/skills/novo-jogo/SKILL.md)), que ensina o Claude a montar jogos seguindo os padrões do Truco Paulista: regras e IA testadas, salas multiplayer com escolha de time, mesa, distribuição animada, sons, dicas no hover, "Como jogar", recordes e conquistas no perfil, visual, celular e deploy. Ela também guarda as preferências do projeto (pouco texto na tela, ícones SVG, sons sem voz, commit só quando pedido).

### Como chamar

- **Pedido normal**: "quero montar o truco mineiro no site". A skill entra sozinha quando o pedido é criar/montar/adicionar um jogo.
- **Pelo nome**: comece com `/novo-jogo`, por exemplo `/novo-jogo monta o truco mineiro`. Garante que ela seja usada.

Funciona em qualquer sessão do Claude Code aberta na pasta do repositório.

### Fluxo

1. **Peça o plano primeiro**: `/novo-jogo quero o truco mineiro do lado do paulista. faz o plano antes de começar`. O Claude lê o código, propõe a arquitetura e devolve as perguntas de regra.
2. **Responda as regras**: é a etapa mais importante (regra errada é o bug mais caro). Pode ser direto: "escada 2/4/8/10/12, mão de 10 vale 4, sem sinais por enquanto". Se não souber algum detalhe, diga "usa o padrão mais comum".
3. **Aprove ou ajuste o plano**: "pode começar", ou "não quero card novo, substitui o Em breve".
4. **Implementação por etapas**: regras e testes → servidor → telas → acabamento (som, dicas, distribuição, "Como jogar"). O Claude testa no navegador (solo, multiplayer com 2 abas, celular). Para acompanhar de perto: "faz só a engine e os testes e me mostra".
5. **Revise e peça ajustes**: selecione o elemento no navegador e diga o que mudar ("o placar tá desalinhado").
6. **Commit e push**: peça "faz o commit e push". O Claude não commita sozinho.
7. **Deploy**: no Easypanel, refaça o deploy dos serviços `web` e `ws`. Um jogo novo normalmente não precisa de variável nova.

### Exemplos de prompt

| Situação | Prompt |
|---|---|
| Jogo novo completo | `/novo-jogo quero montar fodinha, faz o plano antes` |
| Variante de um jogo existente | `/novo-jogo monta o truco mineiro reaproveitando o paulista` |
| Só uma parte | `/novo-jogo faz só a engine e os testes do buraco, sem tela ainda` |
| Recurso num jogo existente | `adiciona dicas no hover e som no truco mineiro igual ao paulista` |
| Ajuste visual | selecione o elemento e escreva o que não gostou |

### Mantendo a skill atualizada

Quando uma correção deve valer para todos os jogos (um gosto visual, uma regra de trabalho, uma armadilha nova), peça: `atualiza a skill novo-jogo com isso`. A skill fica em `.claude/skills/novo-jogo/`: o `SKILL.md` tem o fluxo e o checklist, e `references/` tem os detalhes (arquitetura, UI, som, "Como jogar", SEO e prévia de link, recordes e conquistas, verificação).

## Desenvolvimento

```bash
bun install
cp apps/web/.env.example apps/web/.env   # preencha as variáveis (Postgres do seu PC)
bun run --cwd apps/web db:migrate        # cria/atualiza as tabelas
bun run dev     # web :3000, ws :3001
bun run test    # regras dos jogos, servidor de salas e site
```

### Contas (login com Google)

[Better Auth](https://better-auth.com) + Prisma + Postgres. Configuração em `apps/web/lib/auth.ts`, schema em `apps/web/prisma/schema.prisma`. Telas: `/login`, `/perfil` (área do jogador, com sidebar) e `/perfil/<username>` (perfil público, sem e-mail).

- **Nome de usuário**: toda conta nova ganha um a partir do nome (`joaosilva`, `joaosilva2`…) e o jogador troca em Perfil → Conta. Regras e palavras reservadas em `lib/username.ts` — uma rota nova dentro de `/perfil` precisa entrar na lista de reservadas.

- **Novo provedor** (GitHub, Discord…): habilite em `socialProviders` no `lib/auth.ts` e adicione em `SOCIAL_PROVIDERS` (`components/auth/providers.tsx`).
- **E-mail e senha**: ligue `emailAndPassword` no `lib/auth.ts` e coloque o formulário em `components/auth/LoginOptions.tsx`, acima dos botões.
- **Recordes e conquistas**: cada partida terminada vira uma linha em `game_result` (`lib/stats/`). Sudoku e Spider mandam pelo navegador (`/api/results`); os jogos online e contra IA são registrados pelo servidor de salas, que sabe quem está logado por um ticket assinado com `GAME_SECRET` e envia para `/api/internal/results`. Quem sai no meio de uma partida online leva derrota. Conquistas novas: `lib/stats/achievements.ts`.
- Para rodar local, copie também `apps/server/.env.example` para `apps/server/.env` com o mesmo `GAME_SECRET` do site.
- Para mandar alguém logar e voltar: `loginHref("/caminho")` (`lib/login.ts`).

- No Google Cloud, em **Credenciais > ID do cliente OAuth**, adicione os URIs de redirecionamento:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://mesadejogos.com/api/auth/callback/google`
- No [Discord Developer Portal](https://discord.com/developers/applications), em **OAuth2 > Redirects**, o mesmo com `/callback/discord`.
- Mesmo e-mail em Google e Discord vira uma conta só (`accountLinking` no `lib/auth.ts`).
- Mudou o schema? `bun run --cwd apps/web db:migrate` cria a migração. Em produção ela roda sozinha na subida do container (`prisma migrate deploy`).
- No servidor: `const session = await auth.api.getSession({ headers: await headers() })`. No cliente: `authClient.useSession()`.

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

Variáveis de ambiente (runtime, sem precisar rebuildar):

| Serviço | Variável | Exemplo |
|---|---|---|
| web | `NEXT_PUBLIC_WS_URL` (ou `WS_URL`) | `wss://ws.seudominio.com` |
| web | `DATABASE_URL` | `postgresql://user:senha@host:5432/mesadejogos` |
| web | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| web | `BETTER_AUTH_URL` | `https://mesadejogos.com` |
| web | `GOOGLE_CLIENT_ID` | do Google Cloud |
| web | `GOOGLE_CLIENT_SECRET` | do Google Cloud |
| web | `DISCORD_CLIENT_ID` | do Discord Developer Portal |
| web | `DISCORD_CLIENT_SECRET` | do Discord Developer Portal |
| web | `GAME_SECRET` | `openssl rand -hex 32` (o mesmo no `ws`) |
| ws | `GAME_SECRET` | o mesmo do `web` |
| ws | `WEB_URL` | endereço interno do serviço web, ex.: `http://web:3000` |
| ws | `PORT` (opcional) | `3001` |

Sem `NEXT_PUBLIC_WS_URL`, o cliente tenta `ws(s)://<host da página>:3001`.
