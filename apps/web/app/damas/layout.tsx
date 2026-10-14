import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("damas");

export default function DamasLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("damas")} />
      {children}
    </>
  );
}
