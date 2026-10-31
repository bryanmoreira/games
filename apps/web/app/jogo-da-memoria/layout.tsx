import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("jogo-da-memoria");

export default function MemoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("jogo-da-memoria")} />
      {children}
    </>
  );
}
