import type { GameId } from "@mesa/truco";
import { roomPath as memoriaRoom } from "./jogo-da-memoria/paths";
import { roomPath as trucoRoom } from "./truco/paths";
import { roomPath as connect4Room } from "./connect4/paths";
import { roomPath as stopRoom } from "./stop/paths";
import { roomPath as batalhaRoom } from "./batalha-naval/paths";
import { roomPath as codenamesRoom } from "./codenames/paths";
import { roomPath as otrioRoom } from "./otrio/paths";
import { roomPath as velhaRoom } from "./jogo-da-velha/paths";
import { roomPath as damasRoom } from "./damas/paths";
import { roomPath as ludoRoom } from "./ludo/paths";
import { roomPath as dominoRoom } from "./domino/paths";
import { roomPath as xadrezRoom } from "./xadrez/paths";
import { roomPath as sinucaRoom } from "./sinuca/paths";
import { roomPath as futebolRoom } from "./futebol-de-botao/paths";
import { roomPath as tijoladaRoom } from "./tijolada/paths";
import { roomPath as buracoRoom } from "./buraco/paths";
import { roomPath as blackjackRoom } from "./blackjack/paths";

/** Rota da sala de cada jogo online (para redirecionar quem abre o código pela rota errada). */
export const GAME_ROOM_PATH: Record<GameId, (code: string) => string> = {
  "jogo-da-memoria": memoriaRoom,
  "truco-paulista": trucoRoom,
  connect4: connect4Room,
  stop: stopRoom,
  "batalha-naval": batalhaRoom,
  codenames: codenamesRoom,
  otrio: otrioRoom,
  "jogo-da-velha": velhaRoom,
  damas: damasRoom,
  ludo: ludoRoom,
  domino: dominoRoom,
  xadrez: xadrezRoom,
  sinuca: sinucaRoom,
  "futebol-de-botao": futebolRoom,
  tijolada: tijoladaRoom,
  buraco: buracoRoom,
  blackjack: blackjackRoom,
};
