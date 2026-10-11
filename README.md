# Mesa de Jogos

[mesadejogos.com](https://mesadejogos.com) — site com vários jogos de cartas e de mesa. Hoje: **Truco Paulista** (`/truco-paulista`), **Paciência Spider** (`/paciencia-spider`), **Sudoku** (`/sudoku`), **Connect 4** (`/connect-4`), **Stop** (`/stop`) e **Batalha Naval** (`/batalha-naval`). Spider e Sudoku rodam só no navegador.

Monorepo Bun: `apps/web` (Next.js), `apps/server` (WebSocket em Bun), `packages/game` (regras do Truco Paulista), `packages/spider` (regras da Paciência Spider), `packages/sudoku` (gerador, solver lógico e regras do Sudoku).
Cartas: [Webisso/playing-cards](https://github.com/Webisso/playing-cards) (MIT).

## Montando um jogo novo (com Claude Code)

O repositório tem a skill de projeto **`novo-jogo`** ([.claude/skills/novo-jogo](.claude/skills/novo-jogo/SKILL.md)), que ensina o Claude a montar jogos seguindo os padrões do Truco Paulista: regras e IA testadas, salas multiplayer com escolha de time, mesa, distribuição animada, sons, dicas no hover, "Como jogar", visual, celular e deploy. Ela também guarda as preferências do projeto (pouco texto na tela, ícones SVG, sons sem voz, commit só quando pedido).

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

Quando uma correção deve valer para todos os jogos (um gosto visual, uma regra de trabalho, uma armadilha nova), peça: `atualiza a skill novo-jogo com isso`. A skill fica em `.claude/skills/novo-jogo/`: o `SKILL.md` tem o fluxo e o checklist, e `references/` tem os detalhes (arquitetura, UI, som, "Como jogar", verificação).

## Desenvolvimento

```bash
bun install
bun run dev     # web :3000, ws :3001
bun test packages
```

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
| ws | `PORT` (opcional) | `3001` |

Sem `NEXT_PUBLIC_WS_URL`, o cliente tenta `ws(s)://<host da página>:3001`.
