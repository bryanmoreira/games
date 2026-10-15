import { JsonLd } from "@/components/seo";
import { gameLd, gameMetadata } from "@/lib/seo";

export const metadata = gameMetadata("futebol-de-botao");

export default function FutebolLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={gameLd("futebol-de-botao")} />
      {children}
    </>
  );
}
