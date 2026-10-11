import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("stop");

export default function StopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("stop")} />
      {children}
    </>
  );
}
