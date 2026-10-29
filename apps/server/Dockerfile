# Build a partir da raiz do monorepo:
#   docker build -f apps/server/Dockerfile -t games-ws .

FROM oven/bun:1.3 AS build
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/batalha-naval/package.json packages/batalha-naval/
COPY packages/codenames/package.json packages/codenames/
COPY packages/connect4/package.json packages/connect4/
COPY packages/truco/package.json packages/truco/
COPY packages/otrio/package.json packages/otrio/
COPY packages/jogo-da-velha/package.json packages/jogo-da-velha/
COPY packages/damas/package.json packages/damas/
COPY packages/xadrez/package.json packages/xadrez/
COPY packages/domino/package.json packages/domino/
COPY packages/blackjack/package.json packages/blackjack/
COPY packages/buraco/package.json packages/buraco/
COPY packages/ludo/package.json packages/ludo/
COPY packages/futebol-de-botao/package.json packages/futebol-de-botao/
COPY packages/tijolada/package.json packages/tijolada/
COPY packages/sinuca/package.json packages/sinuca/
COPY packages/spider/package.json packages/spider/
COPY packages/stop/package.json packages/stop/
COPY packages/sudoku/package.json packages/sudoku/
COPY packages/verbete/package.json packages/verbete/
COPY packages/caca-palavras/package.json packages/caca-palavras/
COPY packages/quente-ou-frio/package.json packages/quente-ou-frio/
RUN bun install --frozen-lockfile --linker=hoisted

COPY tsconfig.base.json ./
COPY packages/batalha-naval packages/batalha-naval
COPY packages/codenames packages/codenames
COPY packages/connect4 packages/connect4
COPY packages/truco packages/truco
COPY packages/otrio packages/otrio
COPY packages/jogo-da-velha packages/jogo-da-velha
COPY packages/damas packages/damas
COPY packages/xadrez packages/xadrez
COPY packages/domino packages/domino
COPY packages/blackjack packages/blackjack
COPY packages/buraco packages/buraco
COPY packages/ludo packages/ludo
COPY packages/futebol-de-botao packages/futebol-de-botao
COPY packages/tijolada packages/tijolada
COPY packages/sinuca packages/sinuca
COPY packages/stop packages/stop
COPY apps/server apps/server
RUN bun run --cwd apps/server build

FROM oven/bun:1.3-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001

# Servidor empacotado em um único arquivo, sem node_modules
COPY --from=build --chown=bun:bun /app/apps/server/dist/index.js ./index.js

USER bun
EXPOSE 3001
CMD ["bun", "index.js"]
