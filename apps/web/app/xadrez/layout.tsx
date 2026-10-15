import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("xadrez");

export default function XadrezLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("xadrez")} />
      {children}
    </>
  );
}
