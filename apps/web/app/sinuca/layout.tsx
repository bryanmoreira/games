import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("sinuca");

export default function SinucaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("sinuca")} />
      {children}
    </>
  );
}
