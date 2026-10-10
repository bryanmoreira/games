# Build a partir da raiz do monorepo:
#   docker build -f apps/web/Dockerfile -t games-web .

FROM oven/bun:1.3 AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependências (camada em cache enquanto os manifests não mudam)
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
COPY packages/game/package.json packages/game/
RUN bun install --frozen-lockfile --linker=hoisted

COPY tsconfig.base.json ./
COPY packages/game packages/game
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
