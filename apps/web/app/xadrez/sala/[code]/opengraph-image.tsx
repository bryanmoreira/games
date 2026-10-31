import { OG_SIZE, roomOgImage } from "@/lib/og";
import { fetchRoomPreview } from "@/lib/room-preview";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Convite para uma sala no Mesa de Jogos";

/** Prévia do link do convite: quem chamou e o código da sala (sala que já acabou: só o jogo e o código) */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const p = await fetchRoomPreview(code);
  return roomOgImage("xadrez", code, p?.host ?? "", p ? `${p.humans} de ${p.seats} na mesa` : "");
}
