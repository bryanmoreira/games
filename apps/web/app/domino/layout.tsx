import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("domino");

export default function DominoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("domino")} />
      {children}
    </>
  );
}
