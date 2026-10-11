import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("truco-paulista");

export default function TrucoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("truco-paulista")} />
      {children}
    </>
  );
}
