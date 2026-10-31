import { VariationPage, variationMetadata } from "@/components/variacoes/VariationPage";

export const metadata = variationMetadata("/jogo-da-velha/contra-o-computador");

export default function Page() {
  return <VariationPage path="/jogo-da-velha/contra-o-computador" />;
}
