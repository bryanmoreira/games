import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("ludo");

export default function LudoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("ludo")} />
      {children}
    </>
  );
}
