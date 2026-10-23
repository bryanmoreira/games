import path from "node:path";
import type { NextConfig } from "next";

const root = path.resolve(process.cwd(), "../..");

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  turbopack: { root },
  transpilePackages: ["@mesa/batalha-naval", "@mesa/buraco", "@mesa/codenames", "@mesa/connect4", "@mesa/damas", "@mesa/domino", "@mesa/futebol-de-botao", "@mesa/truco", "@mesa/jogo-da-velha", "@mesa/ludo", "@mesa/otrio", "@mesa/spider", "@mesa/stop", "@mesa/sudoku", "@mesa/tijolada", "@mesa/verbete", "@mesa/xadrez"],
};

export default config;
