# SEO, GEO, prévia de link e convite

O site é **Mesa de Jogos** (`https://mesadejogos.com`). Todo jogo novo entra nas buscas, nas respostas de IA e nas prévias de link do mesmo jeito que os outros. Quase tudo sai de uma lista só: `GAMES` em `apps/web/lib/seo.ts`.

## 1. Entrada em `lib/seo.ts`

Acrescente um objeto em `GAMES` (a ordem da lista é a ordem no sitemap, no `llms.txt` e nos links "Como jogar" da home):

| Campo | Para quê | Exemplo (Truco) |
|---|---|---|
| `slug`, `path` | igual à rota do jogo | `"truco-paulista"`, `"/truco-paulista"` |
| `name` | nome curto (breadcrumb, links, llms.txt) | `"Truco Paulista"` |
| `title` | título da aba e do Google; o layout raiz acrescenta " · Mesa de Jogos" | `"Truco Paulista Online Grátis"` |
| `description` | meta description, ~150 caracteres, com o termo que as pessoas buscam | "Jogue Truco Paulista online grátis: crie uma sala…" |
| `tagline` | frase curta visível sob o título da página do jogo e na prévia | "Truco em duplas, online com amigos ou contra o computador." |
| `keywords` | termos de busca em português | `["truco online", "jogar truco online grátis", …]` |
| `genre`, `players`, `modes` | dados estruturados e llms.txt | `{ min: 2, max: 4 }` |
| `howTo` | título e descrição da página "Como jogar" | "Como jogar Truco Paulista: regras, manilhas e apostas" |
| `faq` | 3 a 5 perguntas e respostas da página "Como jogar" | "O que são as manilhas?" |

**Só escreva no FAQ e nas descrições o que o código faz.** Confira no código antes de afirmar (número de jogadores, se tem IA, se tem desfazer, regra de pontuação). Uma resposta errada é citada por buscador e por IA.

Com a entrada pronta, `sitemap.xml`, `llms.txt`, `llms-full.txt` e a lista "Como jogar" da home já incluem o jogo, sem mexer em mais nada.

## 2. Arquivos do jogo

- `app/<slug>/layout.tsx`: `metadata = gameMetadata("<slug>")` e `<JsonLd data={gameLd("<slug>")} />` antes de `children` (copie de `app/truco-paulista/layout.tsx`).
- `app/<slug>/page.tsx`: `<GameIntro slug="<slug>" />` logo depois do `</h1>`.
- `app/<slug>/como-jogar/page.tsx`: `metadata = howToMetadata("<slug>")`, `<JsonLd data={howToLd("<slug>")} />` no início do `<main>` e `<GameFaq slug="<slug>" />` depois do conteúdo de regras.
- Telas que não devem ir para o Google ganham um `layout.tsx` com `metadata = noindex`: `app/<slug>/sala/layout.tsx` (jogo online) ou `app/<slug>/jogo/layout.tsx` (jogo de um jogador só).

## 3. Prévia de link (Open Graph)

Cada jogo tem uma imagem de 1200×630 que aparece ao colar o link no WhatsApp, no Discord e nas redes. As salas herdam a imagem do jogo, então o convite mostra a arte certa.

- Em `lib/og.tsx`: acrescente o título em duas linhas em `TITLES` (igual ao card da home, ex.: `["BATALHA", "NAVAL"]`) e um `case "<slug>"` em `art()` com a arte do jogo, ocupando no máximo ~460×460.
- Crie `app/<slug>/opengraph-image.tsx` copiando o de outro jogo (10 linhas, só troca o slug).
- A imagem é gerada pelo Satori (`next/og`), que tem limitações: **toda `div` com mais de um filho precisa de `display: "flex"`**, só estilo inline (sem Tailwind), imagens como data URL (as cartas são lidas de `public/cards` por `card()`), e `transform: rotate(...)` funciona.
- Visual fixo: mesa verde com borda de madeira, título em Bungee dourado, `tagline` em Inter e o selo verde-escuro **só com "mesadejogos.com"** (o usuário pediu para tirar "grátis" e "sem cadastro" da imagem).
- Confira a imagem antes de entregar: `curl -o /tmp/x.png localhost:3000/<slug>/opengraph-image` e abra o PNG. Procure texto sobreposto, título repetido na arte (no Stop, a arte com "STOP" duplicava o título e virou letra sorteada com folha de respostas) e quebra de linha no selo.

## 4. Convite pelo WhatsApp (só jogos online)

O botão "Convidar" fica no `Lobby` e já aparece em toda sala. Para um jogo online novo, acrescente a chamada da mensagem em `INVITE` (`components/ui/Lobby.tsx`). O `Record<GameId, string>` faz o typecheck falhar se faltar. Exemplo: `"truco-paulista": "Bora jogar um truco? 🃏"`.

**Jogo de um jogador só não tem botão de convite**: o usuário achou que não faz sentido.

O link enviado leva `utm_source=whatsapp` e o clique gera o evento `convite-whatsapp` no Umami, com o jogo como propriedade.

## 5. Verificação

- `curl localhost:3000/<slug>` e `/<slug>/como-jogar`: `<title>`, `<link rel="canonical">`, `og:image` apontando para `/<slug>/opengraph-image` e os blocos `application/ld+json`.
- `curl localhost:3000/<slug>/sala/ABCD` (ou `/jogo`): `<meta name="robots" content="noindex, nofollow">`.
- `sitemap.xml` e `llms.txt` listam o jogo.
- O build de produção lista `/<slug>/opengraph-image` como estático (○).
