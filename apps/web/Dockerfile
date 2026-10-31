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
COPY packages/truco/package.json packages/truco/
COPY packages/otrio/package.json packages/otrio/
COPY packages/jogo-da-memoria/package.json packages/jogo-da-memoria/
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
COPY packages/mahjong/package.json packages/mahjong/
COPY packages/quente-ou-frio/package.json packages/quente-ou-frio/
RUN bun install --frozen-lockfile --linker=hoisted

COPY tsconfig.base.json ./
COPY packages/batalha-naval packages/batalha-naval
COPY packages/codenames packages/codenames
COPY packages/connect4 packages/connect4
COPY packages/truco packages/truco
COPY packages/otrio packages/otrio
COPY packages/jogo-da-memoria packages/jogo-da-memoria
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
COPY packages/spider packages/spider
COPY packages/stop packages/stop
COPY packages/sudoku packages/sudoku
COPY packages/verbete packages/verbete
COPY packages/caca-palavras packages/caca-palavras
COPY packages/mahjong packages/mahjong
COPY packages/quente-ou-frio packages/quente-ou-frio
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

# Migrações do banco rodam na subida (prisma migrate deploy)
WORKDIR /migrate
RUN echo '{"private":true}' > package.json && bun add prisma@7.10.0 && chown -R bun:bun /migrate
COPY --chown=bun:bun apps/web/prisma ./prisma
COPY --chown=bun:bun apps/web/prisma.config.ts ./

WORKDIR /app
USER bun
EXPOSE 3000
CMD ["sh", "-c", "cd /migrate && bun x prisma migrate deploy && cd /app && exec bun apps/web/server.js"]
