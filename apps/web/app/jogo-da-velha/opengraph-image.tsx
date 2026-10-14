import { gameOgImage, OG_SIZE } from "@/lib/og";
import { getGame } from "@/lib/seo";

export const alt = getGame("jogo-da-velha").title;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return gameOgImage("jogo-da-velha");
}
