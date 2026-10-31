import type { Metadata } from "next";
import { fetchRoomPreview, inviteDescription, inviteTitle } from "@/lib/room-preview";

type Props = { params: Promise<{ code: string }>; children: React.ReactNode };

/** Título e texto do link do convite (a imagem vem de opengraph-image.tsx) */
export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { code } = await params;
  const p = await fetchRoomPreview(code);
  const title = inviteTitle("futebol-de-botao", p);
  const description = inviteDescription("futebol-de-botao", code, p);
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

export default function Layout({ children }: Props) {
  return children;
}
