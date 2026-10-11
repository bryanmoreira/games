import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("codenames");

export default function CodenamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("codenames")} />
      {children}
    </>
  );
}
