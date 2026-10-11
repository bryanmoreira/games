# Build a partir da raiz do monorepo:
#   docker build -f apps/web/Dockerfile -t games-web .

FROM oven/bun:1.3 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependências (camada em cache enquanto os manifests não mudam)
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/batalha-naval/package.json packages/batalha-naval/
COPY packages/codenames/package.json packages/codenames/
COPY packages/connect4/package.json packages/connect4/
COPY packages/game/package.json packages/game/
COPY packages/spider/package.json packages/spider/
COPY packages/stop/package.json packages/stop/
COPY packages/sudoku/package.json packages/sudoku/
RUN bun install --frozen-lockfile --linker=hoisted

COPY tsconfig.base.json ./
COPY packages/batalha-naval packages/batalha-naval
COPY packages/codenames packages/codenames
COPY packages/connect4 packages/connect4
COPY packages/game packages/game
COPY packages/spider packages/spider
COPY packages/stop packages/stop
COPY packages/sudoku packages/sudoku
COPY apps/web apps/web
RUN bun run --cwd apps/web build

FROM oven/bun:1.3-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Saída standalone já contém server.js, node_modules mínimos, estáticos e public/
COPY --from=build --chown=bun:bun /app/apps/web/.next/standalone ./

USER bun
EXPOSE 3000
CMD ["bun", "apps/web/server.js"]
