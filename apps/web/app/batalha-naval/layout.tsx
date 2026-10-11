import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("batalha-naval");

export default function BatalhaNavalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("batalha-naval")} />
      {children}
    </>
  );
}
