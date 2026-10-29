import { gameOgImage, OG_SIZE } from "@/lib/og";
import { getGame } from "@/lib/seo";

export const alt = getGame("quente-ou-frio").title;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return gameOgImage("quente-ou-frio");
}
