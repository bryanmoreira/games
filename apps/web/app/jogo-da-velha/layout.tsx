import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("jogo-da-velha");

export default function VelhaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("jogo-da-velha")} />
      {children}
    </>
  );
}
