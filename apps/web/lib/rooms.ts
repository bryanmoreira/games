import type { GameId } from "@truco/game";
import { roomPath as trucoRoom } from "./truco/paths";
import { roomPath as connect4Room } from "./connect4/paths";
import { roomPath as stopRoom } from "./stop/paths";
import { roomPath as batalhaRoom } from "./batalha-naval/paths";
import { roomPath as codenamesRoom } from "./codenames/paths";

/** Rota da sala de cada jogo online (para redirecionar quem abre o código pela rota errada). */
export const GAME_ROOM_PATH: Record<GameId, (code: string) => string> = {
  "truco-paulista": trucoRoom,
  connect4: connect4Room,
  stop: stopRoom,
  "batalha-naval": batalhaRoom,
  codenames: codenamesRoom,
};
