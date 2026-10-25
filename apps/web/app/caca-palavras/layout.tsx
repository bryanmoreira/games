import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("caca-palavras");

export default function CacaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("caca-palavras")} />
      {children}
    </>
  );
}
