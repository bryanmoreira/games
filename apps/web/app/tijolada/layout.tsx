import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("tijolada");

export default function TijoladaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("tijolada")} />
      {children}
    </>
  );
}
