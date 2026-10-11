import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("connect-4");

export default function Connect4Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("connect-4")} />
      {children}
    </>
  );
}
