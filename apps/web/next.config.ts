import path from "node:path";
import type { NextConfig } from "next";

const root = path.resolve(process.cwd(), "../..");

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: root,
  turbopack: { root },
  transpilePackages: ["@truco/batalha-naval", "@truco/codenames", "@truco/connect4", "@truco/game", "@truco/jogo-da-velha", "@truco/otrio", "@truco/spider", "@truco/stop", "@truco/sudoku", "@truco/verbete"],
};

export default config;
