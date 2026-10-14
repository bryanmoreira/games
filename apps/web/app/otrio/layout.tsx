import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("otrio");

export default function OtrioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("otrio")} />
      {children}
    </>
  );
}
