# Build a partir da raiz do monorepo:
#   docker build -f apps/server/Dockerfile -t games-ws .

FROM oven/bun:1.3 AS build
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/connect4/package.json packages/connect4/
COPY packages/game/package.json packages/game/
COPY packages/spider/package.json packages/spider/
COPY packages/stop/package.json packages/stop/
COPY packages/sudoku/package.json packages/sudoku/
RUN bun install --frozen-lockfile --linker=hoisted

COPY tsconfig.base.json ./
COPY packages/connect4 packages/connect4
COPY packages/game packages/game
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
