import path from "node:path";
import type { NextConfig } from "next";

const root = path.resolve(process.cwd(), "../..");

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  turbopack: { root },
  transpilePackages: ["@truco/batalha-naval", "@truco/codenames", "@truco/connect4", "@truco/damas", "@truco/domino", "@truco/futebol-de-botao", "@truco/game", "@truco/jogo-da-velha", "@truco/ludo", "@truco/otrio", "@truco/spider", "@truco/stop", "@truco/sudoku", "@truco/verbete", "@truco/xadrez"],
};

export default config;
