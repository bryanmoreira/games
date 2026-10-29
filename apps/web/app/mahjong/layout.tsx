import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("mahjong");

export default function MahjongLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("mahjong")} />
      {children}
    </>
  );
}
