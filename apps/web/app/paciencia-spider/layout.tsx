import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("paciencia-spider");

export default function SpiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("paciencia-spider")} />
      {children}
    </>
  );
}
