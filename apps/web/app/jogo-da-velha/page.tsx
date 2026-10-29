import { GameAbout } from "@/components/GameAbout";
import Lobby from "./Lobby";

export default function Page() {
  return (
    <>
      <Lobby />
      <GameAbout slug="jogo-da-velha" />
    </>
  );
}
