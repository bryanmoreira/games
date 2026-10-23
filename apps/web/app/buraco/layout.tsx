import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("buraco");

export default function BuracoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("buraco")} />
      {children}
    </>
  );
}
