---
name: post-blog
description: Escreve e publica posts do blog do Mesa de Jogos (mesadejogos.com) no estilo da casa, com SEO, GEO (respostas citáveis por IAs como ChatGPT, Gemini e Perplexity) e AEO (respostas diretas para featured snippets e "As pessoas também perguntam") caprichados — pesquisa de palavra-chave e intenção, estrutura, regras reais do jogo tiradas do código, prints do site, capa, links internos, perguntas frequentes e envio pela API do blog como rascunho. Use sempre que o usuário pedir um post, artigo, texto ou pauta para o blog (ex.: "escreve um post sobre regras do ludo", "faz um artigo de dicas de xadrez", "quero ranquear para 'como jogar buraco'", "cria 5 posts de truco", "revisa o SEO do post X"), mesmo que não fale em "skill", SEO ou API.
---

# Post do blog do Mesa de Jogos

O blog (`/blog`) existe para trazer gente de busca orgânica para os jogos. Cada post responde uma pergunta real de quem procura sobre um jogo de cartas ou de mesa e termina levando a pessoa para jogar no site. Os posts ficam no banco (`blog_post`) e são criados pela API com chave ou pelo editor em `/admin/blog`.

Leia esta skill inteira antes de escrever. O exemplo completo e comentado está em `references/exemplo.md`.

## Como o usuário trabalha

- Tudo em **português do Brasil**, inclusive as respostas.
- Decisões de pauta (palavra-chave, ângulo, quantos posts) vão **uma pergunta por vez**, com a caixinha de opções (AskUserQuestion), e só quando você não conseguir decidir sozinho com a pesquisa.
- **Nunca citar outro site ou jogo comercial em que um jogo do site se inspira.** Nem no texto, nem nas palavras-chave, nem no slug. Use os nomes do próprio site (ex.: "Verbete", "Tijolada", "Caça-Palavras").
- **Publicar é ação pública.** Envie sempre como rascunho (`"draft": false` só quando o usuário mandar publicar) e mande o link da prévia no admin.

## Fluxo

1. **Entenda o pedido.** Qual jogo (slug em `apps/web/lib/seo.ts`, `GAMES`, ou `home` para o site todo) e qual dúvida o leitor tem.
2. **Pesquise a palavra-chave e a intenção** (seção abaixo). Escolha **uma** palavra-chave principal e 3–8 secundárias.
3. **Evite canibalização.** Liste os posts existentes (`GET /api/v1/blog/posts`) e confira se algum já mira a mesma palavra-chave. Se sim, proponha atualizar aquele post em vez de criar outro.
4. **Junte os fatos do site.** As regras de que o post fala têm que bater com o jogo daqui. Leia a página "Como jogar" (`apps/web/app/<jogo>/como-jogar`), as regras em `packages/<jogo>/src` e o `GAMES` em `lib/seo.ts` (jogadores, modos, FAQ). **Nunca invente regra, número ou recurso.** Na dúvida, abra o jogo no navegador.
5. **Escreva** no formato e no estilo abaixo.
6. **Faça as imagens:** capa e 1–3 prints reais do jogo (seção Imagens).
7. **Passe o checklist** do fim da skill.
8. **Envie como rascunho** pela API e mande ao usuário o link `/admin/blog/<id>`. A aba **Prévia** do editor mostra o post como vai ficar.

## Pesquisa de palavra-chave e intenção

Se houver busca na web (WebSearch), use antes de escrever:

- Pesquise a palavra-chave candidata e 2–3 variações ("como jogar X", "regras do X", "X online", "dicas de X", "X ou Y diferença").
- Anote dos primeiros resultados: **o tipo de página que ranqueia** (lista, passo a passo, comparação, guia), os **subtemas que todos cobrem** (o post precisa cobrir também) e o que **ninguém cobre bem** (é o diferencial).
- Colete as perguntas de "As pessoas também perguntam" e das buscas relacionadas: viram H2 em forma de pergunta ou entram nas Perguntas frequentes.
- Prefira cauda longa com intenção clara ("como ganhar no buraco em dupla") a termos genéricos e disputados ("buraco").

Sem busca na web, use o bom senso sobre como as pessoas buscam aquilo no Google, em português do Brasil, e diga ao usuário que a pesquisa não foi feita.

**Tipos de post que funcionam aqui** (e o formato de cada um):

| Intenção | Exemplo | Formato |
|---|---|---|
| Aprender as regras | "regras do ludo" | resumo das regras + passo a passo de uma partida + link para "Como jogar" |
| Melhorar | "dicas de xadrez para iniciantes" | lista numerada de dicas, cada uma com o porquê |
| Comparar | "truco paulista x mineiro" | o que muda, ponto a ponto, e qual o site usa |
| Decidir onde jogar | "jogos online com amigos" | lista de jogos com link para cada um |
| Resolver um problema | "como convidar amigos pelo WhatsApp" | passos curtos com prints |

## Formato do post

Campos do post (a API valida):

| Campo | Regra |
|---|---|
| `title` | Até 60 caracteres para não cortar no Google (a API aceita até 140). Palavra-chave **no começo**, frase natural, sem caixa alta e sem clickbait. Ex.: "Regras do Ludo: como jogar, passo a passo". |
| `slug` | A palavra-chave, curta, sem acento e sem ano: `regras-do-ludo`. Nunca muda depois de publicado. |
| `description` | 140–160 caracteres (máx. 300). Responde a busca e promete o que o post entrega; tem a palavra-chave. Vira o resumo no Google e na lista do blog. |
| `game` | Slug do jogo em `GAMES` ou `home`. Define o botão "Jogar agora" e a arte da prévia de link. |
| `keyword` | A palavra-chave principal, em minúsculas. |
| `date` | AAAA-MM-DD. Vazio = hoje (Brasília). |
| `cover`, `coverAlt` | Caminho devolvido pelo envio da imagem e uma descrição concreta dela. |
| `body` | Markdown (abaixo). **Não repita o título como `#`**: a página já mostra o título como H1. |

### Markdown aceito

O blog tem um Markdown mínimo (`components/blog/Markdown.tsx`). Fora disto, o texto aparece cru:

- `## Título` e `### Subtítulo` (não existe `#` nem `####`). O título pode ter o parágrafo na linha de baixo.
- Parágrafos separados por **linha em branco**.
- Listas `- item` ou `1. item`, com todas as linhas do bloco no mesmo formato.
- Citação `> texto` (todas as linhas do bloco começando com `>`).
- `**negrito**`, `*itálico*`, `[link](/caminho)`. Links que começam com `/` são internos; os outros abrem em nova aba.
- Imagem **sozinha num bloco**: `![descrição](/blog/imagens/…png "legenda opcional")`.
- **Não existe:** tabela, código, HTML, imagem no meio do parágrafo, lista dentro de lista, link em título.

## Estilo da casa

Siga os posts que já existem (`GET /api/v1/blog/posts`):

- **Abertura de 1–2 frases que já responde.** Nada de "Neste artigo você vai ver…". Ex.: "Truco é jogo de leitura: de cartas, de adversários e do parceiro. Veja o que ajuda."
- **Frases curtas, voz ativa, segunda pessoa ("você")**, tom de quem joga e explica para um amigo. Sem gíria forçada e sem exagero.
- **H2 que dizem o que vem** e, nos posts de dicas, numerados ("## 3. Jogue a primeira vaza com intenção").
- **Listas com rótulo em negrito**: `- **Curingas:** o coringa e o 2, no máximo um por jogo.`
- **Números concretos**: 108 cartas, 11 cartas por jogador, canastra limpa vale 200.
- **Uma seção sobre o próprio site** quando o tema tem variações: "## Qual versão o Mesa de Jogos usa?" ou "## Como é o X do Mesa de Jogos", com as regras daqui em lista.
- **Final com chamada para jogar**: H2 curto ("## Jogue agora" ou "## Treine agora"), uma frase sobre chamar os amigos pelo WhatsApp ou jogar contra o computador, e o link `[Jogar X grátis](/x)`.
- **Sem travessão (—) no texto**: use dois-pontos, vírgula ou ponto.

## SEO

- A palavra-chave principal aparece no **título**, no **slug**, na **descrição**, **nas primeiras 100 palavras**, em **pelo menos um H2** e no **alt de uma imagem**. Sem repetir à força: use as secundárias e sinônimos no resto.
- **Tamanho:** o necessário para cobrir a intenção melhor que os concorrentes. Em geral, 700–1.300 palavras para guias e comparações e 500–900 para listas curtas. Os primeiros posts tinham 250–470 palavras: ao atualizar um deles, aprofunde.
- **Links internos (3–6):** a página do jogo (`/x`), o "Como jogar" (`/x/como-jogar`), o desafio diário quando o jogo tiver (`/x/diario`, ver `DAILY_SEO` em `lib/seo.ts`) e 1–2 posts relacionados. Texto do link descritivo ("regras completas do Buraco"), nunca "clique aqui".
- **Depois de publicar**, sugira ao usuário acrescentar um link para o post novo em 1–2 posts antigos do mesmo jogo (PATCH no `body`).
- **Link externo** só para fonte com autoridade (federação, regra oficial) e só se agregar.
- **Experiência real (E-E-A-T):** prints do jogo daqui, exemplos de jogadas, situações de partida. É o que diferencia de texto genérico.
- **O site já cuida da parte técnica:** canonical, Open Graph, prévia de link com a arte do jogo, JSON-LD `BlogPosting` com `datePublished` e `dateModified`, breadcrumb e sitemap (só posts publicados). Não precisa fazer nada disso.

## AEO: respostas diretas

O objetivo é virar o trecho em destaque do Google e a resposta de assistentes de voz:

- **Logo depois do título, responda a pergunta principal em 40–60 palavras**, numa frase que se sustente sozinha. Ex.: "No buraco, a canastra é um jogo de 7 ou mais cartas. A limpa, sem curinga, vale 200 pontos; a suja, com curinga, vale 100; e a real, do ás ao rei sem curinga, vale 500."
- **H2 em forma de pergunta** quando for o que as pessoas buscam ("## Quantas cartas cada jogador recebe?"), com a resposta na **primeira frase** logo abaixo.
- **Passo a passo em lista numerada** e **definições em uma frase** ("Manilha é a carta mais forte da mão, definida pelo vira.").
- **Feche com `## Perguntas frequentes`** (3–5 perguntas do "As pessoas também perguntam"), cada uma como `### Pergunta?` seguida de 1–3 frases. Não repita perguntas que o post já respondeu num H2.

## GEO: ser citado por IAs

Modelos como ChatGPT, Gemini e Perplexity citam trechos claros, factuais e que se entendem sem o resto da página:

- **Frases autossuficientes:** troque "ele vale 200" por "a canastra limpa vale 200 pontos". Diga o nome do jogo e do conceito em vez de pronome.
- **Fatos com número e condição**, um por frase.
- **Cite a marca de forma consistente**: "Mesa de Jogos" (e `mesadejogos.com` no máximo uma vez), sempre ligada ao que ela oferece: "No Mesa de Jogos você joga Buraco em duplas ou no 1×1, grátis e sem cadastro".
- **Comparações ponto a ponto em lista** ("- **Manilhas:** no paulista mudam a cada mão; no mineiro são fixas.").
- **Um bloco de resumo** em citação logo após a abertura, nos guias longos: `> **Resumo:** …` com 2–3 fatos-chave.
- **Nada de conteúdo vago, opinião sem base ou números inventados.** Um único dado errado tira a confiança no texto todo.

## Imagens

Formato aceito: PNG, JPEG ou WebP até 5 MB. Prefira PNG com poucas cores, com até ~300 KB.

- **Capa (obrigatória):** 1200×630. Duas opções:
  1. **Print do jogo** no navegador embutido (`localhost:3000`), com a janela em 1200×630 (`resize_window` com largura e altura). Mostre um momento que ilustre o tema (ex.: uma canastra na mesa).
  2. **Arte do jogo no feltro**, igual às capas antigas: crie uma rota temporária `apps/web/app/capa-tmp/route.ts` com `export const GET = () => blogCoverImage(["<slug>"])` (de `lib/og.tsx`, aceita 1 a 3 jogos), salve com `curl http://localhost:3000/capa-tmp -o capa.png` e **apague a rota** em seguida.
- **Prints no texto (1–3):** telas reais do jogo mostrando o que o parágrafo explica (a mão, a jogada, a pontuação). Recorte só o que interessa. Prints com até 800px de largura aparecem estreitos e centralizados (bom para tela de celular); os mais largos ocupam a coluna toda.
- **Alt** descreve o que se vê, com detalhes concretos e a palavra-chave quando couber naturalmente ("Três canastras de copas: limpa de 3 a 9, suja com um coringa no lugar do 6 e real do ás ao rei"). **Legenda** curta diz o que concluir da imagem.
- Envie cada imagem com `POST /images` (abaixo) e use o `src`/`markdown` que voltar. Não use `/blog/x.png` para imagens novas: arquivos em `public` só existem depois de um deploy.

## Enviar pela API

A chave é criada em `/admin/blog` > "Chaves da API". Peça ao usuário para deixá-la na variável `MESA_BLOG_API_KEY` (nunca no repositório nem no chat). Base: `https://mesadejogos.com/api/v1/blog`, ou `http://localhost:3000/api/v1/blog` para testar no banco local com uma chave local.

```bash
API=https://mesadejogos.com/api/v1/blog
AUTH="Authorization: Bearer $MESA_BLOG_API_KEY"

# posts existentes (checar canibalização e achar links internos)
curl -s $API/posts -H "$AUTH"

# imagem: devolve { src, width, height, markdown }
curl -s -X POST "$API/images?alt=Descricao%20da%20imagem" -H "$AUTH" -H "Content-Type: image/png" --data-binary @capa.png

# criar como rascunho: monte o JSON num arquivo (no Windows evita problema de aspas e acentos)
curl -s -X POST $API/posts -H "$AUTH" -H "Content-Type: application/json; charset=utf-8" --data-binary @post.json

# editar só alguns campos / publicar quando o usuário mandar
curl -s -X PATCH $API/posts/<slug> -H "$AUTH" -H "Content-Type: application/json" -d '{"draft":false}'
```

Os arquivos de trabalho (`post.json`, imagens) ficam na pasta temporária da sessão, não no repositório. Sem `draft`, o post é criado como rascunho. Se a API devolver `400`, a resposta lista `{ field, message }` de cada problema: corrija e envie de novo. `409` = slug já existe.

## Checklist antes de enviar

- [ ] Palavra-chave escolhida pela intenção, sem canibalizar outro post.
- [ ] Título até 60 caracteres, com a palavra-chave no começo; descrição de 140–160 caracteres.
- [ ] Abertura responde a pergunta em 40–60 palavras; nada de "neste artigo".
- [ ] Todas as regras e números conferidos no código ou no jogo.
- [ ] H2 claros (perguntas onde as pessoas perguntam); nenhum `#` no corpo.
- [ ] Seção "Qual versão o Mesa de Jogos usa?" quando há variações de regra.
- [ ] 3–6 links internos com texto descritivo; CTA final `[Jogar X grátis](/x)`.
- [ ] `## Perguntas frequentes` com 3–5 `###`.
- [ ] Capa 1200×630 e 1–3 prints reais, todos com alt descritivo.
- [ ] Só o Markdown aceito; sem travessão; sem citar sites ou jogos comerciais de inspiração.
- [ ] Enviado como rascunho; link `/admin/blog/<id>` passado ao usuário para conferir na Prévia.

## Atualizar um post existente

Para melhorar um post que não ranqueia: refaça a pesquisa, compare com os primeiros resultados, aprofunde as seções fracas, acrescente a resposta direta, as perguntas frequentes e os prints, e envie com `PATCH /posts/<slug>` (mesmo slug, para não perder o que já foi indexado). Não mude o `date` à toa: a data de atualização já vai para o Google pelo `dateModified`.
