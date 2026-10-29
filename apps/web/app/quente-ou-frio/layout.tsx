import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("quente-ou-frio");

export default function QuenteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("quente-ou-frio")} />
      {children}
    </>
  );
}
