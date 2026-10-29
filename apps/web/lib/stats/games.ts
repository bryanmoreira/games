import type { GameId } from "@mesa/truco";
import { BATALHA_PATH } from "@/lib/batalha-naval/paths";
import { CODENAMES_PATH } from "@/lib/codenames/paths";
import { CONNECT4_PATH } from "@/lib/connect4/paths";
import { DAMAS_PATH } from "@/lib/damas/paths";
import { VELHA_PATH } from "@/lib/jogo-da-velha/paths";
import { LUDO_PATH } from "@/lib/ludo/paths";
import { DOMINO_PATH } from "@/lib/domino/paths";
import { OTRIO_PATH } from "@/lib/otrio/paths";
import { SPIDER_PATH } from "@/lib/spider/paths";
import { STOP_PATH } from "@/lib/stop/paths";
import { SUDOKU_PATH } from "@/lib/sudoku/paths";
import { TRUCO_PATH } from "@/lib/truco/paths";
import { VERBETE_PATH } from "@/lib/verbete/paths";
import { XADREZ_PATH } from "@/lib/xadrez/paths";
import { SINUCA_PATH } from "@/lib/sinuca/paths";
import { FUTEBOL_PATH } from "@/lib/futebol-de-botao/paths";
import { TIJOLADA_PATH } from "@/lib/tijolada/paths";
import { BURACO_PATH } from "@/lib/buraco/paths";
import { BLACKJACK_PATH } from "@/lib/blackjack/paths";
import { CACA_PATH } from "@/lib/caca-palavras/paths";
import { QUENTE_PATH } from "@/lib/quente-ou-frio/paths";

/**
 * Jogos que guardam resultado no perfil. Online: o servidor de salas manda; solo: o navegador manda.
 * A Tijolada está nos online (1×1) e também manda as partidas solo pelo navegador.
 */
export const SOLO_GAMES = ["sudoku", "paciencia-spider", "verbete", "caca-palavras", "quente-ou-frio"] as const;
export const ONLINE_GAMES = ["truco-paulista", "connect4", "otrio", "jogo-da-velha", "xadrez", "sinuca", "damas", "ludo", "domino", "futebol-de-botao", "tijolada", "batalha-naval", "stop", "codenames", "buraco", "blackjack"] as const satisfies readonly GameId[];

export type SoloGame = (typeof SOLO_GAMES)[number];
export type StatGame = SoloGame | GameId;
export type Mode = "solo" | "ai" | "online";
export type Outcome = "win" | "loss" | "draw";

export const GAME_INFO: Record<StatGame, { name: string; path: string }> = {
  "truco-paulista": { name: "Truco", path: TRUCO_PATH },
  connect4: { name: "Connect 4", path: CONNECT4_PATH },
  otrio: { name: "Otrio", path: OTRIO_PATH },
  "jogo-da-velha": { name: "Jogo da Velha", path: VELHA_PATH },
  xadrez: { name: "Xadrez", path: XADREZ_PATH },
  sinuca: { name: "Sinuca", path: SINUCA_PATH },
  damas: { name: "Damas", path: DAMAS_PATH },
  ludo: { name: "Ludo", path: LUDO_PATH },
  domino: { name: "Dominó", path: DOMINO_PATH },
  "futebol-de-botao": { name: "Futebol de Botão", path: FUTEBOL_PATH },
  tijolada: { name: "Tijolada", path: TIJOLADA_PATH },
  "batalha-naval": { name: "Batalha Naval", path: BATALHA_PATH },
  stop: { name: "Stop", path: STOP_PATH },
  codenames: { name: "Codenames", path: CODENAMES_PATH },
  buraco: { name: "Buraco", path: BURACO_PATH },
  blackjack: { name: "Blackjack", path: BLACKJACK_PATH },
  verbete: { name: "Verbete", path: VERBETE_PATH },
  "caca-palavras": { name: "Caça-Palavras", path: CACA_PATH },
  "quente-ou-frio": { name: "Quente ou Frio", path: QUENTE_PATH },
  sudoku: { name: "Sudoku", path: SUDOKU_PATH },
  "paciencia-spider": { name: "Paciência Spider", path: SPIDER_PATH },
};

/** Ordem na tela do perfil. */
export const STAT_GAMES: StatGame[] = [...ONLINE_GAMES, ...SOLO_GAMES];

export const isOnlineGame = (g: string): g is (typeof ONLINE_GAMES)[number] => (ONLINE_GAMES as readonly string[]).includes(g);
/** Jogo da página atual, pelo caminho (ex.: /connect-4/sala/ABCD → connect4). */
export function gameFromPath(pathname: string): StatGame | null {
  return STAT_GAMES.find((g) => pathname === GAME_INFO[g].path || pathname.startsWith(`${GAME_INFO[g].path}/`)) ?? null;
}

export const isSoloGame = (g: string): g is SoloGame => (SOLO_GAMES as readonly string[]).includes(g);
