# Jogos

Monorepo Bun: `apps/web` (Next.js), `apps/server` (WebSocket em Bun), `packages/game` (regras do Truco Paulista).
Cartas: [Webisso/playing-cards](https://github.com/Webisso/playing-cards) (MIT).

## Desenvolvimento

```bash
bun install
bun run dev     # web :3000, ws :3001
bun test packages/game
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
