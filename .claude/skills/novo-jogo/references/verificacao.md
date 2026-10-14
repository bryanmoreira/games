# Verificação e armadilhas conhecidas

## Sumário
- Comandos
- Roteiro no navegador
- Técnicas de teste no navegador
- Armadilhas do ambiente (Windows/OneDrive)
- Armadilhas de React/CSS/Next já vividas

## Comandos

```bash
bun test packages/<slug>
bun run test                                        # tudo: jogos, servidor de salas e site
node_modules/.bin/tsc.exe --noEmit -p apps/web      # Windows: tsc.exe na raiz
node_modules/.bin/tsc.exe -p apps/server
bun run dev                                          # ou os servidores "server"/"web" do .claude/launch.json
docker build -f apps/web/Dockerfile -t games-web .   # só se mudou dependências/build
docker build -f apps/server/Dockerfile -t games-ws .
```

Para smoke test das imagens: `docker run -p 3300:3000 -e NEXT_PUBLIC_WS_URL=ws://localhost:3301 games-web` e `docker run -p 3301:3001 games-ws`; depois remova os containers de teste.

## Roteiro no navegador

Use o navegador embutido (servidores do `.claude/launch.json`: `server` na 3001, `web` na 3000).

1. Hub → card do jogo → página do jogo → "Como jogar" (página) → voltar.
2. Solo: a partida inicia com a animação de distribuição, as IAs jogam e respondem, o placar sobe, o fim de jogo aparece e o "De novo" reinicia.
3. Multiplayer: crie a sala numa aba e entre pelo código em outra (cada aba é um jogador, porque o token fica em `sessionStorage`; mude o nome com `localStorage.setItem('truco.name', ...)` antes de entrar). Teste o mesmo time e times opostos, IA no lugar vazio, aposta entre humanos (a IA parceira **não** pode responder no lugar do humano) e recarregar no meio (reconexão).
4. Recursos: sons (instrumentados), mudo, dicas no hover e o botão de desligar, modal "?" (X / Esc / clique fora), carta coberta com flip.
5. Celular: `resize_window` mobile (375) e 360×780. Sem rolagem horizontal, cabeçalho cabendo, nada sobreposto. Volte para `desktop` no fim.
6. Console sem erros novos (erros de HMR durante restart do dev server podem ser ignorados).

## Técnicas de teste no navegador

- **Jogar automatizado** com `javascript_tool`: um laço que clica `QUERO`/`CORRO`/`button.turn-card`/`De novo` a cada 400 ms. Serve para passar por várias mãos e checar estados (ex.: quantos elementos `.fly-card` existem, se houve erro no console).
- **Esperar um cenário raro** (ex.: manilha na mão): o mesmo laço, parando quando a condição aparecer no DOM.
- **Cenários de placar** (mão de 11, fim de jogo): comando de debug temporário no servidor + uma conexão WS extra no console com o mesmo token, depois recarregar a aba (a conexão extra derruba a da aba com código 4000). Remova o comando depois.
- **Medir em vez de olhar**: `getBoundingClientRect` para checar sobreposição (avatar × placar, painel × carta jogada), `header.scrollWidth` para checar se o cabeçalho estoura, centros verticais para alinhamento.
- **Portas ocupadas por outra conversa**: se a 3000/3001 já são de outro chat (o mesmo código, com recarga), suba só o `server` (o preview escolhe outra porta, ex.: 3002), abra `http://localhost:3000/...` e, em cada aba, rode `window.__ENV__ = { WS_URL: 'ws://localhost:3002' }`: a próxima reconexão do socket usa esse endereço. Recarregar a aba apaga o ajuste.
- **Hover em React**: eventos sintéticos `mouseover`/`mouseout` com `bubbles: true` e `relatedTarget` disparam `onMouseEnter/Leave`. A ferramenta de hover por coordenada às vezes pega a carta vizinha, porque a mão se mexe ao levantar.
- O painel do navegador pode estar oculto ou sendo redimensionado pelo usuário: screenshots falham ou mudam de escala. Prefira `get_page_text`/`javascript_tool`, tire um screenshot novo antes de clicar por coordenada, e lembre que o usuário pode estar jogando no mesmo painel ao mesmo tempo.

## Armadilhas do ambiente (Windows/OneDrive)

- `git mv`/renomear pastas de rota falha com "Permission denied" enquanto o `next dev` roda: pare o servidor `web`, mova e suba de novo.
- Depois de renomear rotas, o `tsc` acusa erros em `.next/dev/types/validator.ts`: apague `apps/web/.next` (com o dev parado) e rode o typecheck de novo.
- `python3` pode abrir o stub da Microsoft Store e travar: para scripts use `bun -e '...'` (Node API disponível).
- Bun Shell nos scripts do `package.json`: `cp -r` não existe, use `cp -R`.
- `bun add` pode falhar com `EPERM` no OneDrive: rode de novo. Fixe `typescript@5` (o Next ainda não aceita o TS 7).

## Armadilhas de React/CSS/Next já vividas

- **Chaves duplicadas entre irmãos**: elementos com `key` numérica no mesmo pai (ex.: `DealAnimation key={hand}` e `ShoutBubble key={id}`) colidiram e o React deixou elementos órfãos na tela. Use prefixo: ``key={`deal-${hand}`}``.
- **Animação com `fill-mode: both`** mantém o `transform` final e anula `hover:-translate-y-*`. Use `backwards` em animações de entrada.
- **`ring` em carta** some porque a carta já tem `box-shadow`: use `outline`.
- **`filter` no próprio elemento com `preserve-3d`** achata o flip 3D: aplique o `drop-shadow` num wrapper por fora (como `.turn-card > *` faz com o `FlipCard`).
- **`NEXT_PUBLIC_*` é embutido no build**: para configurar em runtime, leia no servidor (`await connection()` no layout, chave dinâmica) e injete em `window.__ENV__`.
- **`confirm()`/`alert()` nativos**: no navegador embutido do app eles retornam na hora (`confirm` dá `false`) sem mostrar nada, e o botão parece morto. Confirme na própria página (ex.: o botão vira ✕ + "Começar outra").
- **Estado preso após desmontar**: `mouseleave` não dispara quando o elemento sai do DOM (carta jogada); derive o estado da view atual.
- **StrictMode** monta/desmonta efeitos em dev: timers de animação precisam ser limpos e o guard de "já iniciei" resetado no cleanup, senão a animação trava depois do remount.
