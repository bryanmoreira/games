import { VariationPage, variationMetadata } from "@/components/variacoes/VariationPage";

export const metadata = variationMetadata("/connect-4/contra-o-computador");

export default function Page() {
  return <VariationPage path="/connect-4/contra-o-computador" />;
}
