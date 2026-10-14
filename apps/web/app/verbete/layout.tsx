import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("verbete");

export default function VerbeteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("verbete")} />
      {children}
    </>
  );
}
