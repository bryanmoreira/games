import path from "node:path";
import type { NextConfig } from "next";

const root = path.resolve(process.cwd(), "../..");

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  turbopack: { root },
  experimental: { agentUpgrade: "security" },
  // vocabulário e vetores do Quente ou Frio: lidos do disco pela API (lib/quente-ou-frio/model.ts)
  outputFileTracingIncludes: { "/api/quente-ou-frio": ["../../packages/quente-ou-frio/data/**"] },
  async redirects() {
    return [
      // um endereço só para o Google: www e o /truco antigo apontam para as URLs canônicas
      { source: "/:path*", has: [{ type: "host", value: "www.mesadejogos.com" }], destination: "https://mesadejogos.com/:path*", permanent: true },
      { source: "/truco/:path*", destination: "/truco-paulista/:path*", permanent: true },
    ];
  },
  transpilePackages: ["@mesa/batalha-naval", "@mesa/blackjack", "@mesa/buraco", "@mesa/caca-palavras", "@mesa/codenames", "@mesa/connect4", "@mesa/damas", "@mesa/domino", "@mesa/futebol-de-botao", "@mesa/truco", "@mesa/jogo-da-velha", "@mesa/ludo", "@mesa/mahjong", "@mesa/otrio", "@mesa/quente-ou-frio", "@mesa/sinuca", "@mesa/spider", "@mesa/stop", "@mesa/sudoku", "@mesa/tijolada", "@mesa/verbete", "@mesa/xadrez"],
};

export default config;
