# Truco Paulista

Next.js (web) + Bun WebSocket (server). Cartas: [Webisso/playing-cards](https://github.com/Webisso/playing-cards) (MIT).

```bash
bun install
bun run cards   # baixa as 40 cartas para apps/web/public/cards
bun run dev     # web :3000, ws :3001
bun test packages/game
```

Para jogar na rede local, abra `http://<seu-ip>:3000`. Para outro host de WS, defina `NEXT_PUBLIC_WS_URL`.
