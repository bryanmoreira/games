import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("blackjack");

export default function BlackjackLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("blackjack")} />
      {children}
    </>
  );
}
